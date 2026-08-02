/**
 * A small Chrome DevTools Protocol driver for the running application window.
 *
 * Electron is not a browser tab, so the usual automation tooling cannot reach
 * it. Start the app with a debugging port and this connects to its renderer:
 *
 *   npm run dev -- --remote-debugging-port=9222
 *
 * Node 22 and later expose WebSocket globally; on Node 20 the scripts have to
 * be run with --experimental-websocket, which `assertWebSocket` explains.
 */

const DEFAULT_ENDPOINT = 'http://127.0.0.1:9222'

export const assertWebSocket = () => {
  if (typeof WebSocket !== 'undefined') return
  console.error(
    'This script needs a global WebSocket.\n' +
      '  Node 22 or later: works as is.\n' +
      '  Node 20:          run it with --experimental-websocket.'
  )
  process.exit(1)
}

export const connect = async (endpoint = DEFAULT_ENDPOINT) => {
  assertWebSocket()

  let targets
  try {
    targets = await (await fetch(`${endpoint}/json/list`)).json()
  } catch {
    throw new Error(
      `Nothing is listening on ${endpoint}. Start the application with ` +
        '--remote-debugging-port=9222 first.'
    )
  }

  const target = targets.find((entry) => entry.type === 'page')
  if (!target) throw new Error('The application is running but has no window open.')

  const socket = new WebSocket(target.webSocketDebuggerUrl)
  const pending = new Map()
  let nextId = 1

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id === undefined) return
    const entry = pending.get(message.id)
    if (!entry) return
    pending.delete(message.id)
    if (message.error) entry.reject(new Error(JSON.stringify(message.error)))
    else entry.resolve(message.result)
  })
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })

  /**
   * Expressions must evaluate to something JSON can carry. Returning a DOM node
   * makes the protocol reply with an error instead of a result, which surfaces
   * as a confusing "cannot read exceptionDetails of undefined".
   */
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true
    })
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text
      )
    }
    return result.result.value
  }

  const text = () => evaluate("document.body.innerText.replace(/\\s+/g,' ').trim()")

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  /**
   * A real mouse click through the input pipeline. Radix popovers and menus
   * commit on trusted pointer events, which a synthetic dispatchEvent cannot
   * produce, so anything popover-based has to be driven this way.
   */
  const clickAt = async (x, y) => {
    const base = { x, y, button: 'left', clickCount: 1, buttons: 1, pointerType: 'mouse' }
    await send('Input.dispatchMouseEvent', { ...base, type: 'mouseMoved', buttons: 0 })
    await send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' })
    await send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased', buttons: 0 })
  }

  /**
   * Clicks the centre of the first element matching a JS expression.
   *
   * The settle delay is not padding: a click is dispatched at coordinates, so
   * anything that reflows between measuring the element and pressing the button
   * — a dialog closing, a summary card appearing — lands the click elsewhere.
   *
   * `scroll` must be off for anything inside a popover. Scrolling the page to
   * bring a row into view moves the trigger it is anchored to, and Radix
   * repositions the popover in response, so the measured coordinates point at
   * empty space by the time the button goes down.
   */
  const clickElement = async (expression, { settleMs = 250, scroll = true } = {}) => {
    await sleep(settleMs)
    const box = await evaluate(`(() => {
      const el = ${expression};
      if (!el) return null;
      ${scroll ? "el.scrollIntoView({ block: 'center' });" : ''}
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`)
    if (!box) throw new Error(`no element for ${expression}`)
    await clickAt(box.x, box.y)
    await sleep(150)
  }

  const wait = async (expression, label, timeoutMs = 15000) => {
    const started = Date.now()
    let last
    while (Date.now() - started < timeoutMs) {
      try {
        if (await evaluate(expression)) return true
      } catch (error) {
        last = error
      }
      await sleep(200)
    }
    throw new Error(`timed out waiting for ${label}${last ? ` (${last.message})` : ''}`)
  }

  const screenshot = async () => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' })
    return Buffer.from(data, 'base64')
  }

  return { send, evaluate, text, wait, sleep, clickAt, clickElement, screenshot, close: () => socket.close() }
}

/**
 * Sets a React-controlled input through the prototype setter, which is the only
 * way an assignment reaches React's onChange. Plain `el.value = x` is swallowed.
 *
 * `blur` is what makes a date field reformat what was typed, so it is on by
 * default — but it must be off for the search box inside a picker, where
 * blurring closes the popover before anything can be chosen.
 */
export const setInput = (selector, value, { blur = true } = {}) => `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) throw new Error('no element ' + ${JSON.stringify(selector)});
  const proto = el.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  ${blur ? "el.dispatchEvent(new Event('blur', { bubbles: true }));" : ''}
  return true;
})()`

export const hasText = (needle) =>
  `document.body.innerText.includes(${JSON.stringify(needle)})`
