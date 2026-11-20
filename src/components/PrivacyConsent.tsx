import { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, ShieldCheck } from 'lucide-react';
import { track } from '../platform/telemetry';
import {
  PRIVACY_CONSENT_KEY,
  ensureTapLogin,
  hasPrivacyConsent,
  hasTapPrivacyApi,
  initAds,
  isTapMiniGame,
  requestTapPrivacyAuthorize,
} from '../platform/tap';

type ConsentMode = 'checking' | 'prompt' | 'accepted';

function readStoredConsent(): ConsentMode {
  try {
    const value = localStorage.getItem(PRIVACY_CONSENT_KEY);
    if (value === '1' || value === 'local') return 'accepted';
  } catch {
    // ignore
  }
  return isTapMiniGame() && hasTapPrivacyApi() ? 'checking' : 'prompt';
}

export function PrivacyConsent() {
  const [mode, setMode] = useState<ConsentMode>(readStoredConsent);
  const [declined, setDeclined] = useState(false);
  const [platformDeclined, setPlatformDeclined] = useState(false);

  const grant = useCallback((full: boolean) => {
    try {
      localStorage.setItem(PRIVACY_CONSENT_KEY, full ? '1' : 'local');
    } catch {
      // ignore
    }
    setMode('accepted');
    if (full) {
      initAds();
      void ensureTapLogin();
      window.dispatchEvent(new Event('shishen:privacy-consent'));
    }
    track('privacy_consent', { accepted: true, full });
  }, []);

  // 首次进入小游戏时优先使用 TapTap 平台隐私授权弹窗。
  useEffect(() => {
    if (mode !== 'checking') return;
    let cancelled = false;
    void requestTapPrivacyAuthorize().then((ok) => {
      if (cancelled) return;
      if (ok) {
        grant(true);
      } else {
        setPlatformDeclined(true);
        setMode('prompt');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mode, grant]);

  useEffect(() => {
    if (mode === 'accepted' && hasPrivacyConsent()) initAds();
  }, [mode]);

  if (mode === 'accepted') return null;

  if (mode === 'checking') {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#04050a]/96 p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#38bdf8]/40 bg-[#151827] px-5 py-4 text-sm text-[#cbd5e1]">
          <Loader2 className="h-5 w-5 animate-spin text-[#38bdf8]" />
          <span>正在请求 TapTap 隐私授权…</span>
        </div>
      </div>
    );
  }

  const agree = () => {
    setDeclined(false);
    if (isTapMiniGame() && hasTapPrivacyApi()) {
      setPlatformDeclined(false);
      setMode('checking');
      return;
    }
    // 浏览器环境没有平台隐私接口，使用本页面的自定义授权。
    grant(true);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#04050a]/96 p-4">
      <div className="w-full max-w-[440px] max-h-[92dvh] overflow-y-auto custom-scroll rounded-2xl border border-[#38bdf8]/45 bg-[#151827] p-5 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#38bdf8]" />
          <h2 className="font-display text-base font-black text-[#f4f1ea]">
            用户协议与隐私政策
          </h2>
        </div>

        <p className="text-xs leading-relaxed text-[#cbd5e1]">
          欢迎游玩《弑神道果：万亿亿劫》。开始前，请阅读并同意
          <a
            href="./terms.html"
            target="_blank"
            rel="noreferrer"
            className="mx-1 text-[#7dd3fc] underline underline-offset-2"
          >
            《用户协议》
          </a>
          与
          <a
            href="./privacy.html"
            target="_blank"
            rel="noreferrer"
            className="mx-1 text-[#7dd3fc] underline underline-offset-2"
          >
            《隐私政策》
          </a>
          。
        </p>

        <div className="rounded-xl border border-[#2e3552] bg-[#101322] p-3.5 space-y-2 text-[11px] leading-relaxed text-[#94a3b8]">
          <p className="font-bold text-[#e2e8f0]">我们会用到的能力：</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>TapTap 小游戏登录：用于识别账号与跨设备同步。</li>
            <li>TapTap 云存档：保存境界、护法、词缀、遗物与设置。</li>
            <li>
              TapADN 广告（聚合穿山甲 / 优量汇）：激励视频仅在您主动点击「看广告」时播放，插屏仅在胜利结算后的自然断点展示；广告可能收集设备标识符与网络信息，用于投放、频次控制与反作弊。
            </li>
            <li>本地存档：未登录时进度保存在本机。</li>
          </ul>
          <p>
            我们不会采集通讯录、定位、相册、麦克风等敏感信息，也不会出售您的游戏进度。您可以在《隐私政策》中查看第三方 SDK 清单、数据用途、保存期限与删除方式。
          </p>
        </div>

        {platformDeclined && (
          <div className="rounded-xl border border-[#fbbf24]/45 bg-[#f59e0b]/10 p-3 text-[11px] leading-relaxed text-[#fde68a]">
            平台隐私授权尚未完成。您可以再次授权以启用登录、云存档与广告，或选择仅本地游玩。
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-[#64748b]">
          适龄提示 12+。抵制不良游戏，拒绝盗版游戏。适度游戏益脑，沉迷游戏伤身。
        </p>

        {declined && (
          <div className="rounded-xl border border-[#f43f5e]/45 bg-[#f43f5e]/10 p-3 text-[11px] leading-relaxed text-[#fda4af]">
            未同意隐私政策时，我们不会加载广告或同步云存档。您可以重新阅读后选择同意，或选择仅本地游玩。
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={agree}
            className="min-h-[46px] w-full rounded-xl border border-[#22d3ee]/65 bg-[#06b6d4]/25 px-4 py-2.5 text-sm font-display font-bold tracking-wider text-[#ecfeff] hover:bg-[#06b6d4]/38 cursor-pointer"
          >
            {platformDeclined ? '重新授权平台隐私' : '同意并开始游戏'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDeclined(true);
            }}
            className="min-h-[42px] w-full rounded-xl border border-[#384166] bg-[#181d31] px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:text-white cursor-pointer"
          >
            不同意
          </button>
          {platformDeclined && (
            <button
              type="button"
              onClick={() => grant(false)}
              className="min-h-[38px] w-full rounded-xl border border-[#2e3552] bg-transparent px-4 py-2 text-[11px] font-semibold text-[#7dd3fc] hover:bg-white/[0.03] cursor-pointer"
            >
              仅本地游玩（不登录 / 不同步云存档 / 不看广告）
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#64748b]">
          <FileText className="w-3 h-3" />
          <span>可在设置中随时查看协议与隐私政策</span>
        </div>
      </div>
    </div>
  );
}
