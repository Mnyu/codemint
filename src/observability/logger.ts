export const log = {
  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args);
  },

  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  debug: (...args: unknown[]) => {
    console.log('[DEBUG]', ...args);
  },
};
