import type { MetaState, RelicConfig, RelicId, RelicTier, TribulationId } from '../types/game';
import { TRIBULATION_MAP } from './bosses';

export interface RelicTierMeta {
  label: string;
  shortLabel: string;
  colorName: string;
  order: number;
  baseWeight: number;
  overflowBaseCrystals: number;
  colorClass: string;
  fontClass: string;
  borderClass: string;
  badgeBgClass: string;
  dropHint: string;
}

export const RELIC_TIER_META: Record<RelicTier, RelicTierMeta> = {
  common: {
    label: '凡',
    shortLabel: '凡',
    colorName: '素白',
    order: 1,
    baseWeight: 40,
    overflowBaseCrystals: 12,
    colorClass: 'text-[#e2e8f0]',
    fontClass: 'font-tier-common',
    borderClass: 'border-white/25',
    badgeBgClass: 'bg-[#1a1f32]',
    dropHint: '劫1~10掉落',
  },
  rare: {
    label: '灵',
    shortLabel: '灵',
    colorName: '翠绿',
    order: 2,
    baseWeight: 28,
    overflowBaseCrystals: 75,
    colorClass: 'text-[#34d399]',
    fontClass: 'font-tier-rare',
    borderClass: 'border-[#10b981]/50',
    badgeBgClass: 'bg-[#064e3b]/28',
    dropHint: '劫2~10掉落',
  },
  mystic: {
    label: '玄',
    shortLabel: '玄',
    colorName: '幽蓝',
    order: 3,
    baseWeight: 18,
    overflowBaseCrystals: 500,
    colorClass: 'text-[#38bdf8]',
    fontClass: 'font-tier-mystic',
    borderClass: 'border-[#0284c7]/55',
    badgeBgClass: 'bg-[#0c4a6e]/32',
    dropHint: '劫3~10掉落',
  },
  saint: {
    label: '圣',
    shortLabel: '圣',
    colorName: '玄紫',
    order: 4,
    baseWeight: 10,
    overflowBaseCrystals: 2500,
    colorClass: 'text-[#c084fc]',
    fontClass: 'font-tier-saint',
    borderClass: 'border-[#9333ea]/60',
    badgeBgClass: 'bg-[#4c1d95]/28',
    dropHint: '劫5~10掉落',
  },
  epic: {
    label: '仙',
    shortLabel: '仙',
    colorName: '鎏金',
    order: 5,
    baseWeight: 4,
    overflowBaseCrystals: 18000,
    colorClass: 'text-[#fbbf24]',
    fontClass: 'font-tier-epic',
    borderClass: 'border-[#f59e0b]/70',
    badgeBgClass: 'bg-[#78350f]/28',
    dropHint: '劫7~10掉落',
  },
  mythic: {
    label: '神',
    shortLabel: '神',
    colorName: '猩红',
    order: 6,
    baseWeight: 0,
    overflowBaseCrystals: 100000,
    colorClass: 'text-[#fb7185]',
    fontClass: 'font-tier-mythic',
    borderClass: 'border-[#f43f5e]/65',
    badgeBgClass: 'bg-[#881337]/30',
    dropHint: '仅劫十 1%',
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
  // ==================== 一、凡 (8件) ====================
  {
    id: 'rel_c_click_flat',
    tier: 'common',
    name: '凡铁护腕',
    maxLevel: 60,
    maxDropLevel: null,
    baseCost: 8,
    costGrowth: 1.18,
    description: '主角每次点击的基础成长值额外 +(1.5 × 总等级)。',
  },
  {
    id: 'rel_c_click_mult',
    tier: 'common',
    name: '碎星拳套',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 10,
    costGrowth: 1.18,
    description: '主角点击最终伤害 +(4% × 总等级)。',
  },
  {
    id: 'rel_c_stone_gain',
    tier: 'common',
    name: '聚财铜钱',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 10,
    costGrowth: 1.18,
    description: '全队造成伤害转化为灵石的基础比例 +(4% × 总等级)。',
  },
  {
    id: 'rel_c_cost_down',
    tier: 'common',
    name: '聚灵玉佩',
    maxLevel: 30,
    maxDropLevel: 30,
    baseCost: 15,
    costGrowth: 1.24,
    description: '局内升级灵石成本降低 0.75% × 总等级（特限劫印≤30，合计最高减耗 45%）。',
  },
  {
    id: 'rel_c_mana_cap',
    tier: 'common',
    name: '清心木鱼',
    maxLevel: 30,
    maxDropLevel: null,
    baseCost: 12,
    costGrowth: 1.2,
    description: '主角道力容量上限 +(4 × 总等级)。',
  },
  {
    id: 'rel_c_mana_click',
    tier: 'common',
    name: '引灵指环',
    maxLevel: 25,
    maxDropLevel: null,
    baseCost: 15,
    costGrowth: 1.24,
    description: '主角每次手动点击恢复的道力额外 +(0.05 × 总等级)。',
  },
  {
    id: 'rel_c_merc_atk',
    tier: 'common',
    name: '磨剑石碑',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 12,
    costGrowth: 1.18,
    description: '【护法基础池】全队 1~5 号位护法基础伤害加算 +(3% × 总等级)（与专精遗物同池叠加）。',
  },
  {
    id: 'rel_c_mana_regen',
    tier: 'common',
    name: '吐纳玉简',
    maxLevel: 50,
    maxDropLevel: null,
    baseCost: 14,
    costGrowth: 1.2,
    description: '主角每秒自然恢复的道力额外 +(0.25 × 总等级)。',
  },

  // ==================== 二、灵 (9件) ====================
  {
    id: 'rel_c_puppet_spd',
    tier: 'rare',
    name: '机关发条',
    maxLevel: 40,
    maxDropLevel: null,
    baseCost: 25,
    costGrowth: 1.2,
    description: '机关傀儡基础点击频率额外 +(0.15 × 总等级) 次/秒（超 25次/秒 转攻击力）。',
  },
  {
    id: 'rel_c_start_gold',
    tier: 'rare',
    name: '先天灵根',
    maxLevel: 40,
    maxDropLevel: null,
    baseCost: 30,
    costGrowth: 1.24,
    description: '开局初始灵石：400 × (1.35 ^ 神晶级) × (1 + 0.25 × 劫印级)。',
  },
  {
    id: 'rel_r_sword_dmg',
    tier: 'rare',
    name: '万剑古匣',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 28,
    costGrowth: 1.2,
    description: '【护法基础池】1号位【青冥剑侍】基础池额外加算 +(5% × 总等级)。',
  },
  {
    id: 'rel_r_tentacle',
    tier: 'rare',
    name: '深渊肉块',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 28,
    costGrowth: 1.2,
    description: '【护法基础池】2号位【深渊触母】直伤与每秒毒伤基础池额外加算 +(5% × 总等级)。',
  },
  {
    id: 'rel_r_cannon_dmg',
    tier: 'rare',
    name: '雷霆核心',
    maxLevel: 150,
    maxDropLevel: null,
    baseCost: 32,
    costGrowth: 1.2,
    description: '【护法基础池】3号位【雷火机神】基础池额外加算 +(5% × 总等级)。',
  },
  {
    id: 'rel_r_thunder',
    tier: 'rare',
    name: '雷帝印记',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 35,
    costGrowth: 1.2,
    description: '【天罚神雷】爆发伤害额外 ×(1 + 0.05 × 总等级)。',
  },
  {
    id: 'rel_r_merc_spd',
    tier: 'rare',
    name: '疾风羽靴',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 34,
    costGrowth: 1.2,
    description: '全队 1~5 号位护法基础攻速额外 +(2% × 总等级)（超出 25次/秒(0.04s) 等比例转攻击）。',
  },
  {
    id: 'rel_r_merc_crit',
    tier: 'rare',
    name: '破绽罗盘',
    maxLevel: 50,
    maxDropLevel: 50,
    baseCost: 38,
    costGrowth: 1.22,
    description: '全队护法基础暴击率 +(1.0% × 总等级)，超百溢暴率按 1:2 转为爆伤（特限劫印≤50）。',
  },
  {
    id: 'rel_r_enlight_boost',
    tier: 'rare',
    name: '悟道蒲团',
    maxLevel: 80,
    maxDropLevel: null,
    baseCost: 32,
    costGrowth: 1.2,
    description: '主角每升 1 级【顿悟】，基础点击成长 +(1.5% × 总等级) 并向护法反哺 (4% + 3% × 总等级) 共鸣攻击。',
  },

  // ==================== 三、玄 (8件) ====================
  {
    id: 'rel_r_array_buff',
    tier: 'mystic',
    name: '乾坤阵图',
    maxLevel: 80,
    maxDropLevel: null,
    baseCost: 120,
    costGrowth: 1.22,
    description: '4号位【天机阵尊】1~3号位伤害光环与灵石加成 ×(1 + 0.03 × 总等级)。',
  },
  {
    id: 'rel_r_skill_cd',
    tier: 'mystic',
    name: '缩地符箓',
    maxLevel: 30,
    maxDropLevel: 25,
    baseCost: 150,
    costGrowth: 1.26,
    description: '主角 4 大主动神通冷却缩短 1.2% × 总等级（特限劫印≤25，合计至多 -75%）。',
  },
  {
    id: 'rel_r_skill_dur',
    tier: 'mystic',
    name: '驻时香炉',
    maxLevel: 25,
    maxDropLevel: 25,
    baseCost: 150,
    costGrowth: 1.26,
    description: '【燃血叩击】【万法残影】【弑神共鸣】持续延长 0.3秒 × 总等级（特限劫印≤25）。',
  },
  {
    id: 'rel_r_crit_dmg',
    tier: 'mystic',
    name: '戮仙凶刃',
    maxLevel: 120,
    maxDropLevel: null,
    baseCost: 110,
    costGrowth: 1.22,
    description: '主角与全队护法（含毒伤暴击）基础暴击伤害 +(4% × 总等级)。',
  },
  {
    id: 'rel_r_boss_hp',
    tier: 'mystic',
    name: '镇魂古钟',
    maxLevel: 30,
    maxDropLevel: 30,
    baseCost: 180,
    costGrowth: 1.28,
    description: '所有难度下 BOSS 总血量开局削减 0.75% × 总等级（特限劫印≤30，合计至多削减 45%）。',
  },
  {
    id: 'rel_y_mana_blade',
    tier: 'mystic',
    name: '化气为剑',
    maxLevel: 80,
    maxDropLevel: null,
    baseCost: 140,
    costGrowth: 1.22,
    description: '【战术终伤池】当前每保留 10 点道力，战术终伤池加算 +(0.2% × 总等级)。',
  },
  {
    id: 'rel_y_shell_burst',
    tier: 'mystic',
    name: '碎壳余震',
    maxLevel: 30,
    maxDropLevel: 30,
    baseCost: 160,
    costGrowth: 1.26,
    description: '每击破 1 重古神躯壳，对下重躯壳倾泻当前全队 (0.20 × 总等级) 秒 DPS 的破障真伤（劫印≤30）。',
  },
  {
    id: 'rel_y_drop_luck',
    tier: 'mystic',
    name: '天机寻宝盘',
    maxLevel: 30,
    maxDropLevel: 25,
    baseCost: 220,
    costGrowth: 1.28,
    description: '劫数通关掉落遗物时，更高阶遗物的权重提升 +(10% × 总等级)（特限劫印≤25）。',
  },

  // ==================== 四、圣 (7件 · 含神晶增幅) ====================
  {
    id: 'rel_r_essence',
    tier: 'saint',
    name: '贪婪触须',
    maxLevel: 60,
    maxDropLevel: null,
    baseCost: 600,
    costGrowth: 1.26,
    description: '击破躯壳时额外掉词缀石期待 +(4% × 总等级，每满100%必多掉1颗)。',
  },
  {
    id: 'rel_e_free_roll',
    tier: 'saint',
    name: '命运骰子',
    maxLevel: 10,
    maxDropLevel: 6,
    baseCost: 1200,
    costGrowth: 1.75,
    description: '洗练词缀或本命神通有 5% × 总等级 概率免材料（特限劫印≤6，最高 80%）。',
  },
  {
    id: 'rel_e_affix_luck',
    tier: 'saint',
    name: '七彩神石',
    maxLevel: 40,
    maxDropLevel: null,
    baseCost: 800,
    costGrowth: 1.26,
    description: '洗练等级词缀时，极品(紫)与仙品(金)基础权重提升 8% × 总等级。',
  },
  {
    id: 'rel_e_dot_crit',
    tier: 'saint',
    name: '腐化之眼',
    maxLevel: 15,
    maxDropLevel: null,
    baseCost: 1500,
    costGrowth: 1.55,
    description: '允许 2 号位毒伤暴击（25%+3%×总级暴率上限100%，160%+20%×总级爆伤）。',
  },
  {
    id: 'rel_s_crystal_bless',
    tier: 'saint',
    name: '圣灵聚晶塔',
    maxLevel: 100,
    maxDropLevel: null,
    baseCost: 750,
    costGrowth: 1.24,
    description: '通关结算与满印溢转获得的【神晶】数量额外 +(8% × 总等级)。',
  },
  {
    id: 'rel_s_execute_dmg',
    tier: 'saint',
    name: '残月断魂镰',
    maxLevel: 80,
    maxDropLevel: null,
    baseCost: 900,
    costGrowth: 1.24,
    description: '【战术终伤池】敌血 <50% 时终伤池 +(3% × 总等级)；第 8~10 重常驻一半 (+1.5% × 总等级)。',
  },
  {
    id: 'rel_s_stone_surge',
    tier: 'saint',
    name: '点石成金印',
    maxLevel: 40,
    maxDropLevel: 30,
    baseCost: 1000,
    costGrowth: 1.26,
    description: '【战术终伤池】灵石每多 1 数量级 +(0.5% × 总等级)，且破壳返还 0.4%×总级（上限8%）灵石（劫印≤30）。',
  },

  // ==================== 五、仙 (7件 · 含高阶神晶与掉宝增幅) ====================
  {
    id: 'rel_e_auto_start',
    tier: 'epic',
    name: '逆时沙漏',
    maxLevel: 15,
    maxDropLevel: 15,
    baseCost: 3500,
    costGrowth: 1.65,
    description: '开局赠 2×总等级 级傀儡（上限50）与 500×(1.28^神晶级)×(1+0.25×劫印级) 修为（劫印≤15）。',
  },
  {
    id: 'rel_e_boss_skip',
    tier: 'epic',
    name: '破界断剑',
    maxLevel: 15,
    maxDropLevel: 15,
    baseCost: 4000,
    costGrowth: 1.75,
    description: '击破第 1~8 重躯壳时有 1.5% × 总等级 概率连跳两重并双倍词缀石（限45%，特限劫印≤15）。',
  },
  {
    id: 'rel_e_inf_dmg',
    tier: 'epic',
    name: '弑神道果',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 3000,
    costGrowth: 1.26,
    description: '【终局复利池】全队最终总伤害复利 ×(1.032 ^ 神晶级) × (1.008 ^ 劫印级)。',
  },
  {
    id: 'rel_e_inf_crystal',
    tier: 'epic',
    name: '源初神格',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 2500,
    costGrowth: 1.26,
    description: '通关结算与满印溢转获得的【神晶】数量额外 +(12% × 总等级)。',
  },
  {
    id: 'rel_e_rarity_crown',
    tier: 'epic',
    name: '造化仙冕',
    maxLevel: 20,
    maxDropLevel: 15,
    baseCost: 4500,
    costGrowth: 1.5,
    description: '高阶遗物掉落权重再 +(25% × 总等级)，且有 min(40%, 1.5%×总级) 概率额外多掉 1 件遗物！',
  },
  {
    id: 'rel_e_click_storm',
    tier: 'epic',
    name: '万道归宗剑印',
    maxLevel: 60,
    maxDropLevel: null,
    baseCost: 3200,
    costGrowth: 1.26,
    description: '主角每累计攻击 10 次，立即引动全体已上阵护法各发动 1 次无冷却 +(4% × 总等级) 倍率合击！',
  },
  {
    id: 'rel_e_void_mana',
    tier: 'epic',
    name: '混沌道海',
    maxLevel: 60,
    maxDropLevel: null,
    baseCost: 3000,
    costGrowth: 1.26,
    description: '道力上限 +(10×总级)、回蓝 +(0.5×总级)/s；【战术终伤池】随施法基础蓝耗累计加算 +(0.01%×总级/点，上限+250%，免蓝施法亦计入)。',
  },

  // ==================== 六、神 (6件 · 劫十 1% 终极追求) ====================
  {
    id: 'rel_m_first_affix',
    tier: 'mythic',
    name: '古神之瞳',
    maxLevel: 10,
    maxDropLevel: null,
    baseCost: 15000,
    costGrowth: 2.1,
    description: '全队前 4 个等级词缀槽 (Lv.10~Lv.100) 数值效果 ×(1 + 0.12 × 总等级)。',
  },
  {
    id: 'rel_m_auto_skill',
    tier: 'mythic',
    name: '万法道胎',
    maxLevel: 5,
    maxDropLevel: null,
    baseCost: 30000,
    costGrowth: 2.5,
    description: '4 大主动神通冷却完毕无蓝耗自动释放，且效果 ×(1 + 0.15 × 总等级)。',
  },
  {
    id: 'rel_m_omni_base',
    tier: 'mythic',
    name: '混沌母体',
    maxLevel: 15,
    maxDropLevel: null,
    baseCost: 20000,
    costGrowth: 1.85,
    description: '【战术终伤池】每解锁 1 位本命护法，战术终伤池额外加算 +(4% × 总等级)。',
  },
  {
    id: 'rel_m_click_echo',
    tier: 'mythic',
    name: '岁月史书',
    maxLevel: 10,
    maxDropLevel: 10,
    baseCost: 18000,
    costGrowth: 2.0,
    description: '主角点击修为 6% × 总等级 永久同步至护法基础面板（特限劫印≤10，上限120%）。',
  },
  {
    id: 'rel_m_final_mult',
    tier: 'mythic',
    name: '不可名状之核',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 12000,
    costGrowth: 1.3,
    description: '【终局复利池】真神终伤复利 ×(1.09 ^ 神晶级) × (1.022 ^ 劫印级)。',
  },
  {
    id: 'rel_m_god_crystal',
    tier: 'mythic',
    name: '古神铸晶炉',
    maxLevel: null,
    maxDropLevel: null,
    baseCost: 16000,
    costGrowth: 1.28,
    description: '【神·双效核心】神晶获取 +(20% × 总等级)，同时【战术终伤池】额外加算 +(8% × 总等级)。',
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

export function getDropRarityLuckScore(meta: MetaState): number {
  const panLv =
    (meta.relicLevels.rel_y_drop_luck ?? 0) + (meta.relicDropLevels?.rel_y_drop_luck ?? 0);
  const crownLv =
    (meta.relicLevels.rel_e_rarity_crown ?? 0) + (meta.relicDropLevels?.rel_e_rarity_crown ?? 0);
  return 0.1 * panLv + 0.25 * crownLv;
}

export interface TribulationDropTierOdd {
  tier: RelicTier;
  meta: RelicTierMeta;
  basePct: number;
  effectivePct: number;
  effectiveWeight: number;
}

/**
 * Computes effective rarity probabilities for a Tribulation's independent drop table,
 * factoring in rarity-luck relics (天机寻宝盘 + 造化仙冕).
 */
export function getTribulationEffectiveDropOdds(
  tribId: TribulationId,
  meta: MetaState
): TribulationDropTierOdd[] {
  const trib = TRIBULATION_MAP[tribId];
  if (!trib) return [];
  const entries = RELIC_TIER_ORDER.map((tier) => ({
    tier,
    baseW: trib.relicDropWeights[tier] ?? 0,
  })).filter((e) => e.baseW > 0);

  if (entries.length === 0) return [];
  const baseSum = entries.reduce((s, e) => s + e.baseW, 0);
  const minOrder = Math.min(...entries.map((e) => RELIC_TIER_META[e.tier].order));
  const luckScore = getDropRarityLuckScore(meta);

  const weighted = entries.map((e) => {
    const step = RELIC_TIER_META[e.tier].order - minOrder;
    const effectiveWeight = e.baseW * (1 + luckScore * step * 0.65);
    return {
      tier: e.tier,
      meta: RELIC_TIER_META[e.tier],
      basePct: (e.baseW / baseSum) * 100,
      effectiveWeight,
    };
  });

  const effSum = weighted.reduce((s, e) => s + e.effectiveWeight, 0);
  return weighted.map((e) => ({
    ...e,
    effectivePct: (e.effectiveWeight / effSum) * 100,
  }));
}

export function rollTribulationRelicTier(tribId: TribulationId, meta: MetaState): RelicTier {
  const odds = getTribulationEffectiveDropOdds(tribId, meta);
  if (odds.length === 0) return 'common';
  const totalW = odds.reduce((s, o) => s + o.effectiveWeight, 0);
  let r = Math.random() * totalW;
  for (const o of odds) {
    r -= o.effectiveWeight;
    if (r <= 0) return o.tier;
  }
  return odds[odds.length - 1].tier;
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
    common: { tribRangeLabel: '劫一 ~ 劫十', unlockOrder: 1 },
    rare: { tribRangeLabel: '劫二 ~ 劫十', unlockOrder: 2 },
    mystic: { tribRangeLabel: '劫三 ~ 劫十', unlockOrder: 3 },
    saint: { tribRangeLabel: '劫五 ~ 劫十', unlockOrder: 5 },
    epic: { tribRangeLabel: '劫七 ~ 劫十', unlockOrder: 7 },
    mythic: { tribRangeLabel: '仅限劫十 (1%)', unlockOrder: 10 },
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
