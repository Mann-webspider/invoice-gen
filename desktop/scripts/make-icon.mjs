import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Generates build/icon.ico.
 *
 * Written by hand rather than pulled from an image library: the icon is a flat
 * mark on a solid background, and a build dependency that exists to draw a
 * rectangle is a dependency to keep patched forever.
 *
 * Run with `npm run make:icon`. Replace build/icon.ico with a designed one when
 * the client provides artwork — nothing else has to change.
 */

const SIZES = [256, 128, 64, 48, 32, 16]

/** Slate 800, matching --primary in the app's theme. */
const BACKGROUND = [30, 41, 59]
const INK = [248, 250, 252]
const ACCENT = [56, 189, 248]

/* ------------------------------------------------------------------ *
 * Drawing
 * ------------------------------------------------------------------ */

/**
 * A document with a folded corner and three lines of text, plus an accent bar
 * along the bottom. Drawn at a nominal 256 grid and scaled per size.
 */
const drawIcon = (size) => {
  const pixels = Buffer.alloc(size * size * 4)
  const scale = size / 256

  const set = (x, y, [r, g, b], alpha = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return
    const offset = (y * size + x) * 4
    // Straight alpha over whatever is already there.
    const existing = pixels[offset + 3]
    if (alpha >= 255 || existing === 0) {
      pixels[offset] = r
      pixels[offset + 1] = g
      pixels[offset + 2] = b
      pixels[offset + 3] = Math.max(existing, alpha)
      return
    }
    const a = alpha / 255
    pixels[offset] = Math.round(pixels[offset] * (1 - a) + r * a)
    pixels[offset + 1] = Math.round(pixels[offset + 1] * (1 - a) + g * a)
    pixels[offset + 2] = Math.round(pixels[offset + 2] * (1 - a) + b * a)
    pixels[offset + 3] = 255
  }

  const rect = (x0, y0, x1, y1, colour) => {
    for (let y = Math.round(y0 * scale); y < Math.round(y1 * scale); y++) {
      for (let x = Math.round(x0 * scale); x < Math.round(x1 * scale); x++) {
        set(x, y, colour)
      }
    }
  }

  // Rounded background.
  const radius = Math.round(48 * scale)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, size - 1 - x)
      const dy = Math.min(y, size - 1 - y)
      if (dx < radius && dy < radius) {
        const distance = Math.hypot(radius - dx, radius - dy)
        if (distance > radius) continue
        // One-pixel feather so the corner does not look chewed at 16px.
        if (distance > radius - 1) {
          set(x, y, BACKGROUND, Math.round((radius - distance) * 255))
          continue
        }
      }
      set(x, y, BACKGROUND)
    }
  }

  // Sheet of paper.
  rect(72, 52, 184, 204, INK)

  // Folded corner, cut diagonally out of the top right.
  for (let y = Math.round(52 * scale); y < Math.round(84 * scale); y++) {
    for (let x = Math.round(152 * scale); x < Math.round(184 * scale); x++) {
      const localX = x - 152 * scale
      const localY = y - 52 * scale
      if (localX > localY) set(x, y, BACKGROUND)
    }
  }

  // Lines of text.
  rect(90, 104, 166, 114, BACKGROUND)
  rect(90, 128, 166, 138, BACKGROUND)
  rect(90, 152, 138, 162, BACKGROUND)

  // Accent bar — the invoice total.
  rect(90, 176, 166, 188, ACCENT)

  return pixels
}

/* ------------------------------------------------------------------ *
 * PNG
 * ------------------------------------------------------------------ */

const crcTable = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

const crc32 = (buffer) => {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

const toPng = (pixels, size) => {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  header[10] = 0
  header[11] = 0
  header[12] = 0

  // Each scanline is prefixed with its filter byte; filter 0 is "none".
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

/* ------------------------------------------------------------------ *
 * ICO
 * ------------------------------------------------------------------ */

const toIco = (entries) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)

  const directory = Buffer.alloc(16 * entries.length)
  let offset = header.length + directory.length

  entries.forEach(({ size, png }, index) => {
    const at = index * 16
    // 256 is stored as 0.
    directory[at] = size === 256 ? 0 : size
    directory[at + 1] = size === 256 ? 0 : size
    directory[at + 2] = 0 // palette
    directory[at + 3] = 0
    directory.writeUInt16LE(1, at + 4) // colour planes
    directory.writeUInt16LE(32, at + 6) // bits per pixel
    directory.writeUInt32BE(0, at + 8)
    directory.writeUInt32LE(png.length, at + 8)
    directory.writeUInt32LE(offset, at + 12)
    offset += png.length
  })

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)])
}

/* ------------------------------------------------------------------ */

const buildDir = new URL('../build/', import.meta.url).pathname.replace(/^\//, '')
mkdirSync(buildDir, { recursive: true })

const entries = SIZES.map((size) => ({ size, png: toPng(drawIcon(size), size) }))

writeFileSync(join(buildDir, 'icon.ico'), toIco(entries))

// electron-builder derives the macOS .icns from this file and rejects anything
// smaller than 512px, so it is drawn at 1024 rather than reusing a 256 entry.
writeFileSync(join(buildDir, 'icon.png'), toPng(drawIcon(1024), 1024))

console.log(`build/icon.ico — ${SIZES.join(', ')} px`)
console.log('build/icon.png — 1024 px (source for the macOS .icns)')
