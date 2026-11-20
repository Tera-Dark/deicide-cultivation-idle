/**
 * TapTap 小游戏平台适配层。
 *
 * 设计原则：
 * 1. 在普通浏览器 / PWA 环境下全部降级为本地实现，不影响现有玩法。
 * 2. 在 TapTap 小游戏环境下使用 `window.tap` 提供的登录、云存档、广告与桌面快捷方式能力。
 * 3. 广告单元 ID 一律从构建环境变量读取，未配置时不展示广告，避免误发奖励。
 */

type AnyFn = (...args: any[]) => any;

interface TapAd {
  show: () => Promise<void>;
  load?: () => Promise<void>;
  onLoad?: (cb: () => void) => void;
  onError?: (cb: (err: unknown) => void) => void;
  onClose?: (cb: (res?: { isEnded?: boolean }) => void) => void;
}

interface TapCloudSaveManager {
  getArchiveList: (opts: {
    success: (res: { saves?: Array<Record<string, any>> }) => void;
    fail?: (err: unknown) => void;
  }) => void;
  createArchive: (opts: Record<string, any>) => void;
  updateArchive: (opts: Record<string, any>) => void;
  getArchiveData: (opts: Record<string, any>) => void;
}

interface TapFileSystemManager {
  writeFile: (opts: Record<string, any>) => void;
  readFile: (opts: Record<string, any>) => void;
}

interface TapGlobal {
  login?: AnyFn;
  checkSession?: AnyFn;
  createRewardedVideoAd?: (opts: { adUnitId: string }) => TapAd;
  createInterstitialAd?: (opts: { adUnitId: string }) => TapAd;
  showToast?: (opts: { title: string; icon?: 'none' | 'success' | 'error' }) => void;
  getCloudSaveManager?: () => TapCloudSaveManager;
  getFileSystemManager?: () => TapFileSystemManager;
  env?: { USER_DATA_PATH?: string; TEMP_DATA_PATH?: string };
  hasHomeScreenWidgetAndPinned?: AnyFn;
  createHomeScreenWidget?: AnyFn;
  reportEvent?: AnyFn;
  requirePrivacyAuthorize?: AnyFn;
  onHide?: (cb: () => void) => void;
  onShow?: (cb: () => void) => void;
}

declare global {
  interface Window {
    tap?: TapGlobal;
  }
}

export const REWARDED_AD_UNIT_ID = String(
  ((import.meta as ImportMeta & { env?: Record<string, unknown> }).env ?? {})
    .VITE_TAPTAP_REWARDED_AD_UNIT_ID ?? ''
).trim();
export const INTERSTITIAL_AD_UNIT_ID = String(
  ((import.meta as ImportMeta & { env?: Record<string, unknown> }).env ?? {})
    .VITE_TAPTAP_INTERSTITIAL_AD_UNIT_ID ?? ''
).trim();

export function getTap(): TapGlobal | null {
  if (typeof window === 'undefined') return null;
  return window.tap ?? null;
}

export function isTapMiniGame(): boolean {
  return Boolean(getTap());
}

export const PRIVACY_CONSENT_KEY = 'shishen_privacy_consent_v1';

/** 是否已完成可调用平台隐私接口的完整授权（"local" 表示仅本地游玩）。 */
export function hasPrivacyConsent(): boolean {
  try {
    return localStorage.getItem(PRIVACY_CONSENT_KEY) === '1';
  } catch {
    return false;
  }
}

export function hasTapPrivacyApi(): boolean {
  return Boolean(getTap()?.requirePrivacyAuthorize);
}

/** 触发 TapTap 平台隐私授权弹窗；用户拒绝时返回 false。 */
export function requestTapPrivacyAuthorize(): Promise<boolean> {
  const tap = getTap();
  if (!tap?.requirePrivacyAuthorize) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    try {
      tap.requirePrivacyAuthorize?.({
        success: () => resolve(true),
        fail: () => resolve(false),
      });
    } catch {
      resolve(false);
    }
  });
}

export function isAdConfigured(kind: 'rewarded' | 'interstitial' = 'rewarded'): boolean {
  return kind === 'rewarded' ? Boolean(REWARDED_AD_UNIT_ID) : Boolean(INTERSTITIAL_AD_UNIT_ID);
}

/** UI 是否展示广告入口：开发环境允许模拟，正式环境必须配置广告位。 */
export function adsAvailableForUi(): boolean {
  return (
    import.meta.env.DEV ||
    (isTapMiniGame() && Boolean(REWARDED_AD_UNIT_ID) && hasPrivacyConsent())
  );
}

export function tapToast(title: string, icon: 'none' | 'success' | 'error' = 'none'): void {
  const tap = getTap();
  if (tap?.showToast) {
    try {
      tap.showToast({ title, icon });
      return;
    } catch {
      // fall through to console
    }
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(`[tap.toast] ${title}`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  登录态                                     */
/* -------------------------------------------------------------------------- */

let loginPromise: Promise<boolean> | null = null;

/**
 * 小游戏启动时静默调用 TapTap 登录。单机玩法不依赖服务端换取 openid，
 * 但平台审核要求包体内必须接入登录能力；云存档也会复用平台身份。
 */
export function ensureTapLogin(): Promise<boolean> {
  if (loginPromise) return loginPromise;
  // 未完成平台隐私授权前不调用登录接口。
  if (isTapMiniGame() && !hasPrivacyConsent()) return Promise.resolve(false);
  const tap = getTap();
  if (!tap?.login) {
    loginPromise = Promise.resolve(false);
    return loginPromise;
  }
  const login = tap.login;
  loginPromise = new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => resolve(false), 8000);
    try {
      const maybe = login({
        success: () => {
          window.clearTimeout(timeout);
          resolve(true);
        },
        fail: () => {
          window.clearTimeout(timeout);
          resolve(false);
        },
      });
      if (maybe && typeof (maybe as Promise<unknown>).then === 'function') {
        (maybe as Promise<unknown>)
          .then(() => {
            window.clearTimeout(timeout);
            resolve(true);
          })
          .catch(() => {
            window.clearTimeout(timeout);
            resolve(false);
          });
      }
    } catch {
      window.clearTimeout(timeout);
      resolve(false);
    }
  });
  return loginPromise;
}

/* -------------------------------------------------------------------------- */
/*                                  广告                                       */
/* -------------------------------------------------------------------------- */

const REWARDED_TIMEOUT_MS = 30_000;
const INTERSTITIAL_COOLDOWN_MS = 3 * 60 * 1000;
const AD_MOCK_DELAY_MS = 900;

type RewardResolver = (ok: boolean) => void;

let rewardedAd: TapAd | null = null;
let rewardResolvers: RewardResolver[] = [];
let lastInterstitialAt = 0;

/** 在用户同意隐私政策后再预加载广告，避免提前初始化广告 SDK。 */
export function initAds(): void {
  if (!hasPrivacyConsent()) return;
  if (!isTapMiniGame() || !REWARDED_AD_UNIT_ID) return;
  getRewardedAd();
}

function resolveRewards(ok: boolean): void {
  const resolvers = rewardResolvers;
  rewardResolvers = [];
  resolvers.forEach((resolve) => resolve(ok));
}

function getRewardedAd(): TapAd | null {
  if (rewardedAd) return rewardedAd;
  const tap = getTap();
  if (!tap?.createRewardedVideoAd || !REWARDED_AD_UNIT_ID) return null;
  try {
    rewardedAd = tap.createRewardedVideoAd({ adUnitId: REWARDED_AD_UNIT_ID });
    rewardedAd.onLoad?.(() => {
      // 预加载完成，无需额外处理
    });
    rewardedAd.onError?.((err) => {
      // eslint-disable-next-line no-console
      console.warn('[ad] rewarded load/play error', err);
      resolveRewards(false);
    });
    rewardedAd.onClose?.((res) => {
      resolveRewards(Boolean(res?.isEnded));
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[ad] createRewardedVideoAd failed', err);
    rewardedAd = null;
  }
  return rewardedAd;
}

/**
 * 播放激励视频。仅在用户完整观看（onClose.isEnded === true）时返回 true。
 * 开发环境没有 TapTap 容器时模拟 900ms 广告，便于本地验证奖励链路。
 */
export function showRewardedAd(placement: string): Promise<boolean> {
  if (rewardResolvers.length > 0) return Promise.resolve(false);
  if (!isTapMiniGame() || !REWARDED_AD_UNIT_ID) {
    if (import.meta.env.DEV) {
      tapToast('开发模式：模拟广告播放中…');
      return new Promise((resolve) => {
        window.setTimeout(() => {
          tapToast('开发模式：广告观看完成', 'success');
          resolve(true);
        }, AD_MOCK_DELAY_MS);
      });
    }
    tapToast('广告暂未开放，请稍后再试');
    return Promise.resolve(false);
  }

  const ad = getRewardedAd();
  if (!ad) {
    tapToast('广告加载失败，请稍后再试');
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      resolve(ok);
    };

    const timeout = window.setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn(`[ad] rewarded timeout (${placement})`);
      tapToast('广告加载超时，请稍后再试');
      finish(false);
    }, REWARDED_TIMEOUT_MS);

    rewardResolvers.push(finish);

    const play = () => {
      ad.show()
        .catch(() => {
          if (!ad.load) throw new Error('ad not ready');
          return ad.load().then(() => ad.show());
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('[ad] rewarded show failed', err);
          tapToast('暂无广告，请稍后再试');
          finish(false);
        });
    };

    play();
  });
}

/**
 * 插屏广告：只在自然断点（例如胜利结算关闭后）调用，并做 3 分钟冷却。
 * 未配置广告位时直接返回 false，不阻塞主流程。
 */
export function showInterstitialAd(): Promise<boolean> {
  if (!INTERSTITIAL_AD_UNIT_ID || !isTapMiniGame()) return Promise.resolve(false);
  if (Date.now() - lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return Promise.resolve(false);

  const tap = getTap();
  if (!tap?.createInterstitialAd) return Promise.resolve(false);

  let ad: TapAd | null = null;
  try {
    ad = tap.createInterstitialAd({ adUnitId: INTERSTITIAL_AD_UNIT_ID });
  } catch {
    return Promise.resolve(false);
  }
  if (!ad) return Promise.resolve(false);

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (ok) lastInterstitialAt = Date.now();
      resolve(ok);
    };
    const timeout = window.setTimeout(() => finish(false), 15_000);
    ad.onClose?.(() => finish(true));
    ad.onError?.(() => finish(false));
    ad.show()
      .catch(() => {
        if (!ad?.load) {
          finish(false);
          return;
        }
        return ad.load().then(() => ad?.show()).catch(() => finish(false));
      })
      .catch(() => finish(false));
  });
}

/* -------------------------------------------------------------------------- */
/*                                  云存档                                     */
/* -------------------------------------------------------------------------- */

const CLOUD_ARCHIVE_NAME = 'auto_save';
const CLOUD_ARCHIVE_FILE = 'auto_save.json';
const CLOUD_UPLOAD_INTERVAL_MS = 65_000;

let pendingCloudPayload: string | null = null;
let cloudTimer: number | null = null;
let lastCloudUploadAt = 0;
let cloudInFlight = false;

export function cloudSaveAvailable(): boolean {
  if (!hasPrivacyConsent()) return false;
  const tap = getTap();
  return Boolean(tap?.getCloudSaveManager && tap?.getFileSystemManager && tap?.env?.USER_DATA_PATH);
}

function callTap<T>(
  fn: (opts: any) => void,
  opts: Record<string, any>,
  timeoutMs = 10_000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('tap api timeout')), timeoutMs);
    try {
      fn({
        ...opts,
        success: (res: T) => {
          window.clearTimeout(timeout);
          resolve(res);
        },
        fail: (err: unknown) => {
          window.clearTimeout(timeout);
          reject(err);
        },
      });
    } catch (err) {
      window.clearTimeout(timeout);
      reject(err);
    }
  });
}

async function uploadCloudNow(payload: string): Promise<boolean> {
  const tap = getTap();
  const cloud = tap?.getCloudSaveManager?.();
  const fs = tap?.getFileSystemManager?.();
  const basePath = tap?.env?.USER_DATA_PATH;
  if (!cloud || !fs || !basePath) return false;

  const filePath = `${basePath}/${CLOUD_ARCHIVE_FILE}`;
  try {
    await callTap<unknown>((opts) => fs.writeFile(opts), {
      filePath,
      data: payload,
      encoding: 'utf8',
    });

    const list = await callTap<{ saves?: Array<Record<string, any>> }>(
      (opts) => cloud.getArchiveList(opts),
      {}
    );
    const existing = (list.saves ?? []).find((s) => s.name === CLOUD_ARCHIVE_NAME);
    const options: Record<string, any> = {
      archiveMetaData: {
        name: CLOUD_ARCHIVE_NAME,
        summary: 'Godslayer Dao auto save',
        playtime: 0,
      },
      archiveFilePath: filePath,
    };

    if (existing) {
      await callTap<unknown>((opts) => cloud.updateArchive(opts), {
        archiveUUID: existing.uuid,
        ...options,
      });
    } else {
      await callTap<unknown>((opts) => cloud.createArchive(opts), options);
    }
    lastCloudUploadAt = Date.now();
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloud] upload failed', err);
    return false;
  }
}

/** 节流上传：云存档接口限制约 1 次/分钟，这里做 65 秒节流与单飞。 */
export function scheduleCloudSave(payloadBase64: string): void {
  if (!cloudSaveAvailable()) return;
  pendingCloudPayload = payloadBase64;
  if (cloudTimer !== null || cloudInFlight) return;
  const wait = Math.max(0, CLOUD_UPLOAD_INTERVAL_MS - (Date.now() - lastCloudUploadAt));
  cloudTimer = window.setTimeout(() => {
    cloudTimer = null;
    void flushCloudSave();
  }, wait);
}

export function getLastCloudUploadAt(): number {
  return lastCloudUploadAt;
}

export function cloudUploadCooldownRemaining(): number {
  return Math.max(0, CLOUD_UPLOAD_INTERVAL_MS - (Date.now() - lastCloudUploadAt));
}

export async function flushCloudSave(): Promise<boolean> {
  if (!cloudSaveAvailable() || !pendingCloudPayload || cloudInFlight) return false;
  // 平台限制：同一存档每分钟最多上传 1 次。
  if (cloudUploadCooldownRemaining() > 0) return false;
  cloudInFlight = true;
  const payload = pendingCloudPayload;
  pendingCloudPayload = null;
  try {
    return await uploadCloudNow(payload);
  } finally {
    cloudInFlight = false;
    if (pendingCloudPayload) {
      const wait = Math.max(0, CLOUD_UPLOAD_INTERVAL_MS - (Date.now() - lastCloudUploadAt));
      if (cloudTimer === null) {
        cloudTimer = window.setTimeout(() => {
          cloudTimer = null;
          void flushCloudSave();
        }, wait);
      }
    }
  }
}

export async function loadCloudSave(): Promise<string | null> {
  if (!hasPrivacyConsent()) return null;
  const tap = getTap();
  const cloud = tap?.getCloudSaveManager?.();
  const fs = tap?.getFileSystemManager?.();
  const basePath = tap?.env?.USER_DATA_PATH;
  if (!cloud || !fs || !basePath) return null;

  try {
    const list = await callTap<{ saves?: Array<Record<string, any>> }>(
      (opts) => cloud.getArchiveList(opts),
      {}
    );
    const archive = (list.saves ?? []).find((s) => s.name === CLOUD_ARCHIVE_NAME);
    if (!archive) return null;

    const targetFilePath = `${basePath}/${CLOUD_ARCHIVE_FILE}`;
    const downloaded = await callTap<{ filePath?: string }>(
      (opts) => cloud.getArchiveData(opts),
      {
        archiveUUID: archive.uuid,
        archiveFileId: archive.fileId,
        targetFilePath,
      }
    );
    const file = await callTap<{ data?: string }>((opts) => fs.readFile(opts), {
      filePath: downloaded.filePath || targetFilePath,
      encoding: 'utf8',
    });
    return typeof file.data === 'string' && file.data.length > 0 ? file.data : null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[cloud] load failed', err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              桌面快捷方式                                   */
/* -------------------------------------------------------------------------- */

export function requestAddToDesktop(): Promise<boolean> {
  if (!hasPrivacyConsent()) {
    tapToast('请先同意隐私政策后再添加到桌面');
    return Promise.resolve(false);
  }
  const tap = getTap();
  if (!tap?.hasHomeScreenWidgetAndPinned || !tap?.createHomeScreenWidget) {
    tapToast('请使用 TapTap 客户端打开后添加桌面');
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    tap.hasHomeScreenWidgetAndPinned?.({
      success: ({ isPinned, isAdded }: { isPinned?: boolean; isAdded?: boolean }) => {
        if (isPinned || isAdded) {
          tapToast('已在桌面快捷方式中', 'success');
          resolve(true);
          return;
        }
        tap.createHomeScreenWidget?.({
          success: () => {
            tapToast('已添加到桌面', 'success');
            resolve(true);
          },
          fail: () => {
            tapToast('添加失败，请稍后再试');
            resolve(false);
          },
        });
      },
      fail: () => {
        tapToast('添加失败，请稍后再试');
        resolve(false);
      },
    });
  });
}

/* -------------------------------------------------------------------------- */
/*                              应用生命周期                                   */
/* -------------------------------------------------------------------------- */

export function subscribeAppLifecycle(onHide: () => void, onShow: () => void): () => void {
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') onHide();
    else onShow();
  };
  const handlePageHide = () => onHide();

  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('pagehide', handlePageHide);

  const tap = getTap();
  try {
    tap?.onHide?.(onHide);
    tap?.onShow?.(onShow);
  } catch {
    // 部分容器版本未实现，忽略即可
  }

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('pagehide', handlePageHide);
  };
}
