import { useState } from 'react';
import { Crown, Lock, Sparkles } from 'lucide-react';
import { RELICS, RELIC_TIER_META } from '../config/relics';
import { formatNumber, toDecimal } from '../core/formatNumber';
import { getRelicPullCost, getRelicUpgradeCost, useGameStore } from '../stores/useGameStore';
import type { RelicTier } from '../types/game';

type TierFilter = 'all' | RelicTier;

export function TabRelics() {
  const { meta, settings, pullRandomRelic, upgradeRelic } = useGameStore();
  const [filter, setFilter] = useState<TierFilter>('all');

  const crystals = toDecimal(meta.divineCrystals);
  const pullCost = getRelicPullCost(meta);

  const ownedStd = RELICS.filter(
    (r) => r.tier !== 'mythic' && (meta.relicLevels[r.id] ?? 0) > 0
  ).length;
  const allStdOwned = ownedStd >= 25;
  const totalOwned = RELICS.filter((r) => (meta.relicLevels[r.id] ?? 0) > 0).length;

  const filtered = filter === 'all' ? RELICS : RELICS.filter((r) => r.tier === filter);

  return (
    <div className="space-y-2">
      {/* Compact Relic Hall Pull Bar */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-lg p-2.5 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#f4f1ea]">
            遗物圣殿 · {totalOwned}/{RELICS.length}
          </div>
          <p className="text-[11px] text-[#a3b1cc] truncate mt-0.5">
            仙阶{meta.unlockedEpicPool ? '已开' : '劫3开'} · 神阶劫7~10掉落
          </p>
        </div>

        {!meta.unlockedRelicHall ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md text-[11px] text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0">
            <Lock className="w-3 h-3" />
            <span>首通劫一开</span>
          </span>
        ) : allStdOwned ? (
          <span className="px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-[#10b981]/18 border border-[#34d399]/40 text-[#a7f3d0] shrink-0">
            常驻全齐
          </span>
        ) : (
          <button
            type="button"
            onClick={pullRandomRelic}
            disabled={crystals.lt(pullCost)}
            className={`min-w-[100px] px-2.5 py-1.5 rounded-md text-xs font-medium border text-right shrink-0 transition-colors cursor-pointer ${
              crystals.gte(pullCost)
                ? 'bg-[#a855f7]/28 border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                : 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
            }`}
          >
            <div className="inline-flex items-center gap-1 font-semibold leading-tight">
              <Sparkles className="w-3 h-3" />
              <span>神晶抽取</span>
            </div>
            <div className="font-mono-num text-[10px] opacity-90">{pullCost} 神晶</div>
          </button>
        )}
      </div>

      {/* Compact Tier Filters */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#101322] border border-[#2e3552] rounded-md">
        {(
          [
            ['all', '全部'],
            ['common', '凡(8)'],
            ['rare', '灵(10)'],
            ['epic', '仙(7)'],
            ['mythic', '神(5)'],
          ] as [TierFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
              filter === key ? 'bg-[#252b44] text-white' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Compact Relics List */}
      <div className="space-y-1.5">
        {filtered.map((r) => {
          const lv = meta.relicLevels[r.id] ?? 0;
          const owned = lv > 0;
          const isMax = r.maxLevel !== null && lv >= r.maxLevel;
          const upCost = getRelicUpgradeCost(r.id, lv);
          const canUp = owned && !isMax && crystals.gte(upCost);
          const tMeta = RELIC_TIER_META[r.tier];

          return (
            <div
              key={r.id}
              className={`rounded-lg p-2.5 border flex items-center justify-between gap-2.5 ${
                owned
                  ? `bg-[#171a29] ${tMeta.borderClass}`
                  : 'bg-[#121523] border-white/8 opacity-65'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-display text-xs font-bold flex items-center gap-1 truncate ${tMeta.colorClass}`}
                  >
                    {owned && <Crown className="w-3 h-3 shrink-0" />}
                    <span className="truncate">
                      [{tMeta.label}] {r.name}
                    </span>
                  </span>
                  <span className="font-mono-num text-[11px] text-[#e2e8f0] shrink-0">
                    {owned
                      ? `Lv.${lv}${r.maxLevel !== null ? `/${r.maxLevel}` : ''}`
                      : '未获'}
                  </span>
                </div>
                <p className="text-[11px] text-[#a3b1cc] mt-0.5 leading-snug">{r.description}</p>
              </div>

              {owned ? (
                <button
                  type="button"
                  onClick={() => upgradeRelic(r.id)}
                  disabled={!canUp}
                  className={`min-w-[88px] px-2.5 py-1.5 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
                    isMax
                      ? 'bg-[#10b981]/18 border border-[#34d399]/35 text-[#a7f3d0] cursor-default'
                      : canUp
                        ? 'bg-[#a855f7]/28 border border-[#c084fc]/60 text-[#faf5ff] hover:bg-[#a855f7]/40'
                        : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  {isMax ? (
                    <div className="text-center font-semibold">已满级</div>
                  ) : (
                    <>
                      <div className="font-semibold leading-tight">升阶 +1</div>
                      <div className="font-mono-num text-[10px] opacity-90">
                        {formatNumber(upCost, settings.numberMode)} 神晶
                      </div>
                    </>
                  )}
                </button>
              ) : (
                <span className="px-2 py-1.5 rounded text-[10px] text-[#94a3b8] bg-[#101322] border border-white/8 shrink-0 whitespace-nowrap">
                  {r.tier === 'mythic' ? '劫7~10掉落' : '凝练抽取'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
