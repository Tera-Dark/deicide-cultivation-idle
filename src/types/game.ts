export type NumberDisplayMode = 'chinese' | 'scientific';
export type BuyMode = 1 | 10 | 'MAX';
export type FloatingTextMode = 'all' | 'crit' | 'off';

export type ArchetypeId =
  | 'merc_sword'
  | 'merc_tentacle'
  | 'merc_cannon'
  | 'merc_array'
  | 'merc_god';

export type AffixTier = 'white' | 'green' | 'blue' | 'purple' | 'gold';

export type AffixId =
  // Tier 1 (12)
  | 'af_t1_atk'
  | 'af_t1_spd'
  | 'af_t1_crit_r'
  | 'af_t1_crit_d'
  | 'af_t1_flat_lv'
  | 'af_t1_early'
  | 'af_t1_late'
  | 'af_t1_hero_a'
  | 'af_t1_hero_c'
  | 'af_t1_mana_r'
  | 'af_t1_poison'
  | 'af_t1_skill_d'
  // Tier 2 (12)
  | 'af_t2_double'
  | 'af_t2_triple'
  | 'af_t2_stack'
  | 'af_t2_execute'
  | 'af_t2_gold'
  | 'af_t2_jackpot'
  | 'af_t2_cheap'
  | 'af_t2_stone_p'
  | 'af_t2_mana_h'
  | 'af_t2_h_grow'
  | 'af_t2_puppet'
  | 'af_t2_century'
  // Tier 3 (14)
  | 'af_t3_sword_s'
  | 'af_t3_tent_s'
  | 'af_t3_can_s'
  | 'af_t3_arr_s'
  | 'af_t3_total_l'
  | 'af_t3_click_t'
  | 'af_t3_pop_dot'
  | 'af_t3_cd_can'
  | 'af_t3_hero_ln'
  | 'af_t3_buff_h'
  | 'af_t3_adj_dmg'
  | 'af_t3_team_sp'
  | 'af_t3_p_scale'
  | 'af_t3_lone';

export type InnateAffixId =
  | 'sp_double_lvl'
  | 'sp_affix_boost'
  | 'sp_free_up'
  | 'sp_omni_crit'
  | 'sp_skill_trig'
  | 'sp_poison_god'
  | 'sp_cannon_gat'
  | 'sp_sword_storm'
  | 'sp_gold_empire'
  | 'sp_max_god';

export type SkillId = 'sk_blood' | 'sk_clone' | 'sk_thunder' | 'sk_sync';

export type RelicTier = 'common' | 'rare' | 'mystic' | 'saint' | 'epic' | 'mythic';

export type RelicId =
  | 'rel_c_click_flat'
  | 'rel_c_click_mult'
  | 'rel_c_stone_gain'
  | 'rel_c_cost_down'
  | 'rel_c_mana_cap'
  | 'rel_c_mana_click'
  | 'rel_c_puppet_spd'
  | 'rel_c_start_gold'
  | 'rel_r_sword_dmg'
  | 'rel_r_tentacle'
  | 'rel_r_cannon_dmg'
  | 'rel_r_array_buff'
  | 'rel_r_skill_cd'
  | 'rel_r_skill_dur'
  | 'rel_r_thunder'
  | 'rel_r_crit_dmg'
  | 'rel_r_essence'
  | 'rel_r_boss_hp'
  | 'rel_e_auto_start'
  | 'rel_e_free_roll'
  | 'rel_e_affix_luck'
  | 'rel_e_dot_crit'
  | 'rel_e_boss_skip'
  | 'rel_e_inf_dmg'
  | 'rel_e_inf_crystal'
  | 'rel_m_first_affix'
  | 'rel_m_auto_skill'
  | 'rel_m_omni_base'
  | 'rel_m_click_echo'
  | 'rel_m_final_mult';

export type TribulationId =
  | 'tier_1'
  | 'tier_2'
  | 'tier_3'
  | 'tier_4'
  | 'tier_5'
  | 'tier_6'
  | 'tier_7'
  | 'tier_8'
  | 'tier_9'
  | 'tier_10';

export type SpeedrunRank = 'C' | 'B' | 'A' | 'S' | 'SSS';

export type TutorialNodeId = 'tut_phase1' | 'tut_merc1' | 'tut_affix' | 'tut_tier1_win';

export interface AffixInstance {
  id: AffixId;
  tier: AffixTier;
}

export interface PendingLevelAffixes {
  indices: number[]; // which slots (0..9) were rolled
  candidates: (AffixInstance | null)[]; // length 10 snapshot
}

export interface MercenarySlotState {
  slotIndex: number; // 0..4
  unlocked: boolean;
  archetype: ArchetypeId; // Fixed per slot
  level: number; // Resets to 1 on restart/clear
  innateAffix: InnateAffixId;
  pendingInnateAffix: InnateAffixId | null;
  unlockedLevelSlots: number; // 0..10 permanently opened via EffLevel milestones
  levelAffixes: (AffixInstance | null)[]; // length 10, 100% persistent
  lockedLevelSlots: boolean[]; // length 10
  pendingLevelAffixes: PendingLevelAffixes | null;
  attackTimer: number;
  attackCount: number; // Within-run attack counter (af_t2_stack, sp_skill_trig)
}

export interface SkillRuntimeState {
  level: number;
  activeRemaining: number;
  cooldownRemaining: number;
  autoCast: boolean;
}

export interface HeroBuffStack {
  val: number; // decimal ratio e.g. 0.03 = +3%
  expiresAt: number; // timestamp ms
}

export interface RunState {
  tribulationId: TribulationId;
  phaseIndex: number; // 0..9
  bossHp: string;
  bossMaxHp: string;
  poisonStacks: number;
  spiritStones: string;
  mana: number;
  clickStacks: string;
  manualClicks: number;
  swordAndHeroAttacksForCannon: number; // Every 15 reduces cannon CD by 1.0s
  enlightenmentLevel: number;
  accumulatedAtk: string;
  sharedHeroGrowth: string;
  realmLevel: number;
  puppetLevel: number;
  skills: Record<SkillId, SkillRuntimeState>;
  heroBuffStacks: HeroBuffStack[]; // FIFO max 25
  timerStarted: boolean;
  elapsedMs: number;
  runCompleted: boolean;
  recentTickDps: {
    hero: string;
    poison: string;
    mercs: [string, string, string, string, string];
  };
}

export interface MetaState {
  affixStones: number;
  divineCrystals: string;
  hasUnlockedPuppet: boolean;
  firstBreakGiftsClaimed: number;
  unlockedBulkBuy: boolean;
  unlockedRelicHall: boolean;
  unlockedAffixLock: boolean;
  unlockedInnateReroll: boolean;
  unlockedEpicPool: boolean;
  unlockedAutoSkill: boolean;
  hasSeenIntro: boolean;
  shownTutorials: Record<TutorialNodeId, boolean>;
  clearedTribulations: Record<TribulationId, boolean>;
  clearCounts: Record<TribulationId, number>;
  ngPlusCount: number;
  relicLevels: Record<RelicId, number>;
  relicDropLevels: Record<RelicId, number>;
  rerollPity: number;
  highestUnlockedOrder: number;
  bestClearTimesMs: Partial<Record<TribulationId, number>>;
  sssUnlockedAutoRepeat: Partial<Record<TribulationId, boolean>>;
  autoRepeatEnabled: boolean;
  totalSlays: number;
  totalRestarts: number;
  totalPlayTimeMs: number;
  totalClicks: string;
  highestDps: string;
  totalRerolls: number;
}

export interface SettingsState {
  numberMode: NumberDisplayMode;
  soundEnabled: boolean;
  buyMode: BuyMode;
  floatingTextMode: FloatingTextMode;
  hitVfxEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface GameSaveData {
  version: number;
  savedAt: number;
  run: RunState;
  mercs: MercenarySlotState[];
  meta: MetaState;
  settings: SettingsState;
}

export interface FloatingDamageText {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: 'hero' | 'crit' | 'poison' | 'thunder' | 'shell';
}

export interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export interface PhaseBreakBanner {
  id: number;
  phase: number;
  stones: number;
}

export interface VictoryRelicDropItem {
  relicId: RelicId;
  tier: RelicTier;
  name: string;
  levelsAdded: number;
  newDropLevel: number;
  crystalLevel: number;
  totalLevel: number;
  isNew: boolean;
}

export interface VictoryOverflowDropItem {
  relicId: RelicId;
  tier: RelicTier;
  name: string;
  count: number;
  crystalsGained: string;
}

export interface VictorySummary {
  tribulationId: TribulationId;
  tribulationName: string;
  clearTimeMs: number;
  rank: SpeedrunRank;
  rankCrystalMult: number;
  crystalsEarned: string;
  overflowCrystalBonus: string;
  isNewRecord: boolean;
  firstClearNote: string | null;
  relicDrops: VictoryRelicDropItem[];
  convertedOverflowDrops: VictoryOverflowDropItem[];
  grantedRelicUpgrades: {
    relicId: RelicId;
    name: string;
    levelsAdded: number;
    newLevel: number;
  }[];
  mythicDropped: {
    relicId: RelicId;
    name: string;
    newLevel: number;
    isNew: boolean;
  } | null;
  unlockedNextOrder: number | null;
  unlockedSssAutoRepeat: boolean;
  nextUnlockProgress: {
    nextOrder: number;
    nextName: string;
    prevClears: number;
    reqClears: number;
    totalRelicLevels: number;
    reqRelicLevels: number;
  } | null;
}

export interface ArchetypeConfig {
  id: ArchetypeId;
  slotIndex: number;
  name: string;
  roleTag: string;
  unlockCostCrystals: number;
  baseInterval: number;
  dmgFactor: number;
  poisonFactor?: number;
  baseCritRate: number;
  baseCritDmg: number;
  baseCost: number;
  growthRate: number;
  talent1Name: string;
  talent1Desc: string;
  talent2Name: string;
  talent2Desc: string;
  recommendedInnate: InnateAffixId;
}

export interface AffixConfig {
  id: AffixId;
  name: string;
  tierGroup: '下等' | '中等' | '上等';
  baseValue: number;
  unitKind: 'pct' | 'sec' | 'rate'; // pct -> +X%, sec -> X.XX秒, rate -> +X/秒
  description: string;
}

export interface InnateAffixConfig {
  id: InnateAffixId;
  name: string;
  description: string;
  recommendedFor?: string;
}

export interface RelicConfig {
  id: RelicId;
  tier: RelicTier;
  name: string;
  maxLevel: number | null;
  maxDropLevel: number | null;
  baseCost: number;
  costGrowth: number;
  description: string;
}

export interface BossShellConfig {
  phase: number;
  name: string;
  hpShare: number;
  baseAffixStones: number;
  firstBreakNote?: string;
}

export interface TribulationDebuff {
  directDmgMult?: number;
  autoClickCap?: number;
  stoneMult?: number;
  bossRegenPctPerSec?: number;
  mercIntervalMult?: number;
  manaRegenMult?: number;
  growthRatePenalty?: number;
  stageDecayPerPhase?: number;
}

export interface TribulationConfig {
  id: TribulationId;
  order: number;
  name: string;
  bossTitle: string;
  baseHp: string;
  recommendedLv: string;
  debuffSummary: string;
  debuff: TribulationDebuff;
  baseCrystalReward: number;
  firstClearSummary: string;
  relicDropTier: RelicTier;
  relicDropCount: number;
  unlockReqPrevClears: number;
  unlockReqRelicLevels: number;
  bonusRelicLevels: number;
  mythicDropChance: number;
}
