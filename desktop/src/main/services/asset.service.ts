import { dialog } from 'electron'
import { copyFileSync, existsSync, readFileSync, rmSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { AppError } from '@shared/result'
import type { AssetGetInput, AssetKind, AssetPickInput, AssetResult } from '@shared/contracts'
import { paths } from '../storage/paths'
import { log } from '../log'

/**
 * Exporter letterhead and stamp images.
 *
 * The web app uploaded these over HTTP, saved them under the client-supplied
 * filename with no extension check, and stored an API route
 * ('/upload/header/{id}') in a database column — so the document generator had
 * to fetch its own logos back over the network. Here the file is chosen through
 * the OS picker, copied into userData under a fixed name, and read straight off
 * disk when a document is generated.
 */

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED = new Map<string, string>([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp']
])

/** Magic bytes, so renaming a .exe to .png does not get it copied in. */
const sniff = (buffer: Buffer): string | null => {
  if (buffer.length < 12) return null
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

const assetPath = (exporterId: string, kind: AssetKind): string =>
  join(paths.exporterAssets(exporterId), `${kind}.png`)

/** Which images exist, for the Admin Panel's upload widgets. */
export const exporterImageFlags = (
  exporterId: string
): { header: boolean; footer: boolean; signature: boolean } => ({
  header: existsSync(assetPath(exporterId, 'header')),
  footer: existsSync(assetPath(exporterId, 'footer')),
  signature: existsSync(assetPath(exporterId, 'signature'))
})

/** Raw bytes for the document generator. */
export const readExporterImage = (exporterId: string, kind: AssetKind): Buffer | null => {
  const file = assetPath(exporterId, kind)
  return existsSync(file) ? readFileSync(file) : null
}

export const getAsset = (input: AssetGetInput): AssetResult => {
  const buffer = readExporterImage(input.exporterId, input.kind)
  if (!buffer) return { dataUrl: null }
  const mime = sniff(buffer) ?? 'image/png'
  return { dataUrl: `data:${mime};base64,${buffer.toString('base64')}` }
}

export const pickAsset = async (input: AssetPickInput): Promise<AssetResult> => {
  const result = await dialog.showOpenDialog({
    title: `Choose ${input.kind} image`,
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  })

  if (result.canceled || result.filePaths.length === 0) {
    return getAsset(input)
  }

  const source = result.filePaths[0]
  const extension = extname(source).toLowerCase()
  if (!ALLOWED.has(extension)) {
    throw new AppError('VALIDATION', 'Choose a PNG, JPG or WebP image')
  }

  const size = statSync(source).size
  if (size > MAX_BYTES) {
    throw new AppError('VALIDATION', 'That image is larger than 5 MB')
  }

  const head = readFileSync(source).subarray(0, 12)
  if (!sniff(head)) {
    throw new AppError('VALIDATION', 'That file is not a readable image')
  }

  const destination = assetPath(input.exporterId, input.kind)
  copyFileSync(source, destination)
  log.info(`Stored ${input.kind} image for exporter ${input.exporterId}`)

  return getAsset(input)
}

export const removeAsset = (input: AssetGetInput): null => {
  const file = assetPath(input.exporterId, input.kind)
  if (existsSync(file)) {
    rmSync(file)
    log.info(`Removed ${input.kind} image for exporter ${input.exporterId}`)
  }
  return null
}
