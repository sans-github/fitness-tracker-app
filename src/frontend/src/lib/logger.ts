import log from 'loglevel';

// Production: INFO and above. DEBUG only in local dev.
if (import.meta.env.DEV) {
  log.setLevel('debug');
} else {
  log.setLevel('info');
}

export const sessionId = `sess-${Math.random().toString(36).slice(2, 10)}`;

type LogContext = Record<string, unknown>;

function serialize(
  event: string,
  level: string,
  ctxOrError?: LogContext | unknown,
  ctx?: LogContext,
): string {
  let errorInfo: Record<string, unknown> = {};
  let context: LogContext = {};

  if (ctxOrError instanceof Error) {
    errorInfo = { error: ctxOrError.message };
    context = ctx ?? {};
  } else {
    context = (ctxOrError as LogContext) ?? {};
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    sessionId,
    ...context,
    ...errorInfo,
  };

  const pairs = Object.entries(entry)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');

  return pairs;
}

const logger = {
  info: (event: string, ctx?: LogContext) =>
    log.info(serialize(event, 'INFO', ctx)),
  warn: (event: string, ctx?: LogContext) =>
    log.warn(serialize(event, 'WARN', ctx)),
  error: (event: string, error?: unknown, ctx?: LogContext) =>
    log.error(serialize(event, 'ERROR', error, ctx)),
  debug: (event: string, ctx?: LogContext) =>
    log.debug(serialize(event, 'DEBUG', ctx)),
};

export default logger;
