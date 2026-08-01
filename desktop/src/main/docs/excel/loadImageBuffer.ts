/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LoadedImage } from './types'

/**
 * Drop-in replacement for the browser `loadImageBuffer`.
 *
 * The sheet bodies call `await loadImageBuffer(url)` and destructure
 * `{ buffer, extension, width, height }`. In the web app that was an HTTP
 * fetch back to its own API followed by `createImageBitmap` to measure the
 * result. Here the images are already on disk and are read once, before any
 * sheet runs; this looks them up by the same "url" key so no call site changes.
 */

let registry = new Map<string, LoadedImage>()

/** Called by the orchestrator before the sheets run. */
export const setImageRegistry = (images: Record<string, LoadedImage | undefined>): void => {
  registry = new Map(
    Object.entries(images).filter((entry): entry is [string, LoadedImage] => Boolean(entry[1]))
  )
}

export const loadImageBuffer = async (url: string): Promise<LoadedImage | undefined> =>
  registry.get(url)
