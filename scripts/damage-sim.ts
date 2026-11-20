/**
 * 伤害组成模拟与结构性体检
 *
 *   bun run damage:sim
 *
 * 分析口径：
 * 1. 反解——给定每劫 BOSS 血量，二分求出「达成 120s 通关所需的护法等级」，
 *    与策划标注的推荐等级对照，判断难度曲线是否与掉率曲线匹配；
 * 2. 分解——在代表快照下拆解伤害来源占比（主角/五护法/毒持续/毒爆/点击联动）；
 * 3. 审计——校验攻击/命中口径、25 次/秒间隔上限、溢出折算与 HUD/离线口径一致性。
 */
import Decimal from 'break_infinity.js';
import { ARCHETYPES } from '../src/config/archetypes';
import {
  JACKPOT_OVERFLOW_RATE,
  LEVEL_SLOT_THRESHOLDS,
  MAX_JACKPOT_PROCS_PER_SEC,
} from '../src/config/constants';
import { TRIBULATIONS } from '../src/config/bosses';
import {
  evaluateSpeedrunRank,
  getBossTotalHp,
  getGlobalMult,
  getHeroStats,
  getMercenaryComputedStats,
  getTeamCombatDpsBreakdown,
} from '../src/core/damageCalc';
import { createInitialMercsState, createInitialMetaState, createInitialRunState } from '../src/stores/useGameStore';
import type {
  AffixId,
  AffixTier,
  ArchetypeId,
  MercenarySlotState,
  MetaState,
  RunState,
} from '../src/types/game';

const MERC_IDS: ArchetypeId[] = ['merc_sword', 'merc_tentacle', 'merc_cannon', 'merc_array', 'merc_god'];

const DPS_AFFIX_PROFILE: AffixId[] = [
  'af_t1_atk',
  'af_t1_spd',
  'af_t1_crit_r',
  'af_t1_crit_d',
  'af_t2_century',
  'af_t3_hero_ln',
  'af_t2_double',
  'af_t3_pop_dot',
  'af_t3_click_t',
  'af_t1_atk',
];

/** 按劫数解锁的护法数量（神晶成本曲线 0/20/400/8000/150000） */
const UNLOCKED_BY_ORDER = [2, 2, 2, 3, 3, 4, 4, 5, 5, 5];

/** 各阶期望词缀品质：前 3 劫蓝、4~6 紫、7+ 金 */
function tierForOrder(order: number): AffixTier {
  if (order <= 3) return 'blue';
  if (order <= 6) return 'purple';
  return 'gold';
}

const RELIC_KEYS = [
  'rel_c_merc_atk',
  'rel_c_click_mult',
  'rel_r_merc_spd',
  'rel_r_merc_crit',
  'rel_r_crit_dmg',
  'rel_m_first_affix',
  'rel_r_sword_dmg',
  'rel_r_tentacle',
  'rel_r_cannon_dmg',
  'rel_e_dot_crit',
  'rel_e_inf_dmg',
  'rel_m_final_mult',
  'rel_e_click_storm',
  'rel_m_click_echo',
] as const;

/** 各阶预期毒层（层数上限 3500；按平均战斗时长估） */
const POISON_BY_ORDER = [300, 900, 1500, 2000, 2500, 2800, 3200, 3500, 3500, 3500];

interface BuildOpts {
  order: number;
  mercLevel: number;
  relicBudget: number;
  skillLevel: number;
  accumulatedAtk?: number;
  sharedHeroGrowth?: number;
  puppetLevel?: number;
  /** 克隆/共鸣是否处于激活期（爆发口径） */
  skillsActive?: boolean;
  clickStormLv?: number;
}

function build(opts: BuildOpts): { run: RunState; mercs: MercenarySlotState[]; meta: MetaState } {
  const meta = createInitialMetaState();
  const mercs = createInitialMercsState();
  const order = opts.order;
  const tier = tierForOrder(order);
  const unlockedCount = UNLOCKED_BY_ORDER[order - 1];
  const lv = opts.mercLevel;

  for (let i = 0; i < 5; i++) {
    const level = i < unlockedCount ? lv : 0;
    mercs[i] = {
      ...mercs[i],
      archetype: MERC_IDS[i],
      unlocked: level > 0,
      level,
      innateAffix: ARCHETYPES[MERC_IDS[i]].recommendedInnate,
      unlockedLevelSlots: LEVEL_SLOT_THRESHOLDS.filter((m) => level >= m).length,
      levelAffixes: LEVEL_SLOT_THRESHOLDS.map((threshold, slotIdx) =>
        level >= threshold
          ? { id: DPS_AFFIX_PROFILE[slotIdx % DPS_AFFIX_PROFILE.length], tier }
          : null
      ),
      lockedLevelSlots: Array(10).fill(false),
    };
  }

  const perRelic = Math.min(40, Math.floor(opts.relicBudget / RELIC_KEYS.length));
  for (const key of RELIC_KEYS) {
    meta.relicLevels[key as keyof MetaState['relicLevels']] = perRelic;
  }
  meta.relicLevels.rel_e_click_storm = opts.clickStormLv ?? Math.min(20, Math.floor(order * 1.5));

  const trib = TRIBULATIONS[order - 1];
  const run = createInitialRunState(trib.id, meta);
  const totalHp = getBossTotalHp(trib.id, meta);
  const firstShell = totalHp.mul(0.0001);

  run.realmLevel = Math.min(5, Math.floor(order * 0.55));
  run.enlightenmentLevel = 20 + order * 15;
  run.spiritStones = new Decimal('1e30').toString();
  const active = opts.skillsActive ? 8 : 0;
  for (const id of ['sk_blood', 'sk_clone', 'sk_thunder', 'sk_sync'] as const) {
    run.skills[id] = {
      level: opts.skillLevel,
      cooldownRemaining: 0,
      activeRemaining: id === 'sk_thunder' ? 0 : active,
      autoCast: true,
    };
  }
  run.poisonStacks = POISON_BY_ORDER[order - 1];
  run.manaSpentThisRun = 5000;
  run.mana = 100;
  run.clickStacks = new Decimal(5e4).toString();
  run.accumulatedAtk = new Decimal(opts.accumulatedAtk ?? 0).toString();
  run.sharedHeroGrowth = new Decimal(opts.sharedHeroGrowth ?? 0).toString();
  run.puppetLevel = opts.puppetLevel ?? 50;
  run.bossMaxHp = firstShell.toString();
  run.bossHp = firstShell.toString();
  return { run, mercs, meta };
}

function fmt(d: Decimal): string {
  if (d.lte(0)) return '0';
  const log = d.log10();
  if (log < 6) return d.toNumber().toFixed(0);
  const exp = Math.floor(log);
  const mant = d.div(Decimal.pow(10, exp)).toNumber();
  return `${mant.toFixed(2)}e${exp}`;
}

function pct(part: Decimal, whole: Decimal): string {
  if (whole.lte(0)) return '0.0%';
  return `${part.div(whole).mul(100).toNumber().toFixed(1)}%`;
}

function seconds(sec: number): string {
  if (!Number.isFinite(sec)) return '∞';
  if (sec < 1) return `${(sec * 1000).toFixed(0)}ms`;
  if (sec < 600) return `${sec.toFixed(0)}s`;
  return `${(sec / 60).toFixed(1)}min`;
}

/** 真实秒伤 = 统一 DPS 分解（已含点击联动与机神充能） */
function measure(opts: BuildOpts, mutate?: (s: ReturnType<typeof build>) => void) {
  const state = build(opts);
  if (mutate) mutate(state);
  const { run, mercs, meta } = state;
  const breakdown = getTeamCombatDpsBreakdown(run, mercs, meta, { nowMs: 1 });
  const heroStats = getHeroStats(run, mercs, meta, 1);
  const globalMult = getGlobalMult(run, mercs, meta);

  const stats = mercs.map((m, idx) =>
    m.unlocked && m.level > 0
      ? getMercenaryComputedStats(idx, mercs, run, meta, heroStats.heroBasePower, heroStats.rawHeroClick, globalMult)
      : null
  );
  const volleyOf = (m: MercenarySlotState) =>
    m.innateAffix === 'sp_sword_storm' ? 5 : m.innateAffix === 'sp_cannon_gat' ? 3 : 1;
  const strikesOf = (idx: number) => {
    const st = stats[idx];
    const m = mercs[idx];
    if (!st) return 0;
    return (
      volleyOf(m) +
      (idx === 0 ? 0.4 : 0) +
      st.doubleHitChance +
      st.tripleHitChance * 3
    );
  };

  const trueTotal = breakdown.totalDps;

  const trib = TRIBULATIONS[opts.order - 1];
  const totalHp = getBossTotalHp(trib.id, meta);
  const clearSec = trueTotal.gt(0) ? totalHp.div(trueTotal).toNumber() : Number.POSITIVE_INFINITY;

  return {
    run,
    mercs,
    meta,
    breakdown,
    heroStats,
    stats,
    clicksPerSec: breakdown.clicksPerSec,
    attacksPerSec: breakdown.attacksPerSec,
    hitsPerSec: breakdown.hitsPerSec,
    /** 每名护法的基础间隔命中率（不含点击联动/充能） */
    strikesPerSec: stats.map((st, idx) => (st ? strikesOf(idx) / st.interval : 0)),
    clickLinkDps: breakdown.clickLinkDps,
    clickStormDps: breakdown.clickStormDps,
    cannonChargeDps: breakdown.cannonChargeDps,
    trueTotal,
    totalHp,
    clearSec,
    rank: evaluateSpeedrunRank(Math.max(100, clearSec * 1000), trib.order),
    relicBudget: opts.relicBudget,
  };
}

function recommendMax(order: number): number {
  const text = TRIBULATIONS[order - 1].recommendedLv;
  const nums = text.match(/\d+/g)?.map(Number) ?? [100];
  return Math.max(...nums);
}

/** 二分：达成 targetSec 通关所需的护法等级 */
function solveLevelFor(order: number, targetSec: number, relicBudget: number, skillLevel: number): number {
  let lo = 1;
  let hi = 1200;
  for (let i = 0; i < 26; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const r = measure({ order, mercLevel: mid, relicBudget, skillLevel });
    if (r.clearSec > targetSec) lo = mid;
    else hi = mid;
  }
  return hi;
}

console.log('============================== 难度曲线反解 ==============================');
console.log('口径：标准构筑（按阶词缀品质、遗物按解锁门槛摊分、傀儡 Lv.50、无修为成长加成），');
console.log('      反解「120 秒通关所需护法等级」，并与推荐等级 / SSS 门槛对照。\n');
console.log('      注意：遗物按解锁门槛平均摊到 14 件关键遗物（单件封顶 40 级），劫 8+ 与真实满配存在系统偏差，仅看趋势。');
console.log('劫  推荐等级   所需Lv(120s)  所需Lv(SSS15s)  推荐上限下的通关时间   评级');

for (const trib of TRIBULATIONS) {
  const order = trib.order;
  const relicBudget = Math.max(4, trib.unlockReqRelicLevels);
  const skillLevel = Math.max(1, order * 3);
  const lv120 = solveLevelFor(order, 120, relicBudget, skillLevel);
  const lv15 = solveLevelFor(order, 15, relicBudget, skillLevel);
  const recMax = recommendMax(order);
  const atRec = measure({ order, mercLevel: recMax, relicBudget, skillLevel });
  console.log(
    `${String(order).padEnd(3)} ${trib.recommendedLv.padEnd(12)} ${String(lv120).padStart(8)}      ${String(lv15).padStart(8)}          ${seconds(atRec.clearSec).padStart(8)}            ${atRec.rank.rank}`
  );
}

console.log('\n============================== 伤害来源占比 ==============================');
const SNAPSHOTS: { label: string; opts: BuildOpts }[] = [
  {
    label: '劫2 · Lv.110 · 蓝词缀 · 遗物 4 级 · 毒层 900',
    opts: { order: 2, mercLevel: 110, relicBudget: 4, skillLevel: 6, accumulatedAtk: 2e4, sharedHeroGrowth: 0 },
  },
  {
    label: '劫6 · Lv.500 · 紫词缀 · 遗物 140 级 · 毒层 2800',
    opts: { order: 6, mercLevel: 500, relicBudget: 140, skillLevel: 18, accumulatedAtk: 2e6, sharedHeroGrowth: 0 },
  },
  {
    label: '劫10 · Lv.1000 · 金词缀 · 遗物 2000 级 · 毒层 3500',
    opts: { order: 10, mercLevel: 1000, relicBudget: 2000, skillLevel: 30, accumulatedAtk: 2e8, sharedHeroGrowth: 0 },
  },
];

for (const snap of SNAPSHOTS) {
  for (const active of [false, true]) {
    const r = measure({ ...snap.opts, skillsActive: active });
    const b = r.breakdown;
    console.log(`\n### ${snap.label} ${active ? '（神通全开·爆发）' : '（稳态·无主动神通）'}`);
    console.log(
      `BOSS ${fmt(r.totalHp)} | HUD/离线 ${fmt(b.totalDps)}/s | 真实 ${fmt(r.trueTotal)}/s | 预测 ${seconds(r.clearSec)} | ${r.rank.rank}`
    );
    console.log(
      `点击 ${r.clicksPerSec.toFixed(1)}/s（傀儡+残影）| 攻击事件 ${r.attacksPerSec.toFixed(0)}/s | 命中事件 ${r.hitsPerSec.toFixed(0)}/s | 主角单次 ${fmt(r.heroStats.rawHeroClick)}`
    );
    console.log('  来源              秒伤        占真实');
    console.log(`  主角点击        ${fmt(b.heroDps).padStart(10)}  ${pct(b.heroDps, r.trueTotal).padStart(7)}`);
    r.stats.forEach((st, idx) => {
      if (!st) return;
      console.log(
        `  ${ARCHETYPES[r.mercs[idx].archetype].name.padEnd(6)}      ${fmt(b.mercDpsList[idx]).padStart(10)}  ${pct(b.mercDpsList[idx], r.trueTotal).padStart(7)}   (间隔 ${st.interval.toFixed(2)}s · 基础命中 ${r.strikesPerSec[idx].toFixed(0)}/s · 暴率 ${(st.critRate * 100).toFixed(0)}%)`
      );
    });
    console.log(`  毒·持续        ${fmt(b.poisonPassiveDps).padStart(10)}  ${pct(b.poisonPassiveDps, r.trueTotal).padStart(7)}`);
    console.log(`  毒·暴击/引爆   ${fmt(b.poisonProcDps).padStart(10)}  ${pct(b.poisonProcDps, r.trueTotal).padStart(7)}`);
    console.log(
      `  点击联动伤害   ${fmt(b.clickLinkDps).padStart(10)}  ${pct(b.clickLinkDps, r.trueTotal).padStart(7)}   （已计入 HUD/离线）`
    );
    console.log(
      `  机神充能伤害   ${fmt(b.cannonChargeDps).padStart(10)}  ${pct(b.cannonChargeDps, r.trueTotal).padStart(7)}   （已计入 HUD/离线）`
    );
    console.log(
      `  HUD/离线口径偏差：${((r.trueTotal.div(b.totalDps).toNumber() - 1) * 100).toFixed(1)}%（应为 0）`
    );
  }
}

console.log('\n============================== 攻速与命中事件审计 ==============================');
{
  const r = measure({ order: 10, mercLevel: 1000, relicBudget: 2000, skillLevel: 30, skillsActive: true });
  console.log('25 次/秒上限只作用于「间隔驱动攻击」，单次攻击可拆出多段命中：');
  for (let idx = 0; idx < 5; idx++) {
    const st = r.stats[idx];
    if (!st) continue;
    const attacksPerSec = 1 / st.interval;
    console.log(
      `  ${ARCHETYPES[r.mercs[idx].archetype].name.padEnd(6)} 基础攻击 ${attacksPerSec.toFixed(1)}/s → 基础命中 ${r.strikesPerSec[idx].toFixed(0)}/s（分光/连击/三才放大 ×${(r.strikesPerSec[idx] / attacksPerSec).toFixed(1)}）`
    );
  }
  const totalAttacks = r.stats.reduce((a, st) => a + (st ? 1 / st.interval : 0), 0);
  const totalStrikes = r.strikesPerSec.reduce((a, v) => a + v, 0);
  console.log(
    `  合计：基础攻击 ${totalAttacks.toFixed(0)}/s → 基础命中 ${totalStrikes.toFixed(0)}/s（×${(totalStrikes / totalAttacks).toFixed(1)}）`
  );
  console.log(
    `  含点击联动/机神充能后：攻击事件 ${r.attacksPerSec.toFixed(0)}/s · 命中事件 ${r.hitsPerSec.toFixed(0)}/s`
  );
  console.log(
    `  「每命中」类效果实际触发频率：毒爆 ${(r.hitsPerSec * 0.3).toFixed(0)} 次/s（按 30% 暴击系数估）`
  );
}

console.log('\n============================== 溢出折算与乘区审计 ==============================');
{
  const base = measure({ order: 10, mercLevel: 1000, relicBudget: 2000, skillLevel: 30 });
  const merc = base.mercs[0];
  const st = base.stats[0]!;
  console.log(`  剑侍原始间隔 ${(1000 / (1 / st.interval)).toFixed(0)}ms · 实际间隔 ${(st.interval * 1000).toFixed(0)}ms · 溢出倍率 ×${st.overflowSpdMult.toFixed(2)}`);
  console.log(`  傀儡：速率 ${base.heroStats.puppetRate.toFixed(1)}/s · 溢出倍率 ×${base.heroStats.puppetOverflowMult.toFixed(2)}`);
  console.log(`  残影：速率上限 25/s（超出 1:1 折算为单次伤害）`);
  const panelLink = st.rawDmg;
  console.log(
    `  借力打力（af_t3_hero_ln）: ${fmt(panelLink)} 单次 → 已纳入溢出折算（与【超出部分 1:1 折算】口径一致）`
  );
  void merc;
}

console.log('\n============================== 弑神共鸣(sk_sync) 量级 ==============================');
for (const order of [2, 6, 10]) {
  const r = measure({
    order,
    mercLevel: recommendMax(order),
    relicBudget: Math.max(4, TRIBULATIONS[order - 1].unlockReqRelicLevels),
    skillLevel: Math.max(1, order * 3),
    skillsActive: true,
  });
  let syncDps = new Decimal(0);
  r.stats.forEach((st, idx) => {
    if (!st) return;
    syncDps = syncDps.add(
      r.heroStats.rawHeroClick.mul(0.3 * r.run.skills.sk_sync.level).mul(r.strikesPerSec[idx])
    );
  });
  console.log(
    `  劫${order}：共鸣 Lv.${r.run.skills.sk_sync.level} 附加 ${fmt(syncDps)}/s，占真实总伤 ${pct(syncDps, r.trueTotal)}`
  );
}

console.log('\n============================== 乘区消融实验 ==============================');
console.log('在「劫10 · Lv.1000 · 金词缀 · 遗物 40/件（理论满配）」下逐项移除，看真实秒伤跌幅：\n');
{
  const baseOpts: BuildOpts = {
    order: 10,
    mercLevel: 1000,
    relicBudget: 2000,
    skillLevel: 30,
    accumulatedAtk: 2e8,
  };
  const ref = measure(baseOpts);
  const rows: { label: string; ratio: number }[] = [];
  const variants: { label: string; mutate: (s: ReturnType<typeof build>) => void }[] = [
    {
      label: '第5护法·混沌古神嗣（全队复利）',
      mutate: (s) => {
        s.mercs[4] = { ...s.mercs[4], unlocked: false, level: 0 };
      },
    },
    {
      label: '第4护法·天机阵尊（1~3号位光环）',
      mutate: (s) => {
        s.mercs[3] = { ...s.mercs[3], unlocked: false, level: 0 };
      },
    },
    {
      label: '第2护法·深渊触母（毒）',
      mutate: (s) => {
        s.mercs[1] = { ...s.mercs[1], unlocked: false, level: 0 };
      },
    },
    {
      label: '遗物·造化终章 rel_m_final_mult',
      mutate: (s) => {
        s.meta.relicLevels.rel_m_final_mult = 0;
      },
    },
    {
      label: '遗物·古神瞳 rel_m_first_affix',
      mutate: (s) => {
        s.meta.relicLevels.rel_m_first_affix = 0;
      },
    },
    {
      label: '遗物·无尽遗力 rel_e_inf_dmg',
      mutate: (s) => {
        s.meta.relicLevels.rel_e_inf_dmg = 0;
      },
    },
    {
      label: '遗物·护法全体 rel_c_merc_atk',
      mutate: (s) => {
        s.meta.relicLevels.rel_c_merc_atk = 0;
      },
    },
    {
      label: '遗物·万道合击 rel_e_click_storm',
      mutate: (s) => {
        s.meta.relicLevels.rel_e_click_storm = 0;
      },
    },
    {
      label: '词缀·百炼成仙 af_t2_century（置空）',
      mutate: (s) => {
        s.mercs.forEach((m) => {
          m.levelAffixes.forEach((a, i, arr) => {
            if (a?.id === 'af_t2_century') arr[i] = null;
          });
        });
      },
    },
    {
      label: '词缀·借力打力 af_t3_hero_ln（置空）',
      mutate: (s) => {
        s.mercs.forEach((m) => {
          m.levelAffixes.forEach((a, i, arr) => {
            if (a?.id === 'af_t3_hero_ln') arr[i] = null;
          });
        });
      },
    },
    {
      label: '词缀·残影连击 af_t2_double（置空）',
      mutate: (s) => {
        s.mercs.forEach((m) => {
          m.levelAffixes.forEach((a, i, arr) => {
            if (a?.id === 'af_t2_double') arr[i] = null;
          });
        });
      },
    },
    {
      label: '词缀·万毒催熟 af_t3_pop_dot（置空）',
      mutate: (s) => {
        s.mercs.forEach((m) => {
          m.levelAffixes.forEach((a, i, arr) => {
            if (a?.id === 'af_t3_pop_dot') arr[i] = null;
          });
        });
      },
    },
    {
      label: '词缀品质 金 → 凡（全部槽位）',
      mutate: (s) => {
        s.mercs.forEach((m) => {
          m.levelAffixes.forEach((a) => {
            if (a) a.tier = 'white';
          });
        });
      },
    },
  ];

  for (const v of variants) {
    const r = measure(baseOpts, v.mutate);
    rows.push({ label: v.label, ratio: r.trueTotal.div(ref.trueTotal).toNumber() });
  }
  rows.sort((a, b) => a.ratio - b.ratio);
  for (const r of rows) {
    const dropText =
      r.ratio <= 1e-4
        ? `-${Math.log10(1 / Math.max(r.ratio, 1e-300)).toFixed(1)} 个数量级`
        : `${r.ratio >= 1 ? '+' : '-'}${Math.abs((1 - r.ratio) * 100).toFixed(1)}%`;
    console.log(`  ${r.label.padEnd(34)} 总伤 ${dropText}`);
  }
}
console.log('\n============================== 毒流 vs 直伤流 的分水岭 ==============================');
console.log('固定「劫6 · Lv.500 · 紫词缀 · 毒层 2800」，只改遗物总等级：\n');
console.log('  遗物总级   毒持续    毒爆    毒合计   直伤合计');
{
  for (const relicBudget of [0, 20, 60, 140, 280, 560]) {
    const r = measure({ order: 6, mercLevel: 500, relicBudget, skillLevel: 18, accumulatedAtk: 2e6 });
    const b = r.breakdown;
    console.log(
      `  ${String(relicBudget).padStart(6)}   ${pct(b.poisonPassiveDps, r.trueTotal).padStart(7)}  ${pct(b.poisonProcDps, r.trueTotal).padStart(7)}  ${pct(b.poisonTotalDps, r.trueTotal).padStart(7)}   ${pct(r.trueTotal.sub(b.poisonTotalDps), r.trueTotal).padStart(7)}`
    );
  }
}
console.log('\n============================== NG+ 血量曲线 ==============================');
{
  const meta = createInitialMetaState();
  const baseHp = getBossTotalHp('tier_10', meta);
  for (const ng of [0, 1, 2, 3, 5, 10]) {
    meta.ngPlusCount = ng;
    const hp = getBossTotalHp('tier_10', meta);
    console.log(`  NG+${String(ng).padStart(2)}: ${fmt(hp).padStart(10)}  （相对 NG+0 ×${fmt(hp.div(baseHp))}）`);
  }
}

console.log('\n============================== 「每次攻击」类经济效果量级 ==============================');
{
  const r = measure({ order: 10, mercLevel: 1000, relicBudget: 2000, skillLevel: 30, skillsActive: true });
  const attacksPerSec = r.attacksPerSec;
  const goldJackpot = 0.05 * 7; // 天降横财：base 5% × 仙品 7.0
  const rawJackpotProcs = attacksPerSec * Math.min(1, goldJackpot);
  const fullJackpotProcs = Math.min(rawJackpotProcs, MAX_JACKPOT_PROCS_PER_SEC);
  const overflowJackpotProcs =
    Math.min(
      Math.max(0, rawJackpotProcs - MAX_JACKPOT_PROCS_PER_SEC),
      MAX_JACKPOT_PROCS_PER_SEC
    ) * JACKPOT_OVERFLOW_RATE;
  const jackpotProcs = fullJackpotProcs + overflowJackpotProcs;
  const stonesPerSec = r.trueTotal.mul(2.0 * jackpotProcs);
  const mercLvCap = 1_000_000;
  const upgradeCostAt1000 = new Decimal(ARCHETYPES.merc_sword.baseCost).mul(
    Decimal.pow(ARCHETYPES.merc_sword.growthRate, 1000)
  );
  console.log(`  终局攻击事件 ${attacksPerSec.toFixed(0)}/s（劫10·全神通；v3.9 已按攻击而非命中结算）`);
  console.log(
    `  单个【天降横财】仙品(35%) → 原始 ${rawJackpotProcs.toFixed(0)} 次/秒 → 封顶后等效 ${jackpotProcs.toFixed(1)} 次/秒 → 灵石 ${fmt(stonesPerSec)}/s`
  );
  console.log(
    `  对照：护法 Lv.1000 升 1 级约 ${fmt(upgradeCostAt1000)} 灵石；等级硬上限 Lv.${mercLvCap.toLocaleString()}`
  );
  console.log(
    `  → 每秒灵石可购买的等级数 ≈ ${Math.log10(Math.max(1, stonesPerSec.div(upgradeCostAt1000).toNumber())) < 6 ? stonesPerSec.div(upgradeCostAt1000).toNumber().toFixed(0) : fmt(stonesPerSec.div(upgradeCostAt1000))}`
  );
  console.log(`  → 3 个仙品【天降横财】即可让触发率封顶(100%)，收益再 ×2.9`);
}

console.log('\n============================== 机神「每 15 次攻击」充能 ==============================');
{
  console.log('v3.10：充能每次【攻击】触发一次（不被剑气多段放大），每 15 次攻击 +0.4 秒冷却；所有充能来源合计封顶 1.0 秒/秒（最多使机神攻速翻倍）。');
  for (const order of [2, 6, 10]) {
    const st = order >= 8 ? { skillsActive: true } : {};
    const r = measure({
      order,
      mercLevel: recommendMax(order),
      relicBudget: Math.max(4, TRIBULATIONS[order - 1].unlockReqRelicLevels),
      skillLevel: Math.max(1, order * 3),
      ...st,
    });
    const cannonBase = r.breakdown.mercDpsList[2];
    const cannonCharge = r.breakdown.cannonChargeDps;
    console.log(
      `  劫${String(order).padEnd(2)} 机神基础 ${fmt(cannonBase)}/s → 充能追加 ${fmt(cannonCharge)}/s（占总伤 ${pct(cannonCharge, r.trueTotal)}）`
    );
    console.log(
      `       攻击事件 ${r.attacksPerSec.toFixed(0)}/s · 命中事件 ${r.hitsPerSec.toFixed(0)}/s`
    );
  }
}
