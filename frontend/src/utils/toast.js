import { toast as rawToast } from 'sonner';

// Map to track timestamps of recently triggered toasts
const lastShown = new Map();
const DEFAULT_THROTTLE_MS = 1500;

/**
 * Checks whether a toast message should be shown based on throttle window.
 * @param {string|React.ReactNode} message 
 * @param {string} [id] - Optional unique identifier
 * @param {number} [duration] - Throttle time window in ms
 */
function shouldShowToast(message, id, duration = DEFAULT_THROTTLE_MS) {
  const now = Date.now();
  const key = id || (typeof message === 'string' ? message : JSON.stringify(message));
  const lastTime = lastShown.get(key);

  if (lastTime && now - lastTime < duration) {
    return false;
  }

  lastShown.set(key, now);

  // Clean up old entries periodically
  if (lastShown.size > 50) {
    for (const [k, time] of lastShown.entries()) {
      if (now - time > duration * 2) {
        lastShown.delete(k);
      }
    }
  }

  return true;
}

export const toast = {
  success: (message, options) => {
    if (shouldShowToast(message, options?.id, options?.throttleMs)) {
      return rawToast.success(message, options);
    }
  },
  error: (message, options) => {
    if (shouldShowToast(message, options?.id, options?.throttleMs)) {
      return rawToast.error(message, options);
    }
  },
  info: (message, options) => {
    if (shouldShowToast(message, options?.id, options?.throttleMs)) {
      return rawToast.info(message, options);
    }
  },
  warning: (message, options) => {
    if (shouldShowToast(message, options?.id, options?.throttleMs)) {
      return rawToast.warning(message, options);
    }
  },
  message: (message, options) => {
    if (shouldShowToast(message, options?.id, options?.throttleMs)) {
      return rawToast.message(message, options);
    }
  },
  dismiss: (id) => rawToast.dismiss(id),
  promise: rawToast.promise,
  custom: rawToast.custom
};

export default toast;
