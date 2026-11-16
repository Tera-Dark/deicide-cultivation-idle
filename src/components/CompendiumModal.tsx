import { useMemo, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  Compass,
  Crown,
  Dices,
  EyeOff,
  Lock,
  Search,
  Skull,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  AFFIX_LIST,
  AFFIX_TIER_META,
  INNATE_AFFIX_LIST,
  getAffixTierRates,
} from '../config/affixes';
import { ARCHETYPE_LIST } from '../config/archetypes';
import { BOSS_SHELLS, TRIBULATIONS } from '../config/bosses';
import {
  LEVEL_SLOT_NAMES,
  LEVEL_SLOT_THRESHOLDS,
  MERC_SLOT_CRYSTAL_COSTS,
  REALM_TIERS,
  SKILLS,
} from '../config/constants';
import { MERC_TYPOGRAPHY, RichLoreText } from '../config/highlights';
import {
  RELICS,
  RELIC_TIER_META,
  RELIC_TIER_ORDER,
  getRelicDropOverview,
  getRelicLevelsBreakdown,
} from '../config/relics';
import {
  evaluateSpeedrunRank,
  getBossTotalHp,
  getRelicTotalLv,
  getTotalRelicLevels,
} from '../core/damageCalc';
import { formatNumber, formatTimeMs } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import type { RelicTier } from '../types/game';
import { ArchetypeIcon } from './ArchetypeIcon';

type CodexCategory = 'boss' | 'affix' | 'relic' | 'merc' | 'rules';
type AffixSubFilter = 'all' | '下等' | '中等' | '上等' | 'innate';
type RelicFilter = 'all' | RelicTier;

const CATEGORIES: { id: CodexCategory; label: string; icon: typeof Skull }[] = [
  { id: 'boss', label: '劫狱古神', icon: Skull },
  { id: 'affix', label: '道纹词缀', icon: Dices },
  { id: 'relic', label: '古神遗物', icon: Crown },
  { id: 'merc', label: '护法流派', icon: Users },
  { id: 'rules', label: '修行法典', icon: Compass },
];

export function CompendiumModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { meta, mercs, settings } = useGameStore();
  const [category, setCategory] = useState<CodexCategory>('boss');
  const [affixFilter, setAffixFilter] = useState<AffixSubFilter>('all');
  const [affixQuery, setAffixQuery] = useState('');
  const [relicFilter, setRelicFilter] = useState<RelicFilter>('all');

  const luckLv = getRelicTotalLv(meta, 'rel_e_affix_luck');
  const affixRates = useMemo(() => getAffixTierRates(luckLv), [luckLv]);
  const relicDropOverview = useMemo(() => getRelicDropOverview(meta), [meta]);
  const totalRelicLevels = useMemo(() => getTotalRelicLevels(meta), [meta]);

  const totalRelicsOwned = useMemo(
    () => RELICS.filter((r) => getRelicLevelsBreakdown(meta, r.id).owned).length,
    [meta]
  );

  const clearedBossCount = useMemo(
    () => TRIBULATIONS.filter((t) => meta.clearedTribulations[t.id]).length,
    [meta.clearedTribulations]
  );

  const filteredLevelAffixes = useMemo(() => {
    const q = affixQuery.trim().toLowerCase();
    return AFFIX_LIST.filter((a) => {
      if (affixFilter !== 'all' && affixFilter !== 'innate' && a.tierGroup !== affixFilter) {
        return false;
      }
      if (q && !a.name.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [affixFilter, affixQuery]);

  const filteredInnateAffixes = useMemo(() => {
    const q = affixQuery.trim().toLowerCase();
    return INNATE_AFFIX_LIST.filter((a) => {
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.recommendedFor ?? '').toLowerCase().includes(q)
      );
    });
  }, [affixQuery]);

  const filteredRelics = useMemo(() => {
    if (relicFilter === 'all') return RELICS;
    return RELICS.filter((r) => r.tier === relicFilter);
  }, [relicFilter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#04060c]/88 p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compendium-title"
    >
      <div className="w-full max-w-[540px] h-[92dvh] sm:h-[89dvh] bg-[#131624] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe">
        {/* Top Modal Header */}
        <div className="shrink-0 px-4 py-3 border-b border-[#2e3552] bg-[#161a2b] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-[#38bdf8] shrink-0" />
              <h2
                id="compendium-title"
                className="font-display text-base font-black tracking-wide text-[#f4f1ea] truncate"
              >
                万劫秘藏图鉴
              </h2>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-mono-num mt-0.5">
              古神讨伐 {clearedBossCount}/{TRIBULATIONS.length} · 遗物解封 {totalRelicsOwned}/
              {RELICS.length} · 词缀录 {AFFIX_LIST.length + INNATE_AFFIX_LIST.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer shrink-0"
            aria-label="关闭图鉴"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Category Segmented Navigation */}
        <nav
          aria-label="图鉴分类导航"
          className="shrink-0 grid grid-cols-5 gap-1.5 p-1.5 bg-[#0e111d] border-b border-[#2e3552]"
        >
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`min-h-[46px] flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap active:scale-95 ${
                  active
                    ? 'bg-[#06b6d4]/22 text-[#67e8f9] border border-[#22d3ee]/50'
                    : 'text-[#94a3b8] hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{c.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-3">
          {/* ==================== 1. BOSS & SHELLS ==================== */}
          {category === 'boss' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <h3 className="font-display text-xs font-bold tracking-wider text-[#fda4af]">
                    十重劫狱 · 古神真身档案
                  </h3>
                  <span className="text-[10px] font-mono-num text-[#94a3b8]">
                    当前最高解锁：劫数{meta.highestUnlockedOrder}
                  </span>
                </div>

                {TRIBULATIONS.map((t, idx) => {
                  const unlocked = t.order <= meta.highestUnlockedOrder;
                  const cleared = Boolean(meta.clearedTribulations[t.id]);
                  const clearCount = meta.clearCounts?.[t.id] ?? 0;
                  const bestMs = meta.bestClearTimesMs[t.id];
                  const bestRank =
                    bestMs !== undefined ? evaluateSpeedrunRank(bestMs, t.order).rank : null;
                  const hp = getBossTotalHp(t.id, meta);
                  const dropMeta = RELIC_TIER_META[t.relicDropTier];

                  return (
                    <div
                      key={t.id}
                      className={`rounded-lg p-2.5 border space-y-1.5 ${
                        cleared
                          ? 'bg-[#171a29] border-[#fbbf24]/40'
                          : unlocked
                            ? 'bg-[#171a29] border-[#2e3552]'
                            : 'bg-[#111421] border-white/8 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-display text-[13px] font-black text-[#f4f1ea]">
                              {t.name}
                              {t.id === 'tier_10' && meta.ngPlusCount > 0
                                ? ` +${meta.ngPlusCount}`
                                : ''}
                            </span>
                            <span className="text-[11px] font-semibold text-[#fda4af]">
                              · {t.bossTitle}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`font-mono-num text-[10px] font-bold shrink-0 whitespace-nowrap ${
                            cleared
                              ? 'text-[#34d399]'
                              : unlocked
                                ? 'text-[#38bdf8]'
                                : 'text-[#64748b]'
                          }`}
                        >
                          {cleared ? `已讨伐 (${clearCount}次)` : unlocked ? '已现世' : '未破禁'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[10.5px] font-mono-num text-[#cbd5e1]">
                        <span>总血量 {formatNumber(hp, settings.numberMode)}</span>
                        <span className="text-[#475569]">·</span>
                        <span className="text-[#c084fc]">基础 {t.baseCrystalReward.toLocaleString()} 神晶</span>
                        <span className="text-[#475569]">·</span>
                        <span className={`font-semibold ${dropMeta.colorClass}`}>
                          掉落 [{dropMeta.label}]×{t.relicDropCount}
                        </span>
                        <span className="text-[#475569]">·</span>
                        <span className="text-[#94a3b8]">推荐 {t.recommendedLv}</span>
                      </div>

                      <p className="text-[11px] text-[#e2e8f0] leading-snug">
                        <span className="text-[#94a3b8]">劫狱法则：</span>
                        {t.debuffSummary}
                      </p>
                      <p className="text-[10.5px] text-[#94a3b8] leading-snug">
                        <span className="text-[#fde68a]">首通/掉落：</span>
                        <RichLoreText text={t.firstClearSummary} />
                      </p>

                      {idx > 0 && !unlocked && (
                        <div className="text-[10px] font-mono-num text-[#fda4af]">
                          破禁要求：前劫通关 {t.unlockReqPrevClears} 次 · 遗物总阶 {t.unlockReqRelicLevels} 级
                        </div>
                      )}

                      {bestMs !== undefined && (
                        <div className="text-[10.5px] font-mono-num text-[#fbbf24]">
                          最佳速通：{formatTimeMs(bestMs)} · 评级 {bestRank}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 10 Shells Breakdown */}
              <div className="space-y-1.5 pt-1">
                <h3 className="font-display text-xs font-bold tracking-wider text-[#7dd3fc] px-0.5">
                  十重通用躯壳结构与破壳掉落
                </h3>
                <div className="rounded-lg bg-[#101322] border border-[#2e3552] divide-y divide-white/8">
                  {BOSS_SHELLS.map((sh) => (
                    <div key={sh.phase} className="px-2.5 py-2 space-y-0.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-[#f1f5f9]">{sh.name}</span>
                        <span className="font-mono-num text-[#94a3b8] shrink-0">
                          占总血 {(sh.hpShare * 100).toFixed(sh.hpShare < 0.001 ? 2 : 1)}% ·{' '}
                          <span className="text-[#fbbf24]">+{sh.baseAffixStones} 词缀石</span>
                        </span>
                      </div>
                      {sh.firstBreakNote && (
                        <p className="text-[10px] text-[#6ee7b7]">
                          首破馈赠：<RichLoreText text={sh.firstBreakNote} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 2. AFFIXES ==================== */}
          {category === 'affix' && (
            <div className="space-y-2.5">
              {/* Affix Roll Probability Disclosure */}
              <div className="rounded-lg bg-[#101322] border border-[#2e3552] p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-display font-bold text-[#fef08a]">
                    道纹五阶品质与洗练概率
                  </span>
                  <span className="font-mono-num text-[10px] text-[#94a3b8]">
                    每 10 次必保底极品/仙品
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-center">
                  {affixRates.map((r) => (
                    <div
                      key={r.tier}
                      className={`rounded border px-1 py-1.5 bg-[#151827] ${r.meta.borderClass}`}
                    >
                      <div className={`text-[10.5px] font-bold ${r.meta.colorClass}`}>
                        {r.meta.label}
                      </div>
                      <div className="font-mono-num text-[10px] font-bold text-[#f1f5f9] mt-0.5">
                        {r.effectivePct.toFixed(1)}%
                      </div>
                      <div className="font-mono-num text-[9px] text-[#64748b]">
                        倍率 ×{r.meta.mult.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>
                {luckLv > 0 && (
                  <p className="text-[10px] text-[#c084fc]">
                    当前已受【七彩神石 Lv.{luckLv}】加成（极品/仙品权重 +{luckLv * 6}%）
                  </p>
                )}
              </div>

              {/* Search + SubFilter */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={affixQuery}
                    onChange={(e) => setAffixQuery(e.target.value)}
                    placeholder="搜索词缀名称或效果关键词..."
                    className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-lg bg-[#0d101b] border border-[#2e3552] text-[13px] text-[#f1f5f9] placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-[#101322] border border-[#2e3552] rounded-lg">
                  {(
                    [
                      ['all', '全部(38)'],
                      ['下等', '下等(12)'],
                      ['中等', '中等(12)'],
                      ['上等', '上等(14)'],
                      ['innate', '本命(10)'],
                    ] as [AffixSubFilter, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAffixFilter(key)}
                      className={`min-h-[38px] px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                        affixFilter === key
                          ? 'bg-[#252b44] text-white border border-[#38bdf8]/40'
                          : 'text-[#94a3b8] hover:text-white border border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Affix Entries */}
              {affixFilter !== 'innate' ? (
                <div className="space-y-1.5">
                  {filteredLevelAffixes.map((a) => {
                    const maxVal = a.baseValue * 7;
                    const fmt = (v: number) =>
                      a.unitKind === 'sec' || a.unitKind === 'rate'
                        ? v.toFixed(2)
                        : v >= 10 || Math.abs(v - Math.round(v)) < 0.05
                          ? `${Math.round(v)}`
                          : v.toFixed(1);
                    const rangeText = `${fmt(a.baseValue)}~${fmt(maxVal)}`;
                    const groupColor =
                      a.tierGroup === '上等'
                        ? 'text-[#fbbf24]'
                        : a.tierGroup === '中等'
                          ? 'text-[#c084fc]'
                          : 'text-[#38bdf8]';

                    return (
                      <div
                        key={a.id}
                        className="rounded-lg bg-[#171a29] border border-[#2e3552] p-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#f4f1ea]">{a.name}</span>
                          <span className={`text-[10px] font-semibold ${groupColor}`}>
                            {a.tierGroup}池 · 凡~仙 [{rangeText}]
                          </span>
                        </div>
                        <p className="text-[11px] text-[#cbd5e1] leading-snug">
                          {a.description.replace('{val}', `[${rangeText}]`)}
                        </p>
                      </div>
                    );
                  })}
                  {filteredLevelAffixes.length === 0 && (
                    <p className="text-center text-xs text-[#64748b] py-6">
                      未找到匹配的等级道纹词缀
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredInnateAffixes.map((sp) => (
                    <div
                      key={sp.id}
                      className="rounded-lg bg-[#171a29] border border-[#fbbf24]/45 p-2.5 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#fbbf24]">{sp.name}</span>
                        {sp.recommendedFor && (
                          <span className="text-[10px] text-[#7dd3fc]">{sp.recommendedFor}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#e2e8f0] leading-snug">{sp.description}</p>
                    </div>
                  ))}
                  {filteredInnateAffixes.length === 0 && (
                    <p className="text-center text-xs text-[#64748b] py-6">
                      未找到匹配的先天本命神通
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. RELICS (MASKED IF UNOWNED) ==================== */}
          {category === 'relic' && (
            <div className="space-y-2.5">
              {/* 6 Quality Tiers + Tribulation Drop Mapping */}
              <div className="rounded-lg bg-[#101322] border border-[#2e3552] p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-display font-bold text-[#f4f1ea]">
                    遗物六品阶与劫数掉落分布
                  </span>
                  <span className="font-mono-num text-[10px] text-[#c084fc]">
                    {totalRelicsOwned}/{RELICS.length} 解封 · 总阶 Lv.{totalRelicLevels}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {relicDropOverview.map((d) => (
                    <div
                      key={d.tier}
                      className={`rounded border px-2 py-1.5 bg-[#151827] ${d.meta.borderClass}`}
                    >
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className={`font-bold ${d.meta.colorClass}`}>
                          {d.meta.label}({d.meta.colorName})
                        </span>
                        <span className="font-mono-num text-[#94a3b8]">
                          {d.ownedCount}/{d.totalCount}
                        </span>
                      </div>
                      <div className="font-mono-num text-[10px] text-[#e2e8f0] mt-0.5">
                        {d.tribRangeLabel}
                      </div>
                      <div
                        className={`text-[9.5px] mt-0.5 ${
                          d.unlocked ? 'text-[#34d399]' : 'text-[#64748b]'
                        }`}
                      >
                        {d.unlocked ? '已解封掉落' : `需解锁劫${d.unlockOrder}`}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  秘藏双轨法则：未通过对应劫数掉落获得的遗物保持封印状态。遗物总等级 = 神晶升阶 + 劫印掉落（默认无限叠加；少数特殊机制遗物设劫印上限，满后自动转为对应品阶神晶）。
                </p>
              </div>

              {/* Tier Filter Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-[#101322] border border-[#2e3552] rounded-lg">
                <button
                  type="button"
                  onClick={() => setRelicFilter('all')}
                  className={`min-h-[40px] px-3.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                    relicFilter === 'all'
                      ? 'bg-[#252b44] text-white border border-[#c084fc]/40'
                      : 'text-[#94a3b8] hover:text-white border border-transparent'
                  }`}
                >
                  全部
                </button>
                {RELIC_TIER_ORDER.map((tier) => {
                  const tMeta = RELIC_TIER_META[tier];
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setRelicFilter(tier)}
                      className={`min-h-[40px] px-3.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                        relicFilter === tier
                          ? `bg-[#252b44] ${tMeta.colorClass} font-bold border ${tMeta.borderClass}`
                          : 'text-[#94a3b8] hover:text-white border border-transparent'
                      }`}
                    >
                      {tMeta.shortLabel}
                    </button>
                  );
                })}
              </div>

              {/* Masked / Revealed Relic Entries */}
              <div className="space-y-2">
                {filteredRelics.map((r) => {
                  const bd = getRelicLevelsBreakdown(meta, r.id);
                  const tMeta = RELIC_TIER_META[r.tier];

                  if (!bd.owned) {
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl p-3 border border-white/10 bg-[#121523] flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <EyeOff className="w-4 h-4 text-[#64748b] shrink-0" />
                            <span className={`text-[13px] font-bold ${tMeta.colorClass} opacity-80`}>
                              [{tMeta.label}] ？？？
                            </span>
                            <span className="text-[11px] text-[#64748b]">未收录</span>
                          </div>
                          <p className="text-[11.5px] text-[#64748b] mt-1">
                            需通过【{tMeta.dropHint}】先获得一次，方可解锁图鉴真容与属性详情。
                          </p>
                        </div>
                        <Lock className="w-4 h-4 text-[#475569] shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl p-3 border bg-[#171a29] ${tMeta.borderClass} space-y-1.5`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[13px] font-bold ${tMeta.colorClass}`}>
                          [{tMeta.label}] {r.name}
                        </span>
                        <span className="font-mono-num text-xs font-bold text-[#f1f5f9]">
                          总 Lv.{bd.totalLv}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono-num">
                        <span className="text-[#c084fc]">
                          神晶 Lv.{bd.crystalLv}
                          {r.maxLevel !== null ? `/${r.maxLevel}` : ' (无限)'}
                        </span>
                        <span className="text-[#475569]">+</span>
                        <span className="text-[#fbbf24]">
                          劫印 Lv.{bd.dropLv}
                          {r.maxDropLevel !== null ? `/${r.maxDropLevel}` : ' (无限)'}
                        </span>
                        {r.maxDropLevel !== null && (
                          <span className="text-[#34d399]">
                            · 满劫印转 +{tMeta.overflowBaseCrystals.toLocaleString()}+神晶
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed">{r.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== 4. MERCENARIES & SYNERGY BUILDS ==================== */}
          {category === 'merc' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="font-display text-xs font-bold tracking-wider text-[#7dd3fc] px-0.5">
                  五大本命护法档案
                </h3>
                {ARCHETYPE_LIST.map((arch, idx) => {
                  const slot = mercs[idx];
                  const unlocked = Boolean(slot?.unlocked);
                  const theme = MERC_TYPOGRAPHY[arch.id];
                  const cost = MERC_SLOT_CRYSTAL_COSTS[idx];

                  return (
                    <div
                      key={arch.id}
                      className={`rounded-lg border p-2.5 space-y-1.5 bg-[#171a29] ${theme.cardBorderClass}`}
                      style={{ backgroundImage: theme.radialBgStyle }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ArchetypeIcon archetype={arch.id} className="w-5 h-5 shrink-0" />
                          <span className={`text-[13px] truncate ${theme.nameClass}`}>
                            {idx + 1}号 · {arch.name}
                          </span>
                          <span className={`text-[10.5px] ${theme.roleClass}`}>{arch.roleTag}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono-num font-bold shrink-0 ${
                            unlocked ? 'text-[#34d399]' : 'text-[#c084fc]'
                          }`}
                        >
                          {unlocked
                            ? '已觉醒'
                            : idx === 0
                              ? '首破2重躯壳开'
                              : `${cost.toLocaleString()} 神晶解锁`}
                        </span>
                      </div>

                      <div className="text-[10.5px] font-mono-num text-[#94a3b8]">
                        基础间隔 {arch.baseInterval.toFixed(1)}s · 战力系数 {arch.dmgFactor}x · 暴击{' '}
                        {Math.round(arch.baseCritRate * 100)}% / {Math.round(arch.baseCritDmg * 100)}%
                      </div>

                      <div className="text-[11px] text-[#cbd5e1] space-y-0.5 leading-snug">
                        <div>
                          <span className="text-[#7dd3fc] font-semibold">
                            天赋① {arch.talent1Name}：
                          </span>
                          {arch.talent1Desc}
                        </div>
                        <div>
                          <span className="text-[#7dd3fc] font-semibold">
                            天赋② {arch.talent2Name}：
                          </span>
                          {arch.talent2Desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 10 Slot Thresholds */}
              <div className="rounded-lg bg-[#101322] border border-[#2e3552] p-2.5 space-y-1.5">
                <div className="text-xs font-bold text-[#fde68a]">十重道纹里程碑节点</div>
                <p className="text-[11px] text-[#cbd5e1]">
                  有效等级达到以下节点将永久开启对应词缀槽，且本局每跨过 1 个节点使该护法最终伤害{' '}
                  <span className="text-[#fbbf24] font-bold">×2 倍</span>（第 10 槽另赠 +50 神晶）：
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px] font-mono-num text-[#94a3b8]">
                  {LEVEL_SLOT_THRESHOLDS.map((lv, i) => (
                    <div key={lv} className="bg-[#151827] rounded px-2 py-1 flex justify-between">
                      <span>{LEVEL_SLOT_NAMES[i]}</span>
                      <span className="text-[#7dd3fc]">Lv.{lv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Endgame Synergies */}
              <div className="space-y-1.5">
                <h3 className="font-display text-xs font-bold tracking-wider text-[#fbbf24] px-0.5 inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>终局三大核心联动流派</span>
                </h3>
                <div className="rounded-lg bg-[#101322] border border-[#06b6d4]/35 p-2.5 text-[11px] text-[#cbd5e1] leading-relaxed">
                  <div className="font-bold text-[#e0f2fe] mb-0.5">1. 高频毒爆流</div>
                  <RichLoreText text="给【青冥剑侍】洗【万毒催熟】+【残影连击】/★【万剑归宗】，高频多段斩击引爆【深渊触母】指数腐蚀毒。" />
                </div>
                <div className="rounded-lg bg-[#101322] border border-[#f59e0b]/35 p-2.5 text-[11px] text-[#cbd5e1] leading-relaxed">
                  <div className="font-bold text-[#fef08a] mb-0.5">2. 无限核弹流</div>
                  <RichLoreText text="剑侍与主角攻击每 15 次缩减【雷火机神】1 秒冷却，搭配【雷火装填】与★【歼星连射】实现核弹加特林。" />
                </div>
                <div className="rounded-lg bg-[#101322] border border-[#f43f5e]/35 p-2.5 text-[11px] text-[#cbd5e1] leading-relaxed">
                  <div className="font-bold text-[#fecdd3] mb-0.5">3. 千级登神流</div>
                  <RichLoreText text="搭配【缩资减耗】与★【天道酬勤】速冲 Lv.1000，触发【混沌古神嗣】全队总有效级指数倍增与★【千级共鸣】。" />
                </div>
              </div>
            </div>
          )}

          {/* ==================== 5. CULTIVATION CODEX / MISC RULES ==================== */}
          {category === 'rules' && (
            <div className="space-y-3">
              {/* Realms */}
              <div className="rounded-lg bg-[#171a29] border border-[#c084fc]/40 p-2.5 space-y-1.5">
                <div className="font-display text-xs font-bold text-[#e9d5ff]">
                  肉身境界突破录
                </div>
                <div className="space-y-1 text-[11px]">
                  {REALM_TIERS.map((r) => (
                    <div
                      key={r.level}
                      className="flex items-center justify-between gap-2 bg-[#101322] rounded px-2 py-1.5"
                    >
                      <div>
                        <span className="font-bold text-[#f4f1ea]">{r.name}</span>
                        <span className="text-[10px] text-[#94a3b8] ml-1.5">({r.rewardNote})</span>
                      </div>
                      <span className="font-mono-num text-[10.5px] text-[#c084fc] shrink-0">
                        ×{r.multiplier}
                      </span>
                    </div>
                  ))}
                  <div className="text-[10.5px] text-[#94a3b8] pt-0.5">
                    化神之后可无限突破【古神道躯·N重】，每次灵石需求 ×200，主角全伤永久额外 ×4。
                  </div>
                </div>
              </div>

              {/* 4 Active Skills */}
              <div className="rounded-lg bg-[#171a29] border border-[#2e3552] p-2.5 space-y-1.5">
                <div className="font-display text-xs font-bold text-[#7dd3fc] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>主角四大禁忌神通</span>
                </div>
                <div className="space-y-1.5">
                  {SKILLS.map((sk) => {
                    const reqRealm = REALM_TIERS.find((r) => r.level === sk.unlockRealm);
                    return (
                      <div key={sk.id} className="bg-[#101322] rounded p-2 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#f4f1ea]">{sk.name}</span>
                          <span className="font-mono-num text-[10px] text-[#38bdf8]">
                            {reqRealm?.name}开 · {sk.manaCost}蓝 · {sk.baseCooldown}s CD
                          </span>
                        </div>
                        <p className="text-[#cbd5e1]">{sk.shortDesc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Speedrun & Economy Laws */}
              <div className="rounded-lg bg-[#171a29] border border-[#2e3552] p-2.5 space-y-2 text-[11px] text-[#cbd5e1]">
                <div className="font-display text-xs font-bold text-[#fbbf24]">
                  速通评级 · 轮回与灵石法则
                </div>
                <div className="bg-[#101322] rounded p-2 space-y-1 font-mono-num text-[10.5px]">
                  <div className="flex justify-between">
                    <span className="text-[#fbbf24] font-bold">SSS (&lt; 15秒)</span>
                    <span>神晶 ×6.0 · 解锁自动连刷 · 劫9~10额外 +1 掉落</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#c084fc]">S (&lt; 3分)</span>
                    <span>神晶 ×3.5 · 劫9~10额外 +1 遗物掉落</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#38bdf8]">A (&lt; 10分)</span>
                    <span>神晶 ×2.0 结算神晶倍率</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#34d399]">B (&lt; 30分)</span>
                    <span>神晶 ×1.5 结算神晶倍率</span>
                  </div>
                  <div className="flex justify-between text-[#94a3b8]">
                    <span>C (≥ 30分)</span>
                    <span>神晶 ×1.0 基础奖励</span>
                  </div>
                </div>

                <ul className="space-y-1 text-[10.5px] text-[#cbd5e1] leading-relaxed">
                  <li>
                    · <span className="text-[#fde68a] font-semibold">灵石阶段衰减</span>：第 1~3
                    重躯壳 100% 转化，4~6 重 60%，7~8 重 30%，9~10 重仅 10%。
                  </li>
                  <li>
                    · <span className="text-[#6ee7b7] font-semibold">心魔瓶颈与傀儡</span>：累计修为达单次成长
                    500 倍时触发心魔瓶颈（点击成长降至 20%）；机关傀儡每次自动叩击享 25% 顿悟成长。
                  </li>
                  <li>
                    · <span className="text-[#fda4af] font-semibold">真神轮回 (NG+)</span>：每次击败终焉劫(劫十)，使
                    NG+ 计数 +1：劫十古神血量 ×1e4，神晶奖励 ×2，且额外 +1 件神阶遗物掉落（上限+3）。
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
