import Decimal from 'break_infinity.js';
import { BookOpen, Lock, SlidersHorizontal } from 'lucide-react';
import {
  AFFIXES,
  AFFIX_TIER_META,
  INNATE_AFFIXES,
  formatAffixShortBadgeValue,
  getAffixEffectiveValue,
} from '../config/affixes';
import { ARCHETYPES } from '../config/archetypes';
import { LEVEL_SLOT_THRESHOLDS, MERC_SLOT_CRYSTAL_COSTS } from '../config/constants';
import {
  getCostReductionMult,
  getEffectiveGrowthRate,
  getEffectiveLevel,
  getGlobalMult,
  getHeroStats,
  getMercCheapDiscount,
  getMercenaryComputedStats,
  getRelicTotalLv,
  isSlot5Active,
} from '../core/damageCalc';
import { MERC_TYPOGRAPHY } from '../config/highlights';
import { calculateBulkUpgrade, formatNumber, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import { ArchetypeIcon } from './ArchetypeIcon';

export function TabMercenaries({
  onOpenForgeModal,
  onOpenGuideModal,
}: {
  onOpenForgeModal: (slotIndex: number) => void;
  onOpenGuideModal: () => void;
}) {
  const {
    run,
    mercs,
    meta,
    settings,
    unlockMercSlot,
    upgradeMercenary,
    toggleAutoSetting,
    toggleAutoMercSlot,
  } = useGameStore();

  const stones = toDecimal(run.spiritStones);
  const crystals = toDecimal(meta.divineCrystals);
  const heroStats = getHeroStats(run, mercs, meta);
  const globalMult = getGlobalMult(run, mercs, meta);
  const costRed = getCostReductionMult(meta);
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');
  const s5 = isSlot5Active(mercs);

  return (
    <div className="space-y-2.5">
      {/* Top Helper, Auto-Merc Master Toggle & Build Guide Entry */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-0.5 text-xs text-[#a3b1cc]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenGuideModal}
            className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-lg bg-[#181d31] border border-[#38bdf8]/45 text-[#7dd3fc] font-bold hover:bg-[#06b6d4]/20 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>流派协同指南</span>
          </button>

          <button
            type="button"
            onClick={() => toggleAutoSetting('autoMercs')}
            className={`inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-lg border font-bold transition-colors cursor-pointer whitespace-nowrap ${
              !meta.unlockedAutoMercUpgrade
                ? 'bg-[#101322] border-[#2e3552] text-[#64748b]'
                : meta.autoSettings.autoMercs
                  ? 'bg-[#10b981]/22 border-[#34d399]/60 text-[#ecfdf5]'
                  : 'bg-[#181d31] border-[#384166] text-[#cbd5e1] hover:text-white'
            }`}
          >
            <span>
              {!meta.unlockedAutoMercUpgrade
                ? '自动升级 (劫6解锁)'
                : meta.autoSettings.autoMercs
                  ? '护法自动升级：开'
                  : '护法自动升级：关'}
            </span>
          </button>
        </div>
        <span className="font-mono-num text-xs font-bold text-[#fbbf24] shrink-0">
          保底气运 {meta.rerollPity}/10
        </span>
      </div>

      {/* 5 Fixed Mercenary Cards */}
      {mercs.map((slot, idx) => {
        const arch = ARCHETYPES[slot.archetype];
        const mercTheme = MERC_TYPOGRAPHY[slot.archetype];

        if (!slot.unlocked) {
          const crystalCost = MERC_SLOT_CRYSTAL_COSTS[idx];
          const canUnlock = idx > 0 && crystals.gte(crystalCost);
          return (
            <div
              key={idx}
              className="bg-[#131624] border border-[#2e3552] rounded-xl p-3.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <ArchetypeIcon
                    archetype={slot.archetype}
                    className="w-5 h-5 opacity-65 self-center shrink-0"
                  />
                  <span className="font-mono-num text-xs text-[#64748b]">{idx + 1}号</span>
                  <span className={`text-[15px] opacity-90 ${mercTheme.nameClass}`}>
                    {arch.name}
                  </span>
                  <span className={`text-xs ${mercTheme.roleClass} opacity-80`}>
                    ({arch.roleTag})
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] leading-snug">
                  {idx === 0
                    ? '首破第 2 重躯壳免费解锁'
                    : `天赋：${arch.talent1Name} · ${arch.talent2Name}`}
                </p>
              </div>

              {idx > 0 ? (
                <button
                  type="button"
                  onClick={() => unlockMercSlot(idx)}
                  disabled={!canUnlock}
                  className={`min-h-[48px] min-w-[112px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
                    canUnlock
                      ? 'bg-[#a855f7]/28 border border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                      : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold leading-tight">解锁护法</div>
                  <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
                    {crystalCost.toLocaleString()} 神晶
                  </div>
                </button>
              ) : (
                <span className="min-h-[48px] min-w-[108px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap">
                  <Lock className="w-3.5 h-3.5" />
                  <span>破2重开</span>
                </span>
              )}
            </div>
          );
        }

        const computed = getMercenaryComputedStats(
          idx,
          mercs,
          run,
          meta,
          heroStats.heroBasePower,
          heroStats.rawHeroClick,
          globalMult
        );
        const effGrowth = getEffectiveGrowthRate(arch.growthRate, run.tribulationId);
        const cheapDiscount = getMercCheapDiscount(slot, mercs, meta);
        const bulk = calculateBulkUpgrade(
          new Decimal(arch.baseCost),
          effGrowth,
          slot.level,
          costRed * (1 - cheapDiscount),
          settings.buyMode,
          stones
        );
        const canUpgrade = bulk.count > 0 && stones.gte(bulk.totalCost);

        const effLv = getEffectiveLevel(slot);
        const nextThreshold = LEVEL_SLOT_THRESHOLDS.find((t) => effLv < t);
        const innateCfg =
          INNATE_AFFIXES[slot.innateAffix] ??
          INNATE_AFFIXES[ARCHETYPES[slot.archetype].recommendedInnate];
        const hasInnateBoost = slot.innateAffix === 'sp_affix_boost';
        const hasPending =
          slot.pendingLevelAffixes !== null || slot.pendingInnateAffix !== null;

        const activeSummaries: { text: string; colorClass: string }[] = [];
        for (let sIdx = 0; sIdx < slot.unlockedLevelSlots; sIdx++) {
          if (effLv < LEVEL_SLOT_THRESHOLDS[sIdx]) continue;
          const inst = slot.levelAffixes[sIdx];
          if (!inst) continue;
          const cfg = AFFIXES[inst.id];
          const tMeta = AFFIX_TIER_META[inst.tier];
          if (!cfg || !tMeta) continue;
          const effVal = getAffixEffectiveValue(
            inst,
            sIdx,
            s5,
            hasInnateBoost,
            firstAffixRelicLv
          );
          activeSummaries.push({
            text: `${cfg.name} ${formatAffixShortBadgeValue(inst.id, effVal)}`,
            colorClass: tMeta.colorClass,
          });
        }

        return (
          <div
            key={idx}
            className={`relative overflow-hidden bg-[#171a29] border ${mercTheme.cardBorderClass} rounded-xl p-3.5 pl-4 space-y-2.5 transition-colors`}
            style={{ backgroundImage: mercTheme.radialBgStyle }}
          >
            {/* Left Archetype Accent Bar */}
            <div className={`absolute inset-y-2 left-0 w-[3.5px] rounded-r ${mercTheme.accentBarClass}`} />

            {/* Top Row: Identity + DPS + Big Upgrade Action */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <ArchetypeIcon archetype={slot.archetype} className="w-5 h-5 self-center shrink-0" />
                  <span className={`text-[15px] truncate ${mercTheme.nameClass}`}>
                    {arch.name}
                  </span>
                  <span className={`font-mono-num text-[13px] font-bold shrink-0 ${mercTheme.levelClass}`}>
                    Lv.{slot.level}
                    {effLv > slot.level ? ` (${effLv})` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono-num">
                  <span className="font-bold text-[#e2e8f0]">
                    {formatNumber(computed.dpsEstimate, settings.numberMode, true)}/s
                  </span>
                  {computed.overflowSpdMult > 1 && (
                    <span className="text-[#fbbf24] font-semibold shrink-0">
                      · 25/s转攻×{computed.overflowSpdMult.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[#64748b]">·</span>
                  <span className="text-[#fde047] font-display font-bold truncate">
                    ★ {innateCfg.name}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => upgradeMercenary(idx)}
                disabled={!canUpgrade}
                className={`min-h-[48px] min-w-[112px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
                  canUpgrade
                    ? 'bg-[#06b6d4]/22 border border-[#22d3ee]/55 text-[#ecfeff] hover:bg-[#06b6d4]/35'
                    : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                }`}
              >
                <div className="font-bold leading-tight">升级 +{bulk.count}</div>
                <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
                  {formatNumber(bulk.totalCost, settings.numberMode)} 灵石
                </div>
              </button>
            </div>

            {/* 10-Node Rune Progress Bar */}
            <div className="space-y-1.5">
              <div className="grid grid-cols-10 gap-1">
                {LEVEL_SLOT_THRESHOLDS.map((reqLv, sIdx) => {
                  const permanentlyOpen = sIdx < slot.unlockedLevelSlots;
                  const activeNow = effLv >= reqLv;
                  const inst = slot.levelAffixes[sIdx];
                  const tMeta = inst ? AFFIX_TIER_META[inst.tier] : null;
                  const barColor = !permanentlyOpen
                    ? 'bg-white/10'
                    : !activeNow
                      ? 'bg-[#334155]'
                      : tMeta
                        ? inst?.tier === 'gold'
                          ? 'bg-[#fbbf24]'
                          : inst?.tier === 'purple'
                            ? 'bg-[#c084fc]'
                            : inst?.tier === 'blue'
                              ? 'bg-[#38bdf8]'
                              : inst?.tier === 'green'
                                ? 'bg-[#34d399]'
                                : 'bg-[#cbd5e1]'
                        : 'bg-[#38bdf8]/45';
                  return (
                    <div
                      key={sIdx}
                      className={`h-2 rounded-sm ${barColor}`}
                      title={`Lv.${reqLv}`}
                    />
                  );
                })}
              </div>

              {activeSummaries.length > 0 && (
                <div className="flex items-center gap-x-2.5 gap-y-0.5 flex-wrap text-xs">
                  {activeSummaries.slice(0, 3).map((item, i) => (
                    <span key={i} className={`font-semibold ${item.colorClass}`}>
                      {item.text}
                    </span>
                  ))}
                  {activeSummaries.length > 3 && (
                    <span className="text-[#94a3b8]">+{activeSummaries.length - 3}项</span>
                  )}
                </div>
              )}
            </div>

            {/* Dedicated 44px+ Forge Trigger + Per-Slot Auto Upgrade Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenForgeModal(idx)}
                className={`flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                  hasPending
                    ? 'bg-[#f59e0b]/18 border-[#fbbf24]/65 text-[#fef08a]'
                    : 'bg-[#101322] border-[#2e3552] text-[#cbd5e1] hover:border-[#38bdf8]/55 hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                  <span className="truncate">
                    {hasPending
                      ? '有待确认的洗练对比结果'
                      : `道纹洗练 (${slot.unlockedLevelSlots}/10槽${nextThreshold ? ` · 下槽 Lv.${nextThreshold}` : ''})`}
                  </span>
                </span>
                <span className="text-[#7dd3fc] shrink-0 whitespace-nowrap">洗练 →</span>
              </button>

              {meta.unlockedAutoMercUpgrade && (
                <button
                  type="button"
                  onClick={() => toggleAutoMercSlot(idx)}
                  className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer ${
                    meta.autoSettings.autoMercSlots[idx]
                      ? 'bg-[#10b981]/20 border-[#34d399]/55 text-[#a7f3d0]'
                      : 'bg-[#101322] border-[#2e3552] text-[#64748b] hover:text-white'
                  }`}
                >
                  {meta.autoSettings.autoMercSlots[idx] ? '自动:开' : '自动:关'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
