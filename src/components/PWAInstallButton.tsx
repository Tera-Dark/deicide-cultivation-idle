import { useState } from 'react';
import { CheckCircle2, Download, Share, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="rounded-xl border border-[#34d399]/35 bg-[#10b981]/10 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#a7f3d0]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34d399]" />
          <span>已作为桌面 / 主屏独立应用运行（支持离线单机）</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#38bdf8]/35 bg-[#0e1526] p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#e0f2fe]">
            <Smartphone className="w-4 h-4 text-[#38bdf8] shrink-0" />
            <span>安装到桌面 / 主屏幕</span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5 leading-snug">
            全屏无地址栏沉浸体验，断网亦可离线启动并自动保存本地进度
          </p>
        </div>

        {isInstallable ? (
          <button
            type="button"
            onClick={() => {
              void install();
            }}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#06b6d4]/25 border border-[#22d3ee]/60 text-[#ecfeff] hover:bg-[#06b6d4]/38 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>一键安装</span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide((v) => !v)}
            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#1e2338] border border-[#38bdf8]/45 text-[#cffafe] hover:bg-[#06b6d4]/25 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Share className="w-4 h-4" />
            <span>{showIOSGuide ? '收起指引' : '主屏安装指引'}</span>
          </button>
        ) : (
          <span className="text-[11px] font-medium text-[#7dd3fc] bg-[#161e33] border border-[#2e3552] rounded-lg px-2.5 py-1.5 shrink-0">
            浏览器菜单可添加桌面
          </span>
        )}
      </div>

      {isIOS && showIOSGuide && (
        <div className="rounded-lg bg-[#090c16] border border-[#2e3552] px-3 py-2 text-xs text-[#cbd5e1] leading-relaxed space-y-1">
          <div>1. 点击 Safari 底部工具栏的「分享」图标；</div>
          <div>2. 下滑菜单选择「添加到主屏幕」，即可从桌面独立全屏启动。</div>
        </div>
      )}
    </div>
  );
}
