import type { AffixTier, SkillId } from '../types/game';

export const CHINESE_UNITS = [
  '',
  '万',
  '亿',
  '兆',
  '京',
  '垓',
  '秭',
  '穰',
  '沟',
  '涧',
  '正',
  '载',
  '极',
  '恒河沙',
  '阿僧祇',
  '那由他',
  '不可思议',
  '无量',
  '大数',
  '古戈尔',
];

export const BASE_HERO_ATK = 10;
export const BASE_START_MANA = 40;
export const BASE_MANA_CAP = 100;
export const BASE_MANA_REGEN = 1.0;
export const BASE_MANUAL_CLICK_MANA = 0.8;

export const ENLIGHTENMENT_BASE_COST = 25;
export const ENLIGHTENMENT_COST_GROWTH = 1.42;

export const PUPPET_UNLOCK_COST = 60;
export const PUPPET_COST_GROWTH = 1.28;
export const PUPPET_MAX_LEVEL = 50;

/**
 * 攻击间隔上限：机关傀儡、万法残影与护法的【间隔驱动攻击】封顶 25 次/秒。
 * 注意：每次攻击可拆出多段命中（剑气/连击/三才），且充能、点击联动追加的攻击事件不计入该间隔；
 * 因此“命中事件/秒”可以高于 25，文档与 HUD 必须区分“攻击次数”与“命中次数”。
 */
export const MAX_ATTACKS_PER_SEC = 25;
export const MIN_ATTACK_INTERVAL = 1 / MAX_ATTACKS_PER_SEC; // 0.04s min attack interval

/**
 * 机神充能：剑侍/主角每 15 次攻击折算的冷却秒数。
 * 所有充能来源（15 次攻击 + 雷火装填）合计封顶每秒 1.0 秒冷却，
 * 即充能最多让机神攻击频率翻倍，避免高攻速下充能吞掉终局伤害。
 */
export const CANNON_CHARGE_SEC_PER_15_ATTACKS = 0.4;
export const MAX_CANNON_CHARGE_SEC_PER_SEC = 1.0;

/** 天降横财：每秒最多 5 次全额触发；超出的前 5 次按 20% 折算，再超出则丢弃 */
export const MAX_JACKPOT_PROCS_PER_SEC = 5;
export const JACKPOT_OVERFLOW_RATE = 0.2;

/** 广告灵石加速：10 分钟 ×2，每日最多 3 次 */
export const AD_STONE_BOOST_DURATION_MS = 10 * 60 * 1000;
export const AD_STONE_BOOST_MULT = 2;
export const MAX_DAILY_AD_STONE_BOOSTS = 5;

/** 腐蚀毒层亚线性指数：毒伤 = 毒面板 × 层数^0.75（压制前期 3500× 免费乘区，保留后期成长） */
export const POISON_STACK_EXPONENT = 0.75;

export const MAX_ONSCREEN_FLOATING_TEXTS = 6;
export const FLOATING_TEXT_MIN_INTERVAL_MS = 85;
export const MAX_ONSCREEN_RIPPLES = 4;
export const RIPPLE_MIN_INTERVAL_MS = 65;
export const PHASE_BANNER_MIN_INTERVAL_MS = 300;
export const TOAST_DURATION_MS = 2200;

export const MERC_SLOT_CRYSTAL_COSTS = [0, 20, 400, 8000, 150000] as const;

export const LEVEL_SLOT_THRESHOLDS = [10, 25, 50, 100, 200, 350, 500, 650, 800, 1000] as const;

/**
 * 道纹洗练定价阶梯（按槽位序号 0~9，对应 Lv.10 ~ Lv.1000）。
 * 越深的道纹越难淬炼，让词缀石在千级长线中始终保持价值。
 */
export const AFFIX_REROLL_COST_SINGLE = [2, 2, 2, 4, 4, 4, 7, 7, 7, 12] as const;
export const AFFIX_REROLL_COST_BATCH = [1, 1, 1, 2, 2, 2, 3, 3, 3, 5] as const;

/**
 * 【道纹淬炼】消耗：必定将词缀提升一阶（凡→良→上→极→仙）。
 * 终局词缀石沉淀池——既解决富余废币，也给「指定词缀」提供可预期的保底路径。
 * `null` 表示已达上限（仙品）。
 */
export const AFFIX_QUENCH_COSTS: Record<AffixTier, number | null> = {
  white: 8,
  green: 25,
  blue: 70,
  purple: 220,
  gold: null,
};

export const LEVEL_SLOT_NAMES = [
  '第一重道纹',
  '第二重道纹',
  '第三重道纹',
  '第四重道纹',
  '第五重道纹',
  '第六重道纹',
  '第七重道纹',
  '第八重道纹',
  '第九重道纹',
  '第十重·千级圆满',
] as const;

export interface RealmTierConfig {
  level: number;
  name: string;
  reqStones: number;
  reqClicks: number;
  multiplier: number;
  rewardNote: string;
}

export const REALM_TIERS: RealmTierConfig[] = [
  {
    level: 0,
    name: '凡胎肉身',
    reqStones: 0,
    reqClicks: 0,
    multiplier: 1,
    rewardNote: '自带神通【燃血叩击】',
  },
  {
    level: 1,
    name: '百脉筑基',
    reqStones: 800,
    reqClicks: 50,
    multiplier: 2.5,
    rewardNote: '解锁第2神通【万法残影】',
  },
  {
    level: 2,
    name: '煞气金丹',
    reqStones: 25000,
    reqClicks: 250,
    multiplier: 8,
    rewardNote: '解锁第3神通【天罚神雷】',
  },
  {
    level: 3,
    name: '不灭元婴',
    reqStones: 1.5e6,
    reqClicks: 1000,
    multiplier: 28,
    rewardNote: '解锁第4神通【弑神共鸣】',
  },
  {
    level: 4,
    name: '法则化神',
    reqStones: 2.0e8,
    reqClicks: 3000,
    multiplier: 120,
    rewardNote: '道力上限 +50 · 自然回蓝 +1.5/秒',
  },
];

export interface SkillConfig {
  id: SkillId;
  name: string;
  unlockRealm: number;
  manaCost: number;
  baseDuration: number;
  baseCooldown: number;
  baseUpgradeCost: number;
  costGrowth: number;
  shortDesc: string;
}

export const SKILLS: SkillConfig[] = [
  {
    id: 'sk_blood',
    name: '燃血叩击',
    unlockRealm: 0,
    manaCost: 20,
    baseDuration: 8,
    baseCooldown: 25,
    baseUpgradeCost: 100,
    costGrowth: 1.65,
    shortDesc: '每次点击修为成长 ×(2.0+0.5×级)',
  },
  {
    id: 'sk_clone',
    name: '万法残影',
    unlockRealm: 1,
    manaCost: 35,
    baseDuration: 8,
    baseCooldown: 35,
    baseUpgradeCost: 1200,
    costGrowth: 1.65,
    shortDesc: '每秒自动发动 (5+1×级) 次主角点击',
  },
  {
    id: 'sk_thunder',
    name: '天罚神雷',
    unlockRealm: 2,
    manaCost: 50,
    baseDuration: 0,
    baseCooldown: 25,
    baseUpgradeCost: 30000,
    costGrowth: 1.65,
    shortDesc: '瞬发 (150+50×级) 倍点击破盾核弹',
  },
  {
    id: 'sk_sync',
    name: '弑神共鸣',
    unlockRealm: 3,
    manaCost: 75,
    baseDuration: 10,
    baseCooldown: 50,
    baseUpgradeCost: 1e6,
    costGrowth: 1.65,
    shortDesc: '全佣兵攻速×1.5 且附加主角伤害',
  },
];
