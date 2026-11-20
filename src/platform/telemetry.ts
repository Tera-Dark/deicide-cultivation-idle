import { getTap } from './tap';

/**
 * 轻量埋点。TapTap 小游戏数据看板会自动收集基础数据；
 * 这里补充关键玩法漏斗，浏览器环境下只输出到 console。
 */
export function track(event: string, props?: Record<string, string | number | boolean>): void {
  try {
    const tap = getTap();
    if (tap?.reportEvent) {
      tap.reportEvent({ eventName: event, ...(props ?? {}) });
    }
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[track]', event, props ?? {});
    }
  } catch {
    // 埋点不能影响游戏
  }
}

export function trackError(error: unknown, context = 'unknown'): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack?.slice(0, 800) : undefined;
  try {
    const tap = getTap();
    if (tap?.reportEvent) {
      tap.reportEvent({ eventName: 'client_error', context, message, stack });
    }
  } catch {
    // ignore
  }
  // eslint-disable-next-line no-console
  console.error(`[client_error:${context}]`, error);
}

export function installGlobalErrorTracking(): () => void {
  const onError = (event: ErrorEvent) => {
    trackError(event.error ?? event.message, 'window_error');
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    trackError(event.reason, 'unhandled_rejection');
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
