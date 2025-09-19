/*
 Simple logger utility to centralize logging behavior.
 - debug(): only logs when NEXT_PUBLIC_DEBUG_LOGS (or DEBUG_LOGS) is truthy ('1'|'true'|'debug')
 - info(): logs in development; in production, logs only when NEXT_PUBLIC_DEBUG_LOGS is enabled
 - warn()/error(): always log
*/

const truthy = (v?: string | null) => {
  if (!v) return false
  const s = String(v).toLowerCase().trim()
  return s === '1' || s === 'true' || s === 'debug' || s === 'yes'
}

const DEBUG_ENABLED = truthy(process.env.NEXT_PUBLIC_DEBUG_LOGS) || truthy(process.env.DEBUG_LOGS)
const IS_DEV = process.env.NODE_ENV !== 'production'

export const logger = {
  debug: (...args: any[]) => {
    if (DEBUG_ENABLED) console.debug(...args)
  },
  info: (...args: any[]) => {
    if (IS_DEV || DEBUG_ENABLED) console.info(...args)
  },
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
}

export default logger
