import type { MetaState, RelicConfig, RelicId, RelicTier } from '../types/game';

export interface RelicTierMeta {
  label: string;
  shortLabel: string;
  colorName: string;
  order: number;
  baseWeight: number;
  overflowBaseCrystals: number;
  colorClass: string;
  borderClass: string;
  badgeBgClass: string;
  dropHint: string;
}

export const RELIC_TIER_META: Record<RelicTier, RelicTierMeta> = {
  common: {
    label: '凡阶',
    shortLabel: '凡',
    colorName: '白色',
    order: 1,
    baseWeight: 40,
    overflowBaseCrystals: 12,
    colorClass: 'text-[#e2e8f0]',
    borderClass: 'border-white/25',
    badgeBgClass: 'bg-[#1a1f32]',
    dropHint: '劫1~2通关掉落',
  },
  rare: {
    label: '灵阶',
    shortLabel: '灵',
    colorName: '绿色',
    order: 2,
    baseWeight: 28,
    overflowBaseCrystals: 75,
    colorClass: 'text-[#34d399]',
    borderClass: 'border-[#10b981]/50',
    badgeBgClass: 'bg-[#064e3b]/28',
    dropHint: '劫3~4通关掉落',
  },
  mystic: {
    label: '玄阶',
    shortLabel: '玄',
    colorClass: 'text-[#38bdf8]',
    colorName: '蓝色',
    order: 3,
    baseWeight: 18,
    overflowBaseCrystals: 500,
    borderClass: 'border-[#0284c7]/55',
    badgeBgClass: 'bg-[#0c4a6e]/32',
    dropHint: '劫5~6通关掉落',
  },
  saint: {
    label: '圣阶',
    shortLabel: '圣',
    colorName: '紫色',
    order: 4,
    baseWeight: 10,
    overflowBaseCrystals: 2500,
    colorClass: 'text-[#c084fc]',
    borderClass: 'border-[#9333ea]/60',
    badgeBgClass: 'bg-[#4c1d95]/28',
    dropHint: '劫7~8通关掉落',
  },
  epic: {
    label: '仙阶',
    shortLabel: '仙',
    colorName: '金色',
    order: 5,
    baseWeight: 4,
    overflowBaseCrystals: 18000,
    colorClass: 'text-[#fbbf24]',
    borderClass: 'border-[#f59e0b]/70',
    badgeBgClass: 'bg-[#78350f]/28',
    dropHint: '劫9通关掉落',
  },
  mythic: {
    label: '神阶·古神',
    shortLabel: '神',
    colorName: '红色',
    order: 6,
    baseWeight: 0,
    overflowBaseCrystals: 100000,
    colorClass: 'text-[#fb7185]',
    borderClass: 'border-[#f43f5e]/65',
    badgeBgClass: 'bg-[#881337]/30',
    dropHint: '终焉劫通关掉落',
  },
};

export const RELIC_TIER_ORDER: RelicTier[] = [
  'common',
  'rare',
  'mystic',
  'saint',
  'epic',
  'mythic',
];

export const RELICS: RelicConfig[] = [
  // 6 凡阶 (白色) - 劫数 1~2 专属掉落
  {
    id: 'rel_c_click_flat',
    tier: 'common',
    name: '凡铁护腕',
    maxLevel: 50,
    maxDropLevel: null,
    baseCost: 8,
    costGrowth: 1.24,
    description: '主角每次点击的基础成长值额外 +(2 × 总等级)。',
  },
  {
    id: 'rel_c_click_mult',
    tier: 'common',
    name: '碎星拳套',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 10,
    costGrowth: 1.24,
    description: '主角点击最终伤害 +(25% × 总等级)。',
  },
  {
    id: 'rel_c_stone_gain',
    tier: 'common',
    name: '聚财铜钱',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 10,
    costGrowth: 1.24,
    description: '全队造成伤害转化为灵石的基础比例 +(15% × 总等级)。',
  },
  {
    id: 'rel_c_cost_down',
    tier: 'common',
    name: '聚灵玉佩',
    maxLevel: 40,
    maxDropLevel: 20,
    baseCost: 15,
    costGrowth: 1.3,
    description: '局内升级灵石成本降低 1.5% × 总等级（特限劫印≤20，合计最高减耗 90%）。',
  },
  {
    id: 'rel_c_mana_cap',
    tier: 'common',
    name: '清心木鱼',
    maxLevel: 25,
    maxDropLevel: null,
    baseCost: 12,
    costGrowth: 1.26,
    description: '主角道力容量上限 +(4 × 总等级)。',
  },
  {
    id: 'rel_c_mana_click',
    tier: 'common',
    name: '引灵指环',
    maxLevel: 20,
    maxDropLevel: null,
    baseCost: 15,
    costGrowth: 1.3,
    description: '主角每次手动点击恢复的道力额外 +(0.05 × 总等级)。',
  },

  // 6 灵阶 (绿色) - 劫数 3~4 解锁掉落
  {
    id: 'rel_c_puppet_spd',
    tier: 'rare',
    name: '机关发条',
    maxLevel: 30,
    maxDropLevel: null,
    baseCost: 25,
    costGrowth: 1.28,
    description: '机关傀儡基础点击频率额外 +(0.2 × 总等级) 次/秒。',
  },
  {
    id: 'rel_c_start_gold',
    tier: 'rare',
    name: '先天灵根',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 30,
    costGrowth: 1.32,
    description: '开局初始灵石：500 × (3 ^ 神晶级) × (1 + 0.5 × 劫印级)。',
  },
  {
    id: 'rel_r_sword_dmg',
    tier: 'rare',
    name: '万剑古匣',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 28,
    costGrowth: 1.26,
    description: '1号位【青冥剑侍】最终伤害 +(40% × 总等级)。',
  },
  {
    id: 'rel_r_tentacle',
    tier: 'rare',
    name: '深渊肉块',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 28,
    costGrowth: 1.26,
    description: '2号位【深渊触母】直伤与每秒毒伤 +(40% × 总等级)。',
  },
  {
    id: 'rel_r_cannon_dmg',
    tier: 'rare',
    name: '雷霆核心',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 32,
    costGrowth: 1.26,
    description: '3号位【雷火机神】最终伤害 +(55% × 总等级)。',
  },
  {
    id: 'rel_r_thunder',
    tier: 'rare',
    name: '雷帝印记',
    maxLevel: 50,
    maxDropLevel: null,
    baseCost: 35,
    costGrowth: 1.28,
    description: '【天罚神雷】爆发伤害额外 ×(1 + 0.15 × 总等级)。',
  },

  // 5 玄阶 (蓝色) - 劫数 5~6 解锁掉落
  {
    id: 'rel_r_array_buff',
    tier: 'mystic',
    name: '乾坤阵图',
    maxLevel: 50,
    maxDropLevel: null,
    baseCost: 120,
    costGrowth: 1.32,
    description: '4号位【天机阵尊】1~3号位伤害光环与灵石加成 ×(1 + 0.08 × 总等级)。',
  },
  {
    id: 'rel_r_skill_cd',
    tier: 'mystic',
    name: '缩地符箓',
    maxLevel: 25,
    maxDropLevel: 25,
    baseCost: 150,
    costGrowth: 1.35,
    description: '主角 4 大主动神通冷却缩短 1.6% × 总等级（特限劫印≤25，合计至多 -80%）。',
  },
  {
    id: 'rel_r_skill_dur',
    tier: 'mystic',
    name: '驻时香炉',
    maxLevel: 20,
    maxDropLevel: 20,
    baseCost: 150,
    costGrowth: 1.35,
    description: '【燃血叩击】【万法残影】【弑神共鸣】持续延长 0.5秒 × 总等级（特限劫印≤20）。',
  },
  {
    id: 'rel_r_crit_dmg',
    tier: 'mystic',
    name: '戮仙凶刃',
    maxLevel: 80,
    maxDropLevel: null,
    baseCost: 110,
    costGrowth: 1.28,
    description: '主角与全队护法（含毒伤暴击）基础暴击伤害 +(15% × 总等级)。',
  },
  {
    id: 'rel_r_boss_hp',
    tier: 'mystic',
    name: '镇魂古钟',
    maxLevel: 30,
    maxDropLevel: 30,
    baseCost: 180,
    costGrowth: 1.38,
    description: '所有难度下 BOSS 总血量开局削减 1.5% × 总等级（特限劫印≤30，合计至多 -90%）。',
  },

  // 4 圣阶 (紫色) - 劫数 7~8 解锁掉落
  {
    id: 'rel_r_essence',
    tier: 'saint',
    name: '贪婪触须',
    maxLevel: 50,
    maxDropLevel: null,
    baseCost: 600,
    costGrowth: 1.35,
    description: '击破躯壳时额外掉词缀石期待 +(4% × 总等级，每满100%必多掉1颗)。',
  },
  {
    id: 'rel_e_free_roll',
    tier: 'saint',
    name: '命运骰子',
    maxLevel: 10,
    maxDropLevel: 6,
    baseCost: 1200,
    costGrowth: 1.9,
    description: '洗练词缀或本命神通有 5% × 总等级 概率免材料（特限劫印≤6，最高 80%）。',
  },
  {
    id: 'rel_e_affix_luck',
    tier: 'saint',
    name: '七彩神石',
    maxLevel: 40,
    maxDropLevel: null,
    baseCost: 800,
    costGrowth: 1.38,
    description: '洗练等级词缀时，极品(紫)与仙品(金)基础权重提升 6% × 总等级。',
  },
  {
    id: 'rel_e_dot_crit',
    tier: 'saint',
    name: '腐化之眼',
    maxLevel: 10,
    maxDropLevel: null,
    baseCost: 1500,
    costGrowth: 2.0,
    description: '允许 2 号位毒伤暴击（30%+4%×总级暴率上限100%，200%+40%×总级爆伤）。',
  },

  // 4 仙阶 (金色) - 劫数 9 解锁掉落
  {
    id: 'rel_e_auto_start',
    tier: 'epic',
    name: '逆时沙漏',
    maxLevel: 10,
    maxDropLevel: 10,
    baseCost: 3500,
    costGrowth: 1.9,
    description: '开局赠 5×总等级 级傀儡（上限100）与 1000×(2^神晶级)×(1+0.5×劫印级) 修为（劫印≤10）。',
  },
  {
    id: 'rel_e_boss_skip',
    tier: 'epic',
    name: '破界断剑',
    maxLevel: 10,
    maxDropLevel: 20,
    baseCost: 4000,
    costGrowth: 2.1,
    description: '击破第 1~8 重躯壳时有 2.5% × 总等级 概率连跳两重并双倍词缀石（特限劫印≤20）。',
  },
  {
    id: 'rel_e_inf_dmg',
    tier: 'epic',
    name: '弑神道果',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 2000,
    costGrowth: 1.26,
    description: '全队最终总伤害额外 ×(1.12 ^ 神晶级) × (1.02 ^ 劫印级)。',
  },
  {
    id: 'rel_e_inf_crystal',
    tier: 'epic',
    name: '源初神格',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 2500,
    costGrowth: 1.32,
    description: '通关结算获得的【神晶】数量额外 +(18% × 总等级)。',
  },

  // 5 神阶·古神 (红色) - 终焉劫(劫10)唯一掉落
  {
    id: 'rel_m_first_affix',
    tier: 'mythic',
    name: '古神之瞳',
    maxLevel: 10,
    maxDropLevel: null,
    baseCost: 15000,
    costGrowth: 2.4,
    description: '全队前 4 个等级词缀槽 (Lv.10~Lv.100) 数值效果 ×(1 + 0.25 × 总等级)。',
  },
  {
    id: 'rel_m_auto_skill',
    tier: 'mythic',
    name: '万法道胎',
    maxLevel: 5,
    maxDropLevel: null,
    baseCost: 30000,
    costGrowth: 3.0,
    description: '4 大主动神通冷却完毕无蓝耗自动释放，且效果 ×(1 + 0.2 × 总等级)。',
  },
  {
    id: 'rel_m_omni_base',
    tier: 'mythic',
    name: '混沌母体',
    maxLevel: 10,
    maxDropLevel: null,
    baseCost: 20000,
    costGrowth: 2.4,
    description: '每解锁 1 位本命护法，全队最终总伤害额外 ×(1 + 0.20 × 总等级)。',
  },
  {
    id: 'rel_m_click_echo',
    tier: 'mythic',
    name: '岁月史书',
    maxLevel: 10,
    maxDropLevel: 10,
    baseCost: 18000,
    costGrowth: 2.3,
    description: '主角点击修为 10% × 总等级 永久同步至佣兵基础面板（特限劫印≤10，上限200%）。',
  },
  {
    id: 'rel_m_final_mult',
    tier: 'mythic',
    name: '不可名状之核',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 12000,
    costGrowth: 1.4,
    description: '真神乘区：全队最终伤害复利 ×(1.5 ^ 神晶级) × (1.06 ^ 劫印级)。',
  },
];

export const RELIC_MAP: Record<RelicId, RelicConfig> = RELICS.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RelicId, RelicConfig>
);

export const RELIC_GACHA_TIERS: RelicTier[] = ['common', 'rare', 'mystic', 'saint', 'epic'];

export function getRelicLevelsBreakdown(meta: MetaState, relicId: RelicId) {
  const crystalLv = meta.relicLevels[relicId] ?? 0;
  const dropLv = meta.relicDropLevels?.[relicId] ?? 0;
  const totalLv = crystalLv + dropLv;
  return {
    crystalLv,
    dropLv,
    totalLv,
    owned: totalLv > 0,
  };
}

export interface RelicDropRuleInfo {
  tier: RelicTier;
  meta: RelicTierMeta;
  tribRangeLabel: string;
  unlockOrder: number;
  ownedCount: number;
  totalCount: number;
  unlocked: boolean;
}

export function getRelicDropOverview(meta: MetaState): RelicDropRuleInfo[] {
  const specs: Record<RelicTier, { tribRangeLabel: string; unlockOrder: number }> = {
    common: { tribRangeLabel: '劫数一 ~ 劫数二', unlockOrder: 1 },
    rare: { tribRangeLabel: '劫数三 ~ 劫数四', unlockOrder: 3 },
    mystic: { tribRangeLabel: '劫数五 ~ 劫数六', unlockOrder: 5 },
    saint: { tribRangeLabel: '劫数七 ~ 劫数八', unlockOrder: 7 },
    epic: { tribRangeLabel: '劫数九', unlockOrder: 9 },
    mythic: { tribRangeLabel: '终焉劫 (劫十)', unlockOrder: 10 },
  };

  return RELIC_TIER_ORDER.map((tier) => {
    const items = RELICS.filter((r) => r.tier === tier);
    const ownedCount = items.filter((r) => getRelicLevelsBreakdown(meta, r.id).owned).length;
    const spec = specs[tier];
    return {
      tier,
      meta: RELIC_TIER_META[tier],
      tribRangeLabel: spec.tribRangeLabel,
      unlockOrder: spec.unlockOrder,
      ownedCount,
      totalCount: items.length,
      unlocked: meta.highestUnlockedOrder >= spec.unlockOrder || ownedCount > 0,
    };
  });
}
