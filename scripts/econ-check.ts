/**
 * 经济曲线回归检查（不依赖浏览器 / import.meta.env）
 *
 *   bun run econ:check
 *
 * 任何改动 `stonePerShell`、`baseAffixStones`、洗练/淬炼定价的提交，
 * 都应该先跑这条脚本，确认曲线仍落在设计区间内。
 */
import { BOSS_SHELLS, TRIBULATIONS } from '../src/config/bosses';
import {
  AFFIX_REROLL_COST_BATCH,
  AFFIX_REROLL_COST_SINGLE,
  AFFIX_QUENCH_COSTS,
} from '../src/config/constants';
import {
  getShellStoneExpectation,
  getTribulationStonePerClear,
  rollTribulationStoneDrops,
} from '../src/core/damageCalc';

/** 设计基准：全通期望（颗） */
const EXPECTED_PER_CLEAR = [4, 5.5, 7, 9, 10, 11, 12.5, 14, 16, 20];
const SIM_ROUNDS = 20000;

let failures = 0;

function check(label: string, actual: number, expected: number, tolerance: number): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (!ok) failures += 1;
  console.log(
    `${ok ? '✓' : '✗'} ${label}: ${actual.toFixed(2)} (期望 ${expected}，容差 ${tolerance})`
  );
}

console.log('== 每劫词缀石期望 ==');
TRIBULATIONS.forEach((t, i) => {
  const perClear = getTribulationStonePerClear(t.id);
  check(`劫${t.order} 全通期望`, perClear, EXPECTED_PER_CLEAR[i], 0.01);
});

console.log('\n== 蒙特卡洛校验（均值 / 区间） ==');
TRIBULATIONS.forEach((t) => {
  let total = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < SIM_ROUNDS; i++) {
    const v = rollTribulationStoneDrops(t.id);
    total += v;
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const mean = total / SIM_ROUNDS;
  const expected = getTribulationStonePerClear(t.id);
  check(`劫${t.order} 模拟均值`, mean, expected, Math.max(0.15, expected * 0.03));
  console.log(`   区间 ${min} ~ ${max}`);
});

console.log('\n== 躯壳深度权重 ==');
const weightTotal = BOSS_SHELLS.reduce((s, sh) => s + sh.baseAffixStones, 0);
check('权重总和', weightTotal, 40, 0);
const first = getShellStoneExpectation('tier_10', 0);
const last = getShellStoneExpectation('tier_10', 9);
check('第10重/第1重 深度倍数', last / first, 10, 0.01);

console.log('\n== 洗练 / 淬炼定价 ==');
console.log(`单槽阶梯: ${AFFIX_REROLL_COST_SINGLE.join(' / ')}`);
console.log(`批量阶梯: ${AFFIX_REROLL_COST_BATCH.join(' / ')}`);
console.log(
  `淬炼阶梯: 凡→良 ${AFFIX_QUENCH_COSTS.white} · 良→上 ${AFFIX_QUENCH_COSTS.green} · 上→极 ${AFFIX_QUENCH_COSTS.blue} · 极→仙 ${AFFIX_QUENCH_COSTS.purple}`
);
if (AFFIX_QUENCH_COSTS.gold !== null) {
  failures += 1;
  console.log('✗ 仙品不应有淬炼消耗');
}

const quenchTotalPerMerc = Object.values(AFFIX_QUENCH_COSTS).reduce<number>(
  (sum, v) => sum + (v ?? 0),
  0
);
console.log(`单护法 10 槽由凡淬满仙品: ${quenchTotalPerMerc * 10} 颗`);
check('四人 40 槽淬满仙品（次劫十全通）', (quenchTotalPerMerc * 10 * 4) / 20, 646, 1);

if (failures > 0) {
  console.error(`\n✗ ${failures} 项经济曲线校验未通过`);
  process.exit(1);
}
console.log('\n✓ 全部经济曲线校验通过');
