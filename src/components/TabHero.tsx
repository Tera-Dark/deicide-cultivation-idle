import Decimal from 'break_infinity.js';
import { ArrowUpCircle, Bot, Lock, Sparkles, Zap } from 'lucide-react';
import {
  ENLIGHTENMENT_BASE_COST,
  ENLIGHTENMENT_COST_GROWTH,
  PUPPET_COST_GROWTH,
  PUPPET_MAX_LEVEL,
  PUPPET_UNLOCK_COST,
  REALM_TIERS,
  SKILLS,
} from '../config/constants';
import {
  getCostReductionMult,
  getEffectiveGrowthRate,
  getHeroStats,
  getRealmInfo,
  getSkillEffectiveValues,
} from '../core/damageCalc';
import { calculateBulkUpgrade, formatNumber, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';

export function TabHero() {
  const {
    run,
    mercs,
    meta,
    settings,
    upgradeEnlightenment,
    breakthroughRealm,
    buyPuppet,
    upgradeSkill,
  } = useGameStore();

  const stones = toDecimal(run.spiritStones);
  const clicks = toDecimal(run.clickStacks);
  const heroStats = getHeroStats(run, mercs, meta);
  const costRed = getCostReductionMult(meta);

  const curRealm = getRealmInfo(run.realmLevel);
  const nextRealm = getRealmInfo(run.realmLevel + 1);
  const canBreakRealm =
    stones.gte(nextRealm.reqStones) &&
    (nextRealm.reqClicks <= 0 || clicks.gte(nextRealm.reqClicks));

  const enlGrowth = getEffectiveGrowthRate(ENLIGHTENMENT_COST_GROWTH, run.tribulationId);
  const enlBulk = calculateBulkUpgrade(
    new Decimal(ENLIGHTENMENT_BASE_COST),
    enlGrowth,
    run.enlightenmentLevel,
    costRed,
    settings.buyMode,
    stones
  );

  const pupGrowth = getEffectiveGrowthRate(PUPPET_COST_GROWTH, run.tribulationId);
  const pupBulk = calculateBulkUpgrade(
    new Decimal(PUPPET_UNLOCK_COST),
    pupGrowth,
    run.puppetLevel + 1,
    costRed,
    settings.buyMode,
    stones,
    PUPPET_MAX_LEVEL + 1
  );
  const puppetAtMax = run.puppetLevel >= PUPPET_MAX_LEVEL;
  const showPuppet = meta.hasUnlockedPuppet || run.puppetLevel > 0;

  return (
    <div className="space-y-2">
      {/* Realm Breakthrough Card */}
      <div className="bg-[#171a29] border border-[#c084fc]/45 rounded-lg p-2.5 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-sm font-black tracking-wide text-[#e9d5ff] text-glow-purple truncate">
              {curRealm.name}
            </span>
            <span className="font-mono-num text-xs font-bold text-[#c084fc] shrink-0">
              ×{formatNumber(heroStats.realmMult, settings.numberMode)}
            </span>
            <span className="text-[11px] text-[#94a3b8] shrink-0">→ {nextRealm.name}</span>
          </div>
          <p className="text-[11px] font-mono-num text-[#94a3b8] truncate mt-0.5">
            灵石 {formatNumber(nextRealm.reqStones, settings.numberMode)}
            {nextRealm.reqClicks > 0 ? ` · 点击 ${nextRealm.reqClicks}` : ''} · 下阶 ×
            {formatNumber(nextRealm.multiplier, settings.numberMode)}
          </p>
        </div>

        <button
          type="button"
          onClick={breakthroughRealm}
          disabled={!canBreakRealm}
          className={`px-3 py-2 rounded-md text-xs font-display font-bold tracking-wide inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
            canBreakRealm
              ? 'bg-[#a855f7]/30 border border-[#c084fc]/70 text-[#faf5ff] hover:bg-[#a855f7]/45'
              : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
          }`}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" />
          <span>{canBreakRealm ? '破境' : '未达标'}</span>
        </button>
      </div>

      {/* Enlightenment Compact Card */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-lg p-2.5 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#22d3ee] shrink-0 self-center" />
            <span className="font-display text-[13px] font-black tracking-wide text-[#f4f1ea]">
              顿悟
            </span>
            <span className="font-mono-num text-xs font-bold text-[#22d3ee] text-glow-cyan">
              Lv.{run.enlightenmentLevel}
            </span>
            {heroStats.isSoftCapped && (
              <span
                className="text-[10px] font-semibold text-[#fbbf24] shrink-0"
                title="已触发 500 击心魔瓶颈：继续升级顿悟或转培养护法"
              >
                · 心魔瓶颈(20%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#a3b1cc] truncate mt-0.5 font-mono-num">
            单击{' '}
            <span className="text-[#e2e8f0] font-semibold">
              {formatNumber(heroStats.rawHeroClick, settings.numberMode)}
            </span>{' '}
            · 每击 +
            <span className="text-[#67e8f9] font-semibold">
              {formatNumber(heroStats.growthPerClick, settings.numberMode)}
            </span>{' '}
            修为
          </p>
        </div>

        <button
          type="button"
          onClick={upgradeEnlightenment}
          disabled={enlBulk.count <= 0 || stones.lt(enlBulk.totalCost)}
          className={`min-w-[100px] px-2.5 py-1.5 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
            enlBulk.count > 0 && stones.gte(enlBulk.totalCost)
              ? 'bg-[#06b6d4]/22 border border-[#22d3ee]/55 text-[#ecfeff] hover:bg-[#06b6d4]/35'
              : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
          }`}
        >
          <div className="font-semibold leading-tight">升级 +{enlBulk.count}</div>
          <div className="font-mono-num text-[10px] opacity-90">
            {formatNumber(enlBulk.totalCost, settings.numberMode)} 灵石
          </div>
        </button>
      </div>

      {/* Puppet Card (Progressive reveal after breaking Phase 1) */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-lg p-2.5 flex items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[#34d399] shrink-0 self-center" />
            <span className="font-display text-[13px] font-black tracking-wide text-[#6ee7b7] text-glow-emerald">
              机关傀儡
            </span>
            <span className="font-mono-num text-xs font-bold text-[#34d399]">
              {showPuppet
                ? `Lv.${run.puppetLevel}/${PUPPET_MAX_LEVEL} · ${heroStats.puppetRate.toFixed(1)}/s`
                : '未解锁'}
            </span>
          </div>
          <p className="text-[11px] text-[#a3b1cc] truncate mt-0.5">
            {showPuppet
              ? '自动叩击古神（享 25% 顿悟修为成长）'
              : '首次击破第 1 重躯壳（500 血）后开放'}
          </p>
        </div>

        {!showPuppet ? (
          <div className="px-2.5 py-2 rounded-md text-[11px] text-[#94a3b8] bg-[#101322] border border-[#2e3552] inline-flex items-center gap-1 shrink-0">
            <Lock className="w-3 h-3" />
            <span>破1重开</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={buyPuppet}
            disabled={puppetAtMax || pupBulk.count <= 0 || stones.lt(pupBulk.totalCost)}
            className={`min-w-[100px] px-2.5 py-1.5 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
              puppetAtMax
                ? 'bg-[#10b981]/18 border border-[#34d399]/35 text-[#a7f3d0] cursor-default'
                : pupBulk.count > 0 && stones.gte(pupBulk.totalCost)
                  ? 'bg-[#10b981]/22 border border-[#34d399]/50 text-[#ecfdf5] hover:bg-[#10b981]/35'
                  : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {puppetAtMax ? (
              <div className="text-center font-semibold">已满级</div>
            ) : (
              <>
                <div className="font-semibold leading-tight">
                  {run.puppetLevel === 0 ? '激活' : `升级 +${pupBulk.count}`}
                </div>
                <div className="font-mono-num text-[10px] opacity-90">
                  {formatNumber(pupBulk.totalCost, settings.numberMode)} 灵石
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4 Active Skills Compact Upgrade List */}
      <div className="pt-1 space-y-1.5">
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-display font-bold tracking-[0.08em] text-[#7dd3fc]">
          <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>神通强化</span>
        </div>

        {SKILLS.map((cfg) => {
          const sk = run.skills[cfg.id];
          const unlocked = run.realmLevel >= cfg.unlockRealm;
          const reqRealm = REALM_TIERS.find((r) => r.level === cfg.unlockRealm);
          const eff = getSkillEffectiveValues(cfg.id, sk.level, mercs, meta);
          const skGrowth = getEffectiveGrowthRate(cfg.costGrowth, run.tribulationId);
          const skBulk = calculateBulkUpgrade(
            new Decimal(cfg.baseUpgradeCost),
            skGrowth,
            sk.level,
            costRed,
            settings.buyMode,
            stones
          );
          const canBuy = unlocked && skBulk.count > 0 && stones.gte(skBulk.totalCost);

          return (
            <div
              key={cfg.id}
              className={`rounded-lg p-2.5 border flex items-center justify-between gap-2.5 ${
                unlocked
                  ? 'bg-[#171a29] border-[#2e3552]'
                  : 'bg-[#121523] border-white/8 opacity-65'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[13px] font-extrabold tracking-wide text-[#f4f1ea]">
                    {cfg.name}
                  </span>
                  <span className="font-mono-num text-[11px] font-bold text-[#38bdf8]">
                    Lv.{sk.level} · {eff.manaCost}蓝 · {eff.cooldown.toFixed(0)}s
                  </span>
                </div>
                <p className="text-[11px] text-[#a3b1cc] truncate mt-0.5">{cfg.shortDesc}</p>
              </div>

              {!unlocked ? (
                <div className="px-2.5 py-2 rounded-md text-[11px] text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap">
                  需{reqRealm?.name}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => upgradeSkill(cfg.id)}
                  disabled={!canBuy}
                  className={`min-w-[100px] px-2.5 py-1.5 rounded-md text-xs font-medium text-right shrink-0 transition-colors cursor-pointer ${
                    canBuy
                      ? 'bg-[#3b82f6]/25 border border-[#60a5fa]/55 text-[#eff6ff] hover:bg-[#3b82f6]/35'
                      : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <div className="font-semibold leading-tight">强化 +{skBulk.count}</div>
                  <div className="font-mono-num text-[10px] opacity-90">
                    {formatNumber(skBulk.totalCost, settings.numberMode)} 灵石
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
