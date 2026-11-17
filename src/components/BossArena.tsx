import React, { useState } from 'react';
import Decimal from 'break_infinity.js';
import { ChevronDown, ChevronUp, Lock, Play, Repeat } from 'lucide-react';
import posterVerticalImg from '../assets/images/taptap_poster_vertical_1794919855856.jpg';
import { ARCHETYPES } from '../config/archetypes';
import { BOSS_SHELLS } from '../config/bosses';
import { REALM_TIERS, SKILLS } from '../config/constants';
import {
  getGlobalMult,
  getHeroStats,
  getPoisonTickExpectedDamage,
  getRelicTotalLv,
  getSkillEffectiveValues,
} from '../core/damageCalc';
import { formatNumber, formatTimeMs, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import type { ArchetypeId } from '../types/game';
import { PhaseBreakSigilIcon } from './CultivationIcons';

function CompanionGeometry({
  archetype,
  pulseId,
  hitVfxEnabled,
}: {
  archetype: ArchetypeId;
  pulseId: number;
  hitVfxEnabled: boolean;
}) {
  return (
    <div
      key={hitVfxEnabled ? `merc-${pulseId}` : 'merc-static'}
      className={`w-6 h-6 flex items-center justify-center ${
        hitVfxEnabled && pulseId > 0 ? 'animate-companion-lunge' : ''
      }`}
      title={ARCHETYPES[archetype].name}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
        {archetype === 'merc_sword' && (
          <polygon
            points="16,3 24,27 16,22 8,27"
            fill="#06b6d4"
            fillOpacity="0.28"
            stroke="#22d3ee"
            strokeWidth="1.8"
            style={{ filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.75))' }}
          />
        )}
        {archetype === 'merc_tentacle' && (
          <polygon
            points="16,3 27,16 16,29 5,16"
            fill="#a855f7"
            fillOpacity="0.3"
            stroke="#c084fc"
            strokeWidth="1.8"
            style={{ filter: 'drop-shadow(0 0 5px rgba(192,132,252,0.75))' }}
          />
        )}
        {archetype === 'merc_cannon' && (
          <polygon
            points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5"
            fill="#f59e0b"
            fillOpacity="0.28"
            stroke="#fbbf24"
            strokeWidth="1.8"
            style={{ filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.8))' }}
          />
        )}
        {archetype === 'merc_array' && (
          <g style={{ filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.75))' }}>
            <circle cx="16" cy="16" r="11" fill="none" stroke="#38bdf8" strokeWidth="1.6" />
            <circle cx="16" cy="16" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          </g>
        )}
        {archetype === 'merc_god' && (
          <g style={{ filter: 'drop-shadow(0 0 5px rgba(244,63,94,0.85))' }}>
            <polygon
              points="16,3 19.5,12.5 29,16 19.5,19.5 16,29 12.5,19.5 3,16 12.5,12.5"
              fill="#f43f5e"
              fillOpacity="0.3"
              stroke="#fb7185"
              strokeWidth="1.7"
            />
            <circle cx="16" cy="16" r="2.8" fill="#fef08a" />
          </g>
        )}
      </svg>
    </div>
  );
}

function BossSacredGeometry({
  phaseIndex,
  isHitSquashed,
  expandedMobile = false,
}: {
  phaseIndex: number;
  isHitSquashed: boolean;
  expandedMobile?: boolean;
}) {
  const isPhase1to3 = phaseIndex <= 2;
  const isPhase4to6 = phaseIndex >= 3 && phaseIndex <= 5;
  const isPhase7to9 = phaseIndex >= 6 && phaseIndex <= 8;
  const isPhase10 = phaseIndex >= 9;

  const sealOpacity = phaseIndex === 0 ? 0.96 : phaseIndex === 1 ? 0.72 : 0.48;
  const sealDash = phaseIndex === 0 ? undefined : phaseIndex === 1 ? '10 6' : '5 9';

  const glowColor = isPhase10
    ? 'drop-shadow(0 0 20px rgba(244,63,94,0.85))'
    : isPhase7to9
      ? 'drop-shadow(0 0 16px rgba(251,191,36,0.75))'
      : isPhase4to6
        ? 'drop-shadow(0 0 15px rgba(244,63,94,0.7))'
        : 'drop-shadow(0 0 14px rgba(56,189,248,0.65))';

  const dodecagonPts = Array.from({ length: 12 })
    .map((_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return `${(100 + Math.cos(a) * 84).toFixed(1)},${(100 + Math.sin(a) * 84).toFixed(1)}`;
    })
    .join(' ');

  const scaleClass = isPhase7to9 ? 'scale-110' : 'scale-100';
  const sizeClass = expandedMobile
    ? 'w-40 h-40 sm:w-48 sm:h-48 lg:w-44 lg:h-44'
    : 'w-24 h-24 sm:w-28 sm:h-28 lg:w-40 lg:h-40';

  return (
    <svg
      viewBox="0 0 200 200"
      className={`${sizeClass} overflow-visible transition-transform duration-300 ${scaleClass}`}
      style={{ filter: glowColor }}
    >
      <circle
        cx="100"
        cy="100"
        r="96"
        fill="none"
        stroke="#94a3b8"
        strokeOpacity="0.14"
        strokeWidth="1"
        strokeDasharray="3 6"
      />

      {isPhase1to3 && (
        <g
          className="animate-sigil-cw"
          style={{ transformOrigin: '100px 100px', opacity: sealOpacity }}
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.6"
            strokeDasharray={sealDash}
          />
          <polygon
            points={dodecagonPts}
            fill="rgba(56,189,248,0.08)"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeDasharray={sealDash}
          />
          <polygon
            points="100,48 152,100 100,152 48,100"
            fill="rgba(16,20,36,0.75)"
            stroke="#7dd3fc"
            strokeWidth="1.6"
          />
        </g>
      )}

      {isPhase4to6 && (
        <>
          <g className="animate-sigil-cw-fast" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="100,24 166,138 34,138"
              fill="none"
              stroke={phaseIndex === 3 ? '#c084fc' : '#f43f5e'}
              strokeWidth="2.1"
            />
            {Array.from({ length: phaseIndex >= 5 ? 8 : 6 }).map((_, i, arr) => {
              const a = (i * 2 * Math.PI) / arr.length;
              return (
                <line
                  key={i}
                  x1={100 + Math.cos(a) * 62}
                  y1={100 + Math.sin(a) * 62}
                  x2={100 + Math.cos(a) * 90}
                  y2={100 + Math.sin(a) * 90}
                  stroke="#fb7185"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
          <g className="animate-sigil-ccw" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="100,176 34,62 166,62"
              fill="rgba(192,132,252,0.1)"
              stroke="#c084fc"
              strokeWidth="2"
            />
          </g>
        </>
      )}

      {isPhase7to9 && (
        <>
          <g className="animate-sigil-ccw" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="100,16 172,58 172,142 100,184 28,142 28,58"
              fill="rgba(251,191,36,0.09)"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            <polygon
              points="100,30 158,100 100,170 42,100"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
            />
          </g>
          <g className="animate-eldritch-breathe" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="56,100 100,72 144,100 100,128"
              fill="#181224"
              stroke="#fbbf24"
              strokeWidth="2.2"
            />
            <polygon
              points="76,100 100,82 124,100 100,118"
              fill="#58101c"
              stroke="#f43f5e"
              strokeWidth="1.5"
            />
            <polygon
              points={`100,86 ${isHitSquashed ? 103 : 106},100 100,114 ${
                isHitSquashed ? 97 : 94
              },100`}
              fill="#fef08a"
            />
          </g>
        </>
      )}

      {isPhase10 && (
        <>
          <g className="animate-sigil-cw-fast" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="100,18 182,100 100,182 18,100"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.1"
            />
            <rect
              x="44"
              y="44"
              width="112"
              height="112"
              fill="none"
              stroke="#fda4af"
              strokeWidth="1.5"
              strokeDasharray="12 6"
            />
          </g>
          <g className="animate-core-pulse-fast" style={{ transformOrigin: '100px 100px' }}>
            <polygon
              points="100,46 146,100 100,154 54,100"
              fill="#881337"
              stroke="#ffffff"
              strokeWidth="2.2"
            />
            <polygon
              points="100,66 126,100 100,134 74,100"
              fill="#f43f5e"
              stroke="#fff1f2"
              strokeWidth="1.5"
            />
            <circle cx="100" cy="100" r="8" fill="#ffffff" />
          </g>
        </>
      )}

      {(isPhase1to3 || isPhase4to6) && (
        <polygon
          points="100,82 118,100 100,118 82,100"
          fill={isPhase4to6 ? '#f43f5e' : '#38bdf8'}
          fillOpacity="0.9"
          stroke="#ffffff"
          strokeOpacity="0.7"
          strokeWidth="1.2"
        />
      )}
    </svg>
  );
}

export type MobileViewMode = 'balanced' | 'arena_focus' | 'build_focus';

export function BossArena({
  mobileViewMode = 'balanced',
  onChangeMobileViewMode,
}: {
  mobileViewMode?: MobileViewMode;
  onChangeMobileViewMode?: (mode: MobileViewMode) => void;
}) {
  const {
    run,
    mercs,
    meta,
    settings,
    floatingTexts,
    clickRipples,
    mercPulseIds,
    phaseBreakBanner,
    isHitSquashed,
    isArenaShaking,
    hitOffset,
    shellShatterId,
    lastClearReport,
    autoRepeatCountdown,
    manualClick,
    castSkill,
    toggleSkillAutoCast,
    toggleAutoRepeat,
    openLastClearReportModal,
    quickRestartAfterSilentClear,
  } = useGameStore();
  const [bgBroken, setBgBroken] = useState(false);

  const currentShell = BOSS_SHELLS[Math.min(run.phaseIndex, BOSS_SHELLS.length - 1)];
  const heroStats = getHeroStats(run, mercs, meta);
  const globalMult = getGlobalMult(run, mercs, meta);

  const hp = toDecimal(run.bossHp);
  const maxHp = toDecimal(run.bossMaxHp).max(1);
  const rawHpPct = hp.div(maxHp).mul(100).toNumber();
  const hpPct = Number.isFinite(rawHpPct) ? Math.max(0, Math.min(100, rawHpPct)) : 0;
  const rawManaPct = (run.mana / Math.max(1, heroStats.manaCap)) * 100;
  const manaPct = Number.isFinite(rawManaPct) ? Math.max(0, Math.min(100, rawManaPct)) : 0;

  const heroDps = toDecimal(run.recentTickDps.hero);
  const poisonDps = toDecimal(run.recentTickDps.poison);
  const mercDpsSum = run.recentTickDps.mercs.reduce((acc, v) => acc.add(toDecimal(v)), new Decimal(0));
  const totalDps = heroDps.add(poisonDps).add(mercDpsSum);

  const poisonInfo = getPoisonTickExpectedDamage(
    mercs,
    run,
    meta,
    heroStats.heroBasePower,
    heroStats.rawHeroClick,
    globalMult
  );

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(10, Math.min(88, ((e.clientY - rect.top) / rect.height) * 100));
    manualClick(xPct, yPct);
  };

  const handleArenaKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      manualClick(50, 50);
    }
  };

  const canToggleAutoSkill =
    meta.unlockedAutoSkill || getRelicTotalLv(meta, 'rel_m_auto_skill') > 0;
  const mythicAutoFree = getRelicTotalLv(meta, 'rel_m_auto_skill') > 0;
  const unlockedMercs = mercs.filter((m) => m.unlocked);
  const activeVfx = settings.hitVfxEnabled && !run.runCompleted;
  const sssUnlockedHere = Boolean(meta.sssUnlockedAutoRepeat[run.tribulationId]);
  const showSilentBanner = Boolean(lastClearReport && !run.runCompleted && meta.autoRepeatEnabled && sssUnlockedHere);
  const showRunClearedBar = run.runCompleted || showSilentBanner;
  const isArenaCollapsedMobile = mobileViewMode === 'build_focus';
  const isArenaExpandedMobile = mobileViewMode === 'arena_focus';

  const arenaSizingClass = isArenaCollapsedMobile
    ? 'hidden lg:flex lg:h-full lg:w-[44%]'
    : isArenaExpandedMobile
      ? 'flex-1 min-h-[290px] lg:flex-none lg:h-full lg:w-[44%]'
      : 'h-[40dvh] min-h-[268px] max-h-[375px] lg:h-full lg:max-h-none lg:w-[44%]';

  return (
    <>
      {isArenaCollapsedMobile && (
        <div className="lg:hidden shrink-0 bg-[#151827] border-b border-[#2e3552] px-3 py-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-display font-black text-[#f4f1ea] truncate">
                {currentShell.name}
              </span>
              <span className="font-mono-num font-bold text-[#7dd3fc] shrink-0">
                DPS {formatNumber(totalDps, settings.numberMode, true)}/s
              </span>
            </div>
            <div className="relative h-2.5 w-full rounded bg-[#090b12] border border-[#384166] overflow-hidden">
              <div className="h-full bg-[#f43f5e]" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {run.runCompleted && (
              <button
                type="button"
                onClick={quickRestartAfterSilentClear}
                className="min-h-[34px] px-2.5 rounded-md bg-[#06b6d4]/25 border border-[#22d3ee]/60 text-xs font-bold text-[#cffafe] cursor-pointer"
              >
                再战
              </button>
            )}
            {sssUnlockedHere && (
              <button
                type="button"
                onClick={toggleAutoRepeat}
                className={`min-h-[34px] px-2 rounded-md border text-xs font-bold cursor-pointer ${
                  meta.autoRepeatEnabled
                    ? 'bg-[#10b981]/24 border-[#34d399]/60 text-[#a7f3d0]'
                    : 'bg-[#1e2338] border-[#384166] text-[#94a3b8]'
                }`}
              >
                {meta.autoRepeatEnabled ? '连刷开' : '连刷关'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onChangeMobileViewMode?.('balanced')}
              className="min-h-[34px] inline-flex items-center gap-1 px-2.5 rounded-md border border-[#38bdf8]/45 bg-[#06b6d4]/15 text-xs font-bold text-[#7dd3fc] cursor-pointer whitespace-nowrap"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>展开战区</span>
            </button>
          </div>
        </div>
      )}

    <section
      className={`${arenaSizingClass} shrink-0 relative flex flex-col border-b lg:border-b-0 lg:border-r border-[#2e3552] bg-[#101322] ${
        activeVfx && isArenaShaking ? 'animate-arena-shake' : ''
      }`}
    >
      {/* Top Info: Shell Name, Dual-Layer HP Bar, 10 Phase Nodes */}
      <div className="px-3 pt-1.5 pb-1.5 bg-[#151827]/90 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={`font-display text-sm sm:text-[15px] font-black tracking-wide truncate ${
              run.phaseIndex >= 9
                ? 'text-[#fda4af] text-glow-crimson'
                : run.phaseIndex >= 6
                  ? 'text-[#fde68a] text-glow-amber'
                  : 'text-[#f8f5ee]'
            }`}
          >
            {currentShell.name}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono-num text-xs font-bold text-[#7dd3fc]">
              DPS {formatNumber(totalDps, settings.numberMode, true)}/s
              {run.poisonStacks > 0 && (
                <span className="text-[#34d399] font-semibold ml-1">
                  · 毒{run.poisonStacks}({formatNumber(poisonInfo.expectedPoison, settings.numberMode)})
                </span>
              )}
            </span>
            {onChangeMobileViewMode && (
              <button
                type="button"
                onClick={() => onChangeMobileViewMode('build_focus')}
                className="lg:hidden inline-flex items-center gap-0.5 px-2 py-0.5 rounded border border-[#384166] bg-[#1e2338] text-[11px] font-semibold text-[#cbd5e1] hover:text-white cursor-pointer whitespace-nowrap"
                title="收起古神战区，全屏展开下方构筑面板"
              >
                <ChevronUp className="w-3 h-3" />
                <span>收起</span>
              </button>
            )}
          </div>
        </div>

        {/* Dual-Layer Delayed HP Bar */}
        <div className="relative h-4 w-full rounded bg-[#090b12] border border-[#384166] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#d97706] transition-all duration-300 ease-out"
            style={{ width: `${hpPct}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[#f43f5e]"
            style={{ width: `${hpPct}%` }}
          />
          <div className="relative z-10 h-full flex items-center justify-center text-xs font-mono-num font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
            {formatNumber(hp, settings.numberMode)} / {formatNumber(maxHp, settings.numberMode)} (
            {hpPct.toFixed(1)}%)
          </div>
        </div>

        {/* 10 Shell Phase Indicators */}
        <div className="flex items-center justify-between gap-1 mt-1.5">
          {BOSS_SHELLS.map((s, idx) => {
            const broken = idx < run.phaseIndex || run.runCompleted;
            const current = idx === run.phaseIndex && !run.runCompleted;
            return (
              <div
                key={s.phase}
                className={`h-1.5 flex-1 rounded-sm transition-colors ${
                  broken
                    ? 'bg-white/12'
                    : current
                      ? 'bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.85)]'
                      : 'bg-[#f43f5e]/35'
                }`}
                title={s.name}
              />
            );
          })}
        </div>
      </div>

      {/* Central Interactive Boss Arena */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleArenaClick}
        onKeyDown={handleArenaKeyDown}
        className="relative flex-1 min-h-0 w-full flex flex-col items-center justify-center overflow-hidden cursor-crosshair focus-visible:outline-2 focus-visible:outline-[#38bdf8]"
        aria-label="点击古神法相攻击"
      >
        {!bgBroken && (
          <img
            src={posterVerticalImg}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setBgBroken(true)}
            className="pointer-events-none absolute inset-0 w-full h-full object-cover object-center opacity-[0.22] scale-105"
          />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 48%, rgba(16,19,34,0.28) 0%, rgba(16,19,34,0.82) 66%, #101322 100%)',
          }}
        />

        {sssUnlockedHere && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleAutoRepeat();
            }}
            className={`absolute top-1.5 right-2 z-30 inline-flex items-center gap-1 min-h-[26px] px-2.5 py-0.5 rounded-md border text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
              meta.autoRepeatEnabled
                ? 'bg-[#10b981]/24 border-[#34d399]/65 text-[#a7f3d0]'
                : 'bg-[#151827]/90 border-[#2e3552] text-[#94a3b8] hover:text-white'
            }`}
            title="开启/关闭当前劫数无感自动连刷"
          >
            <Repeat className="w-3 h-3 shrink-0" />
            <span>
              {meta.autoRepeatEnabled
                ? autoRepeatCountdown !== null
                  ? `连刷 ${autoRepeatCountdown.toFixed(1)}s`
                  : '无感连刷:开'
                : '连刷:关'}
            </span>
          </button>
        )}

        {phaseBreakBanner && (
          <div
            key={phaseBreakBanner.id}
            className="pointer-events-none absolute top-1.5 left-1/2 z-30 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-sm bg-gradient-to-r from-[#0d101b]/95 via-[#881337]/92 to-[#0d101b]/95 border-y border-[#fbbf24]/75 text-[11px] font-display font-extrabold tracking-[0.06em] text-[#fef08a] text-glow-gold whitespace-nowrap shadow-[0_0_20px_rgba(244,63,94,0.45)] animate-banner-drop"
          >
            <PhaseBreakSigilIcon className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>
              破壳第 {phaseBreakBanner.phase} 重 ·{' '}
              <span className="text-[#fbbf24] font-mono-num">词缀石 +{phaseBreakBanner.stones}</span>
            </span>
          </div>
        )}

        {activeVfx && shellShatterId > 0 && (
          <div
            key={`shock-${shellShatterId}`}
            className="pointer-events-none absolute w-40 h-40 rounded-full border-2 border-[#f43f5e] animate-shell-shatter"
          />
        )}

        {activeVfx &&
          clickRipples.map((r) => (
            <div
              key={r.id}
              className="pointer-events-none absolute w-12 h-12 rounded-full border-2 border-[#22d3ee] animate-click-ripple"
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            />
          ))}

        <div
          className="relative z-10 flex items-center justify-center transition-transform duration-75"
          style={{
            transform:
              activeVfx && isHitSquashed
                ? `translate3d(${hitOffset.x}px, ${hitOffset.y}px, 0) scale(0.92)`
                : 'translate3d(0, 0, 0) scale(1)',
            filter: activeVfx && isHitSquashed ? 'brightness(1.35)' : 'brightness(1)',
          }}
        >
          <BossSacredGeometry
            phaseIndex={run.phaseIndex}
            isHitSquashed={activeVfx && isHitSquashed}
            expandedMobile={isArenaExpandedMobile}
          />
        </div>

        {unlockedMercs.length > 0 && (
          <div className="pointer-events-none relative z-10 flex items-center justify-center gap-3 mt-1">
            {mercs.map((m, idx) =>
              m.unlocked ? (
                <CompanionGeometry
                  key={idx}
                  archetype={m.archetype}
                  pulseId={mercPulseIds[idx]}
                  hitVfxEnabled={settings.hitVfxEnabled}
                />
              ) : null
            )}
          </div>
        )}

        {settings.floatingTextMode !== 'off' && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
            {floatingTexts
              .filter((ft) =>
                settings.floatingTextMode === 'crit'
                  ? ft.kind === 'crit' || ft.kind === 'thunder' || ft.kind === 'shell'
                  : true
              )
              .map((ft) => {
                const cls =
                  ft.kind === 'crit'
                    ? 'text-[#fbbf24] text-sm font-extrabold animate-float-crit'
                    : ft.kind === 'poison'
                      ? 'text-[#34d399] text-xs font-semibold animate-float-dmg'
                      : ft.kind === 'thunder'
                        ? 'text-[#c084fc] text-sm font-bold animate-float-crit'
                        : ft.kind === 'shell'
                          ? 'text-[#fde68a] text-sm font-bold animate-float-crit'
                          : 'text-[#f8fafc] text-xs font-medium animate-float-dmg';
                return (
                  <div
                    key={ft.id}
                    className={`absolute font-mono-num whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${cls}`}
                    style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                  >
                    {ft.text}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Dedicated Non-Overlapping Silent Clear Report Strip */}
      {showRunClearedBar && lastClearReport && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-[#0c101d] border-t border-[#34d399]/45 text-xs">
          <div className="min-w-0 flex items-center gap-1.5 truncate font-mono-num">
            <span className="font-bold text-[#6ee7b7] shrink-0">
              {lastClearReport.autoRepeatRound > 0
                ? `第${lastClearReport.autoRepeatRound}轮`
                : '已破本劫'}
            </span>
            <span className="text-[#cbd5e1] truncate">
              {formatTimeMs(lastClearReport.clearTimeMs)} ({lastClearReport.rank}) · +
              {formatNumber(lastClearReport.crystalsEarned, settings.numberMode)}晶 · +
              {lastClearReport.dropCount}印
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {run.runCompleted && (
              <button
                type="button"
                onClick={quickRestartAfterSilentClear}
                className="min-h-[28px] inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#06b6d4]/25 border border-[#22d3ee]/60 text-[#cffafe] font-bold hover:bg-[#06b6d4]/40 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                <span>再战</span>
              </button>
            )}
            <button
              type="button"
              onClick={openLastClearReportModal}
              className="min-h-[28px] px-2 py-0.5 rounded bg-[#1e2338] border border-[#384166] text-[#cbd5e1] hover:text-white cursor-pointer"
            >
              详报
            </button>
          </div>
        </div>
      )}

      {/* Bottom Skill Quick-Cast Bar */}
      <div className="shrink-0 bg-[#151827] border-t border-[#2e3552] px-2.5 py-1.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#090b12] border border-[#384166] overflow-hidden">
            <div
              className="h-full bg-[#38bdf8] transition-all duration-100"
              style={{ width: `${manaPct}%` }}
            />
          </div>
          <span className="font-mono-num text-[11px] font-semibold text-[#7dd3fc] shrink-0">
            道力 {Math.floor(run.mana)}/{heroStats.manaCap}
            {mythicAutoFree && (
              <span className="text-[#6ee7b7] ml-1.5">· 万法道胎零蓝自动</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {SKILLS.map((cfg) => {
            const sk = run.skills[cfg.id];
            const unlocked = run.realmLevel >= cfg.unlockRealm;
            const eff = getSkillEffectiveValues(cfg.id, sk.level, mercs, meta);
            const onCd = sk.cooldownRemaining > 0;
            const active = sk.activeRemaining > 0;
            const hasMana = run.mana >= eff.manaCost;
            const ready = unlocked && !onCd && hasMana;
            const reqRealm = REALM_TIERS.find((r) => r.level === cfg.unlockRealm)?.name ?? '';
            const autoOn = mythicAutoFree ? true : sk.autoCast;

            return (
              <div key={cfg.id} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => castSkill(cfg.id)}
                  disabled={!ready}
                  title={cfg.shortDesc}
                  className={`relative min-h-[44px] px-1 py-1 rounded-lg border text-center transition-colors cursor-pointer flex flex-col justify-center ${
                    !unlocked
                      ? 'bg-[#0d101b] border-white/8 text-[#64748b] cursor-not-allowed'
                      : active
                        ? 'bg-[#f59e0b]/22 border-[#fbbf24] text-[#fef08a]'
                        : ready
                          ? 'bg-[#1e2338] border-[#38bdf8]/60 text-[#f1f5f9] hover:bg-[#38bdf8]/20'
                          : 'bg-[#131726] border-[#2e3552] text-[#94a3b8] cursor-not-allowed'
                  }`}
                >
                  <div className="text-[11.5px] font-bold truncate flex items-center justify-center gap-0.5">
                    {!unlocked && <Lock className="w-3 h-3 shrink-0" />}
                    <span className="truncate">{cfg.name}</span>
                  </div>
                  <div className="font-mono-num text-[10.5px] mt-0.5 truncate">
                    {!unlocked
                      ? reqRealm.replace('百脉', '').replace('煞气', '').replace('不灭', '')
                      : active
                        ? `${sk.activeRemaining.toFixed(1)}s`
                        : onCd
                          ? `CD ${sk.cooldownRemaining.toFixed(0)}s`
                          : mythicAutoFree
                            ? '0 蓝'
                            : `${eff.manaCost} 蓝`}
                  </div>
                </button>

                {unlocked && canToggleAutoSkill && !mythicAutoFree && (
                  <button
                    type="button"
                    onClick={() => toggleSkillAutoCast(cfg.id)}
                    className={`min-h-[24px] rounded border text-[10.5px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      autoOn
                        ? 'bg-[#06b6d4]/22 border-[#22d3ee]/60 text-[#67e8f9]'
                        : 'bg-[#101322] border-[#2e3552] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {autoOn ? '自动：开' : '自动：关'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </>
  );
}
