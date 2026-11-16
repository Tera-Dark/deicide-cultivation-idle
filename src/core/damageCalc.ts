import Decimal from 'break_infinity.js';
import {
  getAffixEffectiveValue,
  rollAffixTier,
  rollRandomAffixId,
} from '../config/affixes';
import { ARCHETYPES } from '../config/archetypes';
import { BOSS_SHELLS, TRIBULATIONS, TRIBULATION_MAP } from '../config/bosses';
import { RELICS } from '../config/relics';
import {
  BASE_HERO_ATK,
  BASE_MANA_CAP,
  BASE_MANA_REGEN,
  BASE_MANUAL_CLICK_MANA,
  LEVEL_SLOT_THRESHOLDS,
  PUPPET_MAX_LEVEL,
  REALM_TIERS,
  SKILLS,
} from '../config/constants';
import type {
  AffixId,
  MercenarySlotState,
  MetaState,
  RelicId,
  RunState,
  SkillId,
  SpeedrunRank,
  TribulationId,
} from '../types/game';
import { toDecimal } from './formatNumber';

export function getRelicTotalLv(meta: MetaState, relicId: RelicId): number {
  return (meta.relicLevels[relicId] ?? 0) + (meta.relicDropLevels?.[relicId] ?? 0);
}

export function getTribulationConfig(id: TribulationId) {
  return TRIBULATION_MAP[id] ?? TRIBULATION_MAP.tier_1;
}

export function getBossTotalHp(tribulationId: TribulationId, meta: MetaState): Decimal {
  const trib = getTribulationConfig(tribulationId);
  let total = toDecimal(trib.baseHp);
  // NG+ scaling on tier_10: each clear multiplies BOSS HP by 1e4
  if (tribulationId === 'tier_10' && meta.ngPlusCount > 0) {
    total = total.mul(Decimal.pow(1e4, meta.ngPlusCount));
  }
  const weakenLv = getRelicTotalLv(meta, 'rel_r_boss_hp');
  const weakenMult = Math.max(0.1, 1 - 0.015 * weakenLv);
  return total.mul(weakenMult).max(100);
}

export function getPhaseMaxHp(
  tribulationId: TribulationId,
  phaseIndex: number,
  meta: MetaState
): Decimal {
  const total = getBossTotalHp(tribulationId, meta);
  const shell = BOSS_SHELLS[Math.min(Math.max(phaseIndex, 0), BOSS_SHELLS.length - 1)];
  return total.mul(shell.hpShare).max(1);
}

export function getRealmInfo(realmLevel: number): {
  level: number;
  name: string;
  reqStones: Decimal;
  reqClicks: number;
  multiplier: Decimal;
  rewardNote: string;
} {
  if (realmLevel < REALM_TIERS.length) {
    const t = REALM_TIERS[realmLevel];
    return {
      level: t.level,
      name: t.name,
      reqStones: new Decimal(t.reqStones),
      reqClicks: t.reqClicks,
      multiplier: new Decimal(t.multiplier),
      rewardNote: t.rewardNote,
    };
  }
  const extra = realmLevel - 4;
  return {
    level: realmLevel,
    name: `古神道躯·${extra}重`,
    reqStones: new Decimal(2e8).mul(Decimal.pow(200, extra)),
    reqClicks: 0,
    multiplier: new Decimal(120).mul(Decimal.pow(4, extra)),
    rewardNote: '古神道躯突破：全伤害额外 ×4',
  };
}

export function getRealmMultiplier(realmLevel: number): Decimal {
  if (realmLevel < REALM_TIERS.length) {
    return new Decimal(REALM_TIERS[realmLevel].multiplier);
  }
  return new Decimal(120).mul(Decimal.pow(4, realmLevel - 4));
}

export function getCostReductionMult(meta: MetaState): number {
  const lv = getRelicTotalLv(meta, 'rel_c_cost_down');
  return Math.max(0.1, 1 - 0.015 * lv);
}

export function getEffectiveGrowthRate(baseGrowth: number, tribulationId: TribulationId): number {
  const trib = getTribulationConfig(tribulationId);
  return baseGrowth + (trib.debuff.growthRatePenalty ?? 0);
}

export function getEffectiveLevel(slot: MercenarySlotState): number {
  if (!slot.unlocked || slot.level <= 0) return 0;
  return slot.innateAffix === 'sp_double_lvl' ? slot.level * 2 : slot.level;
}

export function isSlot5Active(mercs: MercenarySlotState[]): boolean {
  return Boolean(mercs[4]?.unlocked && mercs[4].level > 0);
}

/**
 * Sum percentage affixes on a single mercenary (converted to decimal ratio, e.g. 40% -> 0.40)
 * across all active level slots (EffLevel >= LEVEL_SLOT_THRESHOLDS[slotIdx]).
 */
export function sumMercActiveAffixRatio(
  slot: MercenarySlotState,
  affixId: AffixId,
  isSlot5Unlocked: boolean,
  firstAffixRelicLv: number
): number {
  if (!slot.unlocked || slot.level <= 0) return 0;
  const effLevel = getEffectiveLevel(slot);
  const hasInnateBoost = slot.innateAffix === 'sp_affix_boost';
  let total = 0;
  for (let i = 0; i < LEVEL_SLOT_THRESHOLDS.length; i++) {
    if (effLevel < LEVEL_SLOT_THRESHOLDS[i]) continue;
    const inst = slot.levelAffixes[i];
    if (inst && inst.id === affixId) {
      total +=
        getAffixEffectiveValue(inst, i, isSlot5Unlocked, hasInnateBoost, firstAffixRelicLv) / 100;
    }
  }
  return total;
}

/**
 * Sum non-percentage affixes (seconds or per-second rate) on a single mercenary.
 */
export function sumMercActiveAffixRaw(
  slot: MercenarySlotState,
  affixId: AffixId,
  isSlot5Unlocked: boolean,
  firstAffixRelicLv: number
): number {
  if (!slot.unlocked || slot.level <= 0) return 0;
  const effLevel = getEffectiveLevel(slot);
  const hasInnateBoost = slot.innateAffix === 'sp_affix_boost';
  let total = 0;
  for (let i = 0; i < LEVEL_SLOT_THRESHOLDS.length; i++) {
    if (effLevel < LEVEL_SLOT_THRESHOLDS[i]) continue;
    const inst = slot.levelAffixes[i];
    if (inst && inst.id === affixId) {
      total += getAffixEffectiveValue(inst, i, isSlot5Unlocked, hasInnateBoost, firstAffixRelicLv);
    }
  }
  return total;
}

export function sumAllActiveAffixRatio(
  mercs: MercenarySlotState[],
  affixId: AffixId,
  firstAffixRelicLv: number
): number {
  const s5 = isSlot5Active(mercs);
  let total = 0;
  for (const m of mercs) {
    total += sumMercActiveAffixRatio(m, affixId, s5, firstAffixRelicLv);
  }
  return total;
}

export function sumAllActiveAffixRaw(
  mercs: MercenarySlotState[],
  affixId: AffixId,
  firstAffixRelicLv: number
): number {
  const s5 = isSlot5Active(mercs);
  let total = 0;
  for (const m of mercs) {
    total += sumMercActiveAffixRaw(m, affixId, s5, firstAffixRelicLv);
  }
  return total;
}

export function getMercCheapDiscount(
  slot: MercenarySlotState,
  mercs: MercenarySlotState[],
  meta: MetaState
): number {
  const s5 = isSlot5Active(mercs);
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');
  const raw = sumMercActiveAffixRatio(slot, 'af_t2_cheap', s5, firstAffixRelicLv);
  return Math.min(0.75, raw);
}

export function getGlobalMult(
  run: RunState,
  mercs: MercenarySlotState[],
  meta: MetaState
): Decimal {
  const s5 = isSlot5Active(mercs);
  let totalMercEffLevels = 0;
  let unlockedCount = 0;
  let countEffGte500 = 0;
  let anyMaxGod = false;
  let anyGoldEmpire = false;

  for (const m of mercs) {
    if (m.unlocked && m.level > 0) {
      unlockedCount++;
      const effLv = getEffectiveLevel(m);
      totalMercEffLevels += effLv;
      if (effLv >= 500) countEffGte500++;
      if (m.innateAffix === 'sp_max_god') anyMaxGod = true;
      if (m.innateAffix === 'sp_gold_empire') anyGoldEmpire = true;
    }
  }

  const slot5GlobalMult = s5
    ? Decimal.pow(1.18, Math.floor(totalMercEffLevels / 100))
    : new Decimal(1);
  const maxGodMult = anyMaxGod ? Decimal.pow(2.0, countEffGte500) : new Decimal(1);
  const stoneLog10 = Math.max(0, Math.floor(toDecimal(run.spiritStones).max(1).log10()));
  const goldEmpireMult = anyGoldEmpire ? 1 + stoneLog10 * 0.5 : 1;

  const infDmgCrystalLv = meta.relicLevels.rel_e_inf_dmg ?? 0;
  const infDmgDropLv = meta.relicDropLevels?.rel_e_inf_dmg ?? 0;
  const finalMultCrystalLv = meta.relicLevels.rel_m_final_mult ?? 0;
  const finalMultDropLv = meta.relicDropLevels?.rel_m_final_mult ?? 0;
  const omniBaseLv = getRelicTotalLv(meta, 'rel_m_omni_base');

  const relicGlobalMult = Decimal.pow(1.12, infDmgCrystalLv)
    .mul(Decimal.pow(1.02, infDmgDropLv))
    .mul(Decimal.pow(1.5, finalMultCrystalLv))
    .mul(Decimal.pow(1.06, finalMultDropLv))
    .mul(1 + unlockedCount * 0.2 * omniBaseLv);

  const trib = getTribulationConfig(run.tribulationId);
  const stageDecay = trib.debuff.stageDecayPerPhase
    ? Math.pow(1 - trib.debuff.stageDecayPerPhase, run.phaseIndex)
    : 1;

  return slot5GlobalMult
    .mul(maxGodMult)
    .mul(goldEmpireMult)
    .mul(relicGlobalMult)
    .mul(stageDecay);
}

export function getHeroGrowthPerClick(
  run: RunState,
  mercs: MercenarySlotState[],
  meta: MetaState
): Decimal {
  const L = Math.max(1, run.enlightenmentLevel);
  const flatRelic = getRelicTotalLv(meta, 'rel_c_click_flat');
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');
  const hGrowAffix = sumAllActiveAffixRatio(mercs, 'af_t2_h_grow', firstAffixRelicLv);
  const base = 1 + (L - 1) * (1 + Math.floor(L / 10) * 1.5) + 2 * flatRelic;
  return new Decimal(base).mul(1 + hGrowAffix);
}

export function getSkillEffectiveValues(
  skillId: SkillId,
  level: number,
  mercs: MercenarySlotState[],
  meta: MetaState
) {
  const cfg = SKILLS.find((s) => s.id === skillId)!;
  const cdLv = getRelicTotalLv(meta, 'rel_r_skill_cd');
  const durLv = getRelicTotalLv(meta, 'rel_r_skill_dur');
  const autoSkillLv = getRelicTotalLv(meta, 'rel_m_auto_skill');
  const thunderLv = getRelicTotalLv(meta, 'rel_r_thunder');
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');

  const skillPowerMult = 1 + 0.2 * autoSkillLv;
  const cooldown = cfg.baseCooldown * Math.max(0.2, 1 - 0.016 * cdLv);
  const duration = cfg.baseDuration > 0 ? cfg.baseDuration + 0.5 * durLv : 0;
  const manaCost = autoSkillLv > 0 ? 0 : cfg.manaCost;

  let effectValue = 1;
  if (skillId === 'sk_blood') {
    effectValue = (2.0 + 0.5 * level) * skillPowerMult;
  } else if (skillId === 'sk_clone') {
    effectValue = (5 + 1 * level) * skillPowerMult;
  } else if (skillId === 'sk_thunder') {
    const skillDmgAffix = sumAllActiveAffixRatio(mercs, 'af_t1_skill_d', firstAffixRelicLv);
    effectValue =
      (150 + 50 * level) * (1 + 0.15 * thunderLv) * (1 + skillDmgAffix) * skillPowerMult;
  } else if (skillId === 'sk_sync') {
    effectValue = 0.3 * level * skillPowerMult;
  }

  return { cooldown, duration, manaCost, effectValue, skillPowerMult };
}

export function getHeroStats(
  run: RunState,
  mercs: MercenarySlotState[],
  meta: MetaState,
  nowMs = Date.now()
) {
  const trib = getTribulationConfig(run.tribulationId);
  const globalMult = getGlobalMult(run, mercs, meta);
  const realmMult = getRealmMultiplier(run.realmLevel);
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');

  const heroBuffAffix = run.heroBuffStacks.reduce(
    (sum, s) => (s.expiresAt > nowMs ? sum + s.val : sum),
    0
  );
  const heroAtkAffix = sumAllActiveAffixRatio(mercs, 'af_t1_hero_a', firstAffixRelicLv);
  const heroCritAffix = sumAllActiveAffixRatio(mercs, 'af_t1_hero_c', firstAffixRelicLv);
  const clickMultRelic = getRelicTotalLv(meta, 'rel_c_click_mult');
  const critDmgRelic = getRelicTotalLv(meta, 'rel_r_crit_dmg');

  const baseHero = new Decimal(BASE_HERO_ATK).add(toDecimal(run.accumulatedAtk));
  // HeroBasePower excludes GlobalMult so af_t3_hero_ln does not double-count GlobalMult
  const heroBasePower = baseHero
    .mul(realmMult)
    .mul(1 + heroBuffAffix + heroAtkAffix)
    .mul(1 + 0.25 * clickMultRelic);

  const rawHeroClick = heroBasePower.mul(globalMult).mul(trib.debuff.directDmgMult ?? 1);

  const heroCritChance = Math.min(1, 0.1 + heroCritAffix);
  const heroCritDmgMult = 1.5 + 0.15 * critDmgRelic;
  const expectedHeroClick = rawHeroClick.mul(1 + heroCritChance * (heroCritDmgMult - 1));

  // Mana & Regen
  const manaCap =
    BASE_MANA_CAP +
    4 * getRelicTotalLv(meta, 'rel_c_mana_cap') +
    (run.realmLevel >= 4 ? 50 : 0);
  const manaRegenAffix = sumAllActiveAffixRaw(mercs, 'af_t1_mana_r', firstAffixRelicLv);
  const baseRegen = BASE_MANA_REGEN + (run.realmLevel >= 4 ? 1.5 : 0) + manaRegenAffix;
  const manaRegenPerSec = baseRegen * (trib.debuff.manaRegenMult ?? 1);
  const manualClickManaGain =
    (BASE_MANUAL_CLICK_MANA + 0.05 * getRelicTotalLv(meta, 'rel_c_mana_click')) *
    (trib.debuff.manaRegenMult ?? 1);

  // Puppet (Auto-clicker)
  const puppetRelicLv = getRelicTotalLv(meta, 'rel_c_puppet_spd');
  const puppetAffix = sumAllActiveAffixRaw(mercs, 'af_t2_puppet', firstAffixRelicLv);
  let puppetRate =
    run.puppetLevel > 0
      ? 1.5 + (run.puppetLevel - 1) * 0.35 + 0.2 * puppetRelicLv + puppetAffix
      : 0;
  if (trib.debuff.autoClickCap) {
    puppetRate = Math.min(puppetRate, trib.debuff.autoClickCap);
  }

  const growthPerClick = getHeroGrowthPerClick(run, mercs, meta);
  const isSoftCapped = toDecimal(run.accumulatedAtk).gte(growthPerClick.mul(500));

  return {
    baseHero,
    realmMult,
    heroBuffPct: heroBuffAffix,
    heroBasePower,
    rawHeroClick,
    expectedHeroClick,
    heroCritChance,
    heroCritDmgMult,
    manaCap,
    manaRegenPerSec,
    manualClickManaGain,
    puppetRate,
    puppetMaxLevel: PUPPET_MAX_LEVEL,
    growthPerClick,
    isSoftCapped,
  };
}

export function getMercPanelBaseDirect(
  slot: MercenarySlotState,
  sharedHeroGrowth: Decimal
): Decimal {
  if (!slot.unlocked || slot.level <= 0) return new Decimal(0);
  const arch = ARCHETYPES[slot.archetype];
  const effLv = getEffectiveLevel(slot);
  const milestoneCount = LEVEL_SLOT_THRESHOLDS.filter((m) => effLv >= m).length;
  const milestoneMult = Decimal.pow(2.0, milestoneCount);
  return new Decimal(4 * arch.dmgFactor * effLv)
    .mul(Decimal.pow(1.018, effLv))
    .add(sharedHeroGrowth)
    .mul(milestoneMult);
}

export interface MercComputedStats {
  effLevel: number;
  rawDmg: Decimal;
  expectedDmg: Decimal;
  poisonPanelPerSec: Decimal;
  interval: number;
  overflowSpdMult: number;
  critRate: number;
  critDmg: number;
  doubleHitChance: number;
  tripleHitChance: number;
  clickTrigChance: number;
  heroBuffOnHit: number;
  poisonPopChance: number;
  cdReduceCanSec: number;
  jackpotChance: number;
  manaOnHitChance: number;
  dpsEstimate: Decimal;
}

export function getMercenaryComputedStats(
  slotIndex: number,
  mercs: MercenarySlotState[],
  run: RunState,
  meta: MetaState,
  heroBasePower: Decimal,
  rawHeroClick: Decimal,
  globalMult: Decimal
): MercComputedStats {
  const slot = mercs[slotIndex];
  if (!slot || !slot.unlocked || slot.level <= 0) {
    return {
      effLevel: 0,
      rawDmg: new Decimal(0),
      expectedDmg: new Decimal(0),
      poisonPanelPerSec: new Decimal(0),
      interval: 1,
      overflowSpdMult: 1,
      critRate: 0,
      critDmg: 1.5,
      doubleHitChance: 0,
      tripleHitChance: 0,
      clickTrigChance: 0,
      heroBuffOnHit: 0,
      poisonPopChance: 0,
      cdReduceCanSec: 0,
      jackpotChance: 0,
      manaOnHitChance: 0,
      dpsEstimate: new Decimal(0),
    };
  }

  const arch = ARCHETYPES[slot.archetype];
  const trib = getTribulationConfig(run.tribulationId);
  const s5 = isSlot5Active(mercs);
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');
  const critDmgRelic = getRelicTotalLv(meta, 'rel_r_crit_dmg');
  const arrayRelicLv = getRelicTotalLv(meta, 'rel_r_array_buff');
  const sharedHeroGrowth = toDecimal(run.sharedHeroGrowth);

  const sumSelf = (id: AffixId) =>
    sumMercActiveAffixRatio(slot, id, s5, firstAffixRelicLv);
  const sumSelfRaw = (id: AffixId) =>
    sumMercActiveAffixRaw(slot, id, s5, firstAffixRelicLv);

  // Step 1 & 2: EffLevel & PanelBase
  const effLevel = getEffectiveLevel(slot);
  let panelBase = getMercPanelBaseDirect(slot, sharedHeroGrowth);

  // Step 3: Slot 5 converges 500% of Slot 1~4 PanelBase
  if (slotIndex === 4) {
    let sum1to4 = new Decimal(0);
    for (let k = 0; k < 4; k++) {
      if (mercs[k]?.unlocked && mercs[k].level > 0) {
        sum1to4 = sum1to4.add(getMercPanelBaseDirect(mercs[k], sharedHeroGrowth));
      }
    }
    panelBase = panelBase.add(sum1to4.mul(5.0));
  }

  // Step 4: Self affixes & Cross-merc synergies
  const poisonScaleBonus = Math.min(
    50.0,
    Math.floor(run.poisonStacks / 10) * sumSelf('af_t3_p_scale')
  );
  const earlyBonus = run.phaseIndex <= 4 ? sumSelf('af_t1_early') : 0;
  const lateBonus = run.phaseIndex >= 5 ? sumSelf('af_t1_late') : 0;
  const hpRatio = toDecimal(run.bossHp).div(toDecimal(run.bossMaxHp).max(1)).toNumber();
  const executeBonus = hpRatio < 0.3 ? sumSelf('af_t2_execute') : 0;
  const stackBonus = Math.min(100, Math.floor(slot.attackCount / 50)) * sumSelf('af_t2_stack');
  const flatLvBonus = Math.floor(effLevel / 25) * sumSelf('af_t1_flat_lv');

  const affixSelfMult =
    1 + sumSelf('af_t1_atk') + earlyBonus + lateBonus + executeBonus + stackBonus + flatLvBonus;
  const centuryMult = Decimal.pow(
    1 + sumSelf('af_t2_century'),
    Math.floor(effLevel / 100)
  );

  const loneSelf = sumSelf('af_t3_lone');
  let otherLoneCount = 0;
  for (let j = 0; j < mercs.length; j++) {
    if (j === slotIndex) continue;
    const other = mercs[j];
    if (other?.unlocked && other.level > 0) {
      if (sumMercActiveAffixRatio(other, 'af_t3_lone', s5, firstAffixRelicLv) > 0) {
        otherLoneCount++;
      }
    }
  }
  const loneWolfMult = (1 + loneSelf) * Math.pow(0.75, otherLoneCount);

  let adjBuff = 0;
  for (const neighborIdx of [slotIndex - 1, slotIndex + 1]) {
    const nSlot = mercs[neighborIdx];
    if (nSlot?.unlocked && nSlot.level > 0) {
      adjBuff += sumMercActiveAffixRatio(nSlot, 'af_t3_adj_dmg', s5, firstAffixRelicLv);
    }
  }

  const slot1EffLv = mercs[0]?.unlocked ? getEffectiveLevel(mercs[0]) : 0;
  const slot2EffLv = mercs[1]?.unlocked ? getEffectiveLevel(mercs[1]) : 0;
  const slot3EffLv = mercs[2]?.unlocked ? getEffectiveLevel(mercs[2]) : 0;
  const slot4EffLv = mercs[3]?.unlocked ? getEffectiveLevel(mercs[3]) : 0;
  const totalEffLevels = mercs.reduce((s, m) => s + getEffectiveLevel(m), 0);

  const crossSelfSynergy =
    Math.floor(slot1EffLv / 10) * sumSelf('af_t3_sword_s') +
    Math.floor(slot2EffLv / 10) * sumSelf('af_t3_tent_s') +
    Math.floor(totalEffLevels / 50) * sumSelf('af_t3_total_l');
  const arrTeamBonus = sumAllActiveAffixRatio(mercs, 'af_t3_arr_s', firstAffixRelicLv);

  const crossMercSynergyMult =
    (1 + crossSelfSynergy + arrTeamBonus * Math.floor(slot4EffLv / 10) + poisonScaleBonus) *
    (1 + adjBuff) *
    loneWolfMult;

  // Step 5: Slot 4 Aura (Slot 1~3) + Specialty Relics + Hero Link
  const slot4AuraMult =
    mercs[3]?.unlocked && mercs[3].level > 0 && slotIndex <= 2
      ? 1 + slot4EffLv * 0.06 * (1 + 0.08 * arrayRelicLv)
      : 1;

  let mercRelicMult = 1.0;
  if (slotIndex === 0) mercRelicMult = 1 + 0.4 * getRelicTotalLv(meta, 'rel_r_sword_dmg');
  else if (slotIndex === 1) mercRelicMult = 1 + 0.4 * getRelicTotalLv(meta, 'rel_r_tentacle');
  else if (slotIndex === 2) mercRelicMult = 1 + 0.55 * getRelicTotalLv(meta, 'rel_r_cannon_dmg');

  const heroLinkAdd = heroBasePower.mul(sumSelf('af_t3_hero_ln'));

  // Step 6: Attack Interval, 0.05s Overflow Mult, Crit & Final Damage
  const baseInt =
    slotIndex === 2 && slot.innateAffix === 'sp_cannon_gat'
      ? arch.baseInterval * 0.5
      : arch.baseInterval;
  const spdBonus =
    sumSelf('af_t1_spd') + sumAllActiveAffixRatio(mercs, 'af_t3_team_sp', firstAffixRelicLv);
  const skill4 = run.skills.sk_sync;
  const skill4Active = skill4.activeRemaining > 0;
  const skill4Spd = skill4Active ? 1.5 : 1.0;
  const rawInterval = (baseInt * (trib.debuff.mercIntervalMult ?? 1)) / ((1 + spdBonus) * skill4Spd);
  const interval = Math.max(0.05, rawInterval);
  const overflowSpdMult = rawInterval < 0.05 ? 0.05 / rawInterval : 1.0;

  const rawCritRate = arch.baseCritRate + sumSelf('af_t1_crit_r');
  const hasOmniCrit = slot.innateAffix === 'sp_omni_crit';
  const critRate = hasOmniCrit ? 1.0 : Math.min(1.0, rawCritRate);
  const omniOverflowDmg = hasOmniCrit && rawCritRate > 1.0 ? (rawCritRate - 1.0) * 3.0 : 0;
  const critDmg =
    arch.baseCritDmg +
    sumSelf('af_t1_crit_d') +
    Math.floor(slot3EffLv / 10) * sumSelf('af_t3_can_s') +
    0.15 * critDmgRelic +
    omniOverflowDmg;

  let rawDmg = panelBase
    .mul(affixSelfMult)
    .mul(centuryMult)
    .mul(crossMercSynergyMult)
    .mul(slot4AuraMult)
    .mul(mercRelicMult)
    .mul(overflowSpdMult)
    .add(heroLinkAdd)
    .mul(globalMult)
    .mul(trib.debuff.directDmgMult ?? 1);

  if (slotIndex === 2 && run.phaseIndex >= 5) {
    rawDmg = rawDmg.mul(3);
  }

  const skill4Bonus = skill4Active
    ? rawHeroClick.mul(getSkillEffectiveValues('sk_sync', skill4.level, mercs, meta).effectValue)
    : new Decimal(0);

  const expectedSingleHit = rawDmg.mul(1 + critRate * (critDmg - 1)).add(skill4Bonus);

  // Poison panel per stack per second for Slot 2 (uses poisonFactor 0.45)
  let poisonPanelPerSec = new Decimal(0);
  if (slotIndex === 1) {
    const milestoneCount = LEVEL_SLOT_THRESHOLDS.filter((m) => effLevel >= m).length;
    const milestoneMult = Decimal.pow(2.0, milestoneCount);
    const poisonBasePanel = new Decimal(4 * (arch.poisonFactor ?? 0.45) * effLevel)
      .mul(Decimal.pow(1.018, effLevel))
      .add(sharedHeroGrowth)
      .mul(milestoneMult);

    const poisonAffixSum = sumAllActiveAffixRatio(mercs, 'af_t1_poison', firstAffixRelicLv);
    const tentSymbiosisSum = sumAllActiveAffixRatio(mercs, 'af_t3_tent_s', firstAffixRelicLv);
    const tentRelic = 1 + 0.4 * getRelicTotalLv(meta, 'rel_r_tentacle');

    poisonPanelPerSec = poisonBasePanel
      .mul(1 + poisonAffixSum)
      .mul(1 + Math.floor(effLevel / 10) * tentSymbiosisSum)
      .mul(tentRelic)
      .mul(globalMult);
  }

  const doubleHitChance = Math.min(1.0, sumSelf('af_t2_double'));
  const tripleHitChance = Math.min(1.0, sumSelf('af_t2_triple'));
  const clickTrigChance = Math.min(1.0, sumSelf('af_t3_click_t'));
  const heroBuffOnHit = sumSelf('af_t3_buff_h');
  const poisonPopChance = Math.min(1.0, sumSelf('af_t3_pop_dot'));
  const cdReduceCanSec = sumSelfRaw('af_t3_cd_can');
  const jackpotChance = Math.min(1.0, sumSelf('af_t2_jackpot'));
  const manaOnHitChance = Math.min(1.0, sumSelf('af_t2_mana_h'));

  const baseVolley =
    slot.innateAffix === 'sp_sword_storm' ? 5 : slot.innateAffix === 'sp_cannon_gat' ? 3 : 1;
  const talent1Extra = slotIndex === 0 ? 0.2 * 2 : 0; // 20% chance of 2 extra strikes
  const expectedStrikesPerAttack =
    baseVolley + talent1Extra + doubleHitChance + tripleHitChance * 3;
  const dpsEstimate = expectedSingleHit.mul(expectedStrikesPerAttack).div(interval);

  return {
    effLevel,
    rawDmg,
    expectedDmg: expectedSingleHit,
    poisonPanelPerSec,
    interval,
    overflowSpdMult,
    critRate,
    critDmg,
    doubleHitChance,
    tripleHitChance,
    clickTrigChance,
    heroBuffOnHit,
    poisonPopChance,
    cdReduceCanSec,
    jackpotChance,
    manaOnHitChance,
    dpsEstimate,
  };
}

export function getPoisonTickExpectedDamage(
  mercs: MercenarySlotState[],
  run: RunState,
  meta: MetaState,
  heroBasePower: Decimal,
  rawHeroClick: Decimal,
  globalMult: Decimal
): { rawPoison: Decimal; critChance: number; critDmg: number; expectedPoison: Decimal } {
  if (run.poisonStacks <= 0 || !mercs[1]?.unlocked || mercs[1].level <= 0) {
    return {
      rawPoison: new Decimal(0),
      critChance: 0,
      critDmg: 1,
      expectedPoison: new Decimal(0),
    };
  }

  const st2 = getMercenaryComputedStats(
    1,
    mercs,
    run,
    meta,
    heroBasePower,
    rawHeroClick,
    globalMult
  );
  const rawPoison = st2.poisonPanelPerSec.mul(run.poisonStacks);
  const dotCritLv = getRelicTotalLv(meta, 'rel_e_dot_crit');
  if (dotCritLv <= 0) {
    return { rawPoison, critChance: 0, critDmg: 1, expectedPoison: rawPoison };
  }
  const critChance = Math.min(1, 0.3 + 0.04 * dotCritLv);
  const critDmg =
    2.0 + 0.4 * dotCritLv + 0.15 * getRelicTotalLv(meta, 'rel_r_crit_dmg');
  const expectedPoison = rawPoison.mul(1 + critChance * (critDmg - 1));
  return { rawPoison, critChance, critDmg, expectedPoison };
}

export function getSpiritStoneMultiplier(
  mercs: MercenarySlotState[],
  run: RunState,
  meta: MetaState
): number {
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');
  const arrayRelicLv = getRelicTotalLv(meta, 'rel_r_array_buff');
  const slot4Unlocked = Boolean(mercs[3]?.unlocked && mercs[3].level > 0);
  const slot4EffLv = slot4Unlocked ? getEffectiveLevel(mercs[3]) : 0;
  const slot4GoldBonus = slot4Unlocked
    ? (1.2 + slot4EffLv * 0.04) * (1 + 0.08 * arrayRelicLv)
    : 0;

  const goldAffix = sumAllActiveAffixRatio(mercs, 'af_t2_gold', firstAffixRelicLv);
  const stoneRelicLv = getRelicTotalLv(meta, 'rel_c_stone_gain');

  // StagePenalty: Phase 1~3 = 1.0; Phase 4~6 = 0.6; Phase 7~8 = 0.3; Phase 9~10 = 0.1
  const stagePenalty =
    run.phaseIndex <= 2 ? 1.0 : run.phaseIndex <= 5 ? 0.6 : run.phaseIndex <= 7 ? 0.3 : 0.1;

  const trib = getTribulationConfig(run.tribulationId);
  const tierDebuff = trib.debuff.stoneMult ?? 1;

  return (
    0.15 *
    (1 + slot4GoldBonus + goldAffix + 0.15 * stoneRelicLv) *
    stagePenalty *
    tierDebuff
  );
}

export function evaluateSpeedrunRank(
  clearTimeMs: number,
  tribOrder = 1
): {
  rank: SpeedrunRank;
  crystalMult: number;
  bonusRelicLevels: number;
} {
  const sec = clearTimeMs / 1000;
  const topTier = tribOrder >= 9;
  if (sec < 15) return { rank: 'SSS', crystalMult: 6.0, bonusRelicLevels: topTier ? 1 : 0 };
  if (sec < 180) return { rank: 'S', crystalMult: 3.5, bonusRelicLevels: topTier ? 1 : 0 };
  if (sec < 600) return { rank: 'A', crystalMult: 2.0, bonusRelicLevels: 0 };
  if (sec < 1800) return { rank: 'B', crystalMult: 1.5, bonusRelicLevels: 0 };
  return { rank: 'C', crystalMult: 1.0, bonusRelicLevels: 0 };
}

export function getTotalRelicLevels(meta: MetaState): number {
  let total = 0;
  for (const r of RELICS) {
    total += getRelicTotalLv(meta, r.id);
  }
  return total;
}

export function getNextTribulationUnlockState(meta: MetaState): {
  nextTrib: (typeof TRIBULATIONS)[number] | null;
  prevTribId: TribulationId | null;
  prevClears: number;
  reqClears: number;
  totalRelicLevels: number;
  reqRelicLevels: number;
  canUnlock: boolean;
} {
  const nextOrder = meta.highestUnlockedOrder + 1;
  const totalRelicLevels = getTotalRelicLevels(meta);
  if (nextOrder > TRIBULATIONS.length) {
    return {
      nextTrib: null,
      prevTribId: null,
      prevClears: 0,
      reqClears: 0,
      totalRelicLevels,
      reqRelicLevels: 0,
      canUnlock: false,
    };
  }
  const nextTrib = TRIBULATIONS.find((t) => t.order === nextOrder)!;
  const prevTrib = TRIBULATIONS.find((t) => t.order === nextOrder - 1)!;
  const prevClears = meta.clearCounts?.[prevTrib.id] ?? 0;
  return {
    nextTrib,
    prevTribId: prevTrib.id,
    prevClears,
    reqClears: nextTrib.unlockReqPrevClears,
    totalRelicLevels,
    reqRelicLevels: nextTrib.unlockReqRelicLevels,
    canUnlock:
      prevClears >= nextTrib.unlockReqPrevClears &&
      totalRelicLevels >= nextTrib.unlockReqRelicLevels,
  };
}

export { rollAffixTier, rollRandomAffixId };
