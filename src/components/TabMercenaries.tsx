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
  isSlot5Active,
} from '../core/damageCalc';
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
  const { run, mercs, meta, settings, unlockMercSlot, upgradeMercenary } = useGameStore();

  const stones = toDecimal(run.spiritStones);
  const crystals = toDecimal(meta.divineCrystals);
  const heroStats = getHeroStats(run, mercs, meta);
  const globalMult = getGlobalMult(run, mercs, meta);
  const costRed = getCostReductionMult(meta);
  const firstAffixRelicLv = meta.relicLevels.rel_m_first_affix ?? 0;
  const s5 = isSlot5Active(mercs);

  return (
    <div className="space-y-2">
      {/* Top Helper & Build Guide Entry */}
      <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-[#a3b1cc]">
        <button
          type="button"
          onClick={onOpenGuideModal}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d31] border border-[#38bdf8]/40 text-[#7dd3fc] hover:bg-[#06b6d4]/20 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3 h-3" />
          <span>流派指南</span>
        </button>
        <span className="font-mono-num text-[#fbbf24] shrink-0">
          保底气运 {meta.rerollPity}/10
        </span>
      </div>

      {/* 5 Fixed Mercenary Cards */}
      {mercs.map((slot, idx) => {
        const arch = ARCHETYPES[slot.archetype];

        if (!slot.unlocked) {
          const crystalCost = MERC_SLOT_CRYSTAL_COSTS[idx];
          const canUnlock = idx > 0 && crystals.gte(crystalCost);
          return (
            <div
              key={idx}
              className="bg-[#131624] border border-[#2e3552] rounded-lg p-2.5 flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#cbd5e1]">
                  <ArchetypeIcon archetype={slot.archetype} className="w-4 h-4 opacity-50" />
                  <span>
                    {idx + 1}号位 · {arch.name}
                  </span>
                  <span className="text-[10px] text-[#94a3b8]">({arch.roleTag})</span>
                </div>
                <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
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
                  className={`min-w-[96px] px-2.5 py-1.5 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
                    canUnlock
                      ? 'bg-[#a855f7]/28 border border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                      : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold leading-tight">解锁护法</div>
                  <div className="font-mono-num text-[10px] opacity-90">
                    {crystalCost.toLocaleString()} 神晶
                  </div>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-[11px] text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0">
                  <Lock className="w-3 h-3" />
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
        const innateCfg = INNATE_AFFIXES[slot.innateAffix];
        const hasInnateBoost = slot.innateAffix === 'sp_affix_boost';
        const hasPending =
          slot.pendingLevelAffixes !== null || slot.pendingInnateAffix !== null;

        return (
          <div
            key={idx}
            className="bg-[#171a29] border border-[#2e3552] rounded-lg p-2 space-y-1.5"
          >
            {/* Top Row: [Icon + Name + Lv + Next Slot Node] + [Upgrade +N] */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenForgeModal(idx)}
                className="min-w-0 flex-1 flex items-center justify-between gap-2 text-left rounded p-1 -m-1 hover:bg-white/5 transition-colors cursor-pointer"
                title="点击打开千级道纹与本命神通洗练"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ArchetypeIcon archetype={slot.archetype} className="w-5 h-5" />
                  <span className="font-display text-xs font-bold text-[#f4f1ea] truncate">
                    {arch.name}
                  </span>
                  <span className="font-mono-num text-[11px] text-[#22d3ee] shrink-0">
                    Lv.{slot.level}
                    {effLv > slot.level ? `(${effLv})` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono-num text-[10px]">
                  <span className="text-[#94a3b8] hidden sm:inline">
                    {nextThreshold ? `下槽:Lv.${nextThreshold}` : '十槽圆满'}
                  </span>
                  <span className="text-[#38bdf8]">
                    {formatNumber(computed.dpsEstimate, settings.numberMode, true)}/s
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => upgradeMercenary(idx)}
                disabled={!canUpgrade}
                className={`min-w-[92px] px-2 py-1 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
                  canUpgrade
                    ? 'bg-[#06b6d4]/22 border border-[#22d3ee]/55 text-[#ecfeff] hover:bg-[#06b6d4]/35'
                    : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                }`}
              >
                <div className="font-semibold leading-tight">升级 +{bulk.count}</div>
                <div className="font-mono-num text-[10px] opacity-90">
                  {formatNumber(bulk.totalCost, settings.numberMode)} 灵石
                </div>
              </button>
            </div>

            {/* Middle 1-line Talents + Gold Innate Badge */}
            <button
              type="button"
              onClick={() => onOpenForgeModal(idx)}
              className="w-full text-left flex items-center justify-between gap-1.5 text-[10px] px-1 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="text-[#94a3b8] truncate">
                天赋：{arch.talent1Name} · {arch.talent2Name}
              </span>
              <span className="text-[#fbbf24] font-semibold shrink-0 whitespace-nowrap">
                {innateCfg.name}
              </span>
            </button>

            {/* Bottom 2x5 Grid for 10 Level Affix Slots (Lv.10 ~ Lv.1000) */}
            <button
              type="button"
              onClick={() => onOpenForgeModal(idx)}
              className="w-full text-left cursor-pointer group"
              title="点击管理 10 重道纹与本命神通"
            >
              <div className="grid grid-cols-5 gap-1">
                {LEVEL_SLOT_THRESHOLDS.map((reqLv, sIdx) => {
                  const permanentlyOpen = sIdx < slot.unlockedLevelSlots;
                  const activeNow = effLv >= reqLv;
                  const inst = slot.levelAffixes[sIdx];

                  if (!permanentlyOpen) {
                    return (
                      <div
                        key={sIdx}
                        className="px-1 py-0.5 rounded border border-white/8 bg-[#101322] text-[9px] font-mono-num text-[#64748b] flex items-center justify-center gap-0.5 truncate"
                      >
                        <Lock className="w-2.5 h-2.5 shrink-0 opacity-65" />
                        <span>{reqLv}</span>
                      </div>
                    );
                  }

                  if (!inst) {
                    return (
                      <div
                        key={sIdx}
                        className={`px-1 py-0.5 rounded border border-dashed text-[9px] text-center truncate ${
                          activeNow
                            ? 'border-[#38bdf8]/45 text-[#7dd3fc] bg-[#0d101b]'
                            : 'border-white/12 text-[#64748b] bg-[#101322] opacity-65'
                        }`}
                      >
                        {activeNow ? '可洗练' : `Lv.${reqLv}`}
                      </div>
                    );
                  }

                  const tMeta = AFFIX_TIER_META[inst.tier];
                  const cfg = AFFIXES[inst.id];
                  const effVal = getAffixEffectiveValue(
                    inst,
                    sIdx,
                    s5,
                    hasInnateBoost,
                    firstAffixRelicLv
                  );
                  const valStr = formatAffixShortBadgeValue(inst.id, effVal);

                  return (
                    <div
                      key={sIdx}
                      className={`px-1 py-0.5 rounded border text-[9px] truncate flex items-center justify-between gap-0.5 ${
                        activeNow
                          ? `${tMeta.badgeBgClass} ${tMeta.borderClass} ${tMeta.colorClass}`
                          : 'bg-[#101322] border-white/10 text-[#64748b] opacity-55'
                      }`}
                    >
                      <span className="truncate">{cfg.name}</span>
                      <span className="font-mono-num shrink-0">
                        {activeNow ? valStr : `Lv.${reqLv}`}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-1 text-[9px] text-[#64748b] group-hover:text-[#94a3b8]">
                <span>
                  点击开启道纹洗练 · {nextThreshold ? `距下槽还差 ${nextThreshold - effLv} 有效级` : '十槽已全开'}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  {hasPending && <span className="text-[#fbbf24] mr-1">有待定结果</span>}
                  <SlidersHorizontal className="w-2.5 h-2.5" />
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
