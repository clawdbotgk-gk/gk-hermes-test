/**
 * Structured logger with request correlation IDs.
 * Usage: logger.info("message", { meta }) or request-scoped with logger.withRequest(req)
 */

export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase() as LogEntry["level"];
const LEVEL_ORDER: Record<LogEntry["level"], number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function format(entry: LogEntry): string {
  const { timestamp, level, message, requestId, ...rest } = entry;
  const meta = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest, null, 0)}` : "";
  const reqId = requestId ? ` [${requestId}]` : "";
  return `${timestamp} ${level.toUpperCase()}${reqId} ${message}${meta}`;
}

function log(level: LogEntry["level"], message: string, meta?: Record<string, unknown>, requestId?: string) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[LOG_LEVEL]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId && { requestId }),
    ...meta,
  };

  switch (level) {
    case "error":
      console.error(format(entry));
      break;
    case "warn":
      console.warn(format(entry));
      break;
    default:
      console.log(format(entry));
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>, requestId?: string) => log("info", msg, meta, requestId),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, error?: Error, meta?: Record<string, unknown>, requestId?: string) =>
    log("error", msg, { ...meta, error: error?.message, stack: error?.stack }, requestId),
  withContext: (ctx: Record<string, unknown>) => ({
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, { ...ctx, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>, requestId?: string) => log("info", msg, { ...ctx, ...meta }, requestId),
    warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, { ...ctx, ...meta }),
    error: (msg: string, error?: Error, meta?: Record<string, unknown>, requestId?: string) =>
      log("error", msg, error, { ...ctx, ...meta }, requestId),
  }),
};
