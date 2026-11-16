import React from 'react';
import Decimal from 'break_infinity.js';
import { Lock } from 'lucide-react';
import { ARCHETYPES } from '../config/archetypes';
import { BOSS_SHELLS } from '../config/bosses';
import { REALM_TIERS, SKILLS } from '../config/constants';
import {
  getGlobalMult,
  getHeroStats,
  getPoisonTickExpectedDamage,
  getSkillEffectiveValues,
} from '../core/damageCalc';
import { formatNumber, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import type { ArchetypeId } from '../types/game';
import { PhaseBreakSigilIcon } from './CultivationIcons';

function CompanionGeometry({
  archetype,
  pulseId,
}: {
  archetype: ArchetypeId;
  pulseId: number;
}) {
  return (
    <div
      key={`merc-${pulseId}`}
      className={`w-6 h-6 flex items-center justify-center ${
        pulseId > 0 ? 'animate-companion-lunge' : ''
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
}: {
  phaseIndex: number;
  isHitSquashed: boolean;
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

  const scaleClass = isPhase7to9 ? 'scale-115' : 'scale-100';

  return (
    <svg
      viewBox="0 0 200 200"
      className={`w-28 h-28 sm:w-32 sm:h-32 overflow-visible transition-transform duration-300 ${scaleClass}`}
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

export function BossArena() {
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
    manualClick,
    castSkill,
    toggleSkillAutoCast,
  } = useGameStore();

  const currentShell = BOSS_SHELLS[Math.min(run.phaseIndex, BOSS_SHELLS.length - 1)];
  const heroStats = getHeroStats(run, mercs, meta);
  const globalMult = getGlobalMult(run, mercs, meta);

  const hp = toDecimal(run.bossHp);
  const maxHp = toDecimal(run.bossMaxHp).max(1);
  const hpPct = Math.max(0, Math.min(100, hp.div(maxHp).mul(100).toNumber()));
  const manaPct = Math.max(0, Math.min(100, (run.mana / Math.max(1, heroStats.manaCap)) * 100));

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
    meta.unlockedAutoSkill || (meta.relicLevels.rel_m_auto_skill ?? 0) > 0;
  const mythicAutoFree = (meta.relicLevels.rel_m_auto_skill ?? 0) > 0;
  const unlockedMercs = mercs.filter((m) => m.unlocked);

  return (
    <section
      className={`h-[43%] min-h-[265px] shrink-0 relative flex flex-col border-b border-[#2e3552] bg-[#101322] ${
        isArenaShaking ? 'animate-arena-shake' : ''
      }`}
    >
      {/* Top Info: Shell Name, Dual-Layer HP Bar, 10 Phase Nodes */}
      <div className="px-3 pt-2 pb-1.5 bg-[#151827]/90 border-b border-white/8 shrink-0">
        <div className="flex items-center justify-between gap-2 text-xs mb-1">
          <span className="font-display font-bold text-[#f4f1ea] truncate">
            {currentShell.name}
          </span>
          <span className="font-mono-num text-[11px] text-[#cbd5e1] shrink-0">
            DPS {formatNumber(totalDps, settings.numberMode, true)}/s
            {run.poisonStacks > 0 && (
              <span className="text-[#34d399] ml-1.5">
                · 毒{run.poisonStacks}({formatNumber(poisonInfo.expectedPoison, settings.numberMode)})
              </span>
            )}
          </span>
        </div>

        {/* Dual-Layer Delayed HP Bar */}
        <div className="relative h-3.5 w-full rounded-sm bg-[#090b12] border border-[#384166] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#d97706] transition-all duration-300 ease-out"
            style={{ width: `${hpPct}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-[#f43f5e]"
            style={{ width: `${hpPct}%` }}
          />
          <div className="relative z-10 h-full flex items-center justify-center text-[10px] font-mono-num font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
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
                className={`h-1 flex-1 rounded-full transition-colors ${
                  broken
                    ? 'bg-white/12'
                    : current
                      ? 'bg-[#f43f5e]'
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
        {phaseBreakBanner && (
          <div
            key={phaseBreakBanner.id}
            className="pointer-events-none absolute top-2 left-1/2 z-30 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#be123c]/95 border border-[#fbbf24]/70 text-[11px] font-semibold text-[#fef9c3] whitespace-nowrap shadow-lg animate-banner-drop"
          >
            <PhaseBreakSigilIcon className="w-3.5 h-3.5" />
            <span>
              破壳第 {phaseBreakBanner.phase} 重 · 词缀石 +{phaseBreakBanner.stones}
            </span>
          </div>
        )}

        {shellShatterId > 0 && (
          <div
            key={`shock-${shellShatterId}`}
            className="pointer-events-none absolute w-40 h-40 rounded-full border-2 border-[#f43f5e] animate-shell-shatter"
          />
        )}

        {clickRipples.map((r) => (
          <div
            key={r.id}
            className="pointer-events-none absolute w-12 h-12 rounded-full border-2 border-[#22d3ee] animate-click-ripple"
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          />
        ))}

        <div
          className="relative flex items-center justify-center transition-[transform,filter] duration-75"
          style={{
            transform: `translate3d(${hitOffset.x}px, ${hitOffset.y}px, 0) scale(${
              isHitSquashed ? 0.92 : 1
            })`,
            filter: isHitSquashed ? 'brightness(1.7)' : 'brightness(1)',
          }}
        >
          <BossSacredGeometry phaseIndex={run.phaseIndex} isHitSquashed={isHitSquashed} />
        </div>

        {unlockedMercs.length > 0 && (
          <div className="pointer-events-none flex items-center justify-center gap-3 mt-1">
            {mercs.map((m, idx) =>
              m.unlocked ? (
                <CompanionGeometry
                  key={idx}
                  archetype={m.archetype}
                  pulseId={mercPulseIds[idx]}
                />
              ) : null
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
          {floatingTexts.map((ft) => {
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
      </div>

      {/* Bottom Skill Quick-Cast Bar */}
      <div className="shrink-0 bg-[#151827] border-t border-[#2e3552] px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#090b12] border border-[#384166] overflow-hidden">
            <div
              className="h-full bg-[#38bdf8] transition-all duration-100"
              style={{ width: `${manaPct}%` }}
            />
          </div>
          <span className="font-mono-num text-[11px] text-[#7dd3fc] shrink-0">
            道力 {Math.floor(run.mana)}/{heroStats.manaCap}
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

            return (
              <div key={cfg.id} className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => castSkill(cfg.id)}
                  disabled={!ready}
                  title={cfg.shortDesc}
                  className={`relative px-1.5 py-1.5 rounded-md border text-center transition-colors cursor-pointer ${
                    !unlocked
                      ? 'bg-[#0d101b] border-white/8 text-[#64748b] cursor-not-allowed'
                      : active
                        ? 'bg-[#f59e0b]/20 border-[#fbbf24] text-[#fef08a]'
                        : ready
                          ? 'bg-[#1e2338] border-[#38bdf8]/60 text-[#f1f5f9] hover:bg-[#38bdf8]/20'
                          : 'bg-[#131726] border-[#2e3552] text-[#94a3b8] cursor-not-allowed'
                  }`}
                >
                  <div className="text-[11px] font-semibold truncate flex items-center justify-center gap-0.5">
                    {!unlocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{cfg.name}</span>
                  </div>
                  <div className="font-mono-num text-[10px] mt-0.5 truncate">
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

                {unlocked && canToggleAutoSkill && (
                  <label className="flex items-center justify-center gap-1 text-[10px] text-[#94a3b8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mythicAutoFree ? true : sk.autoCast}
                      disabled={mythicAutoFree}
                      onChange={() => toggleSkillAutoCast(cfg.id)}
                      className="accent-[#38bdf8] w-3 h-3"
                    />
                    <span>自动</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
