import log from 'electron-log/main'
import { join } from 'node:path'
import { paths } from './storage/paths'

/**
 * Replaces the 155 stray console.log calls in ui/src and the error_log noise in
 * the PHP controllers. Logs go to a rotating file under userData so the client
 * can send one file when something goes wrong on their machine.
 */
export const initLogger = (): void => {
  log.transports.file.resolvePathFn = () => join(paths.logs(), 'main.log')
  log.transports.file.level = 'info'
  log.transports.file.maxSize = 5 * 1024 * 1024
  log.transports.console.level = process.env.NODE_ENV === 'development' ? 'debug' : false
  log.errorHandler.startCatching({ showDialog: false })
}

export const logger = log.scope('main')
export default log
