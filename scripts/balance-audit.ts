/**
 * 词缀 / 遗物边际审计（结构性平衡回归）
 *
 *   bun run balance:audit
 *
 * 口径：劫10 · Lv.1000 · 金词缀 · 有限遗物拉满（无限遗物 Lv.50）的静态快照。
 * 1. 单槽替换：把某个等级词缀槽换成目标词缀，记录团队 DPS 的最大倍率；
 * 2. 遗物消融：逐件移除遗物，记录团队 DPS 跌幅；
 * 3. 来源占比：主角 / 五护法 / 毒 / 点击联动 / 机神充能。
 *
 * 这不是完整跑图模拟，但能稳定暴露“某个词缀/遗物是否越级”。
 * 任何改动伤害公式、词缀系数或遗物权重的提交，都应先跑这条脚本。
 */
import Decimal from 'break_infinity.js';
import { AFFIX_LIST } from '../src/config/affixes';
import { ARCHETYPES } from '../src/config/archetypes';
import { LEVEL_SLOT_THRESHOLDS } from '../src/config/constants';
import { RELICS } from '../src/config/relics';
import { TRIBULATIONS } from '../src/config/bosses';
import {
  getBossTotalHp,
  getRelicPoolBreakdown,
  getTeamCombatDpsBreakdown,
} from '../src/core/damageCalc';
import {
  createInitialMercsState,
  createInitialMetaState,
  createInitialRunState,
} from '../src/stores/useGameStore';
import type { AffixId, AffixTier, MercenarySlotState, MetaState, RunState } from '../src/types/game';

const MERC_IDS = ['merc_sword', 'merc_tentacle', 'merc_cannon', 'merc_array', 'merc_god'] as const;
const SNAPSHOT_LEVEL = 1000;
const GOLD: AffixTier = 'gold';

/** 基准构筑：不刻意堆某个寡头，保留一条常规 DPS 线 */
const BASELINE_PROFILE: AffixId[] = [
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

interface Snapshot {
  run: RunState;
  mercs: MercenarySlotState[];
  meta: MetaState;
}

function buildSnapshot(): Snapshot {
  const meta = createInitialMetaState();
  const mercs = createInitialMercsState();

  for (const relic of RELICS) {
    const level = relic.maxLevel ?? 50;
    meta.relicLevels[relic.id] = level;
  }

  for (let i = 0; i < 5; i++) {
    mercs[i] = {
      ...mercs[i],
      archetype: MERC_IDS[i],
      unlocked: true,
      level: SNAPSHOT_LEVEL,
      innateAffix: ARCHETYPES[MERC_IDS[i]].recommendedInnate,
      unlockedLevelSlots: LEVEL_SLOT_THRESHOLDS.length,
      levelAffixes: BASELINE_PROFILE.map((id) => ({ id, tier: GOLD })),
      lockedLevelSlots: Array(10).fill(false),
    };
  }

  const trib = TRIBULATIONS[TRIBULATIONS.length - 1];
  const run = createInitialRunState(trib.id, meta);
  const totalHp = getBossTotalHp(trib.id, meta);
  const firstShell = totalHp.mul(0.0001);

  run.realmLevel = 5;
  run.enlightenmentLevel = 170;
  run.spiritStones = new Decimal('1e30').toString();
  run.poisonStacks = 3500;
  run.manaSpentThisRun = 5000;
  run.mana = 100;
  run.clickStacks = new Decimal(5e4).toString();
  run.accumulatedAtk = new Decimal(2e8).toString();
  run.sharedHeroGrowth = '0';
  run.puppetLevel = 50;
  run.bossMaxHp = firstShell.toString();
  run.bossHp = firstShell.toString();
  for (const id of ['sk_blood', 'sk_clone', 'sk_thunder', 'sk_sync'] as const) {
    run.skills[id] = { level: 30, cooldownRemaining: 0, activeRemaining: 0, autoCast: true };
  }

  return { run, mercs, meta };
}

function teamDps(snapshot: Snapshot): Decimal {
  return getTeamCombatDpsBreakdown(snapshot.run, snapshot.mercs, snapshot.meta, { nowMs: 1 })
    .totalDps;
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

const base = buildSnapshot();
const baseDps = teamDps(base);
const baseBreakdown = getTeamCombatDpsBreakdown(base.run, base.mercs, base.meta, { nowMs: 1 });

console.log('============================== 平衡审计快照 ==============================');
console.log('劫10 · Lv.1000 · 金词缀 · 有限遗物拉满 · 无限遗物 Lv.50 · 毒层 3500 · 稳态（无主动神通）\n');
console.log(
  `团队 DPS ${fmt(baseDps)}/s | 点击 ${baseBreakdown.clicksPerSec.toFixed(1)}/s | 攻击 ${baseBreakdown.attacksPerSec.toFixed(0)}/s | 命中 ${baseBreakdown.hitsPerSec.toFixed(0)}/s`
);
console.log('\n来源                秒伤         占比');
console.log(`主角点击          ${fmt(baseBreakdown.heroDps).padStart(11)}  ${pct(baseBreakdown.heroDps, baseDps)}`);
for (let i = 0; i < 5; i++) {
  console.log(
    `${ARCHETYPES[MERC_IDS[i]].name.padEnd(7)}           ${fmt(baseBreakdown.mercDpsList[i]).padStart(11)}  ${pct(baseBreakdown.mercDpsList[i], baseDps)}`
  );
}
console.log(`腐蚀毒            ${fmt(baseBreakdown.poisonTotalDps).padStart(11)}  ${pct(baseBreakdown.poisonTotalDps, baseDps)}`);
console.log(`点击联动          ${fmt(baseBreakdown.clickLinkDps).padStart(11)}  ${pct(baseBreakdown.clickLinkDps, baseDps)}`);

for (let i = 0; i < 5; i++) {
  console.log(
    `  └ ${ARCHETYPES[MERC_IDS[i]].name}联动     ${fmt(baseBreakdown.clickLinkBySlot[i]).padStart(9)}  ${pct(baseBreakdown.clickLinkBySlot[i], baseDps)}`
  );
}console.log(`机神充能          ${fmt(baseBreakdown.cannonChargeDps).padStart(11)}  ${pct(baseBreakdown.cannonChargeDps, baseDps)}`);
const cannonTotal = baseBreakdown.mercDpsList[2].add(baseBreakdown.cannonChargeDps);
const cannonTrueTotal = cannonTotal.add(baseBreakdown.clickLinkBySlot[2]);
console.log(`
※ 雷火机神直接+充能        ${fmt(cannonTotal).padStart(9)}  ${pct(cannonTotal, baseDps)}`);
console.log(`※ 雷火机神全归因（含点击联动）${fmt(cannonTrueTotal).padStart(9)}  ${pct(cannonTrueTotal, baseDps)}`);

// ============================================================================
// 单槽词缀边际
// ============================================================================
interface AffixMarginal {
  id: AffixId;
  name: string;
  ratio: number;
  holder: string;
  slot: number;
}

const rows: AffixMarginal[] = [];
for (const cfg of AFFIX_LIST) {
  let best = { ratio: 0, holder: '', slot: -1 };
  for (let mercIdx = 0; mercIdx < 5; mercIdx++) {
    for (let slot = 0; slot < 10; slot++) {
      const snap = buildSnapshot();
      snap.mercs[mercIdx].levelAffixes[slot] = { id: cfg.id, tier: GOLD };
      const ratio = teamDps(snap).div(baseDps).toNumber();
      if (ratio > best.ratio) {
        best = { ratio, holder: ARCHETYPES[MERC_IDS[mercIdx]].name, slot };
      }
    }
  }
  rows.push({ id: cfg.id, name: cfg.name, ratio: best.ratio, holder: best.holder, slot: best.slot });
}
rows.sort((a, b) => b.ratio - a.ratio);

console.log('\n============================== 单槽金词缀边际（团队 DPS 倍率） ==============================');
console.log('把基准构筑的 1 个槽位替换为目标词缀，取 5 名护法 × 10 槽中的最优收益。\n');
console.log('词缀                 最佳持有者   槽位     边际倍率');
for (const row of rows) {
  const tag = row.ratio >= 1 ? `×${row.ratio.toFixed(2)}` : `×${row.ratio.toFixed(3)}`;
  console.log(`${row.name.padEnd(10)} ${row.holder.padEnd(8)} ${String(row.slot + 1).padStart(2)}      ${tag}`);
}

console.log('\n关键等级加算/复利词缀的自身乘区（Lv.1000 · 单槽仙品，独立于团队占比）：');
console.log(`  百炼成仙：×${(1 + 0.9 * 10).toFixed(2)} 上限（单槽金实际 ×${(1 + 0.15 * Math.sqrt(7) * 10).toFixed(2)}）`);
console.log(`  强体：×4.00 上限（+300%）`);
console.log(`  万仙来朝：×3.00 上限（+200%）`);
console.log(`  唯我独尊：×5.62（前 4 槽吃古神瞳） / ×4.15（5 号位）`);
console.log(`  以毒攻毒：×7.00 上限（触母专属 +600%）`);

// ============================================================================
// 遗物消融
// ============================================================================
const relicRows: { name: string; id: string; ratio: number }[] = [];
for (const relic of RELICS) {
  const snap = buildSnapshot();
  snap.meta.relicLevels[relic.id] = 0;
  snap.meta.relicDropLevels[relic.id] = 0;
  relicRows.push({ name: relic.name, id: relic.id, ratio: teamDps(snap).div(baseDps).toNumber() });
}
relicRows.sort((a, b) => a.ratio - b.ratio);

console.log('\n============================== 遗物消融（移除单件后的团队 DPS） ==============================');
for (const row of relicRows) {
  const drop = (1 - row.ratio) * 100;
  const text = row.ratio <= 1e-6 ? '-100%' : `-${drop.toFixed(1)}%`;
  console.log(`${row.name.padEnd(10)} ${row.id.padEnd(22)} ${text}`);
}

// ============================================================================
// 门槛检查
// ============================================================================
const failures: string[] = [];
function check(label: string, ok: boolean, detail: string): void {
  if (!ok) failures.push(label);
  console.log(`${ok ? '✓' : '✗'} ${label}: ${detail}`);
}

console.log('\n============================== 平衡门槛 ==============================');
const topAffix = rows[0];
const century = rows.find((r) => r.id === 'af_t2_century')!;
const flatLv = rows.find((r) => r.id === 'af_t1_flat_lv')!;
const totalL = rows.find((r) => r.id === 'af_t3_total_l')!;
const lone = rows.find((r) => r.id === 'af_t3_lone')!;
const adj = rows.find((r) => r.id === 'af_t3_adj_dmg')!;
const cannonShare = cannonTotal.div(baseDps).toNumber();
const cannonTrueShare = cannonTrueTotal.div(baseDps).toNumber();
const nonCannonShare = 1 - cannonShare;
const poisonShare = baseBreakdown.poisonTotalDps.div(baseDps).toNumber();
const swordShare = baseBreakdown.mercDpsList[0].div(baseDps).toNumber();
const tentacleShare = baseBreakdown.mercDpsList[1].div(baseDps).toNumber();
const stoneSurgeBonus = getRelicPoolBreakdown(base.run, base.mercs, base.meta).tacticalBreakdown
  .stoneSurge;

check('单槽词缀最高边际 ≤ ×8', topAffix.ratio <= 8, `${topAffix.name} ×${topAffix.ratio.toFixed(2)}`);
check('百炼成仙单槽边际 ≤ ×8', century.ratio <= 8, `×${century.ratio.toFixed(2)}`);
check('强体单槽边际 ≤ ×5', flatLv.ratio <= 5, `×${flatLv.ratio.toFixed(2)}`);
check('万仙来朝单槽边际 ≤ ×5', totalL.ratio <= 5, `×${totalL.ratio.toFixed(2)}`);
check('唯我独尊单槽边际 ≤ ×6', lone.ratio <= 6, `×${lone.ratio.toFixed(2)}`);
check('左右逢源单槽边际 ≤ ×5', adj.ratio <= 5, `×${adj.ratio.toFixed(2)}`);
check('机神直接+充能占比 ≤ 45%', cannonShare <= 0.45, pct(cannonTotal, baseDps));
check('机神全归因占比 ≤ 55%', cannonTrueShare <= 0.55, pct(cannonTrueTotal, baseDps));
check('非机神直接+充能占比 ≥ 55%', nonCannonShare >= 0.55, `${(nonCannonShare * 100).toFixed(1)}%`);
check('毒伤占比 ≥ 5%', poisonShare >= 0.05, pct(baseBreakdown.poisonTotalDps, baseDps));
check('剑侍 + 触母直伤占比 ≥ 15%', swordShare + tentacleShare >= 0.15, `${((swordShare + tentacleShare) * 100).toFixed(1)}%`);
check('点石成金印战术池终伤 ≤ +250%', stoneSurgeBonus <= 2.5 + 1e-9, `+${(stoneSurgeBonus * 100).toFixed(0)}%`);

if (failures.length > 0) {
  console.error(`\n✗ ${failures.length} 项平衡门槛未通过：${failures.join('、')}`);
  process.exit(1);
}
console.log('\n✓ 全部平衡门槛通过');
