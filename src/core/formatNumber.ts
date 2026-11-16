import Decimal from 'break_infinity.js';
import { CHINESE_UNITS } from '../config/constants';
import type { NumberDisplayMode } from '../types/game';

export function toDecimal(value: Decimal | string | number): Decimal {
  if (value instanceof Decimal) return value;
  try {
    return new Decimal(value);
  } catch {
    return new Decimal(0);
  }
}

export function formatNumber(
  input: Decimal | string | number,
  mode: NumberDisplayMode = 'chinese',
  decimalWhenSmall = false
): string {
  const val = toDecimal(input);

  if (!Number.isFinite(val.mantissa) || Number.isNaN(val.mantissa)) {
    return '0';
  }
  if (val.lt(0)) {
    return '-' + formatNumber(val.neg(), mode, decimalWhenSmall);
  }
  if (val.lt(1e-6)) {
    return '0';
  }

  const exp = val.exponent;

  if (exp < 4) {
    const n = val.toNumber();
    if (decimalWhenSmall && n < 1000) {
      return n >= 100 ? n.toFixed(1) : n.toFixed(2);
    }
    return Math.floor(n).toLocaleString('en-US');
  }

  if (mode === 'scientific' || exp >= 80) {
    return `${val.mantissa.toFixed(2)}e${exp}`;
  }

  const unitIdx = Math.min(CHINESE_UNITS.length - 1, Math.floor(exp / 4));
  const unit = CHINESE_UNITS[unitIdx];
  const unitPower = unitIdx * 4;
  const scaled = val.mantissa * Math.pow(10, exp - unitPower);

  return `${scaled.toFixed(2)}${unit}`;
}

export function formatTimeMs(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const centis = Math.floor((safe % 1000) / 10);
  const totalSec = Math.floor(safe / 1000);
  const secs = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const mins = totalMin % 60;
  const hours = Math.floor(totalMin / 60);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${pad(centis)}`;
}

/**
 * Closed-form geometric series cost calculation matching 02_MATH_AND_ECONOMY.md:
 * Cost(L) = BaseCost * ((GrowthRate + TierGrowthPenalty) ^ (L - 1)) * (1 - 0.015 * L_cost_down)
 */
export function calculateBulkUpgrade(
  baseCost: Decimal,
  effectiveGrowth: number,
  currentLevel: number,
  costReductionMult: number,
  buyCount: number | 'MAX',
  budget: Decimal,
  maxLevelCap?: number
): { count: number; totalCost: Decimal } {
  const exponent = Math.max(0, currentLevel - 1);
  const firstCost = baseCost
    .mul(Decimal.pow(effectiveGrowth, exponent))
    .mul(costReductionMult);

  const remainingCap =
    maxLevelCap !== undefined ? Math.max(0, maxLevelCap - currentLevel) : 100000;
  if (remainingCap <= 0) {
    return { count: 0, totalCost: firstCost };
  }

  if (buyCount === 'MAX') {
    if (budget.lt(firstCost)) {
      return { count: 0, totalCost: firstCost };
    }
    if (effectiveGrowth <= 1) {
      const affordable = Math.floor(budget.div(firstCost).toNumber());
      const count = Math.max(1, Math.min(affordable, remainingCap));
      return { count, totalCost: firstCost.mul(count) };
    }
    const ratio = budget.mul(effectiveGrowth - 1).div(firstCost).add(1);
    const n = Math.floor(ratio.log10() / Math.log10(effectiveGrowth));
    let count = Math.max(1, Math.min(n, remainingCap));
    let totalCost = firstCost
      .mul(Decimal.pow(effectiveGrowth, count).sub(1))
      .div(effectiveGrowth - 1);
    if (totalCost.gt(budget) && count > 1) {
      count -= 1;
      totalCost = firstCost
        .mul(Decimal.pow(effectiveGrowth, count).sub(1))
        .div(effectiveGrowth - 1);
    }
    return { count, totalCost };
  }

  const count = Math.max(1, Math.min(buyCount, remainingCap));
  if (count === 1 || effectiveGrowth <= 1) {
    return { count, totalCost: firstCost.mul(count) };
  }
  const totalCost = firstCost
    .mul(Decimal.pow(effectiveGrowth, count).sub(1))
    .div(effectiveGrowth - 1);
  return { count, totalCost };
}
