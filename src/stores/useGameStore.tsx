import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Decimal from 'break_infinity.js';
import {
  AFFIXES,
  AFFIX_TIER_META,
  INNATE_AFFIXES,
  getNextAffixTier,
  getQuenchCost,
  rollAffixTier,
  rollRandomAffixId,
  rollRandomInnateAffix,
} from '../config/affixes';
import { ARCHETYPES } from '../config/archetypes';
import { BOSS_SHELLS, TRIBULATION_MAP, TRIBULATIONS } from '../config/bosses';
import {
  AD_STONE_BOOST_DURATION_MS,
  AD_STONE_BOOST_MULT,
  BASE_START_MANA,
  CANNON_CHARGE_SEC_PER_15_ATTACKS,
  ENLIGHTENMENT_BASE_COST,
  JACKPOT_OVERFLOW_RATE,
  ENLIGHTENMENT_COST_GROWTH,
  FLOATING_TEXT_MIN_INTERVAL_MS,
  LEVEL_SLOT_THRESHOLDS,
  MAX_ATTACKS_PER_SEC,
  MAX_CANNON_CHARGE_SEC_PER_SEC,
  MAX_DAILY_AD_STONE_BOOSTS,
  MAX_JACKPOT_PROCS_PER_SEC,
  MAX_ONSCREEN_FLOATING_TEXTS,
  MAX_ONSCREEN_RIPPLES,
  MERC_SLOT_CRYSTAL_COSTS,
  PHASE_BANNER_MIN_INTERVAL_MS,
  PUPPET_COST_GROWTH,
  PUPPET_MAX_LEVEL,
  PUPPET_UNLOCK_COST,
  REALM_TIERS,
  RIPPLE_MIN_INTERVAL_MS,
  SKILLS,
  TOAST_DURATION_MS,
} from '../config/constants';
import {
  RELICS,
  RELIC_MAP,
  RELIC_TIER_META,
  getRelicLevelsBreakdown,
  rollTribulationRelicTier,
} from '../config/relics';
import {
  evaluateSpeedrunRank,
  getBatchRerollCost,
  getCostReductionMult,
  getEffectiveGrowthRate,
  getGlobalMult,
  getHeroGrowthPerClick,
  getHeroStats,
  getMercCheapDiscount,
  getMercenaryComputedStats,
  getNextTribulationUnlockState,
  getPhaseMaxHp,
  getPoisonTickExpectedDamage,
  getRealmInfo,
  getRelicCrystalBonusMult,
  getRelicTotalLv,
  getShellStoneExpectation,
  getSingleRerollCost,
  getSkillEffectiveValues,
  getSpiritStoneMultiplier,
  getTeamCombatDpsBreakdown,
  getTribulationConfig,
  isSlot5Active,
  rollStoneDrops,
  rollTribulationStoneDrops,
  sumMercActiveAffixRatio,
} from '../core/damageCalc';
import { calculateBulkUpgrade, formatNumber, toDecimal } from '../core/formatNumber';
import {
  cloudSaveAvailable,
  cloudUploadCooldownRemaining,
  getLastCloudUploadAt,
  ensureTapLogin,
  flushCloudSave,
  loadCloudSave,
  scheduleCloudSave,
  subscribeAppLifecycle,
} from '../platform/tap';
import { track } from '../platform/telemetry';
import type {
  AffixInstance,
  ArchetypeId,
  AutoUpgradeSettings,
  BuyMode,
  ClickRipple,
  CloudRestoreResult,
  FloatingDamageText,
  FloatingTextMode,
  GameSaveData,
  InnateAffixId,
  MercenarySlotState,
  MetaState,
  NumberDisplayMode,
  OfflineSummary,
  PhaseBreakBanner,
  RelicId,
  RunState,
  SettingsState,
  SilentClearReport,
  SkillId,
  TribulationId,
  TutorialNodeId,
  VictoryOverflowDropItem,
  VictoryRelicDropItem,
  VictorySummary,
} from '../types/game';
import { soundEngine } from '../utils/audio';

const STORAGE_KEY = 'shishen_daoguo_v35_save';
const TICK_MS = 50; // 20Hz logic tick
const UI_SYNC_MS = 100; // UI 10Hz，逻辑仍为 20Hz
const DAILY_CHEST_CRYSTALS = 3;
const DAILY_CHEST_AFFIX_STONES = 5;
const MAX_DAILY_AD_REROLLS = 3;

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const FIXED_SLOT_ARCHETYPES: ArchetypeId[] = [
  'merc_sword',
  'merc_tentacle',
  'merc_cannon',
  'merc_array',
  'merc_god',
];

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/** 读取存档（Base64 或原始 JSON）的保存时间戳；解析失败返回 0（不阻断恢复） */
function peekSaveTimestamp(raw: string): number {
  try {
    const json = raw.trim().startsWith('{') ? raw : decodeBase64Utf8(raw);
    const parsed = JSON.parse(json) as { savedAt?: unknown };
    return typeof parsed.savedAt === 'number' && Number.isFinite(parsed.savedAt)
      ? parsed.savedAt
      : 0;
  } catch {
    return 0;
  }
}

export function createInitialMetaState(): MetaState {
  const relicLevels = {} as Record<RelicId, number>;
  const relicDropLevels = {} as Record<RelicId, number>;
  for (const r of RELICS) {
    relicLevels[r.id] = 0;
    relicDropLevels[r.id] = 0;
  }
  const clearedTribulations = {} as Record<TribulationId, boolean>;
  const clearCounts = {} as Record<TribulationId, number>;
  for (const t of TRIBULATIONS) {
    clearedTribulations[t.id] = false;
    clearCounts[t.id] = 0;
  }
  return {
    affixStones: 0,
    divineCrystals: '0',
    hasUnlockedPuppet: false,
    firstBreakGiftsClaimed: 0,
    unlockedBulkBuy: false,
    unlockedRelicHall: false,
    unlockedAffixLock: false,
    unlockedInnateReroll: false,
    unlockedEpicPool: false,
    unlockedAutoSkill: false,
    unlockedAutoRealm: false,
    unlockedAutoHeroUpgrades: false,
    unlockedAutoMercUpgrade: false,
    autoSettings: {
      autoRealm: false,
      autoPuppet: false,
      autoEnlightenment: false,
      autoSkills: false,
      autoMercs: false,
      autoMercSlots: [true, true, true, true, true],
    },
    hasSeenIntro: false,
    shownTutorials: {
      tut_phase1: false,
      tut_merc1: false,
      tut_affix: false,
      tut_tier1_win: false,
    },
    clearedTribulations,
    clearCounts,
    ngPlusCount: 0,
    relicLevels,
    relicDropLevels,
    rerollPity: 0,
    highestUnlockedOrder: 1,
    bestClearTimesMs: {},
    sssUnlockedAutoRepeat: {},
    autoRepeatEnabled: false,
    totalSlays: 0,
    totalRestarts: 0,
    totalPlayTimeMs: 0,
    totalClicks: '0',
    highestDps: '0',
    totalRerolls: 0,
    lastDailyChestDay: '',
    lastAdRerollDay: '',
    adRerollsToday: 0,
    adFreeRerollTokens: 0,
    adStoneBoostUntil: 0,
    adStoneBoostMult: 1,
    lastAdStoneBoostDay: '',
    adStoneBoostsToday: 0,
  };
}

export function createInitialMercsState(): MercenarySlotState[] {
  return [0, 1, 2, 3, 4].map((slotIndex) => {
    const archetype = FIXED_SLOT_ARCHETYPES[slotIndex];
    return {
      slotIndex,
      unlocked: false,
      archetype,
      level: 1,
      innateAffix: ARCHETYPES[archetype].recommendedInnate,
      pendingInnateAffix: null,
      unlockedLevelSlots: 0,
      levelAffixes: Array(10).fill(null) as (AffixInstance | null)[],
      lockedLevelSlots: Array(10).fill(false) as boolean[],
      pendingLevelAffixes: null,
      attackTimer: 0,
      attackCount: 0,
    };
  });
}

export function resetMercsForNewRun(mercs: MercenarySlotState[]): MercenarySlotState[] {
  return mercs.map((m) => ({
    ...m,
    level: 1,
    attackTimer: 0,
    attackCount: 0,
  }));
}

export function createInitialRunState(
  tribulationId: TribulationId,
  meta: MetaState,
  prevSkillAutoCast?: Partial<Record<SkillId, boolean>>
): RunState {
  const phase0Max = getPhaseMaxHp(tribulationId, 0, meta);
  const startGoldCrystalLv = meta.relicLevels.rel_c_start_gold ?? 0;
  const startGoldDropLv = meta.relicDropLevels?.rel_c_start_gold ?? 0;
  const startStones =
    startGoldCrystalLv + startGoldDropLv > 0
      ? new Decimal(400)
          .mul(Decimal.pow(1.35, startGoldCrystalLv))
          .mul(1 + 0.25 * startGoldDropLv)
      : new Decimal(0);

  const hourglassCrystalLv = meta.relicLevels.rel_e_auto_start ?? 0;
  const hourglassDropLv = meta.relicDropLevels?.rel_e_auto_start ?? 0;
  const hourglassTotalLv = hourglassCrystalLv + hourglassDropLv;
  const startAccumulated =
    hourglassTotalLv > 0
      ? new Decimal(500)
          .mul(Decimal.pow(1.28, hourglassCrystalLv))
          .mul(1 + 0.25 * hourglassDropLv)
      : new Decimal(0);
  const freePuppetLv =
    hourglassTotalLv > 0 ? Math.min(PUPPET_MAX_LEVEL, 2 * hourglassTotalLv) : 0;

  return {
    tribulationId,
    phaseIndex: 0,
    bossHp: phase0Max.toString(),
    bossMaxHp: phase0Max.toString(),
    poisonStacks: 0,
    spiritStones: startStones.toString(),
    mana: BASE_START_MANA,
    clickStacks: '0',
    manualClicks: 0,
    swordAndHeroAttacksForCannon: 0,
    enlightenmentLevel: 1,
    accumulatedAtk: startAccumulated.toString(),
    sharedHeroGrowth: '0',
    realmLevel: 0,
    puppetLevel: freePuppetLv,
    skills: {
      sk_blood: {
        level: 1,
        activeRemaining: 0,
        cooldownRemaining: 0,
        autoCast: prevSkillAutoCast?.sk_blood ?? false,
      },
      sk_clone: {
        level: 1,
        activeRemaining: 0,
        cooldownRemaining: 0,
        autoCast: prevSkillAutoCast?.sk_clone ?? false,
      },
      sk_thunder: {
        level: 1,
        activeRemaining: 0,
        cooldownRemaining: 0,
        autoCast: prevSkillAutoCast?.sk_thunder ?? false,
      },
      sk_sync: {
        level: 1,
        activeRemaining: 0,
        cooldownRemaining: 0,
        autoCast: prevSkillAutoCast?.sk_sync ?? false,
      },
    },
    manaSpentThisRun: 0,
    heroBuffStacks: [],
    timerStarted: false,
    elapsedMs: 0,
    runCompleted: false,
    recentTickDps: {
      hero: '0',
      poison: '0',
      mercs: ['0', '0', '0', '0', '0'],
      bonus: '0',
    },
  };
}

function normalizeTenSlots<T>(arr: unknown, fallbackValue: T): T[] {
  const res: T[] = Array(10).fill(fallbackValue);
  if (Array.isArray(arr)) {
    for (let i = 0; i < Math.min(10, arr.length); i++) {
      res[i] = arr[i] as T;
    }
  }
  return res;
}

function safeInt(val: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeFloat(val: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function safeDecimalStr(val: unknown, fallback = '0'): string {
  if (val === null || val === undefined) return fallback;
  try {
    const d = new Decimal(val as string | number);
    if (!Number.isFinite(d.mantissa) || Number.isNaN(d.mantissa)) return fallback;
    return d.lt(0) ? fallback : d.toString();
  } catch {
    return fallback;
  }
}

function sanitizeAffixInstance(raw: unknown): AffixInstance | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { id?: unknown; tier?: unknown };
  if (typeof obj.id !== 'string' || !(obj.id in AFFIXES)) return null;
  if (typeof obj.tier !== 'string' || !(obj.tier in AFFIX_TIER_META)) return null;
  return {
    id: obj.id as AffixInstance['id'],
    tier: obj.tier as AffixInstance['tier'],
  };
}

function sanitizeMetaState(raw: Partial<MetaState> | undefined, defaultMeta: MetaState): MetaState {
  const src = raw ?? {};
  const relicLevels = { ...defaultMeta.relicLevels };
  if (src.relicLevels && typeof src.relicLevels === 'object') {
    for (const r of RELICS) {
      const lv = safeInt((src.relicLevels as Record<string, unknown>)[r.id], 0, 0, 100000);
      relicLevels[r.id] = r.maxLevel !== null ? Math.min(r.maxLevel, lv) : lv;
    }
  }

  const relicDropLevels = { ...defaultMeta.relicDropLevels };
  if (src.relicDropLevels && typeof src.relicDropLevels === 'object') {
    for (const r of RELICS) {
      const dlv = safeInt((src.relicDropLevels as Record<string, unknown>)[r.id], 0, 0, 1000000);
      relicDropLevels[r.id] = r.maxDropLevel !== null ? Math.min(r.maxDropLevel, dlv) : dlv;
    }
  }

  const clearedTribulations = { ...defaultMeta.clearedTribulations };
  const clearCounts = { ...defaultMeta.clearCounts };
  const bestClearTimesMs: Partial<Record<TribulationId, number>> = {};
  const sssUnlockedAutoRepeat: Partial<Record<TribulationId, boolean>> = {};
  for (const t of TRIBULATIONS) {
    clearedTribulations[t.id] = Boolean(src.clearedTribulations?.[t.id]);
    const rawCount = (src.clearCounts as Record<string, unknown> | undefined)?.[t.id];
    clearCounts[t.id] = safeInt(rawCount, clearedTribulations[t.id] ? 1 : 0, 0);
    const rawBest = src.bestClearTimesMs?.[t.id];
    if (typeof rawBest === 'number' && Number.isFinite(rawBest) && rawBest > 0) {
      bestClearTimesMs[t.id] = rawBest;
    }
    if (src.sssUnlockedAutoRepeat?.[t.id]) {
      sssUnlockedAutoRepeat[t.id] = true;
    }
  }

  const highestUnlockedOrder = safeInt(src.highestUnlockedOrder, 1, 1, TRIBULATIONS.length);
  for (let i = 0; i < TRIBULATIONS.length - 1; i++) {
    const cur = TRIBULATIONS[i];
    const next = TRIBULATIONS[i + 1];
    if (next.order <= highestUnlockedOrder) {
      clearCounts[cur.id] = Math.max(clearCounts[cur.id], next.unlockReqPrevClears);
    }
  }

  return {
    affixStones: safeInt(src.affixStones, 0, 0),
    divineCrystals: safeDecimalStr(src.divineCrystals, '0'),
    hasUnlockedPuppet: Boolean(src.hasUnlockedPuppet),
    firstBreakGiftsClaimed: safeInt(src.firstBreakGiftsClaimed, 0, 0, 10),
    unlockedBulkBuy: Boolean(src.unlockedBulkBuy),
    unlockedRelicHall: Boolean(src.unlockedRelicHall),
    unlockedAffixLock: Boolean(src.unlockedAffixLock),
    unlockedInnateReroll: Boolean(src.unlockedInnateReroll),
    unlockedEpicPool: Boolean(src.unlockedEpicPool),
    unlockedAutoSkill: Boolean(src.unlockedAutoSkill),
    unlockedAutoRealm: Boolean(src.unlockedAutoRealm || clearedTribulations.tier_3),
    unlockedAutoHeroUpgrades: Boolean(src.unlockedAutoHeroUpgrades || clearedTribulations.tier_5),
    unlockedAutoMercUpgrade: Boolean(src.unlockedAutoMercUpgrade || clearedTribulations.tier_6),
    autoSettings: {
      autoRealm: Boolean(src.autoSettings?.autoRealm),
      autoPuppet: Boolean(src.autoSettings?.autoPuppet),
      autoEnlightenment: Boolean(src.autoSettings?.autoEnlightenment),
      autoSkills: Boolean(src.autoSettings?.autoSkills),
      autoMercs: Boolean(src.autoSettings?.autoMercs),
      autoMercSlots:
        Array.isArray(src.autoSettings?.autoMercSlots) && src.autoSettings.autoMercSlots.length === 5
          ? (src.autoSettings.autoMercSlots.map(Boolean) as [
              boolean,
              boolean,
              boolean,
              boolean,
              boolean,
            ])
          : [true, true, true, true, true],
    },
    hasSeenIntro: Boolean(src.hasSeenIntro),
    shownTutorials: {
      ...defaultMeta.shownTutorials,
      ...(src.shownTutorials ?? {}),
    },
    clearedTribulations,
    clearCounts,
    ngPlusCount: safeInt(src.ngPlusCount, 0, 0, 100000),
    relicLevels,
    relicDropLevels,
    rerollPity: safeInt(src.rerollPity, 0, 0, 9),
    highestUnlockedOrder,
    bestClearTimesMs,
    sssUnlockedAutoRepeat,
    autoRepeatEnabled: Boolean(src.autoRepeatEnabled),
    totalSlays: safeInt(src.totalSlays, 0, 0),
    totalRestarts: safeInt(src.totalRestarts, 0, 0),
    totalPlayTimeMs: safeFloat(src.totalPlayTimeMs, 0, 0),
    totalClicks: safeDecimalStr(src.totalClicks, '0'),
    highestDps: safeDecimalStr(src.highestDps, '0'),
    totalRerolls: safeInt(src.totalRerolls, 0, 0),
    lastDailyChestDay: typeof src.lastDailyChestDay === 'string' ? src.lastDailyChestDay : '',
    lastAdRerollDay: typeof src.lastAdRerollDay === 'string' ? src.lastAdRerollDay : '',
    adRerollsToday: safeInt(src.adRerollsToday, 0, 0, MAX_DAILY_AD_REROLLS),
    adFreeRerollTokens: safeInt(src.adFreeRerollTokens, 0, 0, MAX_DAILY_AD_REROLLS),
    adStoneBoostUntil: safeFloat(src.adStoneBoostUntil, 0, 0),
    adStoneBoostMult: safeFloat(src.adStoneBoostMult, 1, 1, 5),
    lastAdStoneBoostDay:
      typeof src.lastAdStoneBoostDay === 'string' ? src.lastAdStoneBoostDay : '',
    adStoneBoostsToday: safeInt(src.adStoneBoostsToday, 0, 0, MAX_DAILY_AD_STONE_BOOSTS),
  };
}

function sanitizeMercsState(raw: unknown, defaultMercs: MercenarySlotState[]): MercenarySlotState[] {
  if (!Array.isArray(raw) || raw.length !== 5) return defaultMercs;
  return raw.map((item, idx) => {
    const def = defaultMercs[idx];
    const m = (item && typeof item === 'object' ? item : {}) as Partial<MercenarySlotState>;
    const archetype = FIXED_SLOT_ARCHETYPES[idx];
    const validInnate =
      typeof m.innateAffix === 'string' && m.innateAffix in INNATE_AFFIXES
        ? m.innateAffix
        : ARCHETYPES[archetype].recommendedInnate;
    const validPendingInnate =
      typeof m.pendingInnateAffix === 'string' && m.pendingInnateAffix in INNATE_AFFIXES
        ? m.pendingInnateAffix
        : null;

    const rawSlots = normalizeTenSlots<unknown>(m.levelAffixes, null);
    const levelAffixes = rawSlots.map(sanitizeAffixInstance);
    const lockedLevelSlots = normalizeTenSlots<unknown>(m.lockedLevelSlots, false).map(Boolean);

    let pendingLevelAffixes: MercenarySlotState['pendingLevelAffixes'] = null;
    if (
      m.pendingLevelAffixes &&
      typeof m.pendingLevelAffixes === 'object' &&
      Array.isArray(m.pendingLevelAffixes.indices) &&
      Array.isArray(m.pendingLevelAffixes.candidates)
    ) {
      const validIndices = m.pendingLevelAffixes.indices.filter(
        (i): i is number => typeof i === 'number' && i >= 0 && i < 10
      );
      if (validIndices.length > 0) {
        pendingLevelAffixes = {
          indices: validIndices,
          candidates: normalizeTenSlots<unknown>(m.pendingLevelAffixes.candidates, null).map(
            sanitizeAffixInstance
          ),
        };
      }
    }

    return {
      ...def,
      slotIndex: idx,
      unlocked: Boolean(m.unlocked),
      archetype,
      level: safeInt(m.level, 1, 1, 1000000),
      innateAffix: validInnate,
      pendingInnateAffix: validPendingInnate,
      unlockedLevelSlots: safeInt(m.unlockedLevelSlots, 0, 0, 10),
      levelAffixes,
      lockedLevelSlots,
      pendingLevelAffixes,
      attackTimer: safeFloat(m.attackTimer, 0, 0, 60),
      attackCount: safeInt(m.attackCount, 0, 0),
    };
  });
}

const OFFLINE_MIN_MS = 60 * 1000;
const OFFLINE_MAX_MS = 12 * 3600 * 1000;
const OFFLINE_EFFICIENCY = 0.55;
const OFFLINE_MAX_SWEEPS = 120;

interface AutoUpgradeCycleCallbacks {
  onUnlockAffixTut?: () => void;
  onThousandMilestone?: (mercName: string) => void;
}

/**
 * Shared 灵枢 automation pass used by both 20Hz live ticks and Mode B offline simulation.
 * Priority: Tier 3 Realm/Puppet -> Tier 6 Smart Mercs -> Tier 5 Enlightenment/Skills (5% surplus budget if Merc auto is active).
 */
function applyAutoUpgradesCycle(
  nextRun: RunState,
  nextMercs: MercenarySlotState[],
  nextMeta: MetaState,
  callbacks?: AutoUpgradeCycleCallbacks
): boolean {
  if (nextRun.runCompleted) return false;
  let autoPurchased = false;
  const autoCfg = nextMeta.autoSettings;
  const costRedNow = getCostReductionMult(nextMeta);

  // 1. Tier 3 Unlock: Auto Realm Breakthrough & Auto Puppet
  if (nextMeta.unlockedAutoRealm) {
    if (autoCfg.autoRealm) {
      let realmLoop = 0;
      while (realmLoop < 5) {
        realmLoop++;
        const nextInfo = getRealmInfo(nextRun.realmLevel + 1);
        const curStones = toDecimal(nextRun.spiritStones);
        const curClicks = toDecimal(nextRun.clickStacks);
        if (
          curStones.lt(nextInfo.reqStones) ||
          (nextInfo.reqClicks > 0 && curClicks.lt(nextInfo.reqClicks))
        ) {
          break;
        }
        nextRun.spiritStones = curStones.sub(nextInfo.reqStones).toString();
        nextRun.realmLevel += 1;
        autoPurchased = true;
      }
    }

    if (
      autoCfg.autoPuppet &&
      nextMeta.hasUnlockedPuppet &&
      nextRun.puppetLevel < PUPPET_MAX_LEVEL
    ) {
      const curStones = toDecimal(nextRun.spiritStones);
      const pupGrowth = getEffectiveGrowthRate(PUPPET_COST_GROWTH, nextRun.tribulationId);
      const { count, totalCost } = calculateBulkUpgrade(
        new Decimal(PUPPET_UNLOCK_COST),
        pupGrowth,
        nextRun.puppetLevel + 1,
        costRedNow,
        'MAX',
        curStones,
        PUPPET_MAX_LEVEL + 1
      );
      if (count > 0 && curStones.gte(totalCost)) {
        nextRun.spiritStones = curStones.sub(totalCost).toString();
        nextRun.puppetLevel = Math.min(PUPPET_MAX_LEVEL, nextRun.puppetLevel + count);
        autoPurchased = true;
      }
    }
  }

  // 2. Tier 6 Unlock: Smart Cheapest-First Auto Mercenary Upgrade (runs BEFORE Enlightenment/Skills!)
  const hasActiveAutoMerc =
    nextMeta.unlockedAutoMercUpgrade &&
    autoCfg.autoMercs &&
    nextMercs.some((m, idx) => autoCfg.autoMercSlots[idx] && m?.unlocked);

  if (hasActiveAutoMerc) {
    const luckLv = getRelicTotalLv(nextMeta, 'rel_e_affix_luck');
    for (let round = 0; round < 32; round++) {
      const curStones = toDecimal(nextRun.spiritStones);
      let bestIdx = -1;
      let bestSingleCost = new Decimal(Infinity);

      for (let sIdx = 0; sIdx < nextMercs.length; sIdx++) {
        if (!autoCfg.autoMercSlots[sIdx]) continue;
        const slot = nextMercs[sIdx];
        if (!slot || !slot.unlocked) continue;
        const arch = ARCHETYPES[slot.archetype];
        const mGrowth = getEffectiveGrowthRate(arch.growthRate, nextRun.tribulationId);
        const cheapDiscount = getMercCheapDiscount(slot, nextMercs, nextMeta);
        const { count, totalCost } = calculateBulkUpgrade(
          new Decimal(arch.baseCost),
          mGrowth,
          slot.level,
          costRedNow * (1 - cheapDiscount),
          1,
          curStones
        );
        if (count > 0 && totalCost.lt(bestSingleCost)) {
          bestSingleCost = totalCost;
          bestIdx = sIdx;
        }
      }

      if (bestIdx === -1) break;

      const slot = nextMercs[bestIdx];
      const arch = ARCHETYPES[slot.archetype];
      const mGrowth = getEffectiveGrowthRate(arch.growthRate, nextRun.tribulationId);
      const cheapDiscount = getMercCheapDiscount(slot, nextMercs, nextMeta);
      const mult = costRedNow * (1 - cheapDiscount);

      const bulk100 = calculateBulkUpgrade(
        new Decimal(arch.baseCost),
        mGrowth,
        slot.level,
        mult,
        100,
        curStones.mul(0.35)
      );
      const bulk10 =
        bulk100.count >= 10
          ? bulk100
          : calculateBulkUpgrade(
              new Decimal(arch.baseCost),
              mGrowth,
              slot.level,
              mult,
              10,
              curStones.mul(0.5)
            );
      const pick =
        bulk10.count > 0
          ? bulk10
          : calculateBulkUpgrade(
              new Decimal(arch.baseCost),
              mGrowth,
              slot.level,
              mult,
              1,
              curStones
            );

      if (pick.count <= 0 || curStones.lt(pick.totalCost)) break;

      let bonusLevels = 0;
      if (slot.innateAffix === 'sp_free_up') {
        const rolls = Math.min(pick.count, 500);
        for (let r = 0; r < rolls; r++) {
          if (Math.random() < 0.35) bonusLevels++;
        }
      }

      const newLv = slot.level + pick.count + bonusLevels;
      const effLv = slot.innateAffix === 'sp_double_lvl' ? newLv * 2 : newLv;
      const prevOpen = slot.unlockedLevelSlots;
      let nextOpen = prevOpen;
      const nextAffixes = [...slot.levelAffixes];
      for (let k = 0; k < LEVEL_SLOT_THRESHOLDS.length; k++) {
        if (effLv >= LEVEL_SLOT_THRESHOLDS[k]) {
          if (k + 1 > nextOpen) nextOpen = k + 1;
          if (!nextAffixes[k]) {
            nextAffixes[k] = {
              id: rollRandomAffixId(),
              tier: rollAffixTier(luckLv),
            };
          }
        }
      }

      if (prevOpen === 0 && nextOpen >= 1) {
        callbacks?.onUnlockAffixTut?.();
      }
      if (prevOpen < 10 && nextOpen === 10) {
        nextMeta.divineCrystals = toDecimal(nextMeta.divineCrystals).add(50).toString();
        callbacks?.onThousandMilestone?.(arch.name);
      }

      nextRun.spiritStones = curStones.sub(pick.totalCost).toString();
      nextMercs[bestIdx] = {
        ...slot,
        level: newLv,
        unlockedLevelSlots: nextOpen,
        levelAffixes: nextAffixes,
      };
      autoPurchased = true;
    }
  }

  // 3. Tier 5 Unlock: Auto Enlightenment & Auto Skill Upgrade (capped to 5% surplus budget when Auto-Mercs is active)
  if (nextMeta.unlockedAutoHeroUpgrades) {
    if (autoCfg.autoEnlightenment) {
      const curStones = toDecimal(nextRun.spiritStones);
      const enlBudget = hasActiveAutoMerc ? curStones.mul(0.05) : curStones;
      const enlGrowth = getEffectiveGrowthRate(
        ENLIGHTENMENT_COST_GROWTH,
        nextRun.tribulationId
      );
      const { count, totalCost } = calculateBulkUpgrade(
        new Decimal(ENLIGHTENMENT_BASE_COST),
        enlGrowth,
        nextRun.enlightenmentLevel,
        costRedNow,
        'MAX',
        enlBudget
      );
      if (count > 0 && curStones.gte(totalCost)) {
        const prevGrowth = getHeroGrowthPerClick(nextRun, nextMercs, nextMeta);
        nextRun.spiritStones = curStones.sub(totalCost).toString();
        nextRun.enlightenmentLevel += count;
        const nextGrowth = getHeroGrowthPerClick(nextRun, nextMercs, nextMeta);
        const enlightRelicLv = getRelicTotalLv(nextMeta, 'rel_r_enlight_boost');
        if (enlightRelicLv > 0) {
          const resGain = Decimal.max(0, nextGrowth.sub(prevGrowth)).mul(
            0.04 + 0.03 * enlightRelicLv
          );
          nextRun.sharedHeroGrowth = toDecimal(nextRun.sharedHeroGrowth)
            .add(resGain)
            .toString();
        }
        autoPurchased = true;
      }
    }

    if (autoCfg.autoSkills) {
      for (const skCfg of SKILLS) {
        if (nextRun.realmLevel < skCfg.unlockRealm) continue;
        const curStones = toDecimal(nextRun.spiritStones);
        const skBudget = hasActiveAutoMerc ? curStones.mul(0.05) : curStones;
        const skGrowth = getEffectiveGrowthRate(skCfg.costGrowth, nextRun.tribulationId);
        const curLv = nextRun.skills[skCfg.id].level;
        const { count, totalCost } = calculateBulkUpgrade(
          new Decimal(skCfg.baseUpgradeCost),
          skGrowth,
          curLv,
          costRedNow,
          'MAX',
          skBudget
        );
        if (count > 0 && curStones.gte(totalCost)) {
          nextRun.spiritStones = curStones.sub(totalCost).toString();
          nextRun.skills[skCfg.id] = {
            ...nextRun.skills[skCfg.id],
            level: curLv + count,
          };
          autoPurchased = true;
        }
      }
    }
  }

  return autoPurchased;
}

function settleOfflineProgress(
  savedAt: unknown,
  run: RunState,
  mercs: MercenarySlotState[],
  meta: MetaState
): {
  run: RunState;
  mercs: MercenarySlotState[];
  meta: MetaState;
  offlineSummary: OfflineSummary | null;
  pendingTutorials: TutorialNodeId[];
} {
  if (typeof savedAt !== 'number' || !Number.isFinite(savedAt) || savedAt <= 0) {
    return { run, mercs, meta, offlineSummary: null, pendingTutorials: [] };
  }
  const nowMs = Date.now();
  const elapsedOfflineMs = nowMs - savedAt;
  if (elapsedOfflineMs < OFFLINE_MIN_MS) {
    return { run, mercs, meta, offlineSummary: null, pendingTutorials: [] };
  }

  const cappedMs = Math.min(elapsedOfflineMs, OFFLINE_MAX_MS);
  const trib = getTribulationConfig(run.tribulationId);
  const nextMeta: MetaState = {
    ...meta,
    shownTutorials: { ...meta.shownTutorials },
    relicLevels: { ...meta.relicLevels },
    relicDropLevels: { ...(meta.relicDropLevels ?? {}) },
    clearedTribulations: { ...meta.clearedTribulations },
    clearCounts: { ...meta.clearCounts },
    bestClearTimesMs: { ...meta.bestClearTimesMs },
    sssUnlockedAutoRepeat: { ...meta.sssUnlockedAutoRepeat },
    totalPlayTimeMs: meta.totalPlayTimeMs + cappedMs,
  };
  const pendingTutorials: TutorialNodeId[] = [];
  const pushPendingTut = (id: TutorialNodeId) => {
    if (!nextMeta.shownTutorials[id]) {
      nextMeta.shownTutorials[id] = true;
      if (!pendingTutorials.includes(id)) {
        pendingTutorials.push(id);
      }
    }
  };

  const dropAgg: Partial<Record<RelicId, { levelsAdded: number; wasNew: boolean }>> = {};
  const rollRelicDrop = () => {
    const rolledTier = rollTribulationRelicTier(trib.id, nextMeta);
    const tierRelics = RELICS.filter((r) => r.tier === rolledTier);
    const unowned = tierRelics.filter((r) => getRelicTotalLv(nextMeta, r.id) === 0);
    const picked =
      unowned.length > 0
        ? unowned[Math.floor(Math.random() * unowned.length)]
        : tierRelics[Math.floor(Math.random() * tierRelics.length)];
    if (!picked) return new Decimal(0);

    const prevCrystalLv = nextMeta.relicLevels[picked.id] ?? 0;
    const prevDropLv = nextMeta.relicDropLevels[picked.id] ?? 0;
    const prevTotal = prevCrystalLv + prevDropLv;

    if (picked.maxDropLevel !== null && prevDropLv >= picked.maxDropLevel) {
      const tierBase = RELIC_TIER_META[picked.tier].overflowBaseCrystals;
      const ngMult =
        trib.id === 'tier_10' && nextMeta.ngPlusCount > 0
          ? Decimal.pow(2, nextMeta.ngPlusCount)
          : new Decimal(1);
      return new Decimal(tierBase)
        .mul(ngMult)
        .mul(getRelicCrystalBonusMult(nextMeta))
        .floor();
    }

    nextMeta.relicDropLevels[picked.id] = prevDropLv + 1;
    const existing = dropAgg[picked.id];
    dropAgg[picked.id] = {
      levelsAdded: (existing?.levelsAdded ?? 0) + 1,
      wasNew: existing ? existing.wasNew : prevTotal === 0,
    };
    return new Decimal(0);
  };

  const buildRelicDropItems = (): VictoryRelicDropItem[] =>
    Object.entries(dropAgg)
      .map(([id, info]) => {
        const rid = id as RelicId;
        const cfg = RELIC_MAP[rid];
        const bd = getRelicLevelsBreakdown(nextMeta, rid);
        return {
          relicId: rid,
          tier: cfg.tier,
          name: cfg.name,
          levelsAdded: info!.levelsAdded,
          newDropLevel: bd.dropLv,
          crystalLevel: bd.crystalLv,
          totalLevel: bd.totalLv,
          isNew: info!.wasNew,
        };
      })
      .sort((a, b) => {
        const tierDiff = RELIC_TIER_META[b.tier].order - RELIC_TIER_META[a.tier].order;
        return tierDiff !== 0 ? tierDiff : b.levelsAdded - a.levelsAdded;
      });

  // Mode A: SSS Auto-Repeat Offline Sweep
  const canAutoSweep =
    Boolean(nextMeta.autoRepeatEnabled) && Boolean(nextMeta.sssUnlockedAutoRepeat[trib.id]);
  if (canAutoSweep) {
    const cycleMs = Math.max(3000, (nextMeta.bestClearTimesMs[trib.id] ?? 15000) / OFFLINE_EFFICIENCY);
    const sweeps = Math.min(OFFLINE_MAX_SWEEPS, Math.floor(cappedMs / cycleMs));
    if (sweeps >= 1) {
      const rankTimeMs = nextMeta.bestClearTimesMs[trib.id] ?? 14900;
      const { crystalMult, bonusRelicLevels: speedBonusDrops } = evaluateSpeedrunRank(
        rankTimeMs,
        trib.order
      );
      let crystalsEarnedTotal = new Decimal(0);
      let overflowCrystalsTotal = new Decimal(0);
      let unlockedNextOrder: number | null = null;
      // 词缀石：按当前劫数的「每重期望」逐次结算，与在线破壳同口径（不再硬编码 40/次）
      let affixStonesEarned = 0;

      // 离线扫荡冻结境界：真神轮回（NG+）必须在线亲自讨伐，避免离线无限刷层。
      const startNgPlus = nextMeta.ngPlusCount;

      for (let s = 0; s < sweeps; s++) {
        const ngMult =
          trib.id === 'tier_10' && startNgPlus > 0 ? Decimal.pow(2, startNgPlus) : new Decimal(1);
        const crystalBonusMult = getRelicCrystalBonusMult(nextMeta);
        const sweepCrystals = new Decimal(trib.baseCrystalReward)
          .mul(ngMult)
          .mul(crystalMult)
          .mul(crystalBonusMult)
          .floor();
        crystalsEarnedTotal = crystalsEarnedTotal.add(sweepCrystals);
        nextMeta.totalSlays += 1;
        affixStonesEarned += rollTribulationStoneDrops(trib.id, nextMeta, mercs);
        nextMeta.clearCounts[trib.id] = (nextMeta.clearCounts[trib.id] ?? 0) + 1;

        const crownLv = getRelicTotalLv(nextMeta, 'rel_e_rarity_crown');
        const crownExtraDrop =
          crownLv > 0 && Math.random() < Math.min(0.4, 0.015 * crownLv) ? 1 : 0;
        const dropRolls =
          trib.relicDropCount +
          speedBonusDrops +
          crownExtraDrop +
          (trib.id === 'tier_10' ? Math.min(3, startNgPlus) : 0);

        for (let d = 0; d < dropRolls; d++) {
          overflowCrystalsTotal = overflowCrystalsTotal.add(rollRelicDrop());
        }

        while (nextMeta.highestUnlockedOrder < TRIBULATIONS.length) {
          const check = getNextTribulationUnlockState(nextMeta);
          if (!check.nextTrib || !check.canUnlock) break;
          nextMeta.highestUnlockedOrder = check.nextTrib.order;
          unlockedNextOrder = check.nextTrib.order;
        }
      }

      nextMeta.affixStones += affixStonesEarned;
      nextMeta.divineCrystals = toDecimal(nextMeta.divineCrystals)
        .add(crystalsEarnedTotal)
        .add(overflowCrystalsTotal)
        .toString();

      return {
        run,
        mercs,
        meta: nextMeta,
        pendingTutorials,
        offlineSummary: {
          elapsedOfflineMs,
          cappedMs,
          mode: 'auto_repeat',
          tribulationId: trib.id,
          tribulationName: trib.name,
          clearsGained: sweeps,
          shellsBroken: sweeps * 10,
          crystalsGained: crystalsEarnedTotal.toString(),
          overflowCrystals: overflowCrystalsTotal.toString(),
          affixStonesGained: affixStonesEarned,
          stonesGained: '0',
          unlockedNextOrder,
          relicDrops: buildRelicDropItems(),
        },
      };
    }
  }

  // Mode B: Offline Combat Advancement (with 灵枢 auto-upgrades, poison stack ramp & unified DPS)
  const nextRun: RunState = { ...run };
  const nextMercs: MercenarySlotState[] = mercs.map((m) => ({ ...m }));

  applyAutoUpgradesCycle(nextRun, nextMercs, nextMeta, {
    onUnlockAffixTut: () => pushPendingTut('tut_affix'),
  });

  const savedDps = toDecimal(run.recentTickDps.hero)
    .add(toDecimal(run.recentTickDps.poison))
    .add(run.recentTickDps.mercs.reduce((a, v) => a.add(toDecimal(v)), new Decimal(0)))
    .add(toDecimal(run.recentTickDps.bonus ?? '0'));

  const initialBreakdown = getTeamCombatDpsBreakdown(nextRun, nextMercs, nextMeta, { nowMs });
  const initialEffDps = Decimal.max(initialBreakdown.totalDps, savedDps).mul(OFFLINE_EFFICIENCY);
  const canPoisonRampOffline = Boolean(nextMercs[1]?.unlocked && nextMercs[1].level > 0);
  if (initialEffDps.lte(0) && !canPoisonRampOffline) {
    return { run, mercs, meta: nextMeta, offlineSummary: null, pendingTutorials: [] };
  }

  let phase = Math.min(Math.max(0, nextRun.phaseIndex), BOSS_SHELLS.length - 1);
  let hp = toDecimal(nextRun.bossHp);
  let remSec = cappedMs / 1000;
  let shellsBroken = 0;
  let affixStonesGained = 0;
  let stonesGained = new Decimal(0);

  while (remSec > 0 && phase < BOSS_SHELLS.length) {
    // Allow Slot 2 poison to build up realistically across an offline shell
    if (nextMercs[1]?.unlocked && nextMercs[1].level > 0 && nextRun.poisonStacks < 3500) {
      const m2BaseStats = getHeroStats(nextRun, nextMercs, nextMeta, nowMs);
      const m2Stats = getMercenaryComputedStats(
        1,
        nextMercs,
        nextRun,
        nextMeta,
        m2BaseStats.heroBasePower,
        m2BaseStats.rawHeroClick,
        getGlobalMult(nextRun, nextMercs, nextMeta)
      );
      const rampSec = Math.min(remSec, 25);
      const estAttacks = Math.max(
        1,
        Math.min(500, Math.floor(rampSec / Math.max(0.05, m2Stats.interval)))
      );
      if (nextMercs[1].innateAffix === 'sp_poison_god') {
        let stacks = nextRun.poisonStacks;
        for (let a = 0; a < estAttacks && stacks < 3500; a++) {
          const add = Math.max(1, Math.floor(stacks * 0.02));
          stacks = Math.min(3500, stacks + add);
        }
        nextRun.poisonStacks = stacks;
      } else {
        nextRun.poisonStacks = Math.min(3500, nextRun.poisonStacks + estAttacks);
      }
    }

    const breakdown = getTeamCombatDpsBreakdown(nextRun, nextMercs, nextMeta, { nowMs });
    const baseTeamDps =
      phase === run.phaseIndex ? Decimal.max(breakdown.totalDps, savedDps) : breakdown.totalDps;
    const effDps = baseTeamDps.mul(OFFLINE_EFFICIENCY);

    const phaseMaxHp = getPhaseMaxHp(trib.id, phase, nextMeta);
    const regenPerSec = trib.debuff.bossRegenPctPerSec
      ? phaseMaxHp.mul(trib.debuff.bossRegenPctPerSec)
      : new Decimal(0);
    const netDps = effDps.sub(regenPerSec);
    if (netDps.lte(0)) {
      break;
    }

    const timeToBreak = hp.div(netDps).toNumber();
    const dealt = timeToBreak <= remSec ? hp : netDps.mul(remSec);
    const sMult = getSpiritStoneMultiplier(
      nextMercs,
      { ...nextRun, phaseIndex: phase },
      nextMeta,
      false
    );
    const phaseStones = dealt.mul(sMult);
    stonesGained = stonesGained.add(phaseStones);
    nextRun.spiritStones = toDecimal(nextRun.spiritStones).add(phaseStones).toString();

    if (timeToBreak <= remSec) {
      remSec -= Math.max(0.01, timeToBreak);
      shellsBroken += 1;
      affixStonesGained += rollStoneDrops(getShellStoneExpectation(trib.id, phase, nextMeta, nextMercs));
      const pNum = phase + 1;
      if (nextMeta.firstBreakGiftsClaimed < pNum) {
        nextMeta.firstBreakGiftsClaimed = pNum;
        if (pNum === 1) {
          nextMeta.hasUnlockedPuppet = true;
          nextRun.spiritStones = toDecimal(nextRun.spiritStones).add(80).toString();
          stonesGained = stonesGained.add(80);
          affixStonesGained += 2;
          pushPendingTut('tut_phase1');
        } else if (pNum === 2 && !nextMercs[0].unlocked) {
          nextMercs[0] = {
            ...nextMercs[0],
            unlocked: true,
            archetype: 'merc_sword',
            level: 1,
            innateAffix: rollRandomInnateAffix(),
          };
          pushPendingTut('tut_merc1');
        } else if (pNum === 3) {
          affixStonesGained += 8;
        } else if (pNum === 4) {
          nextMeta.unlockedBulkBuy = true;
        }
      }
      phase += 1;
      nextRun.phaseIndex = Math.min(phase, BOSS_SHELLS.length - 1);
      if (phase < BOSS_SHELLS.length) {
        hp = getPhaseMaxHp(trib.id, phase, nextMeta);
        applyAutoUpgradesCycle(nextRun, nextMercs, nextMeta, {
          onUnlockAffixTut: () => pushPendingTut('tut_affix'),
        });
      } else {
        hp = new Decimal(0);
      }
    } else {
      hp = hp.sub(dealt).max(1);
      applyAutoUpgradesCycle(nextRun, nextMercs, nextMeta, {
        onUnlockAffixTut: () => pushPendingTut('tut_affix'),
      });
      remSec = 0;
    }
  }

  if (shellsBroken === 0 && stonesGained.lte(0)) {
    return { run, mercs, meta: nextMeta, offlineSummary: null, pendingTutorials: [] };
  }

  nextMeta.affixStones += affixStonesGained;

  let crystalsEarnedTotal = new Decimal(0);
  let overflowCrystalsTotal = new Decimal(0);
  let unlockedNextOrder: number | null = null;
  let clearsGained = 0;
  let finalRun = nextRun;
  let finalMercs = nextMercs;

  if (phase >= BOSS_SHELLS.length) {
    clearsGained = 1;
    const spentMs = Math.max(100, cappedMs - remSec * 1000);
    const clearTimeMs = nextRun.elapsedMs + spentMs;
    const { crystalMult, bonusRelicLevels: speedBonusDrops } = evaluateSpeedrunRank(
      clearTimeMs,
      trib.order
    );
    const ngMult =
      trib.id === 'tier_10' && nextMeta.ngPlusCount > 0
        ? Decimal.pow(2, nextMeta.ngPlusCount)
        : new Decimal(1);
    crystalsEarnedTotal = new Decimal(trib.baseCrystalReward)
      .mul(ngMult)
      .mul(crystalMult)
      .mul(getRelicCrystalBonusMult(nextMeta))
      .floor();
    nextMeta.divineCrystals = toDecimal(nextMeta.divineCrystals).add(crystalsEarnedTotal).toString();
    nextMeta.totalSlays += 1;
    nextMeta.clearCounts[trib.id] = (nextMeta.clearCounts[trib.id] ?? 0) + 1;
    const prevBest = nextMeta.bestClearTimesMs[trib.id];
    if (prevBest === undefined || clearTimeMs < prevBest) {
      nextMeta.bestClearTimesMs[trib.id] = clearTimeMs;
    }
    if (!nextMeta.clearedTribulations[trib.id]) {
      nextMeta.clearedTribulations[trib.id] = true;
      if (trib.id === 'tier_1') {
        nextMeta.unlockedRelicHall = true;
        pushPendingTut('tut_tier1_win');
      }
      if (trib.id === 'tier_2') {
        nextMeta.unlockedAffixLock = true;
        nextMeta.unlockedInnateReroll = true;
      }
      if (trib.id === 'tier_3') {
        nextMeta.unlockedEpicPool = true;
        nextMeta.unlockedAutoRealm = true;
      }
      if (trib.id === 'tier_4') nextMeta.unlockedAutoSkill = true;
      if (trib.id === 'tier_5') {
        nextMeta.affixStones += 50;
        affixStonesGained += 50;
        nextMeta.unlockedAutoHeroUpgrades = true;
      }
      if (trib.id === 'tier_6') nextMeta.unlockedAutoMercUpgrade = true;
    }

    const crownLv = getRelicTotalLv(nextMeta, 'rel_e_rarity_crown');
    const crownExtraDrop =
      crownLv > 0 && Math.random() < Math.min(0.4, 0.015 * crownLv) ? 1 : 0;
    const dropRolls =
      trib.relicDropCount +
      speedBonusDrops +
      crownExtraDrop +
      (trib.id === 'tier_10' ? Math.min(3, Number(nextMeta.ngPlusCount) || 0) : 0);
    for (let d = 0; d < dropRolls; d++) {
      overflowCrystalsTotal = overflowCrystalsTotal.add(rollRelicDrop());
    }
    if (overflowCrystalsTotal.gt(0)) {
      nextMeta.divineCrystals = toDecimal(nextMeta.divineCrystals)
        .add(overflowCrystalsTotal)
        .toString();
    }

    while (nextMeta.highestUnlockedOrder < TRIBULATIONS.length) {
      const check = getNextTribulationUnlockState(nextMeta);
      if (!check.nextTrib || !check.canUnlock) break;
      nextMeta.highestUnlockedOrder = check.nextTrib.order;
      unlockedNextOrder = check.nextTrib.order;
    }
    if (trib.id === 'tier_10') {
      nextMeta.ngPlusCount += 1;
    }

    finalRun = createInitialRunState(trib.id, nextMeta, {
      sk_blood: run.skills.sk_blood.autoCast,
      sk_clone: run.skills.sk_clone.autoCast,
      sk_thunder: run.skills.sk_thunder.autoCast,
      sk_sync: run.skills.sk_sync.autoCast,
    });
    finalMercs = resetMercsForNewRun(nextMercs);
  } else {
    nextRun.phaseIndex = phase;
    nextRun.bossHp = hp.toString();
    nextRun.bossMaxHp = getPhaseMaxHp(trib.id, phase, nextMeta).toString();
    nextRun.elapsedMs += cappedMs;
    nextRun.timerStarted = true;
    const endBreakdown = getTeamCombatDpsBreakdown(nextRun, nextMercs, nextMeta, { nowMs });
    nextRun.recentTickDps = {
      hero: endBreakdown.heroDps.toString(),
      poison: endBreakdown.poisonTotalDps.toString(),
      mercs: endBreakdown.mercDpsList.map((d) => d.toString()) as [
        string,
        string,
        string,
        string,
        string,
      ],
      bonus: endBreakdown.clickLinkDps.add(endBreakdown.cannonChargeDps).toString(),
    };
  }

  return {
    run: finalRun,
    mercs: finalMercs,
    meta: nextMeta,
    pendingTutorials,
    offlineSummary: {
      elapsedOfflineMs,
      cappedMs,
      mode: 'combat',
      tribulationId: trib.id,
      tribulationName: trib.name,
      clearsGained,
      shellsBroken,
      crystalsGained: crystalsEarnedTotal.toString(),
      overflowCrystals: overflowCrystalsTotal.toString(),
      affixStonesGained,
      stonesGained: stonesGained.toString(),
      unlockedNextOrder,
      relicDrops: buildRelicDropItems(),
    },
  };
}

function loadSavedState(): {
  run: RunState;
  mercs: MercenarySlotState[];
  meta: MetaState;
  settings: SettingsState;
  offlineSummary: OfflineSummary | null;
  pendingTutorials: TutorialNodeId[];
} {
  const defaultMeta = createInitialMetaState();
  const defaultMercs = createInitialMercsState();
  const defaultSettings: SettingsState = {
    numberMode: 'chinese',
    soundEnabled: true,
    buyMode: 1,
    floatingTextMode: 'all',
    hitVfxEnabled: true,
    vibrationEnabled: true,
    silentAutoClear: true,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        run: createInitialRunState('tier_1', defaultMeta),
        mercs: defaultMercs,
        meta: defaultMeta,
        settings: defaultSettings,
        offlineSummary: null,
        pendingTutorials: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<GameSaveData>;
    const meta = sanitizeMetaState(parsed.meta, defaultMeta);
    const mercs = sanitizeMercsState(parsed.mercs, defaultMercs);

    const rawFloatMode = parsed.settings?.floatingTextMode;
    const settings: SettingsState = {
      ...defaultSettings,
      ...(parsed.settings ?? {}),
      numberMode: parsed.settings?.numberMode === 'scientific' ? 'scientific' : 'chinese',
      soundEnabled: typeof parsed.settings?.soundEnabled === 'boolean' ? parsed.settings.soundEnabled : true,
      buyMode:
        parsed.settings?.buyMode === 10 || parsed.settings?.buyMode === 'MAX'
          ? parsed.settings.buyMode
          : 1,
      floatingTextMode:
        rawFloatMode === 'all' || rawFloatMode === 'crit' || rawFloatMode === 'off'
          ? rawFloatMode
          : 'all',
      hitVfxEnabled:
        typeof parsed.settings?.hitVfxEnabled === 'boolean'
          ? parsed.settings.hitVfxEnabled
          : true,
      vibrationEnabled:
        typeof parsed.settings?.vibrationEnabled === 'boolean'
          ? parsed.settings.vibrationEnabled
          : true,
      silentAutoClear:
        typeof parsed.settings?.silentAutoClear === 'boolean'
          ? parsed.settings.silentAutoClear
          : true,
    };

    const rawTribId = parsed.run?.tribulationId;
    const tribId: TribulationId =
      typeof rawTribId === 'string' && rawTribId in TRIBULATION_MAP
        ? (rawTribId as TribulationId)
        : 'tier_1';

    const baseRun = createInitialRunState(tribId, meta);
    if (parsed.run?.runCompleted) {
      const settled = settleOfflineProgress(
        parsed.savedAt,
        baseRun,
        resetMercsForNewRun(mercs),
        meta
      );
      return {
        run: settled.run,
        mercs: settled.mercs,
        meta: settled.meta,
        settings,
        offlineSummary: settled.offlineSummary,
        pendingTutorials: settled.pendingTutorials,
      };
    }

    const rawMercDps = parsed.run?.recentTickDps?.mercs;
    const run: RunState = {
      ...baseRun,
      ...(parsed.run ?? {}),
      tribulationId: tribId,
      phaseIndex: safeInt(parsed.run?.phaseIndex, 0, 0, BOSS_SHELLS.length - 1),
      bossHp: safeDecimalStr(parsed.run?.bossHp, baseRun.bossHp),
      bossMaxHp: safeDecimalStr(parsed.run?.bossMaxHp, baseRun.bossMaxHp),
      poisonStacks: safeInt(parsed.run?.poisonStacks, 0, 0, 3500),
      spiritStones: safeDecimalStr(parsed.run?.spiritStones, baseRun.spiritStones),
      mana: safeFloat(parsed.run?.mana, baseRun.mana, 0, 100000),
      clickStacks: safeDecimalStr(parsed.run?.clickStacks, '0'),
      manualClicks: safeInt(parsed.run?.manualClicks, 0, 0),
      swordAndHeroAttacksForCannon: safeInt(parsed.run?.swordAndHeroAttacksForCannon, 0, 0, 1000),
      enlightenmentLevel: safeInt(parsed.run?.enlightenmentLevel, 1, 1, 1000000),
      accumulatedAtk: safeDecimalStr(parsed.run?.accumulatedAtk, baseRun.accumulatedAtk),
      sharedHeroGrowth: safeDecimalStr(parsed.run?.sharedHeroGrowth, '0'),
      realmLevel: safeInt(parsed.run?.realmLevel, 0, 0, 10000),
      puppetLevel: safeInt(parsed.run?.puppetLevel, baseRun.puppetLevel, 0, PUPPET_MAX_LEVEL),
      elapsedMs: safeFloat(parsed.run?.elapsedMs, 0, 0),
      runCompleted: false,
      skills: {
        sk_blood: { ...baseRun.skills.sk_blood, ...(parsed.run?.skills?.sk_blood ?? {}) },
        sk_clone: { ...baseRun.skills.sk_clone, ...(parsed.run?.skills?.sk_clone ?? {}) },
        sk_thunder: { ...baseRun.skills.sk_thunder, ...(parsed.run?.skills?.sk_thunder ?? {}) },
        sk_sync: { ...baseRun.skills.sk_sync, ...(parsed.run?.skills?.sk_sync ?? {}) },
      },
      manaSpentThisRun: safeFloat(parsed.run?.manaSpentThisRun, 0, 0),
      heroBuffStacks: Array.isArray(parsed.run?.heroBuffStacks)
        ? parsed.run.heroBuffStacks.filter(
            (b) =>
              typeof b?.val === 'number' &&
              Number.isFinite(b.val) &&
              typeof b?.expiresAt === 'number' &&
              Number.isFinite(b.expiresAt)
          )
        : [],
      recentTickDps: {
        hero: safeDecimalStr(parsed.run?.recentTickDps?.hero, baseRun.recentTickDps.hero),
        poison: safeDecimalStr(parsed.run?.recentTickDps?.poison, baseRun.recentTickDps.poison),
        mercs:
          Array.isArray(rawMercDps) && rawMercDps.length === 5
            ? (rawMercDps.map((v) => safeDecimalStr(v, '0')) as [
                string,
                string,
                string,
                string,
                string,
              ])
            : baseRun.recentTickDps.mercs,
        bonus: safeDecimalStr(parsed.run?.recentTickDps?.bonus, '0'),
      },
    };

    const settled = settleOfflineProgress(parsed.savedAt, run, mercs, meta);
    return {
      run: settled.run,
      mercs: settled.mercs,
      meta: settled.meta,
      settings,
      offlineSummary: settled.offlineSummary,
      pendingTutorials: settled.pendingTutorials,
    };
  } catch {
    return {
      run: createInitialRunState('tier_1', defaultMeta),
      mercs: defaultMercs,
      meta: defaultMeta,
      settings: defaultSettings,
      offlineSummary: null,
      pendingTutorials: [],
    };
  }
}

export function getRelicUpgradeCost(relicId: RelicId, currentLevel: number): Decimal {
  const cfg = RELIC_MAP[relicId];
  return new Decimal(cfg.baseCost).mul(Decimal.pow(cfg.costGrowth, currentLevel)).floor();
}

interface GameContextValue {
  run: RunState;
  mercs: MercenarySlotState[];
  meta: MetaState;
  settings: SettingsState;
  floatingTexts: FloatingDamageText[];
  clickRipples: ClickRipple[];
  mercPulseIds: [number, number, number, number, number];
  phaseBreakBanner: PhaseBreakBanner | null;
  isHitSquashed: boolean;
  isArenaShaking: boolean;
  hitOffset: { x: number; y: number };
  hitPulseId: number;
  shellShatterId: number;
  victorySummary: VictorySummary | null;
  offlineSummary: OfflineSummary | null;
  lastClearReport: SilentClearReport | null;
  autoRepeatCountdown: number | null;
  toastMessage: string | null;
  activeTutorial: TutorialNodeId | null;
  clearVictorySummary: () => void;
  clearOfflineSummary: () => void;
  offlineAdBonusClaimed: boolean;
  claimOfflineAdBonus: () => boolean;
  claimDailyChest: () => boolean;
  canClaimDailyChest: boolean;
  claimAdRerollToken: () => boolean;
  canClaimAdRerollToken: boolean;
  claimAdStoneBoost: () => boolean;
  canClaimAdStoneBoost: boolean;
  adStoneBoostActive: boolean;
  adStoneBoostRemainingMs: number;
  adStoneBoostsLeftToday: number;
  cloudAvailable: boolean;
  lastCloudSavedAt: number | null;
  syncCloudNow: () => Promise<boolean>;
  restoreFromCloud: (force?: boolean) => Promise<CloudRestoreResult>;
  openLastClearReportModal: () => void;
  quickRestartAfterSilentClear: () => void;
  completeIntro: () => void;
  replayIntro: () => void;
  dismissTutorial: () => void;

  manualClick: (xPct?: number, yPct?: number) => void;
  upgradeEnlightenment: () => void;
  breakthroughRealm: () => void;
  buyPuppet: () => void;
  castSkill: (skillId: SkillId) => void;
  upgradeSkill: (skillId: SkillId) => void;
  toggleSkillAutoCast: (skillId: SkillId) => void;

  unlockMercSlot: (slotIndex: number) => void;
  upgradeMercenary: (slotIndex: number) => void;
  toggleAffixLock: (slotIndex: number, affixIdx: number) => void;
  rerollMercSingleSlot: (slotIndex: number, affixIdx: number) => void;
  rerollMercBatchSlots: (slotIndex: number) => void;
  quenchMercAffix: (slotIndex: number, affixIdx: number) => void;
  confirmPendingLevelAffixes: (slotIndex: number, accept: boolean) => void;
  rerollMercInnate: (slotIndex: number) => void;
  confirmPendingInnateAffix: (slotIndex: number, accept: boolean) => void;

  upgradeRelic: (relicId: RelicId) => void;

  switchTribulation: (tribId: TribulationId) => void;
  toggleAutoRepeat: () => void;
  toggleAutoSetting: (key: keyof Omit<AutoUpgradeSettings, 'autoMercSlots'>) => void;
  toggleAutoMercSlot: (slotIndex: number) => void;
  restartRun: () => void;

  setBuyMode: (mode: BuyMode) => void;
  setNumberMode: (mode: NumberDisplayMode) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setFloatingTextMode: (mode: FloatingTextMode) => void;
  setHitVfxEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setSilentAutoClear: (enabled: boolean) => void;
  lastSavedAt: number;
  saveNow: () => void;
  exportSaveString: () => string;
  importSaveString: (b64: string) => { ok: boolean; error?: string };
  hardResetAll: (reloadAfter?: boolean) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const initialRef = useRef<ReturnType<typeof loadSavedState> | null>(null);
  if (!initialRef.current) {
    initialRef.current = loadSavedState();
  }

  const [run, setRun] = useState<RunState>(initialRef.current.run);
  const [mercs, setMercs] = useState<MercenarySlotState[]>(initialRef.current.mercs);
  const [meta, setMeta] = useState<MetaState>(initialRef.current.meta);
  const [settings, setSettings] = useState<SettingsState>(initialRef.current.settings);

  const [floatingTexts, setFloatingTexts] = useState<FloatingDamageText[]>([]);
  const [clickRipples, setClickRipples] = useState<ClickRipple[]>([]);
  const [mercPulseIds, setMercPulseIds] = useState<[number, number, number, number, number]>([
    0, 0, 0, 0, 0,
  ]);
  const [phaseBreakBanner, setPhaseBreakBanner] = useState<PhaseBreakBanner | null>(null);
  const [isHitSquashed, setIsHitSquashed] = useState(false);
  const [isArenaShaking, setIsArenaShaking] = useState(false);
  const [hitOffset, setHitOffset] = useState({ x: 0, y: 0 });
  const [hitPulseId, setHitPulseId] = useState(0);
  const [shellShatterId, setShellShatterId] = useState(0);
  const [victorySummary, setVictorySummary] = useState<VictorySummary | null>(null);
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(
    () => initialRef.current?.offlineSummary ?? null
  );
  const [offlineAdBonusClaimed, setOfflineAdBonusClaimed] = useState(false);
  const offlineAdBonusKeyRef = useRef<string | null>(null);
  const [lastCloudSavedAt, setLastCloudSavedAt] = useState<number | null>(null);
  const [lastClearReport, setLastClearReport] = useState<SilentClearReport | null>(null);
  const [autoRepeatCountdown, setAutoRepeatCountdown] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingTutorials, setPendingTutorials] = useState<TutorialNodeId[]>(
    () => initialRef.current?.pendingTutorials ?? []
  );
  const activeTutorial = pendingTutorials[0] ?? null;
  const [lastSavedAt, setLastSavedAt] = useState<number>(() => Date.now());

  const runRef = useRef(run);
  runRef.current = run;
  const mercsRef = useRef(mercs);
  mercsRef.current = mercs;
  const metaRef = useRef(meta);
  metaRef.current = meta;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const puppetAccRef = useRef(0);
  const cloneAccRef = useRef(0);
  // 机神充能令牌桶：容量/回充均为 1.0 秒冷却/秒，保证充能最多让机神攻速翻倍
  const cannonChargeBucketRef = useRef({ tokens: MAX_CANNON_CHARGE_SEC_PER_SEC, at: Date.now() });
  // 天降横财令牌桶：5 次/秒全额 + 5 次/秒按 20% 折算，超出丢弃
  const jackpotProcBucketRef = useRef({
    primary: MAX_JACKPOT_PROCS_PER_SEC,
    overflow: MAX_JACKPOT_PROCS_PER_SEC,
    at: Date.now(),
  });
  const poisonTickAccRef = useRef(0);
  const autoBuyAccRef = useRef(0);
  const uiSyncAccRef = useRef(0);
  const floatIdRef = useRef(1);
  const rippleIdRef = useRef(1);
  const lastFloatSpawnRef = useRef(0);
  const lastRippleSpawnRef = useRef(0);
  const lastBannerAtRef = useRef(0);
  const lastToastRef = useRef<{ msg: string; at: number }>({ msg: '', at: 0 });
  const bannerTimerRef = useRef<number | null>(null);
  const squashTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastMetaUiSyncRef = useRef<number>(Date.now());
  const isHardResettingRef = useRef(false);
  const autoRepeatCountdownRef = useRef<number | null>(null);
  const victoryTriggeredRef = useRef(false);

  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  const showToast = useCallback((msg: string) => {
    const now = performance.now();
    if (msg === lastToastRef.current.msg && now - lastToastRef.current.at < 1500) {
      return;
    }
    lastToastRef.current = { msg, at: now };
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), TOAST_DURATION_MS);
  }, []);

  const triggerVibration = useCallback((pattern: number | number[]) => {
    if (!settingsRef.current.vibrationEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore vibration errors on unsupported devices
    }
  }, []);

  const queueTutorial = useCallback((id: TutorialNodeId, targetMeta: MetaState) => {
    if (!targetMeta.shownTutorials[id]) {
      targetMeta.shownTutorials = { ...targetMeta.shownTutorials, [id]: true };
      setPendingTutorials((q) => (q.includes(id) ? q : [...q, id]));
    }
  }, []);

  const triggerHitSquash = useCallback(() => {
    if (!settingsRef.current.hitVfxEnabled) return;
    setIsHitSquashed(true);
    setHitOffset({
      x: Math.round((Math.random() - 0.5) * 6),
      y: Math.round((Math.random() - 0.5) * 6),
    });
    if (squashTimerRef.current) window.clearTimeout(squashTimerRef.current);
    squashTimerRef.current = window.setTimeout(() => {
      setIsHitSquashed(false);
      setHitOffset({ x: 0, y: 0 });
    }, 65);
  }, []);

  const triggerArenaShake = useCallback(() => {
    if (!settingsRef.current.hitVfxEnabled) return;
    setIsArenaShaking(true);
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => setIsArenaShaking(false), 260);
  }, []);

  const spawnClickRipple = useCallback((xPct: number, yPct: number) => {
    if (!settingsRef.current.hitVfxEnabled) return;
    const now = performance.now();
    if (now - lastRippleSpawnRef.current < RIPPLE_MIN_INTERVAL_MS) return;
    lastRippleSpawnRef.current = now;
    const id = rippleIdRef.current++;
    setClickRipples((prev) => {
      const next =
        prev.length >= MAX_ONSCREEN_RIPPLES
          ? prev.slice(prev.length - (MAX_ONSCREEN_RIPPLES - 1))
          : prev;
      return [...next, { id, x: xPct, y: yPct }];
    });
    window.setTimeout(() => {
      setClickRipples((prev) => prev.filter((r) => r.id !== id));
    }, 430);
  }, []);

  const spawnFloatingText = useCallback(
    (text: string, kind: FloatingDamageText['kind'], xPct?: number, yPct?: number) => {
      const mode = settingsRef.current.floatingTextMode;
      if (mode === 'off') return;
      if (mode === 'crit' && kind !== 'crit' && kind !== 'thunder' && kind !== 'shell') {
        return;
      }
      const now = performance.now();
      const isPriority = kind === 'shell' || kind === 'thunder';
      if (!isPriority && now - lastFloatSpawnRef.current < FLOATING_TEXT_MIN_INTERVAL_MS) {
        return;
      }
      lastFloatSpawnRef.current = now;
      const id = floatIdRef.current++;
      const x = xPct ?? 30 + Math.random() * 40;
      const y = yPct ?? 24 + Math.random() * 34;
      setFloatingTexts((prev) => {
        const next =
          prev.length >= MAX_ONSCREEN_FLOATING_TEXTS
            ? prev.slice(prev.length - (MAX_ONSCREEN_FLOATING_TEXTS - 1))
            : prev;
        return [...next, { id, x, y, text, kind }];
      });
      window.setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 920);
    },
    []
  );

  const saveToLocalStorage = useCallback(() => {
    if (isHardResettingRef.current) return;
    try {
      const savedAt = Date.now();
      const payload: GameSaveData = {
        version: 35,
        savedAt,
        run: runRef.current,
        mercs: mercsRef.current,
        meta: metaRef.current,
        settings: settingsRef.current,
      };
      const json = JSON.stringify(payload);
      localStorage.setItem(STORAGE_KEY, json);
      if (cloudSaveAvailable()) {
        scheduleCloudSave(encodeBase64Utf8(json));
      }
      setLastSavedAt(savedAt);
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const saveNow = useCallback(() => {
    saveToLocalStorage();
    void flushCloudSave();
    showToast('已立即保存当前全部修为与设置');
  }, [saveToLocalStorage, showToast]);

  const applyBossDamageAndCheckBreaks = useCallback(
    (
      nextRun: RunState,
      nextMercs: MercenarySlotState[],
      nextMeta: MetaState,
      dmg: Decimal
    ): { actualDealt: Decimal; shellsBroken: number; completed: boolean } => {
      if (nextRun.runCompleted || dmg.lte(0)) {
        return { actualDealt: new Decimal(0), shellsBroken: 0, completed: nextRun.runCompleted };
      }

      let remaining = dmg;
      let totalDealt = new Decimal(0);
      let shellsBroken = 0;
      let hp = toDecimal(nextRun.bossHp);
      let phase = nextRun.phaseIndex;

      let lastBrokenPhaseNumber = 0;
      let totalStonesEarnedInBreak = 0;

      let safety = 0;
      while (remaining.gt(0) && phase < BOSS_SHELLS.length && safety < 12) {
        safety++;
        const hit = Decimal.min(hp, remaining);
        hp = hp.sub(hit);
        totalDealt = totalDealt.add(hit);
        remaining = remaining.sub(hit);

        if (hp.lte(0)) {
          shellsBroken++;
          const brokenPhaseNumber = phase + 1;

          // 词缀石：按【劫数 × 躯壳深度】的期望掉落，整数必掉 + 小数概率补 1 颗。
          // 遗物/词缀加成为封顶乘法（贪婪触须 ≤+150%、寻宝天眼全队 ≤+100%）。
          const tribCfg = getTribulationConfig(nextRun.tribulationId);
          let stonesGain = rollStoneDrops(
            getShellStoneExpectation(tribCfg.id, phase, nextMeta, nextMercs)
          );

          // rel_e_boss_skip (Phase 1~8)
          const skipLv = getRelicTotalLv(nextMeta, 'rel_e_boss_skip');
          let skippedExtra = false;
          if (phase <= 7 && skipLv > 0 && Math.random() < Math.min(0.45, 0.015 * skipLv)) {
            skippedExtra = true;
            stonesGain *= 2;
          }

          nextMeta.affixStones += stonesGain;
          lastBrokenPhaseNumber = brokenPhaseNumber;
          totalStonesEarnedInBreak += stonesGain;

          // First-break one-time onboarding gifts
          const grantFirstBreakForPhase = (pNum: number) => {
            if (nextMeta.firstBreakGiftsClaimed >= pNum) return;
            nextMeta.firstBreakGiftsClaimed = pNum;

            if (pNum === 1) {
              nextMeta.hasUnlockedPuppet = true;
              nextRun.spiritStones = toDecimal(nextRun.spiritStones).add(80).toString();
              nextMeta.affixStones += 2;
              queueTutorial('tut_phase1', nextMeta);
              showToast('首破第1重躯壳！解锁【机关傀儡】并获赠 80 灵石 & 2 词缀石');
            } else if (pNum === 2) {
              if (!nextMercs[0].unlocked) {
                nextMercs[0] = {
                  ...nextMercs[0],
                  unlocked: true,
                  archetype: 'merc_sword',
                  level: 1,
                  innateAffix: rollRandomInnateAffix(),
                };
              }
              queueTutorial('tut_merc1', nextMeta);
              showToast('首破第2重躯壳！1号位【青冥剑侍】免费加入战场');
            } else if (pNum === 3) {
              nextMeta.affixStones += 8;
              showToast('首破第3重躯壳！额外获赠 8 颗【词缀石】');
            } else if (pNum === 4) {
              nextMeta.unlockedBulkBuy = true;
              showToast('首破第4重躯壳！解锁升级面板 ×10 / MAX 批量购买');
            }
          };

          grantFirstBreakForPhase(brokenPhaseNumber);
          if (skippedExtra) {
            grantFirstBreakForPhase(brokenPhaseNumber + 1);
            phase += 2;
          } else {
            phase += 1;
          }

          if (phase >= BOSS_SHELLS.length) {
            nextRun.phaseIndex = BOSS_SHELLS.length - 1;
            nextRun.bossHp = '0';
            nextRun.runCompleted = true;
            break;
          } else {
            nextRun.phaseIndex = phase;
            const nextMax = getPhaseMaxHp(nextRun.tribulationId, phase, nextMeta);
            hp = nextMax;
            nextRun.bossMaxHp = nextMax.toString();

            // rel_y_shell_burst: shatter shockwave deals (0.20 * lv) seconds of team DPS to the newly exposed shell
            const shellBurstLv = getRelicTotalLv(nextMeta, 'rel_y_shell_burst');
            if (shellBurstLv > 0) {
              const curTeamDps = toDecimal(nextRun.recentTickDps.hero)
                .add(toDecimal(nextRun.recentTickDps.poison))
                .add(
                  nextRun.recentTickDps.mercs.reduce(
                    (acc, v) => acc.add(toDecimal(v)),
                    new Decimal(0)
                  )
                )
                .add(toDecimal(nextRun.recentTickDps.bonus ?? '0'));
              if (curTeamDps.gt(0)) {
                remaining = remaining.add(curTeamDps.mul(0.2 * shellBurstLv));
              }
            }

            // rel_s_stone_surge: instant stone rebate on shell break (max 8%)
            const stoneSurgeLv = getRelicTotalLv(nextMeta, 'rel_s_stone_surge');
            if (stoneSurgeLv > 0) {
              const curStones = toDecimal(nextRun.spiritStones);
              const bonusStones = curStones.mul(Math.min(0.08, 0.004 * stoneSurgeLv));
              if (bonusStones.gt(0)) {
                nextRun.spiritStones = curStones.add(bonusStones).toString();
              }
            }
          }
        } else {
          break;
        }
      }

      if (shellsBroken > 0 && lastBrokenPhaseNumber > 0) {
        const nowBanner = performance.now();
        if (nowBanner - lastBannerAtRef.current >= PHASE_BANNER_MIN_INTERVAL_MS) {
          lastBannerAtRef.current = nowBanner;
          const bannerId = floatIdRef.current++;
          setPhaseBreakBanner({
            id: bannerId,
            phase: lastBrokenPhaseNumber,
            stones: totalStonesEarnedInBreak,
          });
          if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
          bannerTimerRef.current = window.setTimeout(() => setPhaseBreakBanner(null), 1500);
        }
      }

      if (!nextRun.runCompleted) {
        nextRun.bossHp = hp.toString();
      }

      // Real-time Spirit Stones conversion
      const stoneMult = getSpiritStoneMultiplier(nextMercs, nextRun, nextMeta);
      nextRun.spiritStones = toDecimal(nextRun.spiritStones)
        .add(totalDealt.mul(stoneMult))
        .toString();

      return { actualDealt: totalDealt, shellsBroken, completed: nextRun.runCompleted };
    },
    [queueTutorial, showToast]
  );

  // Trigger Slot 2 Talent 2: any ally crit pops 30% of full poison damage
  const consumeCannonCharge = useCallback((seconds: number): number => {
    if (seconds <= 0) return 0;
    const bucket = cannonChargeBucketRef.current;
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(5, (now - bucket.at) / 1000));
    bucket.at = now;
    bucket.tokens = Math.min(MAX_CANNON_CHARGE_SEC_PER_SEC, bucket.tokens + elapsed);
    const granted = Math.min(seconds, bucket.tokens);
    bucket.tokens -= granted;
    return granted;
  }, []);

  const consumeJackpotProc = useCallback((): number => {
    const bucket = jackpotProcBucketRef.current;
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(5, (now - bucket.at) / 1000));
    bucket.at = now;
    bucket.primary = Math.min(MAX_JACKPOT_PROCS_PER_SEC, bucket.primary + elapsed);
    bucket.overflow = Math.min(MAX_JACKPOT_PROCS_PER_SEC, bucket.overflow + elapsed);
    if (bucket.primary >= 1) {
      bucket.primary -= 1;
      return 1;
    }
    if (bucket.overflow >= 1) {
      bucket.overflow -= 1;
      return JACKPOT_OVERFLOW_RATE;
    }
    return 0;
  }, []);

  const triggerCritPoisonBurst = useCallback(
    (nextRun: RunState, nextMercs: MercenarySlotState[], nextMeta: MetaState) => {
      if (
        nextRun.runCompleted ||
        nextRun.poisonStacks <= 0 ||
        !nextMercs[1]?.unlocked ||
        nextMercs[1].level <= 0
      ) {
        return new Decimal(0);
      }
      const heroStats = getHeroStats(nextRun, nextMercs, nextMeta);
      const globalMult = getGlobalMult(nextRun, nextMercs, nextMeta);
      const pInfo = getPoisonTickExpectedDamage(
        nextMercs,
        nextRun,
        nextMeta,
        heroStats.heroBasePower,
        heroStats.rawHeroClick,
        globalMult
      );
      if (pInfo.rawPoison.lte(0)) return new Decimal(0);
      const pCrit = pInfo.critChance > 0 && Math.random() < pInfo.critChance;
      const burstDmg = pInfo.rawPoison.mul(0.3).mul(pCrit ? pInfo.critDmg : 1);
      const res = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, burstDmg);
      return res.actualDealt;
    },
    [applyBossDamageAndCheckBreaks]
  );

  // Trigger Thunder Skill damage (used by manual/auto cast AND sp_skill_trig)
  const fireThunderStrike = useCallback(
    (
      nextRun: RunState,
      nextMercs: MercenarySlotState[],
      nextMeta: MetaState,
      levelOverride?: number
    ) => {
      const heroStats = getHeroStats(nextRun, nextMercs, nextMeta);
      const trib = getTribulationConfig(nextRun.tribulationId);
      const eff = getSkillEffectiveValues(
        'sk_thunder',
        levelOverride ?? nextRun.skills.sk_thunder.level,
        nextMercs,
        nextMeta
      );
      // Thunder ignores Tier 2/6/9 directDmgMult penalties
      const unpenalizedHero = heroStats.rawHeroClick.div(trib.debuff.directDmgMult ?? 1);
      const thunderDmg = unpenalizedHero.mul(eff.effectValue);
      const res = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, thunderDmg);
      soundEngine.playCannonFire();
      triggerVibration(35);
      spawnFloatingText(
        `天罚神雷 -${formatNumber(res.actualDealt, settingsRef.current.numberMode)}`,
        'thunder',
        50,
        28
      );
      return res;
    },
    [applyBossDamageAndCheckBreaks, spawnFloatingText, triggerVibration]
  );

  const handleVictory = useCallback(
    (completedRun: RunState, currentMeta: MetaState) => {
      if (victoryTriggeredRef.current) return;
      victoryTriggeredRef.current = true;

      if (squashTimerRef.current) {
        window.clearTimeout(squashTimerRef.current);
        squashTimerRef.current = null;
      }
      if (shakeTimerRef.current) {
        window.clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = null;
      }
      setIsHitSquashed(false);
      setIsArenaShaking(false);
      setHitOffset({ x: 0, y: 0 });
      setClickRipples([]);

      const m: MetaState = {
        ...currentMeta,
        shownTutorials: { ...currentMeta.shownTutorials },
        relicLevels: { ...currentMeta.relicLevels },
        relicDropLevels: { ...(currentMeta.relicDropLevels ?? {}) },
        clearedTribulations: { ...currentMeta.clearedTribulations },
        clearCounts: { ...currentMeta.clearCounts },
        bestClearTimesMs: { ...currentMeta.bestClearTimesMs },
        sssUnlockedAutoRepeat: { ...currentMeta.sssUnlockedAutoRepeat },
      };

      const trib = getTribulationConfig(completedRun.tribulationId);
      const clearTimeMs = Number.isFinite(completedRun.elapsedMs)
        ? Math.max(100, completedRun.elapsedMs)
        : 100;
      const {
        rank,
        crystalMult,
        bonusRelicLevels: speedBonusDrops,
      } = evaluateSpeedrunRank(clearTimeMs, trib.order);

      const crystalBonusMult = getRelicCrystalBonusMult(m);
      const ngMult =
        trib.id === 'tier_10' && m.ngPlusCount > 0 ? Decimal.pow(2, m.ngPlusCount) : new Decimal(1);

      const crystalsEarned = new Decimal(trib.baseCrystalReward)
        .mul(ngMult)
        .mul(crystalMult)
        .mul(crystalBonusMult)
        .floor();

      m.divineCrystals = toDecimal(m.divineCrystals).add(crystalsEarned).toString();
      m.totalSlays += 1;
      m.clearCounts[trib.id] = (m.clearCounts[trib.id] ?? 0) + 1;

      const prevBest = m.bestClearTimesMs[trib.id];
      const isNewRecord = prevBest === undefined || clearTimeMs < prevBest;
      if (isNewRecord) {
        m.bestClearTimesMs[trib.id] = clearTimeMs;
      }

      let unlockedSssAutoRepeat = false;
      if (rank === 'SSS' && !m.sssUnlockedAutoRepeat[trib.id]) {
        m.sssUnlockedAutoRepeat[trib.id] = true;
        unlockedSssAutoRepeat = true;
      }

      let firstClearNote: string | null = null;
      if (!m.clearedTribulations[trib.id]) {
        m.clearedTribulations[trib.id] = true;
        firstClearNote = trib.firstClearSummary;
        if (trib.id === 'tier_1') {
          m.unlockedRelicHall = true;
          queueTutorial('tut_tier1_win', m);
        }
        if (trib.id === 'tier_2') {
          m.unlockedAffixLock = true;
          m.unlockedInnateReroll = true;
        }
        if (trib.id === 'tier_3') {
          m.unlockedEpicPool = true;
          m.unlockedAutoRealm = true;
        }
        if (trib.id === 'tier_4') m.unlockedAutoSkill = true;
        if (trib.id === 'tier_5') {
          m.affixStones += 50;
          m.unlockedAutoHeroUpgrades = true;
        }
        if (trib.id === 'tier_6') {
          m.unlockedAutoMercUpgrade = true;
        }
      }

      // Linear drop count (1..10) + speedrun bonus + NG+ + 造化仙冕 extra roll
      const crownLv = getRelicTotalLv(m, 'rel_e_rarity_crown');
      const crownExtraDrop =
        crownLv > 0 && Math.random() < Math.min(0.4, 0.015 * crownLv) ? 1 : 0;

      const totalDropRolls =
        trib.relicDropCount +
        speedBonusDrops +
        crownExtraDrop +
        (trib.id === 'tier_10' ? Math.min(3, Number(m.ngPlusCount) || 0) : 0);

      const dropAgg: Partial<Record<RelicId, { levelsAdded: number; wasNew: boolean }>> = {};
      const overflowAgg: Partial<Record<RelicId, { count: number; crystals: Decimal }>> = {};

      for (let d = 0; d < totalDropRolls; d++) {
        const rolledTier = rollTribulationRelicTier(trib.id, m);
        const tierRelics = RELICS.filter((r) => r.tier === rolledTier);
        const unowned = tierRelics.filter((r) => getRelicTotalLv(m, r.id) === 0);
        const picked =
          unowned.length > 0
            ? unowned[Math.floor(Math.random() * unowned.length)]
            : tierRelics[Math.floor(Math.random() * tierRelics.length)];

        if (!picked) continue;

        const prevCrystalLv = m.relicLevels[picked.id] ?? 0;
        const prevDropLv = m.relicDropLevels[picked.id] ?? 0;
        const prevTotal = prevCrystalLv + prevDropLv;

        if (picked.maxDropLevel !== null && prevDropLv >= picked.maxDropLevel) {
          const tierBase = RELIC_TIER_META[picked.tier].overflowBaseCrystals;
          const gain = new Decimal(tierBase).mul(ngMult).mul(crystalBonusMult).floor();
          const curOv = overflowAgg[picked.id];
          overflowAgg[picked.id] = {
            count: (curOv?.count ?? 0) + 1,
            crystals: (curOv?.crystals ?? new Decimal(0)).add(gain),
          };
        } else {
          m.relicDropLevels[picked.id] = prevDropLv + 1;
          const existing = dropAgg[picked.id];
          dropAgg[picked.id] = {
            levelsAdded: (existing?.levelsAdded ?? 0) + 1,
            wasNew: existing ? existing.wasNew : prevTotal === 0,
          };
        }
      }

      const convertedOverflowDrops: VictoryOverflowDropItem[] = Object.entries(overflowAgg).map(
        ([id, info]) => {
          const rid = id as RelicId;
          const cfg = RELIC_MAP[rid];
          return {
            relicId: rid,
            tier: cfg.tier,
            name: cfg.name,
            count: info!.count,
            crystalsGained: info!.crystals.toString(),
          };
        }
      );

      const overflowCrystalBonus = Object.values(overflowAgg).reduce(
        (acc, item) => acc.add(item?.crystals ?? 0),
        new Decimal(0)
      );

      if (overflowCrystalBonus.gt(0)) {
        m.divineCrystals = toDecimal(m.divineCrystals).add(overflowCrystalBonus).toString();
      }

      const relicDrops: VictoryRelicDropItem[] = Object.entries(dropAgg).map(([id, info]) => {
        const rid = id as RelicId;
        const cfg = RELIC_MAP[rid];
        const bd = getRelicLevelsBreakdown(m, rid);
        return {
          relicId: rid,
          tier: cfg.tier,
          name: cfg.name,
          levelsAdded: info!.levelsAdded,
          newDropLevel: bd.dropLv,
          crystalLevel: bd.crystalLv,
          totalLevel: bd.totalLv,
          isNew: info!.wasNew,
        };
      });

      // Dual-lock check: require BOTH exponential prev clears AND total relic levels
      let unlockedNextOrder: number | null = null;
      while (m.highestUnlockedOrder < TRIBULATIONS.length) {
        const check = getNextTribulationUnlockState(m);
        if (!check.nextTrib || !check.canUnlock) break;
        m.highestUnlockedOrder = check.nextTrib.order;
        unlockedNextOrder = check.nextTrib.order;
      }

      const afterCheck = getNextTribulationUnlockState(m);
      const nextUnlockProgress = afterCheck.nextTrib
        ? {
            nextOrder: afterCheck.nextTrib.order,
            nextName: afterCheck.nextTrib.name,
            prevClears: afterCheck.prevClears,
            reqClears: afterCheck.reqClears,
            totalRelicLevels: afterCheck.totalRelicLevels,
            reqRelicLevels: afterCheck.reqRelicLevels,
          }
        : null;

      if (trib.id === 'tier_10') {
        m.ngPlusCount += 1;
      }

      metaRef.current = m;
      setMeta(m);
      saveToLocalStorage();

      const summary: VictorySummary = {
        tribulationId: trib.id,
        tribulationName: trib.name,
        clearTimeMs,
        rank,
        rankCrystalMult: crystalMult,
        crystalsEarned: crystalsEarned.toString(),
        overflowCrystalBonus: overflowCrystalBonus.toString(),
        convertedOverflowDrops,
        isNewRecord,
        firstClearNote,
        relicDrops,
        grantedRelicUpgrades: [],
        mythicDropped: null,
        unlockedNextOrder,
        unlockedSssAutoRepeat,
        nextUnlockProgress,
      };

      track('tribulation_clear', {
        tribulationId: trib.id,
        rank,
        clearTimeMs,
        autoRepeat: Boolean(m.autoRepeatEnabled && m.sssUnlockedAutoRepeat[trib.id]),
      });

      const isAutoLoop = m.autoRepeatEnabled && Boolean(m.sssUnlockedAutoRepeat[trib.id]);
      const isFirstMilestone = Boolean(firstClearNote || unlockedSssAutoRepeat);

      if (isAutoLoop) {
        setVictorySummary(null);
        setLastClearReport((prev) => ({
          tribulationId: trib.id,
          tribulationName: trib.name,
          clearTimeMs,
          rank,
          crystalsEarned: crystalsEarned.toString(),
          dropCount: totalDropRolls,
          overflowCrystals: overflowCrystalBonus.toString(),
          unlockedNextOrder,
          autoRepeatRound: prev && prev.tribulationId === trib.id ? prev.autoRepeatRound + 1 : 1,
          updatedAt: Date.now(),
          summary,
        }));
        autoRepeatCountdownRef.current = 0.25;
        setAutoRepeatCountdown(0.25);
        if (clearTimeMs >= 3000) {
          soundEngine.playVictory();
        }
        if (unlockedNextOrder !== null) {
          showToast(`破禁飞升！已解锁【劫数 ${unlockedNextOrder}】挑战权限！`);
        }
      } else if (settingsRef.current.silentAutoClear && !isFirstMilestone) {
        setVictorySummary(null);
        setLastClearReport({
          tribulationId: trib.id,
          tribulationName: trib.name,
          clearTimeMs,
          rank,
          crystalsEarned: crystalsEarned.toString(),
          dropCount: totalDropRolls,
          overflowCrystals: overflowCrystalBonus.toString(),
          unlockedNextOrder,
          autoRepeatRound: 0,
          updatedAt: Date.now(),
          summary,
        });
        autoRepeatCountdownRef.current = null;
        setAutoRepeatCountdown(null);
        soundEngine.playVictory();
        if (unlockedNextOrder !== null) {
          showToast(`破禁飞升！已解锁【劫数 ${unlockedNextOrder}】挑战权限！`);
        }
      } else {
        soundEngine.playVictory();
        setVictorySummary(summary);
        setLastClearReport({
          tribulationId: trib.id,
          tribulationName: trib.name,
          clearTimeMs,
          rank,
          crystalsEarned: crystalsEarned.toString(),
          dropCount: totalDropRolls,
          overflowCrystals: overflowCrystalBonus.toString(),
          unlockedNextOrder,
          autoRepeatRound: 0,
          updatedAt: Date.now(),
          summary,
        });
        autoRepeatCountdownRef.current = null;
        setAutoRepeatCountdown(null);
      }
    },
    [queueTutorial, saveToLocalStorage, showToast]
  );

  // Execute a Mercenary attack (single volley; anti-recursion enforced!)
  const executeMercAttack = useCallback(
    (
      slotIdx: number,
      nextRun: RunState,
      nextMercs: MercenarySlotState[],
      nextMeta: MetaState,
      allowRepeatProc: boolean
    ): Decimal => {
      const slot = nextMercs[slotIdx];
      if (!slot || !slot.unlocked || slot.level <= 0 || nextRun.runCompleted) {
        return new Decimal(0);
      }

      const heroStats = getHeroStats(nextRun, nextMercs, nextMeta);
      const globalMult = getGlobalMult(nextRun, nextMercs, nextMeta);
      const st = getMercenaryComputedStats(
        slotIdx,
        nextMercs,
        nextRun,
        nextMeta,
        heroStats.heroBasePower,
        heroStats.rawHeroClick,
        globalMult
      );

      slot.attackCount += 1;

      // Slot 4 Talent 2 (时光阵眼): reduce all 4 skill cooldowns by 0.5s
      if (slotIdx === 3) {
        for (const sid of ['sk_blood', 'sk_clone', 'sk_thunder', 'sk_sync'] as SkillId[]) {
          if (nextRun.skills[sid].cooldownRemaining > 0) {
            nextRun.skills[sid].cooldownRemaining = Math.max(
              0,
              nextRun.skills[sid].cooldownRemaining - 0.5
            );
          }
        }
      }

      // Slot 2 Talent 1 (剧毒蔓延) or sp_poison_god (capped at 3500 stacks, +2%/hit ramp)
      if (slotIdx === 1) {
        const MAX_POISON_STACKS = 3500;
        if (slot.innateAffix === 'sp_poison_god') {
          if (nextRun.poisonStacks <= 0) {
            nextRun.poisonStacks = 3;
          } else {
            nextRun.poisonStacks = Math.min(
              MAX_POISON_STACKS,
              Math.max(nextRun.poisonStacks + 3, Math.ceil(nextRun.poisonStacks * 1.02))
            );
          }
        } else {
          nextRun.poisonStacks = Math.min(MAX_POISON_STACKS, nextRun.poisonStacks + 3);
        }
      }

      // Compute non-recursive strike count for this attack trigger
      let totalHits =
        slot.innateAffix === 'sp_sword_storm'
          ? 5
          : slot.innateAffix === 'sp_cannon_gat'
            ? 3
            : 1;

      if (allowRepeatProc) {
        // Slot 1 Talent 1 (剑影分光): 20% chance of 2 extra hits
        if (slotIdx === 0 && Math.random() < 0.2) {
          totalHits += 2;
        }
        // af_t2_double
        if (st.doubleHitChance > 0 && Math.random() < st.doubleHitChance) {
          totalHits += 1;
        }
        // af_t2_triple
        if (st.tripleHitChance > 0 && Math.random() < st.tripleHitChance) {
          totalHits += 3;
        }
      }

      const syncBonus =
        nextRun.skills.sk_sync.activeRemaining > 0
          ? heroStats.rawHeroClick.mul(
              getSkillEffectiveValues(
                'sk_sync',
                nextRun.skills.sk_sync.level,
                nextMercs,
                nextMeta
              ).effectValue
            )
          : new Decimal(0);

      let totalDealt = new Decimal(0);
      const nowMs = Date.now();
      const currentTotalDps = toDecimal(nextRun.recentTickDps.hero)
        .add(toDecimal(nextRun.recentTickDps.poison))
        .add(
          nextRun.recentTickDps.mercs.reduce((acc, v) => acc.add(toDecimal(v)), new Decimal(0))
        )
        .add(toDecimal(nextRun.recentTickDps.bonus ?? '0'));

      // ===== 每次【攻击】触发一次的效果（v3.9：从命中循环移出，避免被 5~9 段命中放大）=====
      // 剑侍/主角每 15 次攻击为机神充能；与雷火装填共享 1.0 秒/秒的充能上限
      if (slotIdx === 0 && nextMercs[2]?.unlocked && nextMercs[2].level > 0) {
        nextRun.swordAndHeroAttacksForCannon += 1;
        if (nextRun.swordAndHeroAttacksForCannon >= 15) {
          const steps = Math.floor(nextRun.swordAndHeroAttacksForCannon / 15);
          nextRun.swordAndHeroAttacksForCannon %= 15;
          nextMercs[2].attackTimer += consumeCannonCharge(
            steps * CANNON_CHARGE_SEC_PER_15_ATTACKS
          );
        }
      }

      // af_t3_cd_can：其他护法的每次攻击为机神装填；机神自身不自我装填，防止无限加速
      if (
        st.cdReduceCanSec > 0 &&
        slotIdx !== 2 &&
        nextMercs[2]?.unlocked &&
        nextMercs[2].level > 0
      ) {
        nextMercs[2].attackTimer += consumeCannonCharge(st.cdReduceCanSec);
      }

      // af_t3_buff_h (FIFO 25 stacks, 5s)
      if (st.heroBuffOnHit > 0) {
        const nextBuffs = [
          ...nextRun.heroBuffStacks.filter((b) => b.expiresAt > nowMs),
          { val: st.heroBuffOnHit, expiresAt: nowMs + 5000 },
        ];
        nextRun.heroBuffStacks =
          nextBuffs.length > 25 ? nextBuffs.slice(nextBuffs.length - 25) : nextBuffs;
      }

      // af_t2_mana_h
      if (st.manaOnHitChance > 0 && Math.random() < st.manaOnHitChance) {
        nextRun.mana = Math.min(heroStats.manaCap, nextRun.mana + 2);
      }

      // af_t2_jackpot：每秒最多 5 次全额 + 5 次 20% 折算，超出丢弃
      if (st.jackpotChance > 0 && currentTotalDps.gt(0) && Math.random() < st.jackpotChance) {
        const procValue = consumeJackpotProc();
        if (procValue > 0) {
          nextRun.spiritStones = toDecimal(nextRun.spiritStones)
            .add(currentTotalDps.mul(2.0).mul(procValue))
            .toString();
        }
      }

      // ===== 每次【命中】结算的伤害/暴击特效 =====
      for (let h = 0; h < totalHits; h++) {
        if (nextRun.runCompleted) break;

        const isCrit = Math.random() < st.critRate;
        const hitDmg = st.rawDmg.mul(isCrit ? st.critDmg : 1).add(syncBonus);
        const res = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, hitDmg);
        totalDealt = totalDealt.add(res.actualDealt);

        if (slotIdx === 2 && res.actualDealt.gt(0) && h === 0) {
          triggerHitSquash();
          if (isCrit) {
            spawnFloatingText(
              `机神爆轰 -${formatNumber(res.actualDealt, settingsRef.current.numberMode)}!`,
              'crit'
            );
          }
        }

        // Any ally crit triggers Slot 2 Talent 2 (毒爆共鸣) — 文案本就按“命中”结算
        if (isCrit) {
          totalDealt = totalDealt.add(triggerCritPoisonBurst(nextRun, nextMercs, nextMeta));
        }

        // af_t3_pop_dot (每命中触发全额毒伤) — 保留按命中结算
        if (
          st.poisonPopChance > 0 &&
          nextRun.poisonStacks > 0 &&
          Math.random() < st.poisonPopChance
        ) {
          const pInfo = getPoisonTickExpectedDamage(
            nextMercs,
            nextRun,
            nextMeta,
            heroStats.heroBasePower,
            heroStats.rawHeroClick,
            globalMult
          );
          if (pInfo.rawPoison.gt(0)) {
            const pCrit = pInfo.critChance > 0 && Math.random() < pInfo.critChance;
            const pDmg = pInfo.rawPoison.mul(pCrit ? pInfo.critDmg : 1);
            const pRes = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, pDmg);
            totalDealt = totalDealt.add(pRes.actualDealt);
          }
        }
      }

      // sp_skill_trig (every 30 attacks triggers free Thunder Strike Lv.>=1)
      if (slot.innateAffix === 'sp_skill_trig' && slot.attackCount % 30 === 0 && !nextRun.runCompleted) {
        fireThunderStrike(nextRun, nextMercs, nextMeta, Math.max(1, nextRun.skills.sk_thunder.level));
      }

      return totalDealt;
    },
    [
      applyBossDamageAndCheckBreaks,
      consumeCannonCharge,
      consumeJackpotProc,
      fireThunderStrike,
      spawnFloatingText,
      triggerCritPoisonBurst,
      triggerHitSquash,
    ]
  );

  // Execute a batch of Hero clicks ('manual' | 'clone' | 'puppet')
  const applyHeroClicks = useCallback(
    (
      nextRun: RunState,
      nextMercs: MercenarySlotState[],
      nextMeta: MetaState,
      clickCount: number,
      clickSource: 'manual' | 'clone' | 'puppet',
      xPct?: number,
      yPct?: number,
      clickDmgMult = 1
    ): { dealt: Decimal; shellsBroken: number } => {
      if (clickCount <= 0 || nextRun.runCompleted) {
        return { dealt: new Decimal(0), shellsBroken: 0 };
      }
      if (!nextRun.timerStarted) nextRun.timerStarted = true;

      const oldStacks = toDecimal(nextRun.clickStacks);
      const newStacks = oldStacks.add(clickCount);
      nextRun.clickStacks = newStacks.toString();
      if (clickSource === 'manual') nextRun.manualClicks += clickCount;
      nextMeta.totalClicks = toDecimal(nextMeta.totalClicks).add(clickCount).toString();

      // Hero attack growth with Puppet 25% sourceFactor + 500-click soft cap 20% + Skill 1
      const growthPerClick = getHeroGrowthPerClick(nextRun, nextMercs, nextMeta);
      const sourceFactor = clickSource === 'puppet' ? 0.25 : 1.0;
      const capPenalty = toDecimal(nextRun.accumulatedAtk).gte(growthPerClick.mul(500))
        ? 0.2
        : 1.0;
      const bloodSkill = nextRun.skills.sk_blood;
      const bloodMult =
        bloodSkill.activeRemaining > 0
          ? getSkillEffectiveValues('sk_blood', bloodSkill.level, nextMercs, nextMeta)
              .effectValue
          : 1.0;
      const actualGainPerClick = growthPerClick
        .mul(sourceFactor)
        .mul(capPenalty)
        .mul(bloodMult);
      const totalGrowthGain = actualGainPerClick.mul(clickCount);

      nextRun.accumulatedAtk = toDecimal(nextRun.accumulatedAtk).add(totalGrowthGain).toString();

      const echoLv = getRelicTotalLv(nextMeta, 'rel_m_click_echo');
      if (echoLv > 0) {
        nextRun.sharedHeroGrowth = toDecimal(nextRun.sharedHeroGrowth)
          .add(totalGrowthGain.mul(Math.min(1.2, 0.06 * echoLv)))
          .toString();
      }

      const heroStats = getHeroStats(nextRun, nextMercs, nextMeta);

      if (clickSource === 'manual') {
        nextRun.mana = Math.min(
          heroStats.manaCap,
          nextRun.mana + heroStats.manualClickManaGain * clickCount
        );
      }

      let totalClickDmg: Decimal;
      let isCrit = false;
      if (clickSource === 'manual') {
        isCrit = Math.random() < heroStats.heroCritChance;
        totalClickDmg = heroStats.rawHeroClick
          .mul(isCrit ? heroStats.heroCritDmgMult : 1)
          .mul(clickCount);
      } else {
        totalClickDmg = heroStats.expectedHeroClick.mul(clickCount).mul(clickDmgMult);
      }

      const res = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, totalClickDmg);

      if (clickSource === 'manual') {
        soundEngine.playClickHit(isCrit);
        setHitPulseId((x) => x + 1);
        triggerHitSquash();
        if (xPct !== undefined && yPct !== undefined) {
          spawnClickRipple(xPct, yPct);
        }
        const txt = formatNumber(res.actualDealt, settingsRef.current.numberMode);
        if (res.shellsBroken > 0) {
          spawnFloatingText(`碎壳 -${txt}`, 'shell', xPct, yPct);
        } else if (isCrit) {
          spawnFloatingText(`会心 -${txt}!`, 'crit', xPct, yPct);
        } else {
          spawnFloatingText(`-${txt}`, 'hero', xPct, yPct);
        }
      }

      // Ally crit -> Slot 2 poison burst
      if (isCrit) {
        triggerCritPoisonBurst(nextRun, nextMercs, nextMeta);
      }

      // Hero clicks advance Slot 3 cannon charge (15 hits -> shared charge budget)
      if (nextMercs[2]?.unlocked && nextMercs[2].level > 0) {
        nextRun.swordAndHeroAttacksForCannon += clickCount;
        if (nextRun.swordAndHeroAttacksForCannon >= 15) {
          const steps = Math.floor(nextRun.swordAndHeroAttacksForCannon / 15);
          nextRun.swordAndHeroAttacksForCannon %= 15;
          nextMercs[2].attackTimer += consumeCannonCharge(
            steps * CANNON_CHARGE_SEC_PER_15_ATTACKS
          );
        }
      }

      // Slot 1 Talent 2 (御剑随心): every 12 cumulative clicks -> Slot 1 free attack
      if (nextMercs[0]?.unlocked && nextMercs[0].level > 0 && !nextRun.runCompleted) {
        const rawSwordTrig = newStacks.div(12).floor().sub(oldStacks.div(12).floor()).toNumber();
        const swordTrig = Number.isFinite(rawSwordTrig)
          ? Math.max(0, Math.min(5, Math.floor(rawSwordTrig)))
          : 5;
        for (let k = 0; k < swordTrig; k++) {
          if (nextRun.runCompleted) break;
          executeMercAttack(0, nextRun, nextMercs, nextMeta, false);
        }
      }

      // Every 20 cumulative clicks -> af_t3_click_t (伴生剑意)
      const rawTrig20 = newStacks.div(20).floor().sub(oldStacks.div(20).floor()).toNumber();
      const triggersCrossed20 = Number.isFinite(rawTrig20)
        ? Math.max(0, Math.min(5, Math.floor(rawTrig20)))
        : 5;
      if (triggersCrossed20 > 0 && !nextRun.runCompleted) {
        const s5 = isSlot5Active(nextMercs);
        const firstRelicLv = getRelicTotalLv(nextMeta, 'rel_m_first_affix');
        for (let t = 0; t < triggersCrossed20; t++) {
          for (let idx = 0; idx < nextMercs.length; idx++) {
            const m = nextMercs[idx];
            if (!m.unlocked || m.level <= 0 || nextRun.runCompleted) continue;
            const chance = Math.min(
              1,
              sumMercActiveAffixRatio(m, 'af_t3_click_t', s5, firstRelicLv)
            );
            if (chance > 0 && Math.random() < chance) {
              executeMercAttack(idx, nextRun, nextMercs, nextMeta, false);
            }
          }
        }
      }

      // Every 10 cumulative clicks -> rel_e_click_storm coordinated team strike
      const clickStormLv = getRelicTotalLv(nextMeta, 'rel_e_click_storm');
      if (clickStormLv > 0 && !nextRun.runCompleted) {
        const rawTrig10 = newStacks.div(10).floor().sub(oldStacks.div(10).floor()).toNumber();
        const triggersCrossed10 = Number.isFinite(rawTrig10)
          ? Math.max(0, Math.min(5, Math.floor(rawTrig10)))
          : 5;
        if (triggersCrossed10 > 0) {
          const globalNow = getGlobalMult(nextRun, nextMercs, nextMeta);
          let volleyDmg = new Decimal(0);
          for (let idx = 0; idx < nextMercs.length; idx++) {
            const m = nextMercs[idx];
            if (!m.unlocked || m.level <= 0) continue;
            const st = getMercenaryComputedStats(
              idx,
              nextMercs,
              nextRun,
              nextMeta,
              heroStats.heroBasePower,
              heroStats.rawHeroClick,
              globalNow
            );
            volleyDmg = volleyDmg.add(st.expectedDmg.mul(0.04 * clickStormLv));
          }
          if (volleyDmg.gt(0)) {
            const stormRes = applyBossDamageAndCheckBreaks(
              nextRun,
              nextMercs,
              nextMeta,
              volleyDmg.mul(triggersCrossed10)
            );
            if (clickSource === 'manual' && stormRes.actualDealt.gt(0)) {
              spawnFloatingText(
                `万道合击 -${formatNumber(stormRes.actualDealt, settingsRef.current.numberMode)}`,
                'crit',
                54,
                32
              );
            }
          }
        }
      }

      return { dealt: res.actualDealt, shellsBroken: res.shellsBroken };
    },
    [
      applyBossDamageAndCheckBreaks,
      consumeCannonCharge,
      executeMercAttack,
      spawnClickRipple,
      spawnFloatingText,
      triggerCritPoisonBurst,
      triggerHitSquash,
    ]
  );

  const castSkillInternal = useCallback(
    (
      skillId: SkillId,
      nextRun: RunState,
      nextMercs: MercenarySlotState[],
      nextMeta: MetaState
    ): boolean => {
      const cfg = SKILLS.find((s) => s.id === skillId)!;
      if (nextRun.realmLevel < cfg.unlockRealm) return false;

      const skState = nextRun.skills[skillId];
      if (skState.cooldownRemaining > 0) return false;

      const eff = getSkillEffectiveValues(skillId, skState.level, nextMercs, nextMeta);
      if (nextRun.mana < eff.manaCost) return false;

      nextRun.mana -= eff.manaCost;
      nextRun.manaSpentThisRun = (nextRun.manaSpentThisRun ?? 0) + cfg.manaCost;
      nextRun.skills[skillId] = {
        ...skState,
        activeRemaining: eff.duration,
        cooldownRemaining: eff.cooldown,
      };

      if (!nextRun.timerStarted) nextRun.timerStarted = true;

      if (skillId === 'sk_thunder') {
        fireThunderStrike(nextRun, nextMercs, nextMeta);
      } else {
        soundEngine.playBurst();
      }

      return true;
    },
    [fireThunderStrike]
  );

  // Main 20Hz Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, Math.max(0.01, (now - lastTime) / 1000));
      lastTime = now;

      const prevRun = runRef.current;

      if (prevRun.runCompleted) {
        const curCd = autoRepeatCountdownRef.current;
        if (curCd !== null) {
          const nextCd = curCd - dt;
          if (nextCd <= 0) {
            const curMeta = metaRef.current;
            const autoCasts = {
              sk_blood: prevRun.skills.sk_blood.autoCast,
              sk_clone: prevRun.skills.sk_clone.autoCast,
              sk_thunder: prevRun.skills.sk_thunder.autoCast,
              sk_sync: prevRun.skills.sk_sync.autoCast,
            };
            const freshRun = createInitialRunState(prevRun.tribulationId, curMeta, autoCasts);
            const freshMercs = resetMercsForNewRun(mercsRef.current);
            victoryTriggeredRef.current = false;
            autoRepeatCountdownRef.current = null;
            runRef.current = freshRun;
            mercsRef.current = freshMercs;
            puppetAccRef.current = 0;
            cloneAccRef.current = 0;
            poisonTickAccRef.current = 0;
            setRun(freshRun);
            setMercs(freshMercs);
            setVictorySummary(null);
            setAutoRepeatCountdown(null);
          } else {
            autoRepeatCountdownRef.current = nextCd;
            setAutoRepeatCountdown(nextCd);
          }
        }
        return;
      }

      const nowMs = Date.now();
      const nextRun: RunState = {
        ...prevRun,
        skills: {
          sk_blood: { ...prevRun.skills.sk_blood },
          sk_clone: { ...prevRun.skills.sk_clone },
          sk_thunder: { ...prevRun.skills.sk_thunder },
          sk_sync: { ...prevRun.skills.sk_sync },
        },
        heroBuffStacks: prevRun.heroBuffStacks.filter((b) => b.expiresAt > nowMs),
        recentTickDps: {
          hero: prevRun.recentTickDps.hero,
          poison: prevRun.recentTickDps.poison,
          mercs: [...prevRun.recentTickDps.mercs] as [string, string, string, string, string],
          bonus: prevRun.recentTickDps.bonus ?? '0',
        },
      };
      const nextMercs: MercenarySlotState[] = mercsRef.current.map((m) => ({ ...m }));
      const nextMeta: MetaState = {
        ...metaRef.current,
        shownTutorials: { ...metaRef.current.shownTutorials },
        relicLevels: { ...metaRef.current.relicLevels },
        relicDropLevels: { ...(metaRef.current.relicDropLevels ?? {}) },
      };

      if (nextRun.timerStarted) {
        nextRun.elapsedMs += dt * 1000;
      }

      // Skill timers & auto-cast
      const hasMythicAuto = getRelicTotalLv(nextMeta, 'rel_m_auto_skill') > 0;
      for (const cfg of SKILLS) {
        const sk = nextRun.skills[cfg.id];
        if (sk.activeRemaining > 0) {
          sk.activeRemaining = Math.max(0, sk.activeRemaining - dt);
        }
        if (sk.cooldownRemaining > 0) {
          sk.cooldownRemaining = Math.max(0, sk.cooldownRemaining - dt);
        }
        if (
          sk.cooldownRemaining <= 0 &&
          nextRun.realmLevel >= cfg.unlockRealm &&
          (hasMythicAuto || (nextMeta.unlockedAutoSkill && sk.autoCast))
        ) {
          castSkillInternal(cfg.id, nextRun, nextMercs, nextMeta);
        }
      }

      // Mana regen
      const heroStats = getHeroStats(nextRun, nextMercs, nextMeta, nowMs);
      nextRun.mana = Math.min(heroStats.manaCap, nextRun.mana + heroStats.manaRegenPerSec * dt);

      // Boss regen (Tier 5 / 9 / 10 — capped at current shell's bossMaxHp)
      const trib = getTribulationConfig(nextRun.tribulationId);
      if (trib.debuff.bossRegenPctPerSec && nextRun.timerStarted && !nextRun.runCompleted) {
        const curHp = toDecimal(nextRun.bossHp);
        const maxHp = toDecimal(nextRun.bossMaxHp);
        const regen = maxHp.mul(trib.debuff.bossRegenPctPerSec * dt);
        nextRun.bossHp = Decimal.min(maxHp, curHp.add(regen)).toString();
      }

      // Puppet auto-clicks (25% atk growth, capped at 25/s with excess converted 1:1 into damage)
      if (heroStats.puppetRate > 0 && !nextRun.runCompleted) {
        puppetAccRef.current += heroStats.puppetRate * dt;
        const hits = Math.floor(puppetAccRef.current);
        if (hits > 0) {
          puppetAccRef.current -= hits;
          applyHeroClicks(
            nextRun,
            nextMercs,
            nextMeta,
            hits,
            'puppet',
            undefined,
            undefined,
            heroStats.puppetOverflowMult
          );
        }
      }

      // Skill 2 Clone clicks (100% atk growth, capped at 25/s with excess converted 1:1 into damage)
      if (nextRun.skills.sk_clone.activeRemaining > 0 && !nextRun.runCompleted) {
        const rawCloneRate = getSkillEffectiveValues(
          'sk_clone',
          nextRun.skills.sk_clone.level,
          nextMercs,
          nextMeta
        ).effectValue;
        const cloneRate = Math.min(MAX_ATTACKS_PER_SEC, rawCloneRate);
        const cloneOverflowMult =
          rawCloneRate > MAX_ATTACKS_PER_SEC ? rawCloneRate / MAX_ATTACKS_PER_SEC : 1.0;
        cloneAccRef.current += cloneRate * dt;
        const hits = Math.floor(cloneAccRef.current);
        if (hits > 0) {
          cloneAccRef.current -= hits;
          applyHeroClicks(
            nextRun,
            nextMercs,
            nextMeta,
            hits,
            'clone',
            undefined,
            undefined,
            cloneOverflowMult
          );
        }
      }

      // Mercenary attacks
      const globalMult = getGlobalMult(nextRun, nextMercs, nextMeta);
      const pulsedSlots = new Set<number>();
      for (let i = 0; i < nextMercs.length; i++) {
        const slot = nextMercs[i];
        if (!slot.unlocked || slot.level <= 0 || nextRun.runCompleted) continue;
        const st = getMercenaryComputedStats(
          i,
          nextMercs,
          nextRun,
          nextMeta,
          heroStats.heroBasePower,
          heroStats.rawHeroClick,
          globalMult
        );
        slot.attackTimer += dt;
        let safety = 0;
        while (slot.attackTimer >= st.interval && safety < 10 && !nextRun.runCompleted) {
          safety++;
          slot.attackTimer -= st.interval;
          executeMercAttack(i, nextRun, nextMercs, nextMeta, true);
          pulsedSlots.add(i);
        }
      }
      if (pulsedSlots.size > 0) {
        setMercPulseIds((prev) =>
          prev.map((v, idx) => (pulsedSlots.has(idx) ? v + 1 : v)) as [
            number,
            number,
            number,
            number,
            number,
          ]
        );
      }

      // Poison 1.0s tick
      if (nextRun.poisonStacks > 0 && !nextRun.runCompleted) {
        poisonTickAccRef.current += dt;
        if (poisonTickAccRef.current >= 1.0) {
          poisonTickAccRef.current -= 1.0;
          const pInfo = getPoisonTickExpectedDamage(
            nextMercs,
            nextRun,
            nextMeta,
            heroStats.heroBasePower,
            heroStats.rawHeroClick,
            globalMult
          );
          if (pInfo.rawPoison.gt(0)) {
            const pCrit = pInfo.critChance > 0 && Math.random() < pInfo.critChance;
            const pDmg = pInfo.rawPoison.mul(pCrit ? pInfo.critDmg : 1);
            const pRes = applyBossDamageAndCheckBreaks(nextRun, nextMercs, nextMeta, pDmg);
            if (pRes.actualDealt.gt(0)) {
              spawnFloatingText(
                `毒伤 -${formatNumber(pRes.actualDealt, settingsRef.current.numberMode)}`,
                'poison',
                48 + (Math.random() - 0.5) * 20,
                40
              );
            }
          }
        }
      }

      // Smooth DPS estimate for HUD (single source of truth)
      const liveBreakdown = getTeamCombatDpsBreakdown(nextRun, nextMercs, nextMeta, { nowMs });
      const mercDpsStrings = liveBreakdown.mercDpsList.map((d) => d.toString()) as [
        string,
        string,
        string,
        string,
        string,
      ];

      nextRun.recentTickDps = {
        hero: liveBreakdown.heroDps.toString(),
        poison: liveBreakdown.poisonTotalDps.toString(),
        mercs: mercDpsStrings,
        bonus: liveBreakdown.clickLinkDps.add(liveBreakdown.cannonChargeDps).toString(),
      };

      // Late-game灵枢 Automation Cycle (runs every 0.25s; Tier 6 Mercs prioritized before Tier 5)
      autoBuyAccRef.current += dt;
      let autoPurchased = false;
      if (autoBuyAccRef.current >= 0.25 && !nextRun.runCompleted) {
        autoBuyAccRef.current = 0;
        autoPurchased = applyAutoUpgradesCycle(nextRun, nextMercs, nextMeta, {
          onUnlockAffixTut: () => queueTutorial('tut_affix', nextMeta),
          onThousandMilestone: (mercName) => {
            if (!nextMeta.autoRepeatEnabled && !settingsRef.current.silentAutoClear) {
              soundEngine.playBurst();
              showToast(`${mercName} 千级圆满！开启第 10 重道纹并获赠 50 神晶！`);
            }
          },
        });
      }

      // Update lifetime playtime & highest DPS
      nextMeta.totalPlayTimeMs += dt * 1000;
      if (liveBreakdown.totalDps.gt(toDecimal(nextMeta.highestDps))) {
        nextMeta.highestDps = liveBreakdown.totalDps.toString();
      }

      const prevBrokenPhase = prevRun.phaseIndex;
      const shellBroke = nextRun.phaseIndex > prevBrokenPhase || nextRun.runCompleted;
      if (shellBroke) {
        soundEngine.playShellBreak();
        triggerVibration([35, 25, 45]);
        if (settingsRef.current.hitVfxEnabled) {
          setShellShatterId((x) => x + 1);
          triggerArenaShake();
        }
      }

      runRef.current = nextRun;
      mercsRef.current = nextMercs;

      // 逻辑仍为 20Hz，UI 降为 10Hz；破壳/胜利等关键事件强制立即同步。
      uiSyncAccRef.current += dt;
      const forceUiSync = shellBroke || autoPurchased || nextRun.runCompleted;
      const shouldSyncUi = forceUiSync || uiSyncAccRef.current * 1000 >= UI_SYNC_MS;
      if (shouldSyncUi) {
        uiSyncAccRef.current = 0;
        setRun(nextRun);
        if (nextMercs.some((m) => m.unlocked)) {
          setMercs(nextMercs);
        }
      }

      const stonesChanged = nextMeta.affixStones !== metaRef.current.affixStones;
      const shouldSyncMetaUi =
        shellBroke || stonesChanged || autoPurchased || nowMs - lastMetaUiSyncRef.current >= 1000;

      metaRef.current = nextMeta;
      if (shouldSyncMetaUi) {
        lastMetaUiSyncRef.current = nowMs;
        setMeta(nextMeta);
      }

      if (nextRun.runCompleted) {
        handleVictory(nextRun, nextMeta);
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [
    applyBossDamageAndCheckBreaks,
    applyHeroClicks,
    castSkillInternal,
    executeMercAttack,
    handleVictory,
    queueTutorial,
    showToast,
    spawnFloatingText,
    triggerArenaShake,
    triggerVibration,
  ]);

  // Auto-save every 2s（切后台时不写盘，减少移动端无意义写入与耗电）
  useEffect(() => {
    const id = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      saveToLocalStorage();
    }, 2000);
    const onUnload = () => saveToLocalStorage();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [saveToLocalStorage]);

  // 静默接入 TapTap 登录（单机玩法不依赖服务端，但平台审核要求接入）
  useEffect(() => {
    void ensureTapLogin();
  }, []);

  // WebView / 小游戏切后台时立即落盘，并尽量同步云端
  useEffect(() => {
    return subscribeAppLifecycle(
      () => {
        saveToLocalStorage();
        void flushCloudSave();
      },
      () => {
        // 回到前台时由 20Hz 主循环继续推进，离线结算只在冷启动时处理
      }
    );
  }, [saveToLocalStorage]);

  const completeIntro = useCallback(() => {
    const next = { ...metaRef.current, hasSeenIntro: true };
    metaRef.current = next;
    setMeta(next);
    saveToLocalStorage();
    track('intro_complete');
  }, [saveToLocalStorage]);

  const replayIntro = useCallback(() => {
    const next = { ...metaRef.current, hasSeenIntro: false };
    metaRef.current = next;
    setMeta(next);
  }, []);

  const dismissTutorial = useCallback(() => {
    setPendingTutorials((q) => q.slice(1));
  }, []);

  const manualClick = useCallback(
    (xPct?: number, yPct?: number) => {
      const prevRun = runRef.current;
      if (prevRun.runCompleted) return;
      const nextRun: RunState = {
        ...prevRun,
        skills: { ...prevRun.skills },
        heroBuffStacks: [...prevRun.heroBuffStacks],
        recentTickDps: { ...prevRun.recentTickDps },
      };
      const nextMercs = mercsRef.current.map((m) => ({ ...m }));
      const nextMeta: MetaState = {
        ...metaRef.current,
        shownTutorials: { ...metaRef.current.shownTutorials },
        relicLevels: { ...metaRef.current.relicLevels },
        relicDropLevels: { ...(metaRef.current.relicDropLevels ?? {}) },
      };

      const res = applyHeroClicks(nextRun, nextMercs, nextMeta, 1, 'manual', xPct, yPct);
      if (res.shellsBroken > 0) {
        soundEngine.playShellBreak();
        triggerVibration([35, 25, 45]);
        if (settingsRef.current.hitVfxEnabled) {
          setShellShatterId((x) => x + 1);
          triggerArenaShake();
        }
      }

      runRef.current = nextRun;
      mercsRef.current = nextMercs;
      metaRef.current = nextMeta;
      setRun(nextRun);
      setMercs(nextMercs);
      setMeta(nextMeta);

      if (nextRun.runCompleted) {
        handleVictory(nextRun, nextMeta);
      }
    },
    [applyHeroClicks, handleVictory, triggerArenaShake, triggerVibration]
  );

  const upgradeEnlightenment = useCallback(() => {
    const prev = runRef.current;
    const stones = toDecimal(prev.spiritStones);
    const effGrowth = getEffectiveGrowthRate(ENLIGHTENMENT_COST_GROWTH, prev.tribulationId);
    const costRed = getCostReductionMult(metaRef.current);
    const { count, totalCost } = calculateBulkUpgrade(
      new Decimal(ENLIGHTENMENT_BASE_COST),
      effGrowth,
      prev.enlightenmentLevel,
      costRed,
      settingsRef.current.buyMode,
      stones
    );
    if (count <= 0 || stones.lt(totalCost)) {
      showToast('灵石不足');
      return;
    }
    const prevGrowth = getHeroGrowthPerClick(prev, mercsRef.current, metaRef.current);
    const nextRunDraft: RunState = {
      ...prev,
      spiritStones: stones.sub(totalCost).toString(),
      enlightenmentLevel: prev.enlightenmentLevel + count,
    };
    const nextGrowth = getHeroGrowthPerClick(nextRunDraft, mercsRef.current, metaRef.current);
    const enlightRelicLv = getRelicTotalLv(metaRef.current, 'rel_r_enlight_boost');
    const gainedResonance =
      enlightRelicLv > 0
        ? Decimal.max(0, nextGrowth.sub(prevGrowth)).mul(0.04 + 0.03 * enlightRelicLv)
        : new Decimal(0);
    const next: RunState = {
      ...nextRunDraft,
      sharedHeroGrowth: toDecimal(prev.sharedHeroGrowth).add(gainedResonance).toString(),
    };
    runRef.current = next;
    setRun(next);
  }, [showToast]);

  const breakthroughRealm = useCallback(() => {
    const prev = runRef.current;
    const nextInfo = getRealmInfo(prev.realmLevel + 1);
    const stones = toDecimal(prev.spiritStones);
    const clicks = toDecimal(prev.clickStacks);
    if (stones.lt(nextInfo.reqStones)) {
      showToast(
        `需拥有 ${formatNumber(nextInfo.reqStones, settingsRef.current.numberMode)} 灵石`
      );
      return;
    }
    if (nextInfo.reqClicks > 0 && clicks.lt(nextInfo.reqClicks)) {
      showToast(`需本局累计点击 ${nextInfo.reqClicks} 次`);
      return;
    }
    const next: RunState = {
      ...prev,
      spiritStones: stones.sub(nextInfo.reqStones).toString(),
      realmLevel: prev.realmLevel + 1,
    };
    runRef.current = next;
    setRun(next);
    soundEngine.playBurst();
    showToast(`肉身破境成功！踏入【${nextInfo.name}】`);
  }, [showToast]);

  const buyPuppet = useCallback(() => {
    const prev = runRef.current;
    if (!metaRef.current.hasUnlockedPuppet) return;
    if (prev.puppetLevel >= PUPPET_MAX_LEVEL) {
      showToast(`机关傀儡已达最高 ${PUPPET_MAX_LEVEL} 级`);
      return;
    }

    const stones = toDecimal(prev.spiritStones);
    const effGrowth = getEffectiveGrowthRate(PUPPET_COST_GROWTH, prev.tribulationId);
    const costRed = getCostReductionMult(metaRef.current);
    const { count, totalCost } = calculateBulkUpgrade(
      new Decimal(PUPPET_UNLOCK_COST),
      effGrowth,
      prev.puppetLevel + 1,
      costRed,
      settingsRef.current.buyMode,
      stones,
      PUPPET_MAX_LEVEL + 1
    );
    if (count <= 0 || stones.lt(totalCost)) {
      showToast('灵石不足');
      return;
    }
    const next: RunState = {
      ...prev,
      spiritStones: stones.sub(totalCost).toString(),
      puppetLevel: Math.min(PUPPET_MAX_LEVEL, prev.puppetLevel + count),
    };
    runRef.current = next;
    setRun(next);
  }, [showToast]);

  const castSkill = useCallback(
    (skillId: SkillId) => {
      const prev = runRef.current;
      if (prev.runCompleted) return;
      const nextRun: RunState = {
        ...prev,
        skills: { ...prev.skills },
        heroBuffStacks: [...prev.heroBuffStacks],
        recentTickDps: { ...prev.recentTickDps },
      };
      const nextMercs = mercsRef.current.map((m) => ({ ...m }));
      const nextMeta: MetaState = {
        ...metaRef.current,
        shownTutorials: { ...metaRef.current.shownTutorials },
        relicLevels: { ...metaRef.current.relicLevels },
        relicDropLevels: { ...(metaRef.current.relicDropLevels ?? {}) },
      };

      const cfg = SKILLS.find((s) => s.id === skillId)!;
      if (nextRun.realmLevel < cfg.unlockRealm) {
        const reqRealm = REALM_TIERS.find((r) => r.level === cfg.unlockRealm);
        showToast(`需破境至【${reqRealm?.name ?? ''}】方可使用`);
        return;
      }
      if (nextRun.skills[skillId].cooldownRemaining > 0) {
        showToast('神通冷却中');
        return;
      }
      const eff = getSkillEffectiveValues(
        skillId,
        nextRun.skills[skillId].level,
        nextMercs,
        nextMeta
      );
      if (nextRun.mana < eff.manaCost) {
        showToast(`道力不足（需 ${eff.manaCost} 点）`);
        return;
      }

      castSkillInternal(skillId, nextRun, nextMercs, nextMeta);
      runRef.current = nextRun;
      mercsRef.current = nextMercs;
      metaRef.current = nextMeta;
      setRun(nextRun);
      setMercs(nextMercs);
      setMeta(nextMeta);

      if (nextRun.runCompleted) {
        handleVictory(nextRun, nextMeta);
      }
    },
    [castSkillInternal, handleVictory, showToast]
  );

  const upgradeSkill = useCallback(
    (skillId: SkillId) => {
      const prev = runRef.current;
      const cfg = SKILLS.find((s) => s.id === skillId)!;
      if (prev.realmLevel < cfg.unlockRealm) {
        showToast('请先突破对应境界解锁此神通');
        return;
      }
      const stones = toDecimal(prev.spiritStones);
      const effGrowth = getEffectiveGrowthRate(cfg.costGrowth, prev.tribulationId);
      const costRed = getCostReductionMult(metaRef.current);
      const curLv = prev.skills[skillId].level;
      const { count, totalCost } = calculateBulkUpgrade(
        new Decimal(cfg.baseUpgradeCost),
        effGrowth,
        curLv,
        costRed,
        settingsRef.current.buyMode,
        stones
      );
      if (count <= 0 || stones.lt(totalCost)) {
        showToast('灵石不足');
        return;
      }
      const next: RunState = {
        ...prev,
        spiritStones: stones.sub(totalCost).toString(),
        skills: {
          ...prev.skills,
          [skillId]: {
            ...prev.skills[skillId],
            level: curLv + count,
          },
        },
      };
      runRef.current = next;
      setRun(next);
    },
    [showToast]
  );

  const toggleSkillAutoCast = useCallback((skillId: SkillId) => {
    if (
      !metaRef.current.unlockedAutoSkill &&
      getRelicTotalLv(metaRef.current, 'rel_m_auto_skill') <= 0
    ) {
      return;
    }
    setRun((prev) => {
      const next: RunState = {
        ...prev,
        skills: {
          ...prev.skills,
          [skillId]: {
            ...prev.skills[skillId],
            autoCast: !prev.skills[skillId].autoCast,
          },
        },
      };
      runRef.current = next;
      return next;
    });
  }, []);

  const unlockMercSlot = useCallback(
    (slotIndex: number) => {
      if (slotIndex === 0) {
        showToast('1 号位将在首次击破第 2 重躯壳时免费解锁！');
        return;
      }
      const curMercs = mercsRef.current;
      if (curMercs[slotIndex]?.unlocked) return;
      const cost = MERC_SLOT_CRYSTAL_COSTS[slotIndex];
      const crystals = toDecimal(metaRef.current.divineCrystals);
      if (crystals.lt(cost)) {
        showToast(`神晶不足（需 ${cost.toLocaleString()} 颗神晶）`);
        return;
      }

      const nextMeta: MetaState = {
        ...metaRef.current,
        divineCrystals: crystals.sub(cost).toString(),
      };
      const randomInnate = rollRandomInnateAffix();
      const nextMercs = curMercs.map((m, idx) =>
        idx === slotIndex
          ? {
              ...m,
              unlocked: true,
              level: 1,
              innateAffix: randomInnate,
            }
          : m
      );

      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      setMeta(nextMeta);
      setMercs(nextMercs);
      soundEngine.playBurst();
      saveToLocalStorage();
      showToast(`永久解锁 ${slotIndex + 1} 号位【${ARCHETYPES[curMercs[slotIndex].archetype].name}】`);
    },
    [saveToLocalStorage, showToast]
  );

  const upgradeMercenary = useCallback(
    (slotIndex: number) => {
      const curMercs = mercsRef.current;
      const slot = curMercs[slotIndex];
      if (!slot || !slot.unlocked) return;

      const arch = ARCHETYPES[slot.archetype];
      const prevRun = runRef.current;
      const stones = toDecimal(prevRun.spiritStones);
      const effGrowth = getEffectiveGrowthRate(arch.growthRate, prevRun.tribulationId);
      const costRed = getCostReductionMult(metaRef.current);
      const cheapDiscount = getMercCheapDiscount(slot, curMercs, metaRef.current);

      const { count, totalCost } = calculateBulkUpgrade(
        new Decimal(arch.baseCost),
        effGrowth,
        slot.level,
        costRed * (1 - cheapDiscount),
        settingsRef.current.buyMode,
        stones
      );
      if (count <= 0 || stones.lt(totalCost)) {
        showToast('灵石不足');
        return;
      }

      // ★【天道酬勤 (sp_free_up)】：each purchased level has 35% chance for +1 bonus free level
      let bonusLevels = 0;
      if (slot.innateAffix === 'sp_free_up') {
        const rolls = Math.min(count, 2000);
        for (let r = 0; r < rolls; r++) {
          if (Math.random() < 0.35) bonusLevels++;
        }
      }

      const newLv = slot.level + count + bonusLevels;
      const effLv = slot.innateAffix === 'sp_double_lvl' ? newLv * 2 : newLv;
      const luckLv = getRelicTotalLv(metaRef.current, 'rel_e_affix_luck');

      const prevOpen = slot.unlockedLevelSlots;
      let nextOpen = prevOpen;
      const nextAffixes = [...slot.levelAffixes];
      for (let k = 0; k < LEVEL_SLOT_THRESHOLDS.length; k++) {
        if (effLv >= LEVEL_SLOT_THRESHOLDS[k]) {
          if (k + 1 > nextOpen) nextOpen = k + 1;
          if (!nextAffixes[k]) {
            nextAffixes[k] = {
              id: rollRandomAffixId(),
              tier: rollAffixTier(luckLv),
            };
          }
        }
      }

      const nextMeta: MetaState = {
        ...metaRef.current,
        shownTutorials: { ...metaRef.current.shownTutorials },
      };

      // First Lv.10 node tutorial trigger
      if (prevOpen === 0 && nextOpen >= 1) {
        queueTutorial('tut_affix', nextMeta);
      }

      // First Lv.1000 slot 10 unlock grants +50 divine crystals
      if (prevOpen < 10 && nextOpen === 10) {
        nextMeta.divineCrystals = toDecimal(nextMeta.divineCrystals).add(50).toString();
        soundEngine.playBurst();
        showToast(`${arch.name} 千级圆满！开启第 10 重道纹并获赠 50 神晶！`);
      }

      const nextRun: RunState = {
        ...prevRun,
        spiritStones: stones.sub(totalCost).toString(),
      };
      const nextMercs = curMercs.map((m, idx) =>
        idx === slotIndex
          ? {
              ...m,
              level: newLv,
              unlockedLevelSlots: nextOpen,
              levelAffixes: nextAffixes,
            }
          : m
      );

      runRef.current = nextRun;
      mercsRef.current = nextMercs;
      metaRef.current = nextMeta;
      setRun(nextRun);
      setMercs(nextMercs);
      setMeta(nextMeta);
    },
    [queueTutorial, showToast]
  );

  const toggleAffixLock = useCallback(
    (slotIndex: number, affixIdx: number) => {
      if (!metaRef.current.unlockedAffixLock) {
        showToast('首次通关【劫数二：坚甲利鳞】后解锁槽位锁定功能');
        return;
      }
      setMercs((prev) => {
        const next = prev.map((m, idx) => {
          if (idx !== slotIndex || affixIdx >= m.unlockedLevelSlots) return m;
          const locked = [...m.lockedLevelSlots];
          locked[affixIdx] = !locked[affixIdx];
          return { ...m, lockedLevelSlots: locked };
        });
        mercsRef.current = next;
        return next;
      });
    },
    [showToast]
  );

  const rerollMercSingleSlot = useCallback(
    (slotIndex: number, affixIdx: number) => {
      const slot = mercsRef.current[slotIndex];
      if (!slot || !slot.unlocked) return;
      if (affixIdx >= slot.unlockedLevelSlots) return;
      if (slot.pendingLevelAffixes !== null) {
        showToast('请先确认或放弃当前洗练结果');
        return;
      }

      const curMeta = metaRef.current;
      const stoneCost = getSingleRerollCost(affixIdx);
      // 【命运骰子】免单：上限 50%，且仅作用于单槽洗练
      const freeChance = Math.min(0.5, 0.05 * getRelicTotalLv(curMeta, 'rel_e_free_roll'));
      const isFreeRoll = freeChance > 0 && Math.random() < freeChance;
      const useAdToken = !isFreeRoll && curMeta.adFreeRerollTokens > 0;

      if (!isFreeRoll && !useAdToken && curMeta.affixStones < stoneCost) {
        showToast(`词缀石不足（该重道纹单槽重铸需 ${stoneCost} 颗）`);
        return;
      }

      let nextPity = curMeta.rerollPity + 1;
      let triggeredPity = false;
      if (nextPity >= 10) {
        nextPity = 0;
        triggeredPity = true;
      }

      const luckLv = getRelicTotalLv(curMeta, 'rel_e_affix_luck');
      const candidates = [...slot.levelAffixes];
      const rolledAffix: AffixInstance = {
        id: rollRandomAffixId(),
        tier: rollAffixTier(luckLv, triggeredPity),
      };
      candidates[affixIdx] = rolledAffix;

      const nextMeta: MetaState = {
        ...curMeta,
        affixStones:
          isFreeRoll || useAdToken ? curMeta.affixStones : curMeta.affixStones - stoneCost,
        adFreeRerollTokens: useAdToken
          ? Math.max(0, curMeta.adFreeRerollTokens - 1)
          : curMeta.adFreeRerollTokens,
        rerollPity: nextPity,
        totalRerolls: curMeta.totalRerolls + 1,
      };
      const nextMercs = mercsRef.current.map((m, idx) =>
        idx === slotIndex
          ? {
              ...m,
              pendingLevelAffixes: {
                indices: [affixIdx],
                candidates,
              },
            }
          : m
      );

      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      setMeta(nextMeta);
      setMercs(nextMercs);
      saveToLocalStorage();

      if (rolledAffix.tier === 'purple' || rolledAffix.tier === 'gold') {
        triggerVibration([25, 20, 35]);
      }

      if (triggeredPity) {
        showToast('气运爆发！10次保底必出极品/仙品词缀！请确认替换');
      } else if (isFreeRoll) {
        showToast('触发【命运骰子】免单洗练！请确认替换');
      } else if (useAdToken) {
        showToast('已消耗 1 次广告免费洗练！请确认替换');
      }
    },
    [saveToLocalStorage, showToast, triggerVibration]
  );

  const rerollMercBatchSlots = useCallback(
    (slotIndex: number) => {
      const slot = mercsRef.current[slotIndex];
      if (!slot || !slot.unlocked) return;
      if (slot.pendingLevelAffixes !== null) {
        showToast('请先确认或放弃当前洗练结果');
        return;
      }

      const targetIndices: number[] = [];
      for (let i = 0; i < slot.unlockedLevelSlots; i++) {
        if (!slot.lockedLevelSlots[i]) targetIndices.push(i);
      }
      if (targetIndices.length === 0) {
        showToast('已开启的词缀槽位已全部锁定');
        return;
      }

      const curMeta = metaRef.current;
      const stoneCost = getBatchRerollCost(targetIndices);
      // 批量洗练不受【命运骰子】免单影响，避免终局货币失效

      if (curMeta.affixStones < stoneCost) {
        showToast(`词缀石不足（需 ${stoneCost} 颗，按道纹深度阶梯计价）`);
        return;
      }

      let nextPity = curMeta.rerollPity + 1;
      let triggeredPity = false;
      if (nextPity >= 10) {
        nextPity = 0;
        triggeredPity = true;
      }

      const luckLv = getRelicTotalLv(curMeta, 'rel_e_affix_luck');
      const candidates = [...slot.levelAffixes];
      const pityPickIdx = triggeredPity
        ? targetIndices[Math.floor(Math.random() * targetIndices.length)]
        : -1;

      let rolledHighTier = false;
      for (const idx of targetIndices) {
        const tier = rollAffixTier(luckLv, idx === pityPickIdx);
        if (tier === 'purple' || tier === 'gold') rolledHighTier = true;
        candidates[idx] = {
          id: rollRandomAffixId(),
          tier,
        };
      }

      const nextMeta: MetaState = {
        ...curMeta,
        affixStones: curMeta.affixStones - stoneCost,
        rerollPity: nextPity,
        totalRerolls: curMeta.totalRerolls + 1,
      };
      const nextMercs = mercsRef.current.map((m, idx) =>
        idx === slotIndex
          ? {
              ...m,
              pendingLevelAffixes: {
                indices: targetIndices,
                candidates,
              },
            }
          : m
      );

      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      setMeta(nextMeta);
      setMercs(nextMercs);
      saveToLocalStorage();

      if (rolledHighTier) {
        triggerVibration([25, 20, 35]);
      }

      if (triggeredPity) {
        showToast('气运爆发！10次保底必出极品/仙品词缀！请确认替换');
      }
    },
    [saveToLocalStorage, showToast, triggerVibration]
  );

  const quenchMercAffix = useCallback(
    (slotIndex: number, affixIdx: number) => {
      const slot = mercsRef.current[slotIndex];
      if (!slot || !slot.unlocked) return;
      if (affixIdx >= slot.unlockedLevelSlots) return;
      if (slot.pendingLevelAffixes !== null) {
        showToast('请先确认或放弃当前洗练结果');
        return;
      }

      const inst = slot.levelAffixes[affixIdx];
      if (!inst) {
        showToast('该槽位尚无道纹，请先洗练出一条基础词缀');
        return;
      }

      const nextTier = getNextAffixTier(inst.tier);
      const cost = getQuenchCost(inst.tier);
      if (!nextTier || cost === null) {
        showToast('仙品已是道纹极致，无法继续淬炼');
        return;
      }

      const curMeta = metaRef.current;
      if (curMeta.affixStones < cost) {
        showToast(`词缀石不足（淬炼至${AFFIX_TIER_META[nextTier].label}需 ${cost} 颗）`);
        return;
      }

      const nextMercs = mercsRef.current.map((m, idx) =>
        idx === slotIndex
          ? {
              ...m,
              levelAffixes: m.levelAffixes.map((a, i) =>
                i === affixIdx && a ? { ...a, tier: nextTier } : a
              ),
            }
          : m
      );
      const nextMeta: MetaState = {
        ...curMeta,
        affixStones: curMeta.affixStones - cost,
        totalRerolls: curMeta.totalRerolls + 1,
      };

      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      setMeta(nextMeta);
      setMercs(nextMercs);
      saveToLocalStorage();
      triggerVibration([18, 24, 18]);
      showToast(
        `淬炼成功：${AFFIXES[inst.id]?.name ?? '道纹'} 提升至【${AFFIX_TIER_META[nextTier].label}】`
      );
      track('affix_quench', { from: inst.tier, to: nextTier, cost });
    },
    [saveToLocalStorage, showToast, triggerVibration]
  );

  const confirmPendingLevelAffixes = useCallback(
    (slotIndex: number, accept: boolean) => {
      setMercs((prev) => {
        const next = prev.map((m, idx) => {
          if (idx !== slotIndex || !m.pendingLevelAffixes) return m;
          return {
            ...m,
            levelAffixes: accept ? m.pendingLevelAffixes.candidates : m.levelAffixes,
            pendingLevelAffixes: null,
          };
        });
        mercsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const rerollMercInnate = useCallback(
    (slotIndex: number) => {
      const slot = mercsRef.current[slotIndex];
      if (!slot || !slot.unlocked) return;
      const curMeta = metaRef.current;
      if (!curMeta.unlockedInnateReroll) {
        showToast('首次通关【劫数二】后解锁先天本命神通重铸');
        return;
      }
      if (slot.pendingInnateAffix !== null) {
        showToast('请先确认或放弃待定本命神通');
        return;
      }

      const crystalCost = 5;
      const freeChance = Math.min(0.8, 0.05 * getRelicTotalLv(curMeta, 'rel_e_free_roll'));
      const isFreeRoll = freeChance > 0 && Math.random() < freeChance;
      const curCrystals = toDecimal(curMeta.divineCrystals);

      if (!isFreeRoll && curCrystals.lt(crystalCost)) {
        showToast(`神晶不足（重铸本命神通需 ${crystalCost} 颗神晶）`);
        return;
      }

      const newInnate: InnateAffixId = rollRandomInnateAffix(slot.innateAffix);
      const nextMeta: MetaState = {
        ...curMeta,
        divineCrystals: isFreeRoll
          ? curMeta.divineCrystals
          : curCrystals.sub(crystalCost).toString(),
        totalRerolls: curMeta.totalRerolls + 1,
      };
      const nextMercs = mercsRef.current.map((m, idx) =>
        idx === slotIndex ? { ...m, pendingInnateAffix: newInnate } : m
      );

      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      setMeta(nextMeta);
      setMercs(nextMercs);
      saveToLocalStorage();

      if (isFreeRoll) {
        showToast('触发【命运骰子】免单神晶重铸！请确认替换');
      }
    },
    [saveToLocalStorage, showToast]
  );

  const confirmPendingInnateAffix = useCallback(
    (slotIndex: number, accept: boolean) => {
      setMercs((prev) => {
        const next = prev.map((m, idx) => {
          if (idx !== slotIndex || !m.pendingInnateAffix) return m;
          return {
            ...m,
            innateAffix: accept ? m.pendingInnateAffix : m.innateAffix,
            pendingInnateAffix: null,
          };
        });
        mercsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const upgradeRelic = useCallback(
    (relicId: RelicId) => {
      const curMeta = metaRef.current;
      const cfg = RELIC_MAP[relicId];
      const bd = getRelicLevelsBreakdown(curMeta, relicId);
      if (!bd.owned) return;
      if (cfg.maxLevel !== null && bd.crystalLv >= cfg.maxLevel) {
        showToast('该遗物神晶升阶已达上限');
        return;
      }
      const cost = getRelicUpgradeCost(relicId, bd.crystalLv);
      const crystals = toDecimal(curMeta.divineCrystals);
      if (crystals.lt(cost)) {
        showToast(`神晶不足（需 ${formatNumber(cost, settingsRef.current.numberMode)} 神晶）`);
        return;
      }
      const nextMeta: MetaState = {
        ...curMeta,
        divineCrystals: crystals.sub(cost).toString(),
        relicLevels: {
          ...curMeta.relicLevels,
          [relicId]: bd.crystalLv + 1,
        },
      };
      let newlyUnlockedOrder: number | null = null;
      while (nextMeta.highestUnlockedOrder < TRIBULATIONS.length) {
        const check = getNextTribulationUnlockState(nextMeta);
        if (!check.nextTrib || !check.canUnlock) break;
        nextMeta.highestUnlockedOrder = check.nextTrib.order;
        newlyUnlockedOrder = check.nextTrib.order;
      }
      metaRef.current = nextMeta;
      setMeta(nextMeta);
      soundEngine.playBurst();
      saveToLocalStorage();
      if (newlyUnlockedOrder !== null) {
        showToast(`遗物总阶突破门槛！已破禁解锁【劫数 ${newlyUnlockedOrder}】！`);
      }
    },
    [saveToLocalStorage, showToast]
  );

  const switchTribulation = useCallback(
    (tribId: TribulationId) => {
      const cfg = getTribulationConfig(tribId);
      if (cfg.order > metaRef.current.highestUnlockedOrder) {
        showToast('请先击败前置劫数以解锁');
        return;
      }
      const autoCasts = {
        sk_blood: runRef.current.skills.sk_blood.autoCast,
        sk_clone: runRef.current.skills.sk_clone.autoCast,
        sk_thunder: runRef.current.skills.sk_thunder.autoCast,
        sk_sync: runRef.current.skills.sk_sync.autoCast,
      };
      const prevTribId = runRef.current.tribulationId;
      const freshRun = createInitialRunState(tribId, metaRef.current, autoCasts);
      const freshMercs = resetMercsForNewRun(mercsRef.current);
      victoryTriggeredRef.current = false;
      autoRepeatCountdownRef.current = null;
      runRef.current = freshRun;
      mercsRef.current = freshMercs;
      puppetAccRef.current = 0;
      cloneAccRef.current = 0;
      poisonTickAccRef.current = 0;
      setIsHitSquashed(false);
      setIsArenaShaking(false);
      setHitOffset({ x: 0, y: 0 });
      setRun(freshRun);
      setMercs(freshMercs);
      setVictorySummary(null);
      setAutoRepeatCountdown(null);
      if (tribId !== prevTribId) {
        setLastClearReport(null);
      }
      saveToLocalStorage();
      showToast(`已切换至【${cfg.name}】`);
    },
    [saveToLocalStorage, showToast]
  );

  const restartRun = useCallback(() => {
    const curMeta: MetaState = {
      ...metaRef.current,
      totalRestarts: metaRef.current.totalRestarts + 1,
    };
    const autoCasts = {
      sk_blood: runRef.current.skills.sk_blood.autoCast,
      sk_clone: runRef.current.skills.sk_clone.autoCast,
      sk_thunder: runRef.current.skills.sk_thunder.autoCast,
      sk_sync: runRef.current.skills.sk_sync.autoCast,
    };
    const freshRun = createInitialRunState(runRef.current.tribulationId, curMeta, autoCasts);
    const freshMercs = resetMercsForNewRun(mercsRef.current);
    victoryTriggeredRef.current = false;
    autoRepeatCountdownRef.current = null;
    metaRef.current = curMeta;
    runRef.current = freshRun;
    mercsRef.current = freshMercs;
    puppetAccRef.current = 0;
    cloneAccRef.current = 0;
    poisonTickAccRef.current = 0;
    setIsHitSquashed(false);
    setIsArenaShaking(false);
    setHitOffset({ x: 0, y: 0 });
    setMeta(curMeta);
    setRun(freshRun);
    setMercs(freshMercs);
    setVictorySummary(null);
    setAutoRepeatCountdown(null);
    saveToLocalStorage();
    showToast('已兵解重开：词缀石、本命神通、十槽词缀与遗物 100% 保留');
  }, [saveToLocalStorage, showToast]);

  const toggleAutoRepeat = useCallback(() => {
    const cur = metaRef.current;
    const nextEnabled = !cur.autoRepeatEnabled;
    const next = { ...cur, autoRepeatEnabled: nextEnabled };
    metaRef.current = next;
    setMeta(next);
    saveToLocalStorage();
    if (!nextEnabled) {
      autoRepeatCountdownRef.current = null;
      setAutoRepeatCountdown(null);
    } else if (
      runRef.current.runCompleted &&
      next.sssUnlockedAutoRepeat[runRef.current.tribulationId]
    ) {
      autoRepeatCountdownRef.current = 0.2;
      setAutoRepeatCountdown(0.2);
    }
  }, [saveToLocalStorage]);

  const toggleAutoSetting = useCallback(
    (key: keyof Omit<AutoUpgradeSettings, 'autoMercSlots'>) => {
      const m = metaRef.current;
      if ((key === 'autoRealm' || key === 'autoPuppet') && !m.unlockedAutoRealm) {
        showToast('首次通关【劫数三】后解锁自动破境与自动傀儡');
        return;
      }
      if ((key === 'autoEnlightenment' || key === 'autoSkills') && !m.unlockedAutoHeroUpgrades) {
        showToast('首次通关【劫数五】后解锁自动顿悟与自动强化神通');
        return;
      }
      if (key === 'autoMercs' && !m.unlockedAutoMercUpgrade) {
        showToast('首次通关【劫数六】后解锁护法自动升级');
        return;
      }
      setMeta((prev) => {
        const next: MetaState = {
          ...prev,
          autoSettings: {
            ...prev.autoSettings,
            [key]: !prev.autoSettings[key],
          },
        };
        metaRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage, showToast]
  );

  const toggleAutoMercSlot = useCallback(
    (slotIndex: number) => {
      if (!metaRef.current.unlockedAutoMercUpgrade) {
        showToast('首次通关【劫数六】后解锁护法自动升级');
        return;
      }
      if (slotIndex < 0 || slotIndex > 4) return;
      setMeta((prev) => {
        const nextSlots = [...prev.autoSettings.autoMercSlots] as [
          boolean,
          boolean,
          boolean,
          boolean,
          boolean,
        ];
        nextSlots[slotIndex] = !nextSlots[slotIndex];
        const next: MetaState = {
          ...prev,
          autoSettings: {
            ...prev.autoSettings,
            autoMercSlots: nextSlots,
          },
        };
        metaRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage, showToast]
  );

  const setBuyMode = useCallback(
    (buyMode: BuyMode) => {
      setSettings((prev) => {
        const next = { ...prev, buyMode };
        settingsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setNumberMode = useCallback(
    (numberMode: NumberDisplayMode) => {
      setSettings((prev) => {
        const next = { ...prev, numberMode };
        settingsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setSoundEnabled = useCallback(
    (soundEnabled: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, soundEnabled };
        settingsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setFloatingTextMode = useCallback(
    (floatingTextMode: FloatingTextMode) => {
      setSettings((prev) => {
        const next = { ...prev, floatingTextMode };
        settingsRef.current = next;
        return next;
      });
      if (floatingTextMode === 'off') {
        setFloatingTexts([]);
      } else if (floatingTextMode === 'crit') {
        setFloatingTexts((prev) =>
          prev.filter((ft) => ft.kind === 'crit' || ft.kind === 'thunder' || ft.kind === 'shell')
        );
      }
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setHitVfxEnabled = useCallback(
    (hitVfxEnabled: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, hitVfxEnabled };
        settingsRef.current = next;
        return next;
      });
      if (!hitVfxEnabled) {
        setIsHitSquashed(false);
        setIsArenaShaking(false);
        setClickRipples([]);
        setHitOffset({ x: 0, y: 0 });
      }
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setVibrationEnabled = useCallback(
    (vibrationEnabled: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, vibrationEnabled };
        settingsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const setSilentAutoClear = useCallback(
    (silentAutoClear: boolean) => {
      setSettings((prev) => {
        const next = { ...prev, silentAutoClear };
        settingsRef.current = next;
        return next;
      });
      saveToLocalStorage();
    },
    [saveToLocalStorage]
  );

  const exportSaveString = useCallback(() => {
    const savedAt = Date.now();
    const payload: GameSaveData = {
      version: 35,
      savedAt,
      run: runRef.current,
      mercs: mercsRef.current,
      meta: metaRef.current,
      settings: settingsRef.current,
    };
    return encodeBase64Utf8(JSON.stringify(payload));
  }, []);

  const importSaveString = useCallback(
    (b64: string): { ok: boolean; error?: string } => {
      const cleaned = b64.replace(/\s+/g, '');
      if (!cleaned) {
        return { ok: false, error: '请输入 Base64 存档字符串' };
      }

      let jsonStr: string;
      try {
        jsonStr = decodeBase64Utf8(cleaned);
      } catch {
        return { ok: false, error: '存档格式无效：Base64 解码失败，请检查是否完整复制' };
      }

      let parsed: GameSaveData;
      try {
        parsed = JSON.parse(jsonStr) as GameSaveData;
      } catch {
        return { ok: false, error: '存档结构损坏：无法解析 JSON 数据' };
      }

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        typeof parsed.version !== 'number' ||
        !parsed.run ||
        typeof parsed.run !== 'object' ||
        !parsed.meta ||
        typeof parsed.meta !== 'object' ||
        !Array.isArray(parsed.mercs) ||
        parsed.mercs.length !== 5
      ) {
        return { ok: false, error: '存档结构损坏：缺少版本号、局内进度或五人护法数据' };
      }

      const tribValid = TRIBULATIONS.some((t) => t.id === parsed.run.tribulationId);
      if (!tribValid) {
        return { ok: false, error: '存档校验失败：无效的劫数标识' };
      }

      const isValidDecimalField = (v: unknown) => {
        if (v === undefined || v === null) return false;
        try {
          const d = new Decimal(v as string | number);
          return Number.isFinite(d.mantissa) && !Number.isNaN(d.mantissa);
        } catch {
          return false;
        }
      };

      if (
        !isValidDecimalField(parsed.run.spiritStones) ||
        !isValidDecimalField(parsed.run.bossHp) ||
        !isValidDecimalField(parsed.run.bossMaxHp) ||
        !isValidDecimalField(parsed.meta.divineCrystals)
      ) {
        return { ok: false, error: '存档数值校验失败：灵石、古神血量或神晶数值异常' };
      }

      const defMeta = createInitialMetaState();
      const defMercs = createInitialMercsState();
      const nextMeta = sanitizeMetaState(parsed.meta, defMeta);
      const sanitizedMercs = sanitizeMercsState(parsed.mercs, defMercs);

      const tribId = parsed.run.tribulationId as TribulationId;
      const baseRun = createInitialRunState(tribId, nextMeta);
      const nextMercs = parsed.run.runCompleted
        ? resetMercsForNewRun(sanitizedMercs)
        : sanitizedMercs;
      const nextRun: RunState = parsed.run.runCompleted
        ? baseRun
        : {
            ...baseRun,
            ...parsed.run,
            tribulationId: tribId,
            phaseIndex: safeInt(parsed.run.phaseIndex, 0, 0, BOSS_SHELLS.length - 1),
            bossHp: safeDecimalStr(parsed.run.bossHp, baseRun.bossHp),
            bossMaxHp: safeDecimalStr(parsed.run.bossMaxHp, baseRun.bossMaxHp),
            poisonStacks: safeInt(parsed.run.poisonStacks, 0, 0, 3500),
            spiritStones: safeDecimalStr(parsed.run.spiritStones, baseRun.spiritStones),
            mana: safeFloat(parsed.run.mana, baseRun.mana, 0, 100000),
            clickStacks: safeDecimalStr(parsed.run.clickStacks, '0'),
            manualClicks: safeInt(parsed.run.manualClicks, 0, 0),
            swordAndHeroAttacksForCannon: safeInt(
              parsed.run.swordAndHeroAttacksForCannon,
              0,
              0,
              1000
            ),
            enlightenmentLevel: safeInt(parsed.run.enlightenmentLevel, 1, 1, 1000000),
            accumulatedAtk: safeDecimalStr(parsed.run.accumulatedAtk, baseRun.accumulatedAtk),
            sharedHeroGrowth: safeDecimalStr(parsed.run.sharedHeroGrowth, '0'),
            realmLevel: safeInt(parsed.run.realmLevel, 0, 0, 10000),
            puppetLevel: safeInt(parsed.run.puppetLevel, baseRun.puppetLevel, 0, PUPPET_MAX_LEVEL),
            elapsedMs: safeFloat(parsed.run.elapsedMs, 0, 0),
            runCompleted: false,
            skills: {
              sk_blood: { ...baseRun.skills.sk_blood, ...(parsed.run.skills?.sk_blood ?? {}) },
              sk_clone: { ...baseRun.skills.sk_clone, ...(parsed.run.skills?.sk_clone ?? {}) },
              sk_thunder: {
                ...baseRun.skills.sk_thunder,
                ...(parsed.run.skills?.sk_thunder ?? {}),
              },
              sk_sync: { ...baseRun.skills.sk_sync, ...(parsed.run.skills?.sk_sync ?? {}) },
            },
            heroBuffStacks: Array.isArray(parsed.run.heroBuffStacks)
              ? parsed.run.heroBuffStacks.filter(
                  (b) =>
                    typeof b?.val === 'number' &&
                    Number.isFinite(b.val) &&
                    typeof b?.expiresAt === 'number' &&
                    Number.isFinite(b.expiresAt)
                )
              : [],
            recentTickDps: {
              hero: safeDecimalStr(parsed.run.recentTickDps?.hero, baseRun.recentTickDps.hero),
              poison: safeDecimalStr(
                parsed.run.recentTickDps?.poison,
                baseRun.recentTickDps.poison
              ),
              mercs:
                Array.isArray(parsed.run.recentTickDps?.mercs) &&
                parsed.run.recentTickDps.mercs.length === 5
                  ? (parsed.run.recentTickDps.mercs.map((v) => safeDecimalStr(v, '0')) as [
                      string,
                      string,
                      string,
                      string,
                      string,
                    ])
                  : baseRun.recentTickDps.mercs,
              bonus: safeDecimalStr(parsed.run.recentTickDps?.bonus, '0'),
            },
          };

      const rawFloatMode = parsed.settings?.floatingTextMode;
      const nextSettings: SettingsState = {
        numberMode: parsed.settings?.numberMode === 'scientific' ? 'scientific' : 'chinese',
        soundEnabled: parsed.settings?.soundEnabled ?? true,
        buyMode:
          parsed.settings?.buyMode === 10 || parsed.settings?.buyMode === 'MAX'
            ? parsed.settings.buyMode
            : 1,
        floatingTextMode:
          rawFloatMode === 'all' || rawFloatMode === 'crit' || rawFloatMode === 'off'
            ? rawFloatMode
            : 'all',
        hitVfxEnabled:
          typeof parsed.settings?.hitVfxEnabled === 'boolean'
            ? parsed.settings.hitVfxEnabled
            : true,
        vibrationEnabled:
          typeof parsed.settings?.vibrationEnabled === 'boolean'
            ? parsed.settings.vibrationEnabled
            : true,
        silentAutoClear:
          typeof parsed.settings?.silentAutoClear === 'boolean'
            ? parsed.settings.silentAutoClear
            : true,
      };

      const savedAt = Date.now();
      victoryTriggeredRef.current = false;
      autoRepeatCountdownRef.current = null;
      metaRef.current = nextMeta;
      mercsRef.current = nextMercs;
      runRef.current = nextRun;
      settingsRef.current = nextSettings;
      setMeta(nextMeta);
      setMercs(nextMercs);
      setRun(nextRun);
      setSettings(nextSettings);
      setVictorySummary(null);
      setLastClearReport(null);
      setAutoRepeatCountdown(null);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 35,
          savedAt,
          run: nextRun,
          mercs: nextMercs,
          meta: nextMeta,
          settings: nextSettings,
        })
      );
      setLastSavedAt(savedAt);
      showToast('存档校验通过并导入成功！');
      return { ok: true };
    },
    [showToast]
  );

  // 新设备首次进入且本地无存档时，自动尝试恢复云存档。
  // 本地已有存档时不自动覆盖，避免多设备互相拉扯；设置页提供手动恢复。
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!cloudSaveAvailable()) return;
      if (localStorage.getItem(STORAGE_KEY)) return;
      const b64 = await loadCloudSave();
      if (!cancelled && b64) {
        const res = importSaveString(b64);
        if (res.ok) track('cloud_restore_startup');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [importSaveString]);

  // 用户完成隐私授权后再补一次云存档恢复：首启时授权弹窗会挡住平台接口。
  useEffect(() => {
    const onConsent = () => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      void (async () => {
        if (!cloudSaveAvailable()) return;
        const b64 = await loadCloudSave();
        if (b64) {
          const res = importSaveString(b64);
          if (res.ok) track('cloud_restore_after_consent');
        }
      })();
    };
    window.addEventListener('shishen:privacy-consent', onConsent);
    return () => window.removeEventListener('shishen:privacy-consent', onConsent);
  }, [importSaveString]);

  const hardResetAll = useCallback(
    (reloadAfter = false) => {
      isHardResettingRef.current = true;
      localStorage.removeItem(STORAGE_KEY);
      const freshMeta = createInitialMetaState();
      const freshMercs = createInitialMercsState();
      const freshRun = createInitialRunState('tier_1', freshMeta);
      victoryTriggeredRef.current = false;
      autoRepeatCountdownRef.current = null;
      metaRef.current = freshMeta;
      mercsRef.current = freshMercs;
      runRef.current = freshRun;
      puppetAccRef.current = 0;
      cloneAccRef.current = 0;
      poisonTickAccRef.current = 0;
      setMeta(freshMeta);
      setMercs(freshMercs);
      setRun(freshRun);
      setVictorySummary(null);
      setLastClearReport(null);
      setAutoRepeatCountdown(null);
      setPendingTutorials([]);

      if (reloadAfter && typeof window !== 'undefined') {
        window.location.reload();
        return;
      }

      isHardResettingRef.current = false;
      showToast('已彻底清空全部进度');
    },
    [showToast]
  );

  const clearVictorySummary = useCallback(() => {
    autoRepeatCountdownRef.current = null;
    setVictorySummary(null);
    setAutoRepeatCountdown(null);
  }, []);

  const clearOfflineSummary = useCallback(() => {
    setOfflineSummary(null);
  }, []);

  const offlineSummaryKey = offlineSummary
    ? `${offlineSummary.tribulationId}:${offlineSummary.elapsedOfflineMs}:${offlineSummary.crystalsGained}:${offlineSummary.stonesGained}:${offlineSummary.affixStonesGained}`
    : null;

  useEffect(() => {
    if (offlineSummaryKey && offlineAdBonusKeyRef.current !== offlineSummaryKey) {
      setOfflineAdBonusClaimed(false);
    }
  }, [offlineSummaryKey]);

  const claimOfflineAdBonus = useCallback((): boolean => {
    if (!offlineSummary || !offlineSummaryKey) return false;
    if (offlineAdBonusKeyRef.current === offlineSummaryKey) {
      showToast('本次离线收益已领取过广告翻倍');
      return false;
    }

    const curRun = runRef.current;
    const curMeta = metaRef.current;
    const crystals = toDecimal(offlineSummary.crystalsGained).add(
      toDecimal(offlineSummary.overflowCrystals)
    );
    const stones = toDecimal(offlineSummary.stonesGained);
    const nextRun: RunState = {
      ...curRun,
      spiritStones: toDecimal(curRun.spiritStones).add(stones).toString(),
    };
    const nextMeta: MetaState = {
      ...curMeta,
      divineCrystals: toDecimal(curMeta.divineCrystals).add(crystals).toString(),
      affixStones: curMeta.affixStones + offlineSummary.affixStonesGained,
    };

    runRef.current = nextRun;
    metaRef.current = nextMeta;
    setRun(nextRun);
    setMeta(nextMeta);
    offlineAdBonusKeyRef.current = offlineSummaryKey;
    setOfflineAdBonusClaimed(true);
    saveToLocalStorage();
    showToast(
      `广告翻倍已发放：神晶 +${formatNumber(crystals)} · 灵石 +${formatNumber(stones)} · 词缀石 +${offlineSummary.affixStonesGained}`
    );
    track('ad_reward', { placement: 'offline_double' });
    return true;
  }, [offlineSummary, offlineSummaryKey, saveToLocalStorage, showToast]);

  const canClaimDailyChest =
    meta.lastDailyChestDay !== getTodayKey();

  const claimDailyChest = useCallback((): boolean => {
    const today = getTodayKey();
    const curMeta = metaRef.current;
    if (curMeta.lastDailyChestDay === today) {
      showToast('今日天命宝箱已领取，明日再来');
      return false;
    }
    const nextMeta: MetaState = {
      ...curMeta,
      divineCrystals: toDecimal(curMeta.divineCrystals).add(DAILY_CHEST_CRYSTALS).toString(),
      affixStones: curMeta.affixStones + DAILY_CHEST_AFFIX_STONES,
      lastDailyChestDay: today,
    };
    metaRef.current = nextMeta;
    setMeta(nextMeta);
    saveToLocalStorage();
    showToast(
      `天命宝箱：神晶 +${DAILY_CHEST_CRYSTALS} · 词缀石 +${DAILY_CHEST_AFFIX_STONES}`
    );
    track('daily_chest');
    return true;
  }, [saveToLocalStorage, showToast]);

  const todayKey = getTodayKey();
  const adRerollsUsedToday =
    meta.lastAdRerollDay === todayKey ? meta.adRerollsToday : 0;
  const canClaimAdRerollToken =
    adRerollsUsedToday < MAX_DAILY_AD_REROLLS && meta.adFreeRerollTokens < MAX_DAILY_AD_REROLLS;

  const claimAdRerollToken = useCallback((): boolean => {
    const today = getTodayKey();
    const curMeta = metaRef.current;
    const used = curMeta.lastAdRerollDay === today ? curMeta.adRerollsToday : 0;
    if (used >= MAX_DAILY_AD_REROLLS) {
      showToast('今日广告免费洗练次数已用完');
      return false;
    }
    const nextMeta: MetaState = {
      ...curMeta,
      lastAdRerollDay: today,
      adRerollsToday: used + 1,
      adFreeRerollTokens: Math.min(MAX_DAILY_AD_REROLLS, curMeta.adFreeRerollTokens + 1),
    };
    metaRef.current = nextMeta;
    setMeta(nextMeta);
    saveToLocalStorage();
    showToast('获得 1 次免费洗练，已存入洗练面板');
    track('ad_reward', { placement: 'free_reroll' });
    return true;
  }, [saveToLocalStorage, showToast]);

  const adStoneBoostRemainingMs = Math.max(0, meta.adStoneBoostUntil - Date.now());
  const adStoneBoostActive = adStoneBoostRemainingMs > 0;
  const adStoneBoostsUsedToday =
    meta.lastAdStoneBoostDay === todayKey ? meta.adStoneBoostsToday : 0;
  const adStoneBoostsLeftToday = Math.max(
    0,
    MAX_DAILY_AD_STONE_BOOSTS - adStoneBoostsUsedToday
  );
  const canClaimAdStoneBoost = adStoneBoostsLeftToday > 0 && !adStoneBoostActive;

  const claimAdStoneBoost = useCallback((): boolean => {
    const today = getTodayKey();
    const curMeta = metaRef.current;
    const used = curMeta.lastAdStoneBoostDay === today ? curMeta.adStoneBoostsToday : 0;
    if (used >= MAX_DAILY_AD_STONE_BOOSTS) {
      showToast('今日灵石加速次数已用完');
      return false;
    }
    const now = Date.now();
    const nextMeta: MetaState = {
      ...curMeta,
      adStoneBoostUntil: now + AD_STONE_BOOST_DURATION_MS,
      adStoneBoostMult: AD_STONE_BOOST_MULT,
      lastAdStoneBoostDay: today,
      adStoneBoostsToday: used + 1,
    };
    metaRef.current = nextMeta;
    setMeta(nextMeta);
    saveToLocalStorage();
    showToast('伤害转化灵石 ×2 已启动，持续 10 分钟');
    track('ad_reward', { placement: 'stone_boost' });
    return true;
  }, [saveToLocalStorage, showToast]);

  const syncCloudNow = useCallback(async (): Promise<boolean> => {
    if (!cloudSaveAvailable()) {
      showToast('当前环境未提供云存档能力');
      return false;
    }
    const cooldown = cloudUploadCooldownRemaining();
    if (cooldown > 0) {
      // 自动同步刚刚成功过；平台限制 1 次/分钟，不重复请求，也不提示失败。
      const lastAt = getLastCloudUploadAt();
      if (lastAt > 0) setLastCloudSavedAt(lastAt);
      showToast(`云存档刚刚已自动同步，请 ${Math.ceil(cooldown / 1000)} 秒后再试`);
      return true;
    }
    const payload: GameSaveData = {
      version: 35,
      savedAt: Date.now(),
      run: runRef.current,
      mercs: mercsRef.current,
      meta: metaRef.current,
      settings: settingsRef.current,
    };
    scheduleCloudSave(encodeBase64Utf8(JSON.stringify(payload)));
    const ok = await flushCloudSave();
    if (ok) {
      setLastCloudSavedAt(Date.now());
      showToast('云存档已上传');
      track('cloud_save_manual');
    } else {
      showToast('云存档上传失败，请稍后重试');
    }
    return ok;
  }, [showToast]);

  const restoreFromCloud = useCallback(
    async (force = false): Promise<CloudRestoreResult> => {
      const b64 = await loadCloudSave();
      if (!b64) {
        showToast('未找到可恢复的云存档');
        return { ok: false, reason: 'empty' };
      }

      const cloudSavedAt = peekSaveTimestamp(b64);
      const localRaw = localStorage.getItem(STORAGE_KEY);
      const localSavedAt = localRaw ? peekSaveTimestamp(localRaw) : 0;

      // 防误覆盖：本地进度比云存档新时，需玩家显式确认
      if (!force && localRaw && cloudSavedAt > 0 && localSavedAt > cloudSavedAt) {
        return { ok: false, reason: 'older', cloudSavedAt, localSavedAt };
      }

      const res = importSaveString(b64);
      if (!res.ok) {
        showToast(res.error ?? '云存档恢复失败');
        return { ok: false, reason: 'invalid' };
      }
      track('cloud_restore');
      return { ok: true, cloudSavedAt, localSavedAt };
    },
    [importSaveString, showToast]
  );

  const openLastClearReportModal = useCallback(() => {
    if (lastClearReport) {
      setVictorySummary(lastClearReport.summary);
    }
  }, [lastClearReport]);

  const quickRestartAfterSilentClear = useCallback(() => {
    const curRun = runRef.current;
    const autoCasts = {
      sk_blood: curRun.skills.sk_blood.autoCast,
      sk_clone: curRun.skills.sk_clone.autoCast,
      sk_thunder: curRun.skills.sk_thunder.autoCast,
      sk_sync: curRun.skills.sk_sync.autoCast,
    };
    const freshRun = createInitialRunState(curRun.tribulationId, metaRef.current, autoCasts);
    const freshMercs = resetMercsForNewRun(mercsRef.current);
    victoryTriggeredRef.current = false;
    autoRepeatCountdownRef.current = null;
    runRef.current = freshRun;
    mercsRef.current = freshMercs;
    puppetAccRef.current = 0;
    cloneAccRef.current = 0;
    poisonTickAccRef.current = 0;
    setIsHitSquashed(false);
    setIsArenaShaking(false);
    setHitOffset({ x: 0, y: 0 });
    setRun(freshRun);
    setMercs(freshMercs);
    setVictorySummary(null);
    setAutoRepeatCountdown(null);
  }, []);

  return React.createElement(
    GameContext.Provider,
    {
      value: {
        run,
        mercs,
        meta,
        settings,
        floatingTexts,
        clickRipples,
        mercPulseIds,
        phaseBreakBanner,
        isHitSquashed,
        isArenaShaking,
        hitOffset,
        hitPulseId,
        shellShatterId,
        victorySummary,
        offlineSummary,
        lastClearReport,
        autoRepeatCountdown,
        toastMessage,
        activeTutorial,
        clearVictorySummary,
        clearOfflineSummary,
        offlineAdBonusClaimed,
        claimOfflineAdBonus,
        claimDailyChest,
        canClaimDailyChest,
        claimAdRerollToken,
        canClaimAdRerollToken,
        claimAdStoneBoost,
        canClaimAdStoneBoost,
        adStoneBoostActive,
        adStoneBoostRemainingMs,
        adStoneBoostsLeftToday,
        cloudAvailable: cloudSaveAvailable(),
        lastCloudSavedAt,
        syncCloudNow,
        restoreFromCloud,
        openLastClearReportModal,
        quickRestartAfterSilentClear,
        completeIntro,
        replayIntro,
        dismissTutorial,
        manualClick,
        upgradeEnlightenment,
        breakthroughRealm,
        buyPuppet,
        castSkill,
        upgradeSkill,
        toggleSkillAutoCast,
        unlockMercSlot,
        upgradeMercenary,
        toggleAffixLock,
        rerollMercSingleSlot,
        rerollMercBatchSlots,
        quenchMercAffix,
        confirmPendingLevelAffixes,
        rerollMercInnate,
        confirmPendingInnateAffix,
        upgradeRelic,
        switchTribulation,
        toggleAutoRepeat,
        toggleAutoSetting,
        toggleAutoMercSlot,
        restartRun,
        setBuyMode,
        setNumberMode,
        setSoundEnabled,
        setFloatingTextMode,
        setHitVfxEnabled,
        setVibrationEnabled,
        setSilentAutoClear,
        lastSavedAt,
        saveNow,
        exportSaveString,
        importSaveString,
        hardResetAll,
      },
    },
    children
  );
}

export function useGameStore() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameStore must be used inside GameProvider');
  return ctx;
}
