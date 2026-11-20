import { AFFIX_QUENCH_COSTS } from './constants';
import type {
  AffixConfig,
  AffixId,
  AffixInstance,
  AffixTier,
  InnateAffixConfig,
  InnateAffixId,
} from '../types/game';

export const AFFIX_TIER_META: Record<
  AffixTier,
  {
    label: string;
    mult: number;
    weight: number;
    colorClass: string;
    borderClass: string;
    badgeBgClass: string;
  }
> = {
  white: {
    label: '凡品',
    mult: 1.0,
    weight: 35,
    colorClass: 'text-[#e2e8f0]',
    borderClass: 'border-white/25',
    badgeBgClass: 'bg-[#1a1f32]',
  },
  green: {
    label: '良品',
    mult: 1.6,
    weight: 30,
    colorClass: 'text-[#34d399]',
    borderClass: 'border-[#10b981]/50',
    badgeBgClass: 'bg-[#064e3b]/28',
  },
  blue: {
    label: '上品',
    mult: 2.5,
    weight: 20,
    colorClass: 'text-[#38bdf8]',
    borderClass: 'border-[#0284c7]/55',
    badgeBgClass: 'bg-[#0c4a6e]/32',
  },
  purple: {
    label: '极品',
    mult: 4.0,
    weight: 11,
    colorClass: 'text-[#c084fc]',
    borderClass: 'border-[#9333ea]/60',
    badgeBgClass: 'bg-[#4c1d95]/28',
  },
  gold: {
    label: '仙品',
    mult: 7.0,
    weight: 4,
    colorClass: 'text-[#fbbf24]',
    borderClass: 'border-[#f59e0b]/70',
    badgeBgClass: 'bg-[#78350f]/28',
  },
};

export const AFFIXES: Record<AffixId, AffixConfig> = {
  // ===== 下等 · 凡俗筑基词缀 (12) =====
  af_t1_atk: {
    id: 'af_t1_atk',
    name: '锋锐',
    tierGroup: '下等',
    baseValue: 40,
    unitKind: 'pct',
    description: '该佣兵自身伤害提升 {val}%。',
  },
  af_t1_spd: {
    id: 'af_t1_spd',
    name: '疾风',
    tierGroup: '下等',
    baseValue: 12,
    unitKind: 'pct',
    description: '该佣兵自身攻击速度提升 {val}%。',
  },
  af_t1_crit_r: {
    id: 'af_t1_crit_r',
    name: '精准',
    tierGroup: '下等',
    baseValue: 6,
    unitKind: 'pct',
    description: '该佣兵暴击率提升 {val}%。',
  },
  af_t1_crit_d: {
    id: 'af_t1_crit_d',
    name: '毁灭',
    tierGroup: '下等',
    baseValue: 50,
    unitKind: 'pct',
    description: '该佣兵暴击伤害提升 {val}%。',
  },
  af_t1_flat_lv: {
    id: 'af_t1_flat_lv',
    name: '强体',
    tierGroup: '下等',
    baseValue: 8,
    unitKind: 'pct',
    description: '该佣兵每升 25 有效级，自身伤害额外加算 {val}%（单护法合计上限 +300%）。',
  },
  af_t1_early: {
    id: 'af_t1_early',
    name: '先驱',
    tierGroup: '下等',
    baseValue: 60,
    unitKind: 'pct',
    description: '对第 1~5 重躯壳的 BOSS 造成伤害提升 {val}%。',
    recommendedFor: '前 5 重生效',
  },
  af_t1_late: {
    id: 'af_t1_late',
    name: '屠神',
    tierGroup: '下等',
    baseValue: 80,
    unitKind: 'pct',
    description: '对第 6~10 重躯壳的 BOSS 造成伤害提升 {val}%。',
    recommendedFor: '后 5 重生效',
  },
  af_t1_hero_a: {
    id: 'af_t1_hero_a',
    name: '强击',
    tierGroup: '下等',
    baseValue: 30,
    unitKind: 'pct',
    description: '主角单次点击伤害提升 {val}%。',
  },
  af_t1_hero_c: {
    id: 'af_t1_hero_c',
    name: '开眼',
    tierGroup: '下等',
    baseValue: 3,
    unitKind: 'pct',
    description: '主角点击暴击率提升 {val}%。',
  },
  af_t1_mana_r: {
    id: 'af_t1_mana_r',
    name: '吐纳',
    tierGroup: '下等',
    baseValue: 0.3,
    unitKind: 'rate',
    description: '主角道力自然恢复速度提升 {val}/秒。',
  },
  af_t1_poison: {
    id: 'af_t1_poison',
    name: '蚀骨',
    tierGroup: '下等',
    baseValue: 35,
    unitKind: 'pct',
    description: '场上【腐蚀毒】每秒结算伤害提升 {val}%。',
  },
  af_t1_skill_d: {
    id: 'af_t1_skill_d',
    name: '秘法',
    tierGroup: '下等',
    baseValue: 25,
    unitKind: 'pct',
    description: '主角第 3 神通【天罚神雷】伤害提升 {val}%。',
  },

  // ===== 中等 · 玄妙机制与资源词缀 (12) =====
  af_t2_double: {
    id: 'af_t2_double',
    name: '残影连击',
    tierGroup: '中等',
    baseValue: 10,
    unitKind: 'pct',
    description: '每次攻击有 {val}% 概率追加 1 次全额攻击（不套娃）。',
  },
  af_t2_triple: {
    id: 'af_t2_triple',
    name: '三才剑阵',
    tierGroup: '中等',
    baseValue: 4,
    unitKind: 'pct',
    description: '每次攻击有 {val}% 概率额外追加 3 次全额攻击（不套娃）。',
  },
  af_t2_stack: {
    id: 'af_t2_stack',
    name: '越战越勇',
    tierGroup: '中等',
    baseValue: 2,
    unitKind: 'pct',
    description: '本局每攻击 50 次，自身伤害永久 +{val}%（上限 100 层）。',
  },
  af_t2_execute: {
    id: 'af_t2_execute',
    name: '斩杀法则',
    tierGroup: '中等',
    baseValue: 100,
    unitKind: 'pct',
    description: 'BOSS 当前躯壳血量低于 30% 时，自身伤害提升 {val}%。',
  },
  af_t2_gold: {
    id: 'af_t2_gold',
    name: '点石成金',
    tierGroup: '中等',
    baseValue: 30,
    unitKind: 'pct',
    description: '全队伤害转化为【灵石】获取量提升 {val}%。',
  },
  af_t2_jackpot: {
    id: 'af_t2_jackpot',
    name: '天降横财',
    tierGroup: '中等',
    baseValue: 5,
    unitKind: 'pct',
    description: '每次攻击有 {val}% 概率爆出相当于当前秒伤 200% 的灵石（每秒最多 5 次全额；超出的前 5 次按 20% 折算，再超出丢弃）。',
  },
  af_t2_cheap: {
    id: 'af_t2_cheap',
    name: '缩资减耗',
    tierGroup: '中等',
    baseValue: 5,
    unitKind: 'pct',
    description: '该佣兵自身灵石升级费用降低 {val}%（单佣兵上限 75%）。',
  },
  af_t2_stone_p: {
    id: 'af_t2_stone_p',
    name: '寻宝天眼',
    tierGroup: '中等',
    baseValue: 3,
    unitKind: 'pct',
    description: '破壳词缀石掉落 +{val}%（全队合计上限 +100%）。',
  },
  af_t2_mana_h: {
    id: 'af_t2_mana_h',
    name: '汲灵反哺',
    tierGroup: '中等',
    baseValue: 10,
    unitKind: 'pct',
    description: '每次攻击有 {val}% 概率为主角立即恢复 2 点道力。',
  },
  af_t2_h_grow: {
    id: 'af_t2_h_grow',
    name: '道心共鸣',
    tierGroup: '中等',
    baseValue: 15,
    unitKind: 'pct',
    description: '主角【顿悟】每次点击攻击力成长值额外提升 {val}%。',
  },
  af_t2_puppet: {
    id: 'af_t2_puppet',
    name: '发条超频',
    tierGroup: '中等',
    baseValue: 0.8,
    unitKind: 'rate',
    description: '主角【机关傀儡】自动点击速度额外 +{val}/秒。',
  },
  af_t2_century: {
    id: 'af_t2_century',
    name: '百炼成仙',
    tierGroup: '中等',
    baseValue: 15,
    unitKind: 'pct',
    description:
      '每达整百有效级（100..1000），自身伤害线性 +{val}%（单护法整百比率合计上限 +90%，Lv.1000 最多 ×10；品质按平方根缩放，且不吃 5 号位与古神瞳放大）。',
    tierScaling: 'sqrt',
    recommendedFor: '雷火机神推荐',
  },

  // ===== 上等 · 跨佣兵点名联动词缀 (14) =====
  af_t3_sword_s: {
    id: 'af_t3_sword_s',
    name: '剑道宗师',
    tierGroup: '上等',
    baseValue: 1.5,
    unitKind: 'pct',
    description: '仅 1号位【青冥剑侍】生效：每有 10 有效级，自身伤害 +{val}%（合计上限 +300%）。',
    recommendedFor: '青冥剑侍专属',
  },
  af_t3_tent_s: {
    id: 'af_t3_tent_s',
    name: '深渊共生',
    tierGroup: '上等',
    baseValue: 2.0,
    unitKind: 'pct',
    description: '仅 2号位【深渊触母】生效：每有 10 有效级，自身与毒伤 +{val}%（合计上限 +300%）。',
    recommendedFor: '深渊触母专属',
  },
  af_t3_can_s: {
    id: 'af_t3_can_s',
    name: '重火协同',
    tierGroup: '上等',
    baseValue: 2.5,
    unitKind: 'pct',
    description: '仅 3号位【雷火机神】生效：每有 10 有效级，自身爆伤 +{val}%（合计上限 +300%）。',
    recommendedFor: '雷火机神专属',
  },
  af_t3_arr_s: {
    id: 'af_t3_arr_s',
    name: '阵道加持',
    tierGroup: '上等',
    baseValue: 3.0,
    unitKind: 'pct',
    description: '仅 4号位【天机阵尊】生效：每有 10 有效级，全队佣兵基础伤 +{val}%（全队合计上限 +300%）。',
    recommendedFor: '天机阵尊专属',
  },
  af_t3_total_l: {
    id: 'af_t3_total_l',
    name: '万仙来朝',
    tierGroup: '上等',
    baseValue: 3,
    unitKind: 'pct',
    description: '全队总有效等级每有 50 级，本佣兵伤害提升 {val}%（本词缀合计上限 +200%）。',
  },
  af_t3_click_t: {
    id: 'af_t3_click_t',
    name: '伴生剑意',
    tierGroup: '上等',
    baseValue: 15,
    unitKind: 'pct',
    description: '主角每累计点击 20 次，有 {val}% 概率无视冷却攻击 1 次。',
  },
  af_t3_pop_dot: {
    id: 'af_t3_pop_dot',
    name: '万毒催熟',
    tierGroup: '上等',
    baseValue: 10,
    unitKind: 'pct',
    description: '每次命中后有 {val}% 概率立即引爆 1 次全额腐蚀毒伤。',
  },
  af_t3_cd_can: {
    id: 'af_t3_cd_can',
    name: '雷火装填',
    tierGroup: '上等',
    baseValue: 0.02,
    unitKind: 'sec',
    description: '每次攻击使 3号位【雷火机神】当前冷却缩短 {val} 秒（机神自身攻击不自我装填，每秒充能总量受机神基础攻速上限约束）。',
    recommendedFor: '青冥剑侍/深渊触母推荐',
  },
  af_t3_hero_ln: {
    id: 'af_t3_hero_ln',
    name: '借力打力',
    tierGroup: '上等',
    baseValue: 25,
    unitKind: 'pct',
    description: '将主角点击基础战力的 {val}% 直接附加到每次攻击上（同样享受 25/s 溢出折算）。',
  },
  af_t3_buff_h: {
    id: 'af_t3_buff_h',
    name: '护法反哺',
    tierGroup: '上等',
    baseValue: 3,
    unitKind: 'pct',
    description: '每次攻击使主角点击伤害 +{val}%，持续 5 秒（上限 25 层）。',
  },
  af_t3_adj_dmg: {
    id: 'af_t3_adj_dmg',
    name: '左右逢源',
    tierGroup: '上等',
    baseValue: 12,
    unitKind: 'pct',
    description: '使自身以外其他 4 名佣兵最终伤害独立提升 {val}%（合计上限 +300%）。',
    recommendedFor: '深渊触母/天机阵尊推荐',
  },
  af_t3_team_sp: {
    id: 'af_t3_team_sp',
    name: '三军用命',
    tierGroup: '上等',
    baseValue: 5,
    unitKind: 'pct',
    description: '在场时全队所有 5 位佣兵攻击速度提升 {val}%。',
  },
  af_t3_p_scale: {
    id: 'af_t3_p_scale',
    name: '以毒攻毒',
    tierGroup: '上等',
    baseValue: 0.5,
    unitKind: 'pct',
    description: '仅 2号位【深渊触母】生效：BOSS 每有 10 层腐蚀毒，本佣兵直伤 +{val}%（上限 +600%）。',
    recommendedFor: '深渊触母专属',
  },
  af_t3_lone: {
    id: 'af_t3_lone',
    name: '唯我独尊',
    tierGroup: '上等',
    baseValue: 30,
    unitKind: 'pct',
    description: '本佣兵最终伤害独立 ×(1+{val}%)，其他 4 人伤害 ×0.85。',
    recommendedFor: '雷火机神推荐',
  },
};

export const AFFIX_LIST: AffixConfig[] = Object.values(AFFIXES);

export const INNATE_AFFIXES: Record<InnateAffixId, InnateAffixConfig> = {
  sp_double_lvl: {
    id: 'sp_double_lvl',
    name: '★【法天象地】',
    description: '计算槽位里程碑（每槽 ×2）、光环与跨护法联动时有效等级直接 ×2（基础底盘仍按实购等级稳步成长）！',
  },
  sp_affix_boost: {
    id: 'sp_affix_boost',
    name: '★【道纹升华】',
    description: '该佣兵自身已激活的 10 个等级词缀槽数值效果全部直接 ×2.0 倍！',
  },
  sp_free_up: {
    id: 'sp_free_up',
    name: '★【天道酬勤】',
    description: '每次升级该佣兵时，有 35% 概率免费额外多升 1 级（极速冲刺 1000 级）！',
  },
  sp_omni_crit: {
    id: 'sp_omni_crit',
    name: '★【必杀法则】',
    description: '暴击率锁定 100% 必暴，且溢出 100% 的每 1% 暴率转化为 +3% 爆伤！',
  },
  sp_skill_trig: {
    id: 'sp_skill_trig',
    name: '★【神通法相】',
    description: '每攻击 30 次免费无视冷却自动触发 1 次【天罚神雷】（未至金丹按 Lv.1）！',
  },
  sp_poison_god: {
    id: 'sp_poison_god',
    name: '★【万毒之源】',
    description: '每次叠加腐蚀毒时改为使 BOSS 当前毒层数额外增加 2%（上限 3500 层，持久战指数毒潮）！',
    recommendedFor: '深渊触母推荐',
  },
  sp_cannon_gat: {
    id: 'sp_cannon_gat',
    name: '★【歼星连射】',
    description: '基础攻击间隔直接减半，且每次开炮必定连射 3 发核弹！',
    recommendedFor: '雷火机神推荐',
  },
  sp_sword_storm: {
    id: 'sp_sword_storm',
    name: '★【万剑归宗】',
    description: '每次攻击同时斩出 5 道剑气，分别独立触发毒爆与充能等命中词缀！',
    recommendedFor: '青冥剑侍推荐',
  },
  sp_gold_empire: {
    id: 'sp_gold_empire',
    name: '★【乾坤聚宝】',
    description: '当前灵石每多 1 个数量级（10^N），全队最终伤害直接额外 +50%！',
    recommendedFor: '天机阵尊推荐',
  },
  sp_max_god: {
    id: 'sp_max_god',
    name: '★【千级共鸣】',
    description: '场上每有 1 个有效等级 ≥ 500 级的佣兵，全队最终总伤害独立 ×2.0 倍！',
    recommendedFor: '混沌古神嗣推荐',
  },
};

export const INNATE_AFFIX_LIST: InnateAffixConfig[] = Object.values(INNATE_AFFIXES);

/**
 * Three-way multiplier for level affix slots (0..9):
 * 1. Slot 5 unlocked -> *1.5（仅非复利词缀；复利词缀见 tierScaling）
 * 2. Merc innate sp_affix_boost -> *2.0
 * 3. Relic rel_m_first_affix (slots 0..3 / Lv.10~Lv.100) -> *(1 + 0.10 * L)
 *
 * `tierScaling: 'sqrt'` 的复利词缀把品质倍率开平方，避免仙品 7× 在指数乘区里滚成
 * 数千倍，同时保留品质越高越强的线性感知。
 */
export function getAffixEffectiveValue(
  inst: AffixInstance,
  slotIdx: number,
  isSlot5Unlocked: boolean,
  hasInnateBoost: boolean,
  firstAffixRelicLv: number
): number {
  const cfg = AFFIXES[inst.id];
  const tierMeta = AFFIX_TIER_META[inst.tier];
  if (!cfg || !tierMeta) return 0;
  const isCompound = cfg.tierScaling === 'sqrt';
  const tierMult = isCompound ? Math.sqrt(tierMeta.mult) : tierMeta.mult;
  const slot5Boost = isSlot5Unlocked && !isCompound ? 1.5 : 1.0;
  const innateBoost = hasInnateBoost ? 2.0 : 1.0;
  const relicSlotBoost = !isCompound && slotIdx <= 3 ? 1 + 0.1 * firstAffixRelicLv : 1.0;
  return cfg.baseValue * tierMult * slot5Boost * innateBoost * relicSlotBoost;
}

export function formatAffixValueText(id: AffixId, val: number): string {
  const cfg = AFFIXES[id];
  if (!cfg) return String(Math.round(val));
  if (cfg.unitKind === 'sec') {
    return `${val.toFixed(2)}`;
  }
  if (cfg.unitKind === 'rate') {
    return val.toFixed(2);
  }
  return val >= 10 || Math.abs(val - Math.round(val)) < 0.05
    ? `${Math.round(val)}`
    : `${val.toFixed(1)}`;
}

export function formatAffixShortBadgeValue(id: AffixId, val: number): string {
  const cfg = AFFIXES[id];
  if (!cfg) return `+${Math.round(val)}%`;
  if (cfg.unitKind === 'sec') {
    return `-${val.toFixed(2)}s`;
  }
  if (cfg.unitKind === 'rate') {
    return `+${val.toFixed(1)}/s`;
  }
  const num =
    val >= 10 || Math.abs(val - Math.round(val)) < 0.05 ? `${Math.round(val)}` : `${val.toFixed(1)}`;
  return `+${num}%`;
}

export function formatAffixDescription(
  inst: AffixInstance,
  slotIdx: number,
  isSlot5Unlocked: boolean,
  hasInnateBoost: boolean,
  firstAffixRelicLv: number
): string {
  const cfg = AFFIXES[inst.id];
  if (!cfg) return '未知道纹词缀';
  const val = getAffixEffectiveValue(
    inst,
    slotIdx,
    isSlot5Unlocked,
    hasInnateBoost,
    firstAffixRelicLv
  );
  return cfg.description.replace('{val}', formatAffixValueText(inst.id, val));
}

export function rollRandomAffixId(): AffixId {
  return AFFIX_LIST[Math.floor(Math.random() * AFFIX_LIST.length)].id;
}

export function rollAffixTier(affixLuckRelicLv: number, forceHighTier = false): AffixTier {
  if (forceHighTier) {
    return Math.random() < 0.8 ? 'purple' : 'gold';
  }
  const luckMult = 1 + 0.08 * affixLuckRelicLv;
  const weights: [AffixTier, number][] = [
    ['white', AFFIX_TIER_META.white.weight],
    ['green', AFFIX_TIER_META.green.weight],
    ['blue', AFFIX_TIER_META.blue.weight],
    ['purple', AFFIX_TIER_META.purple.weight * luckMult],
    ['gold', AFFIX_TIER_META.gold.weight * luckMult],
  ];
  const totalWeight = weights.reduce((s, w) => s + w[1], 0);
  let r = Math.random() * totalWeight;
  for (const [tier, w] of weights) {
    r -= w;
    if (r <= 0) return tier;
  }
  return 'white';
}

export const AFFIX_TIER_ORDER: AffixTier[] = ['white', 'green', 'blue', 'purple', 'gold'];

/** 淬炼后的下一阶；仙品返回 null */
export function getNextAffixTier(tier: AffixTier): AffixTier | null {
  const idx = AFFIX_TIER_ORDER.indexOf(tier);
  if (idx < 0 || idx >= AFFIX_TIER_ORDER.length - 1) return null;
  return AFFIX_TIER_ORDER[idx + 1];
}

/** 【道纹淬炼】消耗（颗）；仙品返回 null */
export function getQuenchCost(tier: AffixTier): number | null {
  return AFFIX_QUENCH_COSTS[tier] ?? null;
}

export function getAffixTierRates(affixLuckRelicLv: number): {
  tier: AffixTier;
  meta: (typeof AFFIX_TIER_META)[AffixTier];
  basePct: number;
  effectivePct: number;
}[] {
  const luckMult = 1 + 0.08 * affixLuckRelicLv;
  const baseWeights: Record<AffixTier, number> = {
    white: AFFIX_TIER_META.white.weight,
    green: AFFIX_TIER_META.green.weight,
    blue: AFFIX_TIER_META.blue.weight,
    purple: AFFIX_TIER_META.purple.weight,
    gold: AFFIX_TIER_META.gold.weight,
  };
  const effWeights: Record<AffixTier, number> = {
    white: AFFIX_TIER_META.white.weight,
    green: AFFIX_TIER_META.green.weight,
    blue: AFFIX_TIER_META.blue.weight,
    purple: AFFIX_TIER_META.purple.weight * luckMult,
    gold: AFFIX_TIER_META.gold.weight * luckMult,
  };
  const baseSum = AFFIX_TIER_ORDER.reduce((s, t) => s + baseWeights[t], 0);
  const effSum = AFFIX_TIER_ORDER.reduce((s, t) => s + effWeights[t], 0);
  return AFFIX_TIER_ORDER.map((tier) => ({
    tier,
    meta: AFFIX_TIER_META[tier],
    basePct: (baseWeights[tier] / baseSum) * 100,
    effectivePct: (effWeights[tier] / effSum) * 100,
  }));
}

export function rollRandomInnateAffix(exclude?: InnateAffixId): InnateAffixId {
  const pool = exclude
    ? INNATE_AFFIX_LIST.filter((item) => item.id !== exclude)
    : INNATE_AFFIX_LIST;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
