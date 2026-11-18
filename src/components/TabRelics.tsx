import { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Compass,
  Crown,
  EyeOff,
  Lock,
  Sparkles,
} from 'lucide-react';
import { TRIBULATIONS } from '../config/bosses';
import {
  RELICS,
  RELIC_TIER_META,
  RELIC_TIER_ORDER,
  getDropRarityLuckScore,
  getRelicDropOverview,
  getRelicLevelsBreakdown,
  getTribulationEffectiveDropOdds,
} from '../config/relics';
import { getRelicPoolBreakdown, getTotalRelicLevels } from '../core/damageCalc';
import { formatNumber, toDecimal } from '../core/formatNumber';
import { getRelicUpgradeCost, useGameStore } from '../stores/useGameStore';
import type { RelicConfig, RelicTier } from '../types/game';

type TierFilter = 'all' | RelicTier;

export function TabRelics() {
  const { run, mercs, meta, settings, upgradeRelic } = useGameStore();
  const [filter, setFilter] = useState<TierFilter>('all');
  const [showDropGuide, setShowDropGuide] = useState(false);
  const [showPoolSummary, setShowPoolSummary] = useState(false);

  const crystals = toDecimal(meta.divineCrystals);
  const dropOverview = getRelicDropOverview(meta);
  const totalRelicLevels = getTotalRelicLevels(meta);
  const poolBreakdown = getRelicPoolBreakdown(run, mercs, meta);
  const totalOwned = RELICS.filter((r) => getRelicLevelsBreakdown(meta, r.id).owned).length;
  const dropLuckScore = getDropRarityLuckScore(meta);

  const tierCountMap = RELIC_TIER_ORDER.reduce(
    (acc, tier) => {
      acc[tier] = RELICS.filter((r) => r.tier === tier).length;
      return acc;
    },
    {} as Record<RelicTier, number>
  );

  // Priority sorting: unlocked/owned relics ALWAYS appear first, sorted by tier desc then totalLv desc
  const { ownedRelics, lockedRelics } = useMemo(() => {
    const base = filter === 'all' ? RELICS : RELICS.filter((r) => r.tier === filter);
    const owned: { relic: RelicConfig; bd: ReturnType<typeof getRelicLevelsBreakdown> }[] = [];
    const locked: RelicConfig[] = [];

    for (const r of base) {
      const bd = getRelicLevelsBreakdown(meta, r.id);
      if (bd.owned) {
        owned.push({ relic: r, bd });
      } else {
        locked.push(r);
      }
    }

    owned.sort((a, b) => {
      const orderDiff = RELIC_TIER_META[b.relic.tier].order - RELIC_TIER_META[a.relic.tier].order;
      if (orderDiff !== 0) return orderDiff;
      return b.bd.totalLv - a.bd.totalLv;
    });

    return { ownedRelics: owned, lockedRelics: locked };
  }, [filter, meta]);

  return (
    <div className="space-y-3">
      {/* Relic Hall Overview & Drop Mapping Guide */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-display text-base font-black tracking-wide text-[#f4f1ea]">
                遗物圣殿
              </span>
              <span className="font-mono-num text-xs font-bold text-[#c084fc]">
                已解封 {totalOwned}/{RELICS.length}
              </span>
              <span className="font-mono-num text-xs font-bold text-[#fbbf24]">
                总阶 Lv.{totalRelicLevels}
              </span>
            </div>
            <p className="text-xs text-[#a3b1cc] mt-1 leading-relaxed">
              已解封遗物优先置顶 · 神晶升阶与劫印掉落双轨叠加（满印特殊遗物自动折算同阶神晶）
            </p>
          </div>

          {!meta.unlockedRelicHall ? (
            <span className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap">
              <Lock className="w-3.5 h-3.5" />
              <span>首通劫一开</span>
            </span>
          ) : (
            <div className="min-h-[44px] px-3 py-1.5 rounded-xl text-right bg-[#101322] border border-[#c084fc]/35 shrink-0 flex flex-col justify-center">
              <div className="text-[11px] text-[#94a3b8]">可用神晶</div>
              <div className="font-mono-num text-sm font-extrabold text-[#c084fc]">
                {formatNumber(crystals, settings.numberMode)}
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Linear Drop Count & Independent Rarity Odds Guide */}
        <div className="pt-2.5 border-t border-white/8">
          <button
            type="button"
            onClick={() => setShowDropGuide((v) => !v)}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 text-xs text-[#cbd5e1] hover:text-white cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <Compass className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <span className="font-bold text-[#e2e8f0] shrink-0">十劫线性掉落与全阶掉率</span>
              {dropLuckScore > 0 && (
                <span className="font-mono-num text-[11px] text-[#fbbf24] truncate">
                  掉宝加成 +{Math.round(dropLuckScore * 100)}%
                </span>
              )}
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
            <div className="mt-2.5 rounded-xl bg-[#101322] border border-[#2e3552] p-3 space-y-3">
              {/* 6-Tier Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dropOverview.map((d) => (
                  <div
                    key={d.tier}
                    className={`rounded-lg border px-2.5 py-2 bg-[#151827] ${d.meta.borderClass}`}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span className={`text-[14px] ${d.meta.fontClass}`}>
                        {d.meta.label}
                      </span>
                      <span className="font-mono-num text-[11px] text-[#cbd5e1]">
                        {d.ownedCount}/{d.totalCount}
                      </span>
                    </div>
                    <div className="font-mono-num text-[11.5px] text-[#e2e8f0] mt-0.5">
                      {d.tribRangeLabel}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        d.unlocked ? 'text-[#34d399]' : 'text-[#64748b]'
                      }`}
                    >
                      {d.unlocked ? '已入掉落池' : `需破劫${d.unlockOrder}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-Tribulation Linear Quantity + Effective Independent Probabilities */}
              <div className="space-y-1.5 pt-2 border-t border-white/8">
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span className="font-semibold text-[#cbd5e1]">各劫数实时掉落分配</span>
                  <span className="font-mono-num text-[11px]">数量线性 1 → 10 件</span>
                </div>
                <div className="space-y-1">
                  {TRIBULATIONS.map((t) => {
                    const odds = getTribulationEffectiveDropOdds(t.id, meta);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-white/5 last:border-b-0 flex-wrap"
                      >
                        <span className="font-mono-num font-bold text-[#e2e8f0] shrink-0">
                          劫{t.order} · {t.relicDropCount}件
                        </span>
                        <div className="flex items-center gap-2.5 flex-wrap font-mono-num">
                          {odds.map((o) => (
                            <span key={o.tier} className="inline-flex items-baseline gap-0.5">
                              <span className={o.meta.fontClass}>{o.meta.shortLabel}</span>
                              <span className={o.meta.colorClass}>
                                {o.effectivePct.toFixed(o.effectivePct < 10 ? 1 : 0)}%
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible 4-Pool Relic Multiplier Breakdown */}
        <div className="pt-2 border-t border-white/8">
          <button
            type="button"
            onClick={() => setShowPoolSummary((v) => !v)}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 text-xs text-[#cbd5e1] hover:text-white cursor-pointer"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <BarChart3 className="w-4 h-4 text-[#c084fc] shrink-0" />
              <span className="font-bold text-[#e2e8f0] shrink-0">圣殿四大乘区实时总览</span>
              <span className="font-mono-num text-[11px] text-[#34d399] truncate">
                战术池 ×{poolBreakdown.tacticalPoolMult.toFixed(2)} · 终局池 ×
                {formatNumber(poolBreakdown.infinityPoolMult, settings.numberMode)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[#c084fc] font-semibold shrink-0 whitespace-nowrap">
              <span>{showPoolSummary ? '收起' : '展开'}</span>
              {showPoolSummary ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {showPoolSummary && (
            <div className="mt-2.5 rounded-xl bg-[#101322] border border-[#2e3552] p-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono-num">
                <div className="rounded-lg bg-[#151827] border border-white/8 p-2.5 space-y-1">
                  <div className="text-[11px] text-[#94a3b8]">① 战力基础池（同池加算）</div>
                  <div className="font-bold text-[#67e8f9]">
                    主角点击 ×{poolBreakdown.heroClickMult.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#cbd5e1]">
                    全护法通用 +{(poolBreakdown.mercBaseAllPct * 100).toFixed(0)}%（与专精同池加算）
                  </div>
                </div>

                <div className="rounded-lg bg-[#151827] border border-white/8 p-2.5 space-y-1">
                  <div className="text-[11px] text-[#94a3b8]">② 战术终伤池（同池加算）</div>
                  <div className="font-bold text-[#34d399]">
                    当前合计 ×{poolBreakdown.tacticalPoolMult.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#cbd5e1]">
                    蓄锋+{(poolBreakdown.tacticalBreakdown.manaBlade * 100).toFixed(0)}% · 斩杀+
                    {(poolBreakdown.tacticalBreakdown.execute * 100).toFixed(0)}% · 道海+
                    {(poolBreakdown.tacticalBreakdown.voidMana * 100).toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-lg bg-[#151827] border border-white/8 p-2.5 space-y-1">
                  <div className="text-[11px] text-[#94a3b8]">③ 终局复利池（仙+神复利）</div>
                  <div className="font-bold text-[#fbbf24]">
                    ×{formatNumber(poolBreakdown.infinityPoolMult, settings.numberMode)}
                  </div>
                  <div className="text-[11px] text-[#cbd5e1]">
                    弑神道果 × 不可名状之核长线复利叠层
                  </div>
                </div>

                <div className="rounded-lg bg-[#151827] border border-white/8 p-2.5 space-y-1">
                  <div className="text-[11px] text-[#94a3b8]">④ 经济与减抗池（有封顶）</div>
                  <div className="font-bold text-[#c084fc]">
                    神晶 ×{poolBreakdown.crystalMult.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#cbd5e1]">
                    价格 ×{poolBreakdown.costMult.toFixed(2)} · BOSS血 ×
                    {poolBreakdown.bossHpMult.toFixed(2)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                圣殿重构为“战力基础池 × 战术终伤池 × 终局复利池”三主乘区，避免低层遗物虚高秒杀中后期，鼓励多轮刷劫印叠层与神晶长线累积。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Touch-Scrollable 6-Tier Filter Bar with Luminous Tier Visual Effects */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-[#101322] border border-[#2e3552] rounded-xl">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[44px] px-4 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
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
              className={`min-h-[44px] px-4 text-[13.5px] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-95 inline-flex items-center gap-1 ${
                active
                  ? `bg-[#252b44] border ${tMeta.borderClass}`
                  : 'border border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className={tMeta.fontClass}>{tMeta.label}</span>
              <span className="font-mono-num text-xs text-[#94a3b8]">({tierCountMap[tier]})</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Owned / Unlocked Relics (Always Prioritized on Top) */}
      {ownedRelics.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-[#94a3b8]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#e2e8f0]">
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>已解封遗物 ({ownedRelics.length})</span>
            </span>
            <span>高阶优先排列</span>
          </div>

          {ownedRelics.map(({ relic: r, bd }) => {
            const isCrystalMax = r.maxLevel !== null && bd.crystalLv >= r.maxLevel;
            const upCost = getRelicUpgradeCost(r.id, bd.crystalLv);
            const canUp = !isCrystalMax && crystals.gte(upCost);
            const tMeta = RELIC_TIER_META[r.tier];
            const isHighTier = r.tier === 'epic' || r.tier === 'mythic';

            return (
              <div
                key={r.id}
                className={`rounded-2xl p-4 border bg-[#171a29] flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${tMeta.borderClass}`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <Crown className={`w-4 h-4 shrink-0 self-center ${tMeta.colorClass}`} />
                      <span
                        className={`truncate ${tMeta.fontClass} ${
                          isHighTier ? 'text-[16.5px]' : 'text-[15.5px]'
                        }`}
                      >
                        [{tMeta.label}] {r.name}
                      </span>
                    </span>
                    <span className="font-mono-num text-[13.5px] font-extrabold text-[#f8fafc] shrink-0">
                      总 Lv.{bd.totalLv}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap font-mono-num text-xs">
                    <span className="text-[#c084fc] font-semibold">
                      神晶 Lv.{bd.crystalLv}
                      {r.maxLevel !== null ? `/${r.maxLevel}` : ' (无限)'}
                    </span>
                    <span className="text-[#475569]">·</span>
                    <span className="text-[#fbbf24] font-semibold">
                      劫印 Lv.{bd.dropLv}
                      {r.maxDropLevel !== null ? `/${r.maxDropLevel}` : ' (无限)'}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#cbd5e1] leading-relaxed">{r.description}</p>

                  {r.maxDropLevel !== null && (
                    <p className="text-[11.5px] text-[#c084fc] leading-snug">
                      满劫印转神晶：劫印达 {r.maxDropLevel} 级后再掉落自动转化为{' '}
                      {tMeta.overflowBaseCrystals.toLocaleString()} 基础神晶（受加成）
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => upgradeRelic(r.id)}
                  disabled={!canUp}
                  className={`w-full sm:w-auto sm:min-w-[136px] min-h-[48px] px-4 py-2.5 rounded-xl text-[13.5px] font-medium shrink-0 transition-colors cursor-pointer flex items-center justify-between sm:flex-col sm:justify-center sm:items-end gap-2 sm:gap-0.5 active:scale-[0.98] ${
                    isCrystalMax
                      ? 'bg-[#10b981]/18 border border-[#34d399]/35 text-[#a7f3d0] cursor-default justify-center'
                      : canUp
                        ? 'bg-[#a855f7]/28 border border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                        : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  {isCrystalMax ? (
                    <div className="text-center font-bold w-full">神晶已满阶</div>
                  ) : (
                    <>
                      <div className="font-bold leading-tight">神晶升阶 +1</div>
                      <div className="font-mono-num text-xs opacity-90">
                        {formatNumber(upCost, settings.numberMode)} 神晶
                      </div>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2: Locked / Unowned Relics (Compactly listed below) */}
      {lockedRelics.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1 text-xs text-[#64748b]">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>尚未解封 ({lockedRelics.length})</span>
            </span>
            <span>通关对应劫数掉落后现形</span>
          </div>

          {lockedRelics.map((r) => {
            const tMeta = RELIC_TIER_META[r.tier];
            return (
              <div
                key={r.id}
                className="rounded-xl p-3.5 border border-white/10 bg-[#121523] flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5">
                      <EyeOff className={`w-4 h-4 shrink-0 self-center opacity-75 ${tMeta.colorClass}`} />
                      <span className={`text-[14.5px] opacity-90 ${tMeta.fontClass}`}>
                        [{tMeta.label}] ？？？
                      </span>
                    </span>
                    <span className="font-mono-num text-xs text-[#64748b] shrink-0">未解封</span>
                  </div>
                  <p className="text-xs text-[#64748b] leading-snug">
                    击破【{tMeta.dropHint}】古神后解封真容
                  </p>
                </div>

                <span className="min-h-[42px] px-3 py-2 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-white/8 shrink-0 whitespace-nowrap flex items-center">
                  {tMeta.dropHint}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
