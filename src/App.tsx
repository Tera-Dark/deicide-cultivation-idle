import { Component, useState, type ReactNode } from 'react';
import { BossArena } from './components/BossArena';
import { HeroDaoIcon, MercSwordIcon, RelicHallIcon } from './components/CultivationIcons';
import {
  BuildGuideModal,
  IntroModal,
  MercForgeModal,
  RestartModal,
  SettingsModal,
  TribulationsModal,
  UnlockTutorialModal,
  VictoryModal,
} from './components/Modals';
import { TabHero } from './components/TabHero';
import { TabMercenaries } from './components/TabMercenaries';
import { TabRelics } from './components/TabRelics';
import { TopStatusBar } from './components/TopStatusBar';
import { RichLoreText } from './config/highlights';
import { GameProvider, useGameStore } from './stores/useGameStore';
import type { BuyMode } from './types/game';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : String(error),
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full bg-[#0b0d15] text-[#f4f1ea] flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#151827] border border-[#f43f5e]/50 rounded-xl p-5 space-y-3 text-center">
            <h2 className="font-display text-base font-bold text-[#fda4af]">
              页面状态异常
            </h2>
            <p className="text-xs text-[#a3b1cc] break-words">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('shishen_daoguo_v35_save');
                } catch {
                  // Ignore
                }
                window.location.reload();
              }}
              className="px-4 py-2 rounded-md text-xs font-semibold bg-[#e11d48] text-white hover:bg-[#be123c] cursor-pointer"
            >
              重置存档并重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type MainTab = 'hero' | 'mercs' | 'relics';

const TABS: { id: MainTab; label: string; icon: ReactNode }[] = [
  { id: 'hero', label: '主角修为', icon: <HeroDaoIcon className="w-3.5 h-3.5" /> },
  { id: 'mercs', label: '五人佣兵', icon: <MercSwordIcon className="w-3.5 h-3.5" /> },
  { id: 'relics', label: '古神遗物', icon: <RelicHallIcon className="w-3.5 h-3.5" /> },
];

const BULK_MODES: { value: BuyMode; label: string }[] = [
  { value: 1, label: '×1' },
  { value: 10, label: '×10' },
  { value: 'MAX', label: 'MAX' },
];

function GameShell() {
  const { toastMessage, meta, settings, setBuyMode } = useGameStore();
  const [activeTab, setActiveTab] = useState<MainTab>('hero');
  const [tribulationsOpen, setTribulationsOpen] = useState(false);
  const [forgeMercSlotIdx, setForgeMercSlotIdx] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] w-full bg-[#080a11] flex justify-center">
      {/* Mobile-First Centered Viewport Container */}
      <div className="max-w-[460px] w-full h-[100dvh] mx-auto overflow-hidden flex flex-col border-x border-[#2e3552] select-none bg-[#0d101b] text-[#f1efe9] relative shadow-[0_0_50px_rgba(14,165,233,0.08)]">
        {/* 1. Top Compact Status Bar */}
        <TopStatusBar
          onOpenTribulations={() => setTribulationsOpen(true)}
          onOpenRestart={() => setRestartOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* 2. Middle Sacred Geometry Boss Arena & Skill Bar */}
        <BossArena />

        {/* 3. Bottom Build Drawer */}
        <section className="flex-1 min-h-0 flex flex-col bg-[#111421]">
          <nav
            aria-label="底部构筑分页"
            className="shrink-0 flex items-center justify-between gap-1.5 px-2.5 py-2 bg-[#151827] border-b border-[#2e3552]"
          >
            <div className="flex items-center gap-1 min-w-0">
              {TABS.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#06b6d4]/22 text-[#67e8f9] border border-[#22d3ee]/55'
                        : 'text-[#94a3b8] hover:text-white border border-transparent'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div
              className="flex items-center gap-0.5 p-0.5 bg-[#0d101b] border border-[#2e3552] rounded-md shrink-0"
              title={
                meta.unlockedBulkBuy
                  ? '全局购买倍率'
                  : '击破第 4 重躯壳解锁 ×10 / MAX 批量购买'
              }
            >
              {BULK_MODES.map((m) => {
                const active = settings.buyMode === m.value;
                const locked = !meta.unlockedBulkBuy && m.value !== 1;
                return (
                  <button
                    key={String(m.value)}
                    type="button"
                    disabled={locked}
                    onClick={() => setBuyMode(m.value)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono-num font-semibold rounded transition-colors whitespace-nowrap ${
                      locked
                        ? 'text-[#475569] cursor-not-allowed'
                        : active
                          ? 'bg-[#06b6d4]/30 text-[#67e8f9] cursor-pointer'
                          : 'text-[#94a3b8] hover:text-white cursor-pointer'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-2.5">
            {activeTab === 'hero' && <TabHero />}
            {activeTab === 'mercs' && (
              <TabMercenaries
                onOpenForgeModal={(idx) => setForgeMercSlotIdx(idx)}
                onOpenGuideModal={() => setGuideOpen(true)}
              />
            )}
            {activeTab === 'relics' && <TabRelics />}
          </div>
        </section>

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-md bg-gradient-to-r from-[#0e1220]/96 via-[#161c30]/98 to-[#0e1220]/96 border border-[#fbbf24]/55 text-xs text-[#f1f5f9] shadow-[0_6px_26px_rgba(0,0,0,0.75)] pointer-events-none max-w-[92%] truncate font-medium tracking-wide"
          >
            <RichLoreText text={toastMessage} />
          </div>
        )}
      </div>

      {/* Modals */}
      <IntroModal />
      <UnlockTutorialModal />
      <BuildGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
      <VictoryModal />
      <TribulationsModal open={tribulationsOpen} onClose={() => setTribulationsOpen(false)} />
      <MercForgeModal
        slotIndex={forgeMercSlotIdx}
        onClose={() => setForgeMercSlotIdx(null)}
      />
      <RestartModal open={restartOpen} onClose={() => setRestartOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameShell />
      </GameProvider>
    </ErrorBoundary>
  );
}
