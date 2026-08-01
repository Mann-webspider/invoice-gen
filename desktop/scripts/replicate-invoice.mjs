import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { connect, hasText, setInput } from './lib/cdp.mjs'

/**
 * Rebuilds an invoice the old web application produced, by driving this
 * application's own interface, and then compares the workbooks that come out
 * against the ones the old system left on disk.
 *
 * Everything goes through the user interface: master records are created from
 * the pickers inside the wizard, fields are filled where a person would type,
 * and each step is advanced with Next so its validation actually runs. Writing
 * the rows straight into SQLite would be quicker and would prove nothing.
 *
 *   npm run dev -- --remote-debugging-port=9222      # in one terminal
 *   npm run replicate                                # in another
 *
 * Options:
 *   --fixture <path>   default scripts/fixtures/invoice-0089.json
 *   --number <text>    override the invoice number to write
 *   --replace          delete an existing invoice with that number first
 *   --skip-compare     stop once the invoice has been created
 */

const HERE = dirname(fileURLToPath(import.meta.url))

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(`--${name}`)
const option = (name, fallback) => {
  const index = argv.indexOf(`--${name}`)
  return index === -1 ? fallback : argv[index + 1]
}

const fixturePath = resolve(
  HERE,
  option('fixture', join('fixtures', 'invoice-0089.json'))
)
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'))
const invoiceNumber = option('number', fixture.invoiceNumber)

const app = await connect()

/* ------------------------------------------------------------------ *
 * Reporting
 * ------------------------------------------------------------------ */

const done = []
let failed = null

const step = async (label, fn) => {
  process.stdout.write(`  ${label} … `)
  try {
    const detail = await fn()
    done.push(label)
    console.log(detail ? `ok — ${detail}` : 'ok')
  } catch (error) {
    console.log('FAILED')
    failed = { label, error }
    throw error
  }
}

/* ------------------------------------------------------------------ *
 * Interacting with the form
 * ------------------------------------------------------------------ */

/**
 * Both selectors have to repeat the attribute. `[data-field="x"] input,
 * textarea` is two selectors, the second of which matches every textarea on the
 * page — which is how the product rows quietly wrote themselves into the
 * consignee box.
 */
const field = (path) => `[data-field="${path}"] input, [data-field="${path}"] textarea`

const fill = async (path, value) => {
  await app.evaluate(setInput(field(path), value))
}

const fillAll = async (entries) => {
  for (const [path, value] of Object.entries(entries)) {
    // Keys beginning with an underscore are notes to whoever reads the fixture.
    if (value === '' || path.startsWith('_')) continue
    await fill(path, value)
  }
}

/**
 * Clicks one of the segmented buttons a short option set renders as, addressing
 * it by the value that gets stored rather than by its label — "By sea" on
 * screen is SHIPPING - THROUGH SEA in the document.
 */
const chooseButton = async (path, value) => {
  const selector = `[data-field="${path}"] [role="radio"][data-value="${value}"]`
  for (let attempt = 0; attempt < 3; attempt++) {
    await app.clickElement(`document.querySelector('${selector}')`, { settleMs: 200 })
    // Clicks are dispatched at coordinates, so a click during a reflow lands
    // somewhere else. Confirm it took rather than discovering it three steps
    // later as "Payment term is required".
    if (await app.evaluate(`document.querySelector('${selector}')?.ariaChecked === 'true'`)) {
      return
    }
  }
  throw new Error(`could not select ${value} for ${path}`)
}

/**
 * Opens a picker and takes an existing row, or creates it from the typed text
 * when it is not there. This is the path a clerk takes when the list is missing
 * what they need, so the script exercises it rather than pre-seeding the lists.
 */
const choosePicker = async (path, label, { create = true } = {}) => {
  await app.clickElement(`document.querySelector('[data-field="${path}"] [role="combobox"]')`)
  await app.wait(`!!document.querySelector('[cmdk-input]')`, `the ${path} picker`)
  await app.evaluate(setInput('[cmdk-input]', label, { blur: false }))
  await app.sleep(250)

  const existing = `Array.from(document.querySelectorAll('[cmdk-item]'))
    .find(n => n.textContent.trim().startsWith(${JSON.stringify(label)}) &&
               !n.textContent.includes('Add'))`
  const chosen = `document.querySelector('[data-field="${path}"] [role="combobox"]')
    ?.textContent.includes(${JSON.stringify(label)})`

  if (await app.evaluate(`!!(${existing})`)) {
    await app.clickElement(existing, { settleMs: 80, scroll: false })
    await app.wait(chosen, `${label} to be chosen for ${path}`, 5000)
    return 'chose an existing entry'
  }

  if (!create) throw new Error(`"${label}" is not on the ${path} list`)

  const addRow = `Array.from(document.querySelectorAll('[cmdk-item]'))
    .find(n => n.textContent.includes('Add'))`
  await app.clickElement(addRow, { settleMs: 80, scroll: false })
  await app.wait(chosen, `${label} to be added and chosen for ${path}`, 8000)
  return 'added it from the picker'
}

/** Clicks a dialog row in a picker, then fills and submits that dialog. */
const addViaDialog = async (path, addLabel, values, submitLabel) => {
  await app.clickElement(`document.querySelector('[data-field="${path}"] [role="combobox"]')`)
  await app.wait(hasText(addLabel), `the "${addLabel}" row`)
  await app.clickElement(
    `Array.from(document.querySelectorAll('[cmdk-item]'))
       .find(n => n.textContent.includes(${JSON.stringify(addLabel)}))`,
    { settleMs: 80, scroll: false }
  )
  await app.wait(`!!document.querySelector('[role="dialog"] input')`, 'the dialog')

  for (const [label, value] of Object.entries(values)) {
    const ok = await app.evaluate(`(() => {
      const scope = Array.from(document.querySelectorAll('[role="dialog"]')).pop();
      const item = Array.from(scope.querySelectorAll('label'))
        .find(l => l.textContent.trim() === ${JSON.stringify(label)});
      if (!item) return false;
      const control = document.getElementById(item.htmlFor) ||
        item.parentElement.querySelector('input, textarea');
      if (!control) return false;
      const proto = control.tagName === 'TEXTAREA'
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set
        .call(control, ${JSON.stringify(value)});
      control.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`)
    if (!ok) throw new Error(`the dialog has no field labelled "${label}"`)
  }

  await app.clickElement(
    `Array.from(document.querySelectorAll('[role="dialog"] button'))
       .find(n => n.textContent.trim() === ${JSON.stringify(submitLabel)})`,
    { settleMs: 150, scroll: false }
  )
  await app.wait(`!document.querySelector('[role="dialog"]')`, 'the dialog to close')
  await app.sleep(500)
}

const clickButton = (label, scope = 'button') =>
  app.clickElement(
    `Array.from(document.querySelectorAll(${JSON.stringify(scope)}))
       .find(n => n.textContent.trim() === ${JSON.stringify(label)}) ||
     Array.from(document.querySelectorAll(${JSON.stringify(scope)}))
       .find(n => n.textContent.trim().includes(${JSON.stringify(label)}))`
  )

/** Advances a step, turning the wizard's own refusal into a readable failure. */
const next = async (expected) => {
  await clickButton('Next')
  await app.sleep(500)
  const problems = await app.evaluate(
    `JSON.stringify(Array.from(document.querySelectorAll('[role="alert"] button'))
       .map(n => n.textContent.trim()))`
  )
  const list = JSON.parse(problems)
  if (list.length) throw new Error(`the step would not advance: ${list.join('; ')}`)
  await app.wait(hasText(expected), expected)
}

/* ------------------------------------------------------------------ *
 * The run
 * ------------------------------------------------------------------ */

console.log(`\nReplicating ${invoiceNumber} from ${fixturePath}\n`)

try {
  await step('the application is signed in', async () => {
    const session = await app.evaluate(
      `(async () => {
         const r = await window.api.invoke('auth:session', undefined);
         return JSON.stringify(r.ok ? r.data : { error: r.message });
       })()`
    )
    const state = JSON.parse(session)
    if (!state.user) {
      throw new Error(
        'no one is signed in. Sign in first — this script drives the interface, ' +
          'it does not know anyone’s password.'
      )
    }
    return `as ${state.user.name}`
  })

  await step('no invoice already holds that number', async () => {
    const existing = await app.evaluate(
      `(async () => {
         const r = await window.api.invoke('invoice:list', undefined);
         if (!r.ok) return 'ERROR: ' + r.message;
         const hit = r.data.find(i => i.invoiceNumber === ${JSON.stringify(invoiceNumber)});
         return hit ? hit.id : '';
       })()`
    )
    if (existing.startsWith('ERROR')) throw new Error(existing)
    if (!existing) return

    if (!flag('replace')) {
      throw new Error(
        `${invoiceNumber} already exists. Re-run with --replace to overwrite it, or ` +
          'pass --number to write a different one.'
      )
    }

    const removed = await app.evaluate(
      `(async () => {
         const r = await window.api.invoke('invoice:remove', { id: ${JSON.stringify(existing)} });
         return r.ok ? '' : r.message;
       })()`
    )
    if (removed) throw new Error(`could not remove the existing invoice: ${removed}`)
    return 'removed the previous copy'
  })

  /* ---------------- master data, seeded through the wizard ---------- */

  await step('open a new invoice', async () => {
    // Via the dashboard, not straight to #/invoice: assigning the hash it is
    // already on is not a navigation, so the wizard would keep the form state
    // of whatever was left on screen — including a previous run's rows.
    await app.evaluate(`location.hash = '#/'`)
    await app.wait(hasText('Create a new invoice'), 'the dashboard')
    await app.sleep(300)
    await app.evaluate(`location.hash = '#/invoice'`)
    await app.wait(hasText('Your company'), 'step 1')
    await app.wait(
      `document.querySelectorAll('[data-field^="invoice.products.product_list."]').length === 0`,
      'an empty goods table'
    )
    await app.sleep(600)
  })

  await step('the exporting company exists', async () => {
    const master = fixture.master.exporter
    const known = await app.evaluate(`(async () => {
      const r = await window.api.invoke('master:list', { entity: 'exporter' });
      return r.ok && r.data.some(e => e.companyName === ${JSON.stringify(master.companyName)});
    })()`)

    if (known) {
      await choosePicker('invoice.exporter.id', master.companyName, { create: false })
      return 'already on the list'
    }

    await addViaDialog(
      'invoice.exporter.id',
      'Add a company that is not on the list',
      {
        'Company name': master.companyName,
        Address: master.companyAddress,
        'Phone number': master.contactNumber,
        'Email address': master.email,
        'IE code': master.ieCode,
        GSTIN: master.gstinNumber,
        PAN: master.panNumber,
        'Tax ID': master.taxId,
        'State code': master.stateCode,
        Name: master.authorizedName,
        'Job title': master.authorizedDesignation,
        Prefix: master.companyPrefix,
        'Financial year': master.invoiceYear,
        'Last number used': String(master.lastInvoiceNumber)
      },
      'Add company'
    )
    return 'added from the picker'
  })

  await step('the invoice number matches the original', async () => {
    // Choosing a company reserves the next number; this invoice has to carry
    // the one the old system gave it.
    await app.wait(
      `!!document.querySelector('${field('invoice.invoice_number')}')?.value`,
      'a reserved number'
    )
    await fill('invoice.invoice_number', invoiceNumber)
    return invoiceNumber
  })

  /* ---------------- step 1 ------------------------------------------ */

  await step('invoice, buyer and shipment details', async () => {
    await fillAll(fixture.step1.text)
    for (const [path, value] of Object.entries(fixture.step1.choices)) {
      await chooseButton(path, value)
    }
  })

  await step('the destination pair', async () => {
    const pair = fixture.master.destination
    const known = await app.evaluate(`(async () => {
      const r = await window.api.invoke('master:list', { entity: 'countryOption' });
      return r.ok && r.data.some(d => d.portOfDischarge === ${JSON.stringify(pair.portOfDischarge)});
    })()`)
    if (known) {
      await choosePicker('invoice.shipping.port_of_discharge', pair.portOfDischarge, {
        create: false
      })
      return 'already on the list'
    }
    await addViaDialog(
      'invoice.shipping.port_of_discharge',
      'Add a port that is not on the list',
      { 'Port of discharge': pair.portOfDischarge, 'Final destination': pair.finalDestination },
      'Add destination'
    )
    return 'added from the picker'
  })

  await step('the remaining lists', async () => {
    const added = []
    for (const [path, label] of Object.entries(fixture.step1.pickers)) {
      if (path === 'invoice.shipping.port_of_discharge') continue
      const result = await choosePicker(path, label)
      if (result.startsWith('added')) added.push(label)
    }
    return added.length ? `added ${added.join(', ')} on the way through` : 'all already present'
  })

  await step('the goods', async () => {
    const [product] = fixture.step1.products
    await clickButton('Add the first product')
    await app.sleep(400)

    const categoryKnown = await app.evaluate(`(async () => {
      const r = await window.api.invoke('master:list', { entity: 'productCategory' });
      return r.ok && r.data.some(c => c.description === ${JSON.stringify(product.category)});
    })()`)
    if (categoryKnown) {
      await choosePicker('invoice.products.product_list.0.category_id', product.category, {
        create: false
      })
    } else {
      await addViaDialog(
        'invoice.products.product_list.0.category_id',
        'Add a product type',
        {
          Description: fixture.master.productCategory.description,
          'HSN code': fixture.master.productCategory.hsnCode
        },
        'Add product type'
      )
    }

    const sizeKnown = await app.evaluate(`(async () => {
      const r = await window.api.invoke('master:list', { entity: 'productSize' });
      return r.ok && r.data.some(s => s.size === ${JSON.stringify(product.size)});
    })()`)
    if (sizeKnown) {
      await choosePicker('invoice.products.product_list.0.size', product.size, { create: false })
    } else {
      await addViaDialog(
        'invoice.products.product_list.0.size',
        'Add a size',
        {
          Size: fixture.master.productSize.size,
          'Square metres per unit': fixture.master.productSize.sqm
        },
        'Add size'
      )
    }

    await choosePicker('invoice.products.product_list.0.unit', product.unit)

    for (const key of ['product_name', 'quantity', 'sqm', 'price', 'net_weight', 'gross_weight']) {
      await fill(`invoice.products.product_list.0.${key}`, product[key])
    }

    const total = await app.evaluate(
      `document.querySelectorAll('[data-field="invoice.products.product_list.0"] .border-dashed')[1]
         ?.textContent.trim()`
    )
    return `line amount ${total}`
  })

  await step('the supplier', async () => {
    const [supplier] = fixture.step1.suppliers
    await clickButton('Add supplier')
    await app.sleep(400)

    const known = await app.evaluate(`(async () => {
      const r = await window.api.invoke('master:list', { entity: 'supplier' });
      return r.ok && r.data.some(s => s.name === ${JSON.stringify(supplier.name)});
    })()`)
    if (known) {
      await choosePicker('invoice.suppliers.0.id', supplier.name, { create: false })
    } else {
      const master = fixture.master.supplier
      await addViaDialog(
        'invoice.suppliers.0.id',
        'Add a supplier that is not on the list',
        {
          'Supplier name': master.name,
          GSTIN: master.gstinNumber,
          Address: master.address,
          'Self-sealing permission': master.permission
        },
        'Add supplier'
      )
    }

    await fill('invoice.suppliers.0.tax_invoice_number', supplier.tax_invoice_number)
    await fill('invoice.suppliers.0.date', supplier.date)
  })

  await step('step 1 passes validation', () => next('Packing list'))

  /* ---------------- step 2 ------------------------------------------ */

  await step('the containers', async () => {
    const rows = fixture.step2.containers
    await clickButton('Add the first container')
    await app.sleep(300)
    for (let index = 1; index < rows.length; index++) {
      await clickButton('Add container')
      await app.sleep(200)
    }

    for (const [index, row] of rows.entries()) {
      for (const [key, value] of Object.entries(row)) {
        await fill(`invoice.products.containers.${index}.${key}`, value)
      }
    }
    await fillAll(fixture.step2.text)

    const totals = await app.evaluate(
      `JSON.stringify(Array.from(document.querySelectorAll('.border-dashed'))
         .map(n => n.textContent.trim()))`
    )
    return `${rows.length} rows, totals ${JSON.parse(totals).slice(-3).join(' / ')}`
  })

  await step('step 2 passes validation', () => next('Customs office'))

  /* ---------------- step 3 ------------------------------------------ */

  await step('the annexure', async () => {
    await choosePicker('annexure.selected_manufacturer.name', fixture.step3.manufacturer, {
      create: false
    })
    await fillAll(fixture.step3.text)
    return 'jurisdiction values are not recoverable from this invoice — see the fixture'
  })

  await step('step 3 passes validation', () => next('Container weights'))

  /* ---------------- step 4 ------------------------------------------ */

  await step('the verified gross mass', async () => {
    await fillAll(fixture.step4.text)
    for (const [path, value] of Object.entries(fixture.step4.choices)) {
      await chooseButton(path, value)
    }

    // Containers arrive from the packing list already; top up if the fixture
    // carries more rows than were copied.
    const rows = fixture.step4.containers
    const present = await app.evaluate(
      `document.querySelectorAll('[data-field^="vgm.containers."][data-field$="0"], ` +
        `[data-field="vgm.containers"] tbody tr').length`
    )
    void present
    for (let index = 0; index < rows.length; index++) {
      const exists = await app.evaluate(
        `!!document.querySelector('${field(`vgm.containers.${index}.container_no`)}')`
      )
      if (!exists) {
        await clickButton('Add container')
        await app.sleep(200)
      }
      for (const [key, value] of Object.entries(rows[index])) {
        await fill(`vgm.containers.${index}.${key}`, value)
      }
    }
    return `${rows.length} weighed containers`
  })

  await step('the invoice is created', async () => {
    await clickButton('Create the invoice')
    await app.wait(hasText(invoiceNumber), 'the dashboard listing it', 30000)
  })

  /* ---------------- documents --------------------------------------- */

  const generated = await (async () => {
    let value
    await step('the documents are generated', async () => {
      const result = await app.evaluate(`(async () => {
        const list = await window.api.invoke('invoice:list', undefined);
        if (!list.ok) return JSON.stringify({ error: list.message });
        const hit = list.data.find(i => i.invoiceNumber === ${JSON.stringify(invoiceNumber)});
        if (!hit) return JSON.stringify({ error: 'the invoice is not in the list' });
        const out = await window.api.invoke('document:generate', { invoiceId: hit.id });
        return JSON.stringify(out.ok ? out.data : { error: out.message });
      })()`)
      const parsed = JSON.parse(result)
      if (parsed.error) throw new Error(parsed.error)
      value = parsed
      return `${parsed.files?.length ?? 0} files`
    })
    return value
  })()

  if (!flag('skip-compare')) {
    console.log('\nComparing against the original workbooks\n')
    const { compareWorkbooks } = await import('./lib/compare-workbooks.mjs')
    const originals = resolve(HERE, '..', fixture.compare.originalsFolder)
    const produced = dirname(generated.files[0].path)

    const report = await compareWorkbooks(
      originals,
      produced,
      fixture.compare.workbooks,
      invoiceNumber
    )

    const outputDir = resolve(HERE, '..', 'release', 'replication')
    mkdirSync(outputDir, { recursive: true })
    const reportPath = join(outputDir, 'invoice-0089-differences.json')
    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    for (const sheet of report.sheets) {
      if (sheet.missing === undefined) {
        console.log(`  ${sheet.name.padEnd(22)} NOT PRODUCED`)
        continue
      }

      const clean = sheet.missing.length === 0 && sheet.added.length === 0
      console.log(
        `  ${sheet.name.padEnd(22)} ` +
          (clean
            ? `every value matches (${sheet.compared} cells)`
            : `${sheet.missing.length} missing, ${sheet.added.length} new`)
      )

      const show = (label, values) => {
        for (const value of values.slice(0, 6)) {
          console.log(`      ${label} ${JSON.stringify(value).slice(0, 110)}`)
        }
        if (values.length > 6) console.log(`      ${label} … ${values.length - 6} more`)
      }
      show('only on the original:', sheet.missing)
      show('only on the new one: ', sheet.added)
    }
    console.log(`\n  full report: ${reportPath}`)
  }

  console.log(`\n${done.length} steps completed.\n`)
} catch (error) {
  console.error(`\nStopped at: ${failed?.label ?? 'startup'}`)
  console.error(`  ${error.message}\n`)
  try {
    const outputDir = resolve(HERE, '..', 'release', 'replication')
    mkdirSync(outputDir, { recursive: true })
    const shotPath = join(outputDir, 'failure.png')
    writeFileSync(shotPath, await app.screenshot())
    console.error(`  screenshot: ${shotPath}\n`)
  } catch {
    // A screenshot is a courtesy; never let it mask the real failure.
  }
  process.exitCode = 1
} finally {
  app.close()
}
