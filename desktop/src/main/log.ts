/**
 * Minimal logging seam.
 *
 * Modules under src/main use this instead of importing electron-log directly,
 * so code such as the legacy importer and the migration runner can also run
 * outside Electron — under tsx in a CLI, or in a test — where `electron` cannot
 * be imported at all. main/index.ts swaps in the electron-log sink at startup.
 */

export interface LogSink {
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
}

/* eslint-disable no-console */
let sink: LogSink = {
  info: (message, ...args) => console.log(message, ...args),
  warn: (message, ...args) => console.warn(message, ...args),
  error: (message, ...args) => console.error(message, ...args)
}
/* eslint-enable no-console */

export const setLogSink = (next: LogSink): void => {
  sink = next
}

export const log: LogSink = {
  info: (message, ...args) => sink.info(message, ...args),
  warn: (message, ...args) => sink.warn(message, ...args),
  error: (message, ...args) => sink.error(message, ...args)
}
