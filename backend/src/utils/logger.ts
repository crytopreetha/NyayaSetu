type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function sanitizeMeta(meta: any): any {
  if (!meta || typeof meta !== 'object') return meta;
  if (Array.isArray(meta)) return meta.map(sanitizeMeta);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('key') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('extracted_text') ||
      lowerKey.includes('content') ||
      lowerKey.includes('body') && typeof val === 'string' && val.length > 200
    ) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object') {
      clean[key] = sanitizeMeta(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

function formatLog(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const sanitized = meta ? sanitizeMeta(meta) : undefined;
  const metaStr = sanitized ? ` ${JSON.stringify(sanitized)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: any) {
    console.log(formatLog('info', message, meta));
  },
  warn(message: string, meta?: any) {
    console.warn(formatLog('warn', message, meta));
  },
  error(message: string, meta?: any) {
    console.error(formatLog('error', message, meta));
  },
  debug(message: string, meta?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', message, meta));
    }
  },
};
