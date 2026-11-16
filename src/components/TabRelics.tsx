import { useState } from 'react';
import { ChevronDown, ChevronUp, Compass, Crown, EyeOff, Lock } from 'lucide-react';
import {
  RELICS,
  RELIC_TIER_META,
  RELIC_TIER_ORDER,
  getRelicDropOverview,
  getRelicLevelsBreakdown,
} from '../config/relics';
import { getTotalRelicLevels } from '../core/damageCalc';
import { formatNumber, toDecimal } from '../core/formatNumber';
import { getRelicUpgradeCost, useGameStore } from '../stores/useGameStore';
import type { RelicTier } from '../types/game';

type TierFilter = 'all' | RelicTier;

export function TabRelics() {
  const { meta, settings, upgradeRelic } = useGameStore();
  const [filter, setFilter] = useState<TierFilter>('all');
  const [showDropGuide, setShowDropGuide] = useState(false);

  const crystals = toDecimal(meta.divineCrystals);
  const dropOverview = getRelicDropOverview(meta);
  const totalRelicLevels = getTotalRelicLevels(meta);
  const totalOwned = RELICS.filter((r) => getRelicLevelsBreakdown(meta, r.id).owned).length;

  const tierCountMap = RELIC_TIER_ORDER.reduce(
    (acc, tier) => {
      acc[tier] = RELICS.filter((r) => r.tier === tier).length;
      return acc;
    },
    {} as Record<RelicTier, number>
  );

  const filtered = filter === 'all' ? RELICS : RELICS.filter((r) => r.tier === filter);

  return (
    <div className="space-y-2.5">
      {/* Relic Hall Overview & Drop Mapping Guide */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-[15px] font-black tracking-wide text-[#f4f1ea]">
                遗物圣殿
              </span>
              <span className="font-mono-num text-xs font-bold text-[#c084fc]">
                已解封 {totalOwned}/{RELICS.length}
              </span>
              <span className="font-mono-num text-xs font-bold text-[#fbbf24]">
                总阶 Lv.{totalRelicLevels}
              </span>
            </div>
            <p className="text-xs text-[#a3b1cc] mt-1 leading-snug">
              通关对应劫数无限累加【劫印】 · 神晶独立升阶（满印特殊遗物溢转对应品阶神晶）
            </p>
          </div>

          {!meta.unlockedRelicHall ? (
            <span className="min-h-[42px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap">
              <Lock className="w-3.5 h-3.5" />
              <span>首通劫一开</span>
            </span>
          ) : (
            <div className="min-h-[42px] px-3 py-1.5 rounded-lg text-right bg-[#101322] border border-[#c084fc]/35 shrink-0 flex flex-col justify-center">
              <div className="text-[11px] text-[#94a3b8]">可用神晶</div>
              <div className="font-mono-num text-xs font-extrabold text-[#c084fc]">
                {formatNumber(crystals, settings.numberMode)}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Tribulation Drop Guide */}
        <div className="pt-2 border-t border-white/8">
          <button
            type="button"
            onClick={() => setShowDropGuide((v) => !v)}
            className="w-full min-h-[40px] flex items-center justify-between gap-2 text-xs text-[#cbd5e1] hover:text-white cursor-pointer"
          >
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <Compass className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <span className="font-bold text-[#e2e8f0] shrink-0">各劫掉落明细</span>
              <span className="font-mono-num text-[11px] text-[#94a3b8] truncate">
                劫1~2凡 · 3~4灵 · 5~6玄 · 7~8圣 · 9仙 · 终焉神
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[#7dd3fc] font-semibold shrink-0 whitespace-nowrap">
              <span>{showDropGuide ? '收起' : '展开'}</span>
              {showDropGuide ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {showDropGuide && (
            <div className="mt-2 rounded-lg bg-[#101322] border border-[#2e3552] p-2.5 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dropOverview.map((d) => (
                  <div
                    key={d.tier}
                    className={`rounded-lg border px-2.5 py-2 bg-[#151827] ${d.meta.borderClass}`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className={`font-bold ${d.meta.colorClass}`}>
                        {d.meta.label}({d.meta.colorName[0]})
                      </span>
                      <span className="font-mono-num text-[11px] text-[#cbd5e1]">
                        {d.ownedCount}/{d.totalCount}
                      </span>
                    </div>
                    <div className="font-mono-num text-[11px] text-[#e2e8f0] mt-0.5">
                      {d.tribRangeLabel}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        d.unlocked ? 'text-[#34d399]' : 'text-[#64748b]'
                      }`}
                    >
                      {d.unlocked ? '已解封掉落' : `需解锁劫${d.unlockOrder}`}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#94a3b8] leading-snug">
                每件遗物总等级 = 神晶升阶 + 劫印掉落（默认无限累加；少数特殊上限遗物满印后直接折算同品阶神晶）。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Touch-Scrollable 6-Tier Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-[#101322] border border-[#2e3552] rounded-xl">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[40px] px-3.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            filter === 'all' ? 'bg-[#252b44] text-white' : 'text-[#94a3b8] hover:text-white'
          }`}
        >
          全部({RELICS.length})
        </button>
        {RELIC_TIER_ORDER.map((tier) => {
          const tMeta = RELIC_TIER_META[tier];
          const active = filter === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => setFilter(tier)}
              className={`min-h-[40px] px-3.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                active
                  ? `bg-[#252b44] ${tMeta.colorClass}`
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {tMeta.shortLabel}({tierCountMap[tier]})
            </button>
          );
        })}
      </div>

      {/* Relics List (Unowned strictly veiled!) */}
      <div className="space-y-2">
        {filtered.map((r) => {
          const bd = getRelicLevelsBreakdown(meta, r.id);
          const isCrystalMax = r.maxLevel !== null && bd.crystalLv >= r.maxLevel;
          const upCost = getRelicUpgradeCost(r.id, bd.crystalLv);
          const canUp = bd.owned && !isCrystalMax && crystals.gte(upCost);
          const tMeta = RELIC_TIER_META[r.tier];

          if (!bd.owned) {
            return (
              <div
                key={r.id}
                className="rounded-xl p-3.5 border border-white/10 bg-[#121523] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`font-display text-[14px] font-extrabold tracking-wide inline-flex items-center gap-1.5 opacity-85 ${tMeta.colorClass}`}
                    >
                      <EyeOff className="w-4 h-4 shrink-0 self-center opacity-75" />
                      <span>[{tMeta.label}] ？？？</span>
                    </span>
                    <span className="font-mono-num text-xs font-semibold text-[#64748b] shrink-0">
                      未解封
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] leading-snug">
                    击败【{tMeta.dropHint}】对应古神后，方可窥见真容与具体属性
                  </p>
                </div>

                <span className="min-h-[44px] px-3 py-2 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-white/8 shrink-0 whitespace-nowrap flex items-center">
                  {tMeta.dropHint}
                </span>
              </div>
            );
          }

          return (
            <div
              key={r.id}
              className={`rounded-xl p-3.5 border bg-[#171a29] flex items-center justify-between gap-3 ${tMeta.borderClass}`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span
                    className={`font-display text-[14.5px] font-extrabold tracking-wide flex items-center gap-1.5 min-w-0 ${tMeta.colorClass}`}
                  >
                    <Crown className="w-4 h-4 shrink-0 self-center" />
                    <span className="truncate">
                      [{tMeta.label}] {r.name}
                    </span>
                  </span>
                  <span className="font-mono-num text-[13px] font-extrabold text-[#f8fafc] shrink-0">
                    总 Lv.{bd.totalLv}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap font-mono-num text-xs">
                  <span className="text-[#c084fc] font-semibold">
                    神晶 Lv.{bd.crystalLv}
                    {r.maxLevel !== null ? `/${r.maxLevel}` : ''}
                  </span>
                  <span className="text-[#475569]">+</span>
                  <span className="text-[#fbbf24] font-semibold">
                    劫印 Lv.{bd.dropLv}
                    {r.maxDropLevel !== null ? `/${r.maxDropLevel}` : ' (无限)'}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-[#cbd5e1] leading-snug">
                  {r.description}
                </p>

                {r.maxDropLevel !== null && (
                  <p className="text-[11px] text-[#c084fc]">
                    特殊上限：劫印满 {r.maxDropLevel} 级后重复掉落自动转化{' '}
                    {tMeta.overflowBaseCrystals.toLocaleString()} 基础神晶
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => upgradeRelic(r.id)}
                disabled={!canUp}
                className={`min-h-[48px] min-w-[112px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
                  isCrystalMax
                    ? 'bg-[#10b981]/18 border border-[#34d399]/35 text-[#a7f3d0] cursor-default'
                    : canUp
                      ? 'bg-[#a855f7]/28 border border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                      : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {isCrystalMax ? (
                  <div className="text-center font-bold">神晶满阶</div>
                ) : (
                  <>
                    <div className="font-bold leading-tight">神晶 +1</div>
                    <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
                      {formatNumber(upCost, settings.numberMode)} 神晶
                    </div>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
