import type { SkillId } from '../types/game';

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
export const ENLIGHTENMENT_COST_GROWTH = 1.38;

export const PUPPET_UNLOCK_COST = 60;
export const PUPPET_COST_GROWTH = 1.28;
export const PUPPET_MAX_LEVEL = 50;

export const MERC_SLOT_CRYSTAL_COSTS = [0, 10, 150, 3000, 50000] as const;

export const LEVEL_SLOT_THRESHOLDS = [10, 25, 50, 100, 200, 350, 500, 650, 800, 1000] as const;

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
    multiplier: 3,
    rewardNote: '解锁第2神通【万法残影】',
  },
  {
    level: 2,
    name: '煞气金丹',
    reqStones: 25000,
    reqClicks: 250,
    multiplier: 10,
    rewardNote: '解锁第3神通【天罚神雷】',
  },
  {
    level: 3,
    name: '不灭元婴',
    reqStones: 1.5e6,
    reqClicks: 1000,
    multiplier: 40,
    rewardNote: '解锁第4神通【弑神共鸣】',
  },
  {
    level: 4,
    name: '法则化神',
    reqStones: 2.0e8,
    reqClicks: 3000,
    multiplier: 200,
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
