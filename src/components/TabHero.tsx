import { useState } from 'react';
import Decimal from 'break_infinity.js';
import { ArrowUpCircle, Bot, ChevronDown, ChevronUp, Lock, Sparkles, Zap } from 'lucide-react';
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
    toggleAutoSetting,
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
  const autoCfg = meta.autoSettings;
  const [autoOpen, setAutoOpen] = useState(false);

  const autoItems = [
    {
      key: 'autoRealm' as const,
      label: '自动破境',
      unlocked: meta.unlockedAutoRealm,
      reqHint: '劫3',
    },
    {
      key: 'autoPuppet' as const,
      label: '自动傀儡',
      unlocked: meta.unlockedAutoRealm,
      reqHint: '劫3',
    },
    {
      key: 'autoEnlightenment' as const,
      label: '自动顿悟',
      unlocked: meta.unlockedAutoHeroUpgrades,
      reqHint: '劫5',
    },
    {
      key: 'autoSkills' as const,
      label: '自动强技',
      unlocked: meta.unlockedAutoHeroUpgrades,
      reqHint: '劫5',
    },
  ];
  const activeAutoCount = autoItems.filter((i) => i.unlocked && autoCfg[i.key]).length;
  const unlockedAutoCount = autoItems.filter((i) => i.unlocked).length;

  return (
    <div className="space-y-2.5">
      {/* Collapsible Late-Game Automation Control Panel */}
      <div className="bg-[#121626] border border-[#2e3552] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setAutoOpen((v) => !v)}
          className="w-full min-h-[42px] px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-[#7dd3fc] tracking-wide shrink-0">
              灵枢自动修行
            </span>
            <span className="font-mono-num text-[11px] text-[#94a3b8] truncate">
              {unlockedAutoCount > 0
                ? `已开启 ${activeAutoCount}/${unlockedAutoCount}`
                : '劫三开破境/傀儡 · 劫五开顿悟/强技'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#94a3b8] shrink-0">
            <span>{autoOpen ? '收起' : '展开'}</span>
            {autoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {autoOpen && (
          <div className="px-3 pb-2.5 pt-1 border-t border-white/6 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {autoItems.map((item) => {
                const active = item.unlocked && autoCfg[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleAutoSetting(item.key)}
                    className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer flex items-center justify-between gap-1 ${
                      !item.unlocked
                        ? 'bg-[#101322] border-[#2e3552]/70 text-[#64748b]'
                        : active
                          ? 'bg-[#10b981]/22 border-[#34d399]/60 text-[#ecfdf5]'
                          : 'bg-[#1a1f32] border-[#384166] text-[#cbd5e1] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="font-mono-num text-[11px] shrink-0">
                      {!item.unlocked ? item.reqHint : active ? '开' : '关'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-snug">
              灵石优先供给护法升级；开启护法自动后，顿悟/强技仅消耗 5% 余钱，离线闭关同样自动修行。
            </p>
          </div>
        )}
      </div>

      {/* Realm Breakthrough Card */}
      <div className="bg-[#171a29] border border-[#c084fc]/45 rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-[15px] font-black tracking-wide text-[#e9d5ff] text-glow-purple">
              {curRealm.name}
            </span>
            <span className="font-mono-num text-[13px] font-bold text-[#c084fc] shrink-0">
              ×{formatNumber(heroStats.realmMult, settings.numberMode)}
            </span>
            <span className="text-xs text-[#94a3b8] shrink-0">→ {nextRealm.name}</span>
          </div>
          <p className="text-xs font-mono-num text-[#94a3b8] leading-snug">
            灵石 {formatNumber(nextRealm.reqStones, settings.numberMode)}
            {nextRealm.reqClicks > 0 ? ` · 点击 ${nextRealm.reqClicks}` : ''} · 下阶 ×
            {formatNumber(nextRealm.multiplier, settings.numberMode)}
          </p>
        </div>

        <button
          type="button"
          onClick={breakthroughRealm}
          disabled={!canBreakRealm}
          className={`min-h-[48px] min-w-[108px] px-3.5 py-2 rounded-lg text-[13px] font-display font-bold tracking-wide inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
            canBreakRealm
              ? 'bg-[#a855f7]/30 border border-[#c084fc]/70 text-[#faf5ff] hover:bg-[#a855f7]/45'
              : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 shrink-0" />
          <span>{canBreakRealm ? '破境' : '未达标'}</span>
        </button>
      </div>

      {/* Enlightenment Card */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <Sparkles className="w-4 h-4 text-[#22d3ee] shrink-0 self-center" />
            <span className="font-display text-[15px] font-black tracking-wide text-[#f4f1ea]">
              顿悟
            </span>
            <span className="font-mono-num text-[13px] font-bold text-[#22d3ee] text-glow-cyan">
              Lv.{run.enlightenmentLevel}
            </span>
            {heroStats.isSoftCapped && (
              <span
                className="text-xs font-semibold text-[#fbbf24] shrink-0"
                title="已触发 500 击心魔瓶颈：继续升级顿悟或转培养护法"
              >
                · 心魔瓶颈(20%)
              </span>
            )}
          </div>
          <p className="text-xs text-[#a3b1cc] font-mono-num leading-snug">
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
          className={`min-h-[48px] min-w-[114px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
            enlBulk.count > 0 && stones.gte(enlBulk.totalCost)
              ? 'bg-[#06b6d4]/22 border border-[#22d3ee]/55 text-[#ecfeff] hover:bg-[#06b6d4]/35'
              : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
          }`}
        >
          <div className="font-bold leading-tight">升级 +{enlBulk.count}</div>
          <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
            {formatNumber(enlBulk.totalCost, settings.numberMode)} 灵石
          </div>
        </button>
      </div>

      {/* Puppet Card */}
      <div className="bg-[#171a29] border border-[#2e3552] rounded-xl p-3.5 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <Bot className="w-4 h-4 text-[#34d399] shrink-0 self-center" />
            <span className="font-display text-[15px] font-black tracking-wide text-[#6ee7b7] text-glow-emerald">
              机关傀儡
            </span>
            <span className="font-mono-num text-[13px] font-bold text-[#34d399]">
              {showPuppet
                ? `Lv.${run.puppetLevel}/${PUPPET_MAX_LEVEL} · ${heroStats.puppetRate.toFixed(1)}/s${
                    heroStats.puppetOverflowMult > 1
                      ? ` (超速转攻×${heroStats.puppetOverflowMult.toFixed(2)})`
                      : ''
                  }`
                : '未解锁'}
            </span>
          </div>
          <p className="text-xs text-[#a3b1cc] leading-snug">
            {showPuppet
              ? '自动叩击古神（享 25% 顿悟修为成长 · 上限25次/秒，超限等比例转攻击）'
              : '首次击破第 1 重躯壳（25 血）后开放'}
          </p>
        </div>

        {!showPuppet ? (
          <div className="min-h-[48px] min-w-[108px] px-3 py-2 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-[#2e3552] inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap">
            <Lock className="w-3.5 h-3.5" />
            <span>破1重开</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={buyPuppet}
            disabled={puppetAtMax || pupBulk.count <= 0 || stones.lt(pupBulk.totalCost)}
            className={`min-h-[48px] min-w-[114px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
              puppetAtMax
                ? 'bg-[#10b981]/18 border border-[#34d399]/35 text-[#a7f3d0] cursor-default'
                : pupBulk.count > 0 && stones.gte(pupBulk.totalCost)
                  ? 'bg-[#10b981]/22 border border-[#34d399]/50 text-[#ecfdf5] hover:bg-[#10b981]/35'
                  : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
            }`}
          >
            {puppetAtMax ? (
              <div className="text-center font-bold">已满级</div>
            ) : (
              <>
                <div className="font-bold leading-tight">
                  {run.puppetLevel === 0 ? '激活' : `升级 +${pupBulk.count}`}
                </div>
                <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
                  {formatNumber(pupBulk.totalCost, settings.numberMode)} 灵石
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* 4 Active Skills Upgrade List */}
      <div className="pt-1.5 space-y-2">
        <div className="flex items-center gap-1.5 px-1 text-xs font-display font-bold tracking-[0.08em] text-[#7dd3fc]">
          <Zap className="w-4 h-4 text-[#38bdf8]" />
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
              className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                unlocked
                  ? 'bg-[#171a29] border-[#2e3552]'
                  : 'bg-[#121523] border-white/8 opacity-70'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-[15px] font-extrabold tracking-wide text-[#f4f1ea]">
                    {cfg.name}
                  </span>
                  <span className="font-mono-num text-xs font-bold text-[#38bdf8]">
                    Lv.{sk.level} · {eff.manaCost}蓝 · {eff.cooldown.toFixed(0)}s
                  </span>
                </div>
                <p className="text-xs text-[#a3b1cc] leading-snug">{cfg.shortDesc}</p>
              </div>

              {!unlocked ? (
                <div className="min-h-[48px] min-w-[108px] px-3 py-2 rounded-lg text-xs text-[#94a3b8] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap flex items-center justify-center">
                  需{reqRealm?.name}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => upgradeSkill(cfg.id)}
                  disabled={!canBuy}
                  className={`min-h-[48px] min-w-[114px] px-3 py-2 rounded-lg text-[13px] font-medium text-right shrink-0 transition-colors cursor-pointer flex flex-col justify-center ${
                    canBuy
                      ? 'bg-[#3b82f6]/25 border border-[#60a5fa]/55 text-[#eff6ff] hover:bg-[#3b82f6]/35'
                      : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold leading-tight">强化 +{skBulk.count}</div>
                  <div className="font-mono-num text-[11px] opacity-90 mt-0.5">
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
