import { Component, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BossArena, type MobileViewMode } from './components/BossArena';
import { CompendiumModal } from './components/CompendiumModal';
import { HeroDaoIcon, MercSwordIcon, RelicHallIcon } from './components/CultivationIcons';
import {
  BuildGuideModal,
  IntroModal,
  MercForgeModal,
  OfflineReportModal,
  RestartModal,
  SettingsModal,
  TribulationsModal,
  UnlockTutorialModal,
  VictoryModal,
} from './components/Modals';
import { OfflineIndicator } from './components/OfflineIndicator';
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

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught UI error:', error);
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
  { id: 'hero', label: '主角修为', icon: <HeroDaoIcon className="w-4 h-4 shrink-0" /> },
  { id: 'mercs', label: '五人护法', icon: <MercSwordIcon className="w-4 h-4 shrink-0" /> },
  { id: 'relics', label: '古神遗物', icon: <RelicHallIcon className="w-4 h-4 shrink-0" /> },
];

const BULK_MODES: { value: BuyMode; label: string }[] = [
  { value: 1, label: '×1' },
  { value: 10, label: '×10' },
  { value: 'MAX', label: 'MAX' },
];

function GameShell() {
  const { toastMessage, meta, settings, setBuyMode } = useGameStore();
  const [activeTab, setActiveTab] = useState<MainTab>('hero');
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('balanced');
  const [tribulationsOpen, setTribulationsOpen] = useState(false);
  const [compendiumOpen, setCompendiumOpen] = useState(false);
  const [forgeMercSlotIdx, setForgeMercSlotIdx] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSelectMobileTab = (tabId: MainTab) => {
    setActiveTab(tabId);
    if (mobileViewMode === 'arena_focus') {
      setMobileViewMode('balanced');
    }
  };

  const bulkSelector = (
    <div
      className="flex items-center gap-1 p-1 bg-[#0d101b] border border-[#2e3552] rounded-lg shrink-0"
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
            className={`min-h-[34px] min-w-[46px] px-2.5 text-xs font-mono-num font-bold rounded-md transition-colors whitespace-nowrap ${
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
  );

  return (
    <div className="h-[100dvh] w-full bg-[#080a11] flex justify-center overflow-hidden">
      {/* Mobile-First Responsive Shell (Full-width Phone -> 2-Column Desktop) */}
      <div className="w-full max-w-[540px] lg:max-w-6xl h-[100dvh] mx-auto overflow-hidden flex flex-col sm:border-x border-[#2e3552] select-none bg-[#0d101b] text-[#f1efe9] relative shadow-[0_0_50px_rgba(14,165,233,0.08)]">
        {/* 1. Top Status Bar */}
        <TopStatusBar
          onOpenTribulations={() => setTribulationsOpen(true)}
          onOpenCompendium={() => setCompendiumOpen(true)}
          onOpenRestart={() => setRestartOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* 2. Main Split Workspace */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* Arena: Collapsible/Expandable Upper Stage on Mobile, Left Column on Desktop */}
          <BossArena
            mobileViewMode={mobileViewMode}
            onChangeMobileViewMode={setMobileViewMode}
          />

          {/* Build Workspace: Scrollable Cards + Desktop Top Tabs */}
          <section
            className={`${
              mobileViewMode === 'arena_focus' ? 'shrink-0 lg:flex-1' : 'flex-1 min-h-0'
            } flex flex-col bg-[#111421]`}
          >
            {/* Desktop Tabs + Bulk Bar | Mobile Expand/Collapse + Bulk Utility Header */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-[#151827] border-b border-[#2e3552]">
              {/* Desktop Tabs */}
              <nav
                aria-label="主构筑分页"
                className="hidden lg:flex items-center gap-1.5 min-w-0"
              >
                {TABS.map((t) => {
                  const active = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              </nav>

              {/* Mobile Expand/Collapse Controls */}
              <div className="lg:hidden flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    setMobileViewMode((m) => (m === 'arena_focus' ? 'balanced' : 'arena_focus'))
                  }
                  className={`min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    mobileViewMode === 'arena_focus'
                      ? 'bg-[#06b6d4]/25 border-[#22d3ee]/60 text-[#67e8f9]'
                      : 'bg-[#101322] border-[#2e3552] text-[#cbd5e1] hover:text-white'
                  }`}
                >
                  {mobileViewMode === 'arena_focus' ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>展开构筑</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>收起构筑</span>
                    </>
                  )}
                </button>
                {mobileViewMode !== 'arena_focus' && (
                  <button
                    type="button"
                    onClick={() =>
                      setMobileViewMode((m) => (m === 'build_focus' ? 'balanced' : 'build_focus'))
                    }
                    className={`min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      mobileViewMode === 'build_focus'
                        ? 'bg-[#a855f7]/25 border-[#c084fc]/60 text-[#e9d5ff]'
                        : 'bg-[#101322] border-[#2e3552] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {mobileViewMode === 'build_focus' ? (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>展开战区</span>
                      </>
                    ) : (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>全屏构筑</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {activeTab !== 'relics' && mobileViewMode !== 'arena_focus' ? (
                bulkSelector
              ) : (
                <div className="hidden lg:block" />
              )}
            </div>

            <div
              className={`${
                mobileViewMode === 'arena_focus' ? 'hidden lg:block' : 'block'
              } flex-1 min-h-0 overflow-y-auto custom-scroll p-3 space-y-2.5`}
            >
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
        </div>

        {/* 3. Mobile Bottom Thumb-Zone Navigation Bar */}
        <nav
          aria-label="底部构筑导航"
          className="lg:hidden shrink-0 grid grid-cols-3 gap-1.5 px-2.5 py-2 bg-[#151827] border-t border-[#2e3552] pb-safe"
        >
          {TABS.map((t) => {
            const active = activeTab === t.id && mobileViewMode !== 'arena_focus';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectMobileTab(t.id)}
                className={`min-h-[46px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-[13px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#06b6d4]/22 text-[#67e8f9] border border-[#22d3ee]/60 shadow-[0_0_14px_rgba(6,182,212,0.18)]'
                    : 'bg-[#101322]/70 text-[#94a3b8] hover:text-white border border-white/6'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="absolute bottom-[74px] lg:bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#0e1220]/98 via-[#161c30]/98 to-[#0e1220]/98 border border-[#fbbf24]/60 text-[13px] text-[#f1f5f9] shadow-[0_6px_26px_rgba(0,0,0,0.8)] pointer-events-none max-w-[92%] truncate font-medium tracking-wide"
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
      <OfflineReportModal />
      <TribulationsModal open={tribulationsOpen} onClose={() => setTribulationsOpen(false)} />
      <CompendiumModal open={compendiumOpen} onClose={() => setCompendiumOpen(false)} />
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
        <OfflineIndicator />
        <GameShell />
      </GameProvider>
    </ErrorBoundary>
  );
}
