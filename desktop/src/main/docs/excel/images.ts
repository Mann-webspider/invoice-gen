import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { LoadedImage } from './types'

/**
 * Letterhead images, read off disk.
 *
 * The web version fetched them over HTTP from its own API — the generator ran
 * in the browser, so it had to ask the server for the logos the server had just
 * told it about — and measured them with `createImageBitmap`, a browser API.
 * Here the file is already local and the dimensions come from the file header.
 */

/** PNG/JPEG/WebP dimensions from the header bytes; no decode, no dependency. */
const measure = (buffer: Buffer): { width: number; height: number; extension: string } | null => {
  if (buffer.length < 24) return null

  // PNG: IHDR width/height are big-endian at byte 16.
  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      extension: 'png'
    }
  }

  // JPEG: walk the segment markers to the first SOFn frame header.
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buffer[offset + 1]
      const isFrameHeader =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isFrameHeader) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
          extension: 'jpeg'
        }
      }
      offset += 2 + buffer.readUInt16BE(offset + 2)
    }
    return null
  }

  // WebP (VP8X / VP8 / VP8L).
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    const chunk = buffer.subarray(12, 16).toString('ascii')
    if (chunk === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
        extension: 'webp'
      }
    }
    if (chunk === 'VP8 ') {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
        extension: 'webp'
      }
    }
  }

  return null
}

export const loadImage = (file: string): LoadedImage | undefined => {
  if (!existsSync(file)) return undefined

  const buffer = readFileSync(file)
  const size = measure(buffer)
  if (!size) return undefined

  return {
    // ExcelJS accepts a Node Buffer; the ArrayBuffer type keeps the original
    // signature so the sheet bodies need no change.
    buffer: buffer as unknown as ArrayBuffer,
    extension: size.extension,
    width: size.width,
    height: size.height
  }
}

/** Reads the three letterhead slots for one exporter master. */
export const loadExporterImages = (
  assetsDir: string,
  exporterMasterId: string
): { header?: LoadedImage; footer?: LoadedImage; signature?: LoadedImage } => {
  if (!exporterMasterId) return {}
  const dir = join(assetsDir, 'exporters', exporterMasterId)
  return {
    header: loadImage(join(dir, 'header.png')),
    footer: loadImage(join(dir, 'footer.png')),
    signature: loadImage(join(dir, 'signature.png'))
  }
}
