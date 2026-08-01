import electronLog from 'electron-log/main'
import { join } from 'node:path'
import { paths } from './storage/paths'
import { setLogSink } from './log'

/**
 * Replaces the 155 stray console.log calls in ui/src and the error_log noise in
 * the PHP controllers. Logs go to a rotating file under userData so the client
 * can send one file when something goes wrong on their machine.
 */
export const initLogger = (): void => {
  electronLog.transports.file.resolvePathFn = () => join(paths.logs(), 'main.log')
  electronLog.transports.file.level = 'info'
  electronLog.transports.file.maxSize = 5 * 1024 * 1024
  electronLog.transports.console.level =
    process.env.NODE_ENV === 'development' ? 'debug' : false
  electronLog.errorHandler.startCatching({ showDialog: false })

  const scoped = electronLog.scope('main')
  setLogSink({
    info: (message, ...args) => scoped.info(message, ...args),
    warn: (message, ...args) => scoped.warn(message, ...args),
    error: (message, ...args) => scoped.error(message, ...args)
  })
}
