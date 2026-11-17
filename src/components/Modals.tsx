import { useEffect, useState } from 'react';
import Decimal from 'break_infinity.js';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Dices,
  Film,
  Lock,
  LockOpen,
  MousePointerClick,
  Play,
  RefreshCw,
  Repeat,
  Save,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trophy,
  Type,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import {
  AFFIXES,
  AFFIX_TIER_META,
  AFFIX_TIER_ORDER,
  INNATE_AFFIXES,
  formatAffixDescription,
  formatAffixShortBadgeValue,
  getAffixEffectiveValue,
} from '../config/affixes';
import { ARCHETYPES } from '../config/archetypes';
import { TRIBULATIONS } from '../config/bosses';
import { LEVEL_SLOT_NAMES, LEVEL_SLOT_THRESHOLDS } from '../config/constants';
import { MERC_TYPOGRAPHY, RichLoreText } from '../config/highlights';
import { RELIC_TIER_META, getTribulationEffectiveDropOdds } from '../config/relics';
import {
  evaluateSpeedrunRank,
  getBossTotalHp,
  getEffectiveLevel,
  getGlobalMult,
  getHeroStats,
  getMercenaryComputedStats,
  getPoisonTickExpectedDamage,
  getRelicTotalLv,
  getSkillEffectiveValues,
  getTotalRelicLevels,
  isSlot5Active,
} from '../core/damageCalc';
import { formatNumber, formatTimeMs, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import type { MercenarySlotState, MetaState, RunState, TutorialNodeId } from '../types/game';
import { ArchetypeIcon } from './ArchetypeIcon';
import { PhaseBreakSigilIcon } from './CultivationIcons';
import coverBannerImg from '../assets/images/taptap_cover_banner_1794919855982.jpg';
import taptapIconImg from '../assets/images/taptap_icon_1794919853581.jpg';

interface IntroAct {
  actCode: string;
  title: string;
  titleClass: string;
  glowGradient: string;
  accentColor: string;
  lines: string[];
}

const INTRO_ACTS: IntroAct[] = [
  {
    actCode: '第 一 幕 · 伪 善 苍 穹',
    title: '伪善之天',
    titleClass: 'text-[#e0f2fe] text-glow-sky',
    glowGradient:
      'radial-gradient(circle at 50% 42%, rgba(56,189,248,0.18) 0%, rgba(14,116,144,0.08) 42%, transparent 72%)',
    accentColor: 'via-[#38bdf8]/65',
    lines: [
      '凡人皆言，吐纳灵气、苦修飞升即可得道长生。',
      '直到你修成天眼，刺破九重云端——',
      '终于看清了苍穹尽头那令万灵窒息的恐怖真相。',
    ],
  },
  {
    actCode: '第 二 幕 · 诡 谲 真 相',
    title: '天道古神',
    titleClass: 'text-[#fda4af] text-glow-crimson',
    glowGradient:
      'radial-gradient(circle at 50% 42%, rgba(244,63,94,0.19) 0%, rgba(168,85,247,0.12) 45%, transparent 74%)',
    accentColor: 'via-[#f43f5e]/65',
    lines: [
      '世间所谓的“天道”，竟是一尊盘踞在星海深处、',
      '由高维法则血肉编织而成的【不可名状古神】！',
      '万古众生苦修化作的灵气，不过是祂沉睡中的食粮。',
    ],
  },
  {
    actCode: '第 三 幕 · 异 端 觉 醒',
    title: '弑神夺果',
    titleClass: 'text-[#fef08a] text-glow-gold',
    glowGradient:
      'radial-gradient(circle at 50% 42%, rgba(251,191,36,0.18) 0%, rgba(244,63,94,0.16) 46%, transparent 74%)',
    accentColor: 'via-[#fbbf24]/70',
    lines: [
      '今日，你自斩凡根，唤醒体内禁忌的【弑神道胎】！',
      '每次叩击都将强行剥离古神【灵石】，永久化为自身修为；',
      '召集【五大本命护法】，轰碎【十重躯壳】，窃取【古神道果】！',
    ],
  },
];

interface TutorialCinemaMeta {
  tag: string;
  title: string;
  titleClass: string;
  glowGradient: string;
  borderClass: string;
  lines: string[];
  emblem: 'puppet' | 'merc_sword' | 'affix' | 'relic';
}

const TUTORIAL_CONTENT: Record<TutorialNodeId, TutorialCinemaMeta> = {
  tut_phase1: {
    tag: '破 壳 机 缘 · 灵 枢 认 主',
    title: '躯壳初裂 · 傀儡认主',
    titleClass: 'text-[#6ee7b7] text-glow-emerald',
    glowGradient:
      'radial-gradient(circle at 50% 38%, rgba(16,185,129,0.22) 0%, rgba(6,182,212,0.08) 46%, transparent 74%)',
    borderClass: 'border-[#34d399]/50',
    emblem: 'puppet',
    lines: [
      '你轰碎了古神最外层的腐朽外皮，获赠【80 灵石 & 2 词缀石】！',
      '主角面板已解锁【机关傀儡】，仅需 60 灵石即可激活，开启全自动叩击！',
    ],
  },
  tut_merc1: {
    tag: '本 命 护 法 · 剑 意 觉醒',
    title: '青冥剑侍 参上',
    titleClass: 'text-[#22d3ee] text-glow-cyan',
    glowGradient:
      'radial-gradient(circle at 50% 38%, rgba(6,182,212,0.24) 0%, rgba(56,189,248,0.1) 46%, transparent 74%)',
    borderClass: 'border-[#22d3ee]/55',
    emblem: 'merc_sword',
    lines: [
      '你从虚空剑匣中解救出第一位固定护法——【1号位：青冥剑侍】！',
      '自带连斩与御剑随心双天赋，并附带 1 个永久的【先天本命神通】槽位。',
      '护法从 10 级升至 1000 级可逐层点亮 10 个词缀槽，且每达节点伤害直接 ×2 倍！',
    ],
  },
  tut_affix: {
    tag: '道 纹 显 圣 · 万 法 洗 炼',
    title: '道纹觉醒 · 十槽开启',
    titleClass: 'text-[#fde047] text-glow-gold',
    glowGradient:
      'radial-gradient(circle at 50% 38%, rgba(251,191,36,0.22) 0%, rgba(245,158,11,0.08) 46%, transparent 74%)',
    borderClass: 'border-[#fbbf24]/55',
    emblem: 'affix',
    lines: [
      '护法已达 Lv.10，成功点亮第 1 重等级道纹词缀槽！',
      '点击护法卡片打开【道纹洗练面板】，消耗【词缀石】即可洗练 48 种三六九等神技！',
      '每 10 次洗练必出极品或仙品词缀，支持先看后换，重开 100% 永久保留！',
    ],
  },
  tut_tier1_win: {
    tag: '弑 神 初 捷 · 圣 殿 洞 开',
    title: '劫一功成 · 遗物圣殿',
    titleClass: 'text-[#d8b4fe] text-glow-purple',
    glowGradient:
      'radial-gradient(circle at 50% 38%, rgba(168,85,247,0.24) 0%, rgba(251,191,36,0.1) 46%, transparent 74%)',
    borderClass: 'border-[#c084fc]/55',
    emblem: 'relic',
    lines: [
      '恭喜轰杀古神第一尊分身，获赠【15 颗】【神晶】与首件【凡遗物】！',
      '建议攒够 20 神晶唤醒【2号位：深渊触母】开启高频毒爆流，',
      '并重复刷取劫数积攒【遗物圣殿】总阶数，逐层破禁冲击高阶古神！',
    ],
  },
};

export function IntroModal() {
  const { meta, completeIntro } = useGameStore();
  const [step, setStep] = useState(0);
  const [skipStaggerForStep, setSkipStaggerForStep] = useState<number | null>(null);
  const [heroImgBroken, setHeroImgBroken] = useState(false);
  const [iconImgBroken, setIconImgBroken] = useState(false);

  if (meta.hasSeenIntro) return null;

  const act = INTRO_ACTS[step];
  const isLast = step === INTRO_ACTS.length - 1;
  const instant = skipStaggerForStep === step;

  const handleNext = () => {
    if (isLast) {
      completeIntro();
    } else {
      setStep((s) => s + 1);
      setSkipStaggerForStep(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#04050a] text-[#f1efe9] overflow-hidden animate-cinema-veil select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      onClick={() => {
        if (!instant) setSkipStaggerForStep(step);
      }}
    >
      {/* Breathing Void Aura & Subtle Cover Illustration Backdrop */}
      {!heroImgBroken && (
        <img
          src={coverBannerImg}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          onError={() => setHeroImgBroken(true)}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.26] scale-105 blur-[1px] select-none"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#04050a]/92 via-[#04050a]/72 to-[#04050a]" />
      <div
        className="pointer-events-none absolute inset-0 animate-cinema-breathe transition-all duration-1000"
        style={{ backgroundImage: act.glowGradient }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
        <PhaseBreakSigilIcon className="w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] animate-sigil-cw" />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at center, transparent 34%, rgba(3,4,8,0.92) 100%)',
        }}
      />

      {/* Top Subtle Cinema Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-5 pb-2 max-w-[680px] w-full mx-auto">
        <div className="inline-flex items-center gap-2 text-[11px] font-mono-num tracking-[0.22em] text-[#7dd3fc]/80">
          <PhaseBreakSigilIcon className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>序章 · {step + 1} / 3</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            completeIntro();
          }}
          className="text-xs tracking-[0.14em] text-[#94a3b8] hover:text-[#f8fafc] px-3 py-1 rounded border border-white/12 hover:border-white/30 bg-white/[0.03] transition-colors cursor-pointer"
        >
          跳过序章
        </button>
      </header>

      {/* Center Film-Grade Editorial Typography Stage */}
      <main
        key={`act-${step}`}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 sm:px-10 max-w-[580px] w-full mx-auto text-center"
      >
        {step === 2 && (
          <div
            className="mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#f59e0b]/40 bg-[#0b101b]/90 shadow-[0_0_24px_rgba(245,158,11,0.28)] flex items-center justify-center animate-cinematic-line"
            style={{ animationDelay: instant ? '0ms' : '20ms' }}
          >
            {!iconImgBroken ? (
              <img
                src={taptapIconImg}
                alt="弑神道果图腾徽记"
                referrerPolicy="no-referrer"
                onError={() => setIconImgBroken(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <PhaseBreakSigilIcon className="w-9 h-9 text-[#fbbf24]" />
            )}
          </div>
        )}
        <div
          className="text-[11px] sm:text-xs font-mono-num tracking-[0.34em] text-[#94a3b8] uppercase animate-cinematic-line"
          style={{ animationDelay: instant ? '0ms' : '60ms' }}
        >
          {act.actCode}
        </div>

        <h2
          id="intro-title"
          className={`mt-4 font-display font-black text-[30px] sm:text-[38px] leading-[1.2] tracking-[0.16em] animate-cinematic-title ${act.titleClass}`}
          style={{ animationDelay: instant ? '0ms' : '160ms' }}
        >
          {act.title}
        </h2>

        <div
          className={`w-28 h-px mx-auto my-6 bg-gradient-to-r from-transparent ${act.accentColor} to-transparent animate-cinematic-line`}
          style={{ animationDelay: instant ? '0ms' : '280ms' }}
        />

        <div className="space-y-3.5 sm:space-y-4">
          {act.lines.map((line, i) => (
            <p
              key={i}
              className="text-[15px] sm:text-[17px] leading-[1.95] text-[#dce4f0]/95 font-normal tracking-[0.03em] animate-cinematic-line"
              style={{
                animationDelay: instant ? '0ms' : `${460 + i * 620}ms`,
              }}
            >
              <RichLoreText text={line} />
            </p>
          ))}
        </div>
      </main>

      {/* Bottom Cinema Timeline & Focal CTA */}
      <footer className="relative z-10 px-6 sm:px-8 pb-7 pt-3 max-w-[580px] w-full mx-auto flex flex-col items-center gap-4">
        {!instant && (
          <span className="text-[10px] tracking-[0.2em] text-[#64748b] animate-pulse">
            轻触屏幕即可加速显现
          </span>
        )}

        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {INTRO_ACTS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`前往第${i + 1}幕`}
                onClick={(e) => {
                  e.stopPropagation();
                  setStep(i);
                  setSkipStaggerForStep(null);
                }}
                className={`h-1 rounded-sm transition-all cursor-pointer ${
                  i === step
                    ? 'w-8 bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                    : i < step
                      ? 'w-3 bg-[#38bdf8]/45'
                      : 'w-2.5 bg-white/15 hover:bg-white/30'
                }`}
              />
            ))}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs sm:text-sm font-display font-bold tracking-[0.14em] bg-[#0e172a]/90 border border-[#38bdf8]/55 text-[#e0f2fe] hover:bg-[#06b6d4]/25 hover:border-[#22d3ee] transition-all cursor-pointer animate-cinema-cta-breathe"
            >
              <span>继 续 凝 视</span>
              <ArrowRight className="w-4 h-4 text-[#22d3ee]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-xs sm:text-sm font-display font-black tracking-[0.16em] bg-gradient-to-r from-[#be123c] via-[#e11d48] to-[#be123c] hover:from-[#e11d48] hover:to-[#f43f5e] border border-[#fda4af]/60 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] transition-all cursor-pointer"
            >
              <span>燃 血 叩 击 · 逆 伐 天 道</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

export function UnlockTutorialModal() {
  const { activeTutorial, victorySummary, dismissTutorial } = useGameStore();
  const [instantNode, setInstantNode] = useState<TutorialNodeId | null>(null);

  // Defer milestone cinema reveal until VictoryModal is dismissed so two full-screen overlays never stack
  if (!activeTutorial || victorySummary) return null;

  const content = TUTORIAL_CONTENT[activeTutorial];
  const instant = instantNode === activeTutorial;

  return (
    <div
      className="fixed inset-0 z-[56] flex items-center justify-center bg-[#04060c]/97 p-5 animate-cinema-veil select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tut-modal-title"
      onClick={() => {
        if (!instant) setInstantNode(activeTutorial);
      }}
    >
      {/* Atmospheric Node-Matched Breathing Halo */}
      <div
        className="pointer-events-none absolute inset-0 animate-cinema-breathe"
        style={{ backgroundImage: content.glowGradient }}
      />

      <div
        key={activeTutorial}
        className={`relative z-10 w-full max-w-[460px] rounded-xl border ${content.borderClass} bg-gradient-to-b from-[#131727]/95 via-[#0e111d]/96 to-[#090b13]/98 px-6 py-7 shadow-[0_0_50px_rgba(0,0,0,0.85)] text-center space-y-5`}
      >
        {/* Centered Thematic Emblem */}
        <div className="flex justify-center animate-cinematic-line" style={{ animationDelay: '40ms' }}>
          <div className="w-16 h-16 rounded-full bg-[#0a0d16] border border-white/15 flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.2)]">
            {content.emblem === 'merc_sword' ? (
              <ArchetypeIcon archetype="merc_sword" className="w-11 h-11" />
            ) : content.emblem === 'puppet' ? (
              <Bot className="w-8 h-8 text-[#34d399]" />
            ) : content.emblem === 'relic' ? (
              <Crown className="w-8 h-8 text-[#c084fc]" />
            ) : (
              <Sparkles className="w-8 h-8 text-[#fbbf24]" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div
            className="text-[10px] font-mono-num tracking-[0.28em] text-[#94a3b8] uppercase animate-cinematic-line"
            style={{ animationDelay: instant ? '0ms' : '110ms' }}
          >
            {content.tag}
          </div>
          <h2
            id="tut-modal-title"
            className={`font-display text-2xl sm:text-[26px] font-black tracking-[0.1em] animate-cinematic-title ${content.titleClass}`}
            style={{ animationDelay: instant ? '0ms' : '180ms' }}
          >
            {content.title}
          </h2>
        </div>

        <div
          className="w-24 h-px mx-auto bg-gradient-to-r from-transparent via-white/25 to-transparent animate-cinematic-line"
          style={{ animationDelay: instant ? '0ms' : '260ms' }}
        />

        <div className="space-y-2.5 text-left sm:text-center">
          {content.lines.map((line, i) => (
            <p
              key={i}
              className="text-[13.5px] sm:text-sm text-[#dbe4f2] leading-[1.85] animate-cinematic-line"
              style={{ animationDelay: instant ? '0ms' : `${340 + i * 380}ms` }}
            >
              <RichLoreText text={line} />
            </p>
          ))}
        </div>

        <div
          className="pt-2 flex flex-col items-center gap-2 animate-cinematic-line"
          style={{ animationDelay: instant ? '0ms' : '700ms' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissTutorial();
            }}
            className="w-full sm:w-auto px-7 py-2.5 rounded-md text-xs sm:text-sm font-display font-bold tracking-[0.14em] bg-[#06b6d4]/22 border border-[#22d3ee]/65 text-[#ecfeff] hover:bg-[#06b6d4]/38 transition-all cursor-pointer animate-cinema-cta-breathe"
          >
            明了 · 继续弑神
          </button>
        </div>
      </div>
    </div>
  );
}

export function BuildGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/78 backdrop-blur-sm p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-[480px] max-h-[90dvh] bg-[#151827] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe">
        <div className="shrink-0 px-4 py-3.5 border-b border-[#2e3552] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#38bdf8]" />
            <h2
              id="guide-modal-title"
              className="font-display text-base font-black tracking-wide text-[#f4f1ea]"
            >
              五大本命护法 · 终局协同指南
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-3">
          <div className="bg-[#101322] border border-[#06b6d4]/35 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <ArchetypeIcon archetype="merc_sword" className="w-5 h-5" />
              <ArchetypeIcon archetype="merc_tentacle" className="w-5 h-5" />
              <h3 className="font-display text-sm font-black text-[#e0f2fe] tracking-wide">
                1. 高频毒爆流
              </h3>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-[1.75]">
              <RichLoreText text="给【青冥剑侍】洗出【万毒催熟】与【残影连击】/★【万剑归宗】，利用 0.4 秒超高频多段斩击疯狂引爆【深渊触母】叠加的永久腐蚀毒（触母本命推荐 ★【万毒之源】指数叠毒）！" />
            </p>
          </div>

          <div className="bg-[#101322] border border-[#f59e0b]/35 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <ArchetypeIcon archetype="merc_sword" className="w-5 h-5" />
              <ArchetypeIcon archetype="merc_cannon" className="w-5 h-5" />
              <h3 className="font-display text-sm font-black text-[#fef08a] tracking-wide">
                2. 无限核弹流
              </h3>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-[1.75]">
              <RichLoreText text="【雷火机神】自带“剑侍与主角每攻 15 次缩减 1 秒冷却”，给【青冥剑侍】洗【雷火装填】、给机神洗【伴生剑意】与本命神通 ★【歼星连射】，让 5 秒重炮化为每秒轰炸的毁灭加特林！" />
            </p>
          </div>

          <div className="bg-[#101322] border border-[#f43f5e]/35 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <ArchetypeIcon archetype="merc_array" className="w-5 h-5" />
              <ArchetypeIcon archetype="merc_god" className="w-5 h-5" />
              <h3 className="font-display text-sm font-black text-[#fecdd3] tracking-wide">
                3. 千级登神流
              </h3>
            </div>
            <p className="text-xs text-[#cbd5e1] leading-[1.75]">
              <RichLoreText text="【天机阵尊】与【混沌古神嗣】配合全员洗出【缩资减耗】与本命神通 ★【天道酬勤】，冲上 Lv.1000 激活全部 10 槽（每次里程碑伤害 ×2），触发 5 号位“每 100 总有效级复利 ×1.18”与 ★【千级共鸣】，稳步踏破终焉古神！" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VictoryModal() {
  const {
    meta,
    settings,
    victorySummary,
    autoRepeatCountdown,
    clearVictorySummary,
    switchTribulation,
    toggleAutoRepeat,
  } = useGameStore();

  if (!victorySummary) return null;

  const currentIdx = TRIBULATIONS.findIndex((t) => t.id === victorySummary.tribulationId);
  const nextTrib =
    currentIdx >= 0 && currentIdx < TRIBULATIONS.length - 1
      ? TRIBULATIONS[currentIdx + 1]
      : null;
  const nextTribUnlocked = Boolean(nextTrib && nextTrib.order <= meta.highestUnlockedOrder);
  const overflowBonus = toDecimal(victorySummary.overflowCrystalBonus || '0');
  const convertedOverflowDrops = victorySummary.convertedOverflowDrops ?? [];
  const unlockProg = victorySummary.nextUnlockProgress;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-[#04050c]/84 p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-[470px] max-h-[92dvh] overflow-y-auto custom-scroll bg-[#151827] border border-[#fbbf24]/50 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-3.5 pb-safe">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#fbbf24]">
              <Trophy className="w-4 h-4" />
              <span>弑神胜利结算</span>
            </div>
            <h2
              id="victory-title"
              className="font-display text-xl font-black tracking-wide text-[#f4f1ea] mt-1"
            >
              {victorySummary.tribulationName}
            </h2>
          </div>
          <button
            type="button"
            onClick={clearVictorySummary}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#101322] border border-[#2e3552] rounded-xl p-3.5">
          <div>
            <span className="text-xs text-[#94a3b8] block">本局耗时</span>
            <span className="font-mono-num text-lg font-extrabold text-[#f4f1ea]">
              {formatTimeMs(victorySummary.clearTimeMs)}
            </span>
            {victorySummary.isNewRecord && (
              <span className="block text-xs font-semibold text-[#34d399] mt-0.5">
                刷新最快纪录
              </span>
            )}
          </div>
          <div>
            <span className="text-xs text-[#94a3b8] block">竞速评级</span>
            <span className="font-mono-num text-lg font-extrabold text-[#fbbf24] text-glow-amber">
              {victorySummary.rank} 级 (×{victorySummary.rankCrystalMult})
            </span>
            <span className="block text-xs font-mono-num font-bold text-[#c084fc] mt-0.5">
              +{formatNumber(victorySummary.crystalsEarned, settings.numberMode)} 神晶
            </span>
          </div>
        </div>

        {(victorySummary.firstClearNote ||
          victorySummary.unlockedSssAutoRepeat ||
          victorySummary.unlockedNextOrder !== null ||
          victorySummary.relicDrops.length > 0 ||
          convertedOverflowDrops.length > 0 ||
          overflowBonus.gt(0)) && (
          <div className="space-y-2.5 text-xs bg-[#101322] border border-[#2e3552] rounded-xl p-3.5 max-h-56 overflow-y-auto custom-scroll">
            {victorySummary.unlockedNextOrder !== null && (
              <div className="text-[#34d399] font-bold">
                破禁飞升：已成功解锁【劫数 {victorySummary.unlockedNextOrder}】挑战权限！
              </div>
            )}
            {victorySummary.firstClearNote && (
              <div className="text-[#fde68a] leading-relaxed">
                首通解锁：<RichLoreText text={victorySummary.firstClearNote} />
              </div>
            )}
            {victorySummary.unlockedSssAutoRepeat && (
              <div className="text-[#6ee7b7]">
                SSS 瞬杀降维：已永久解锁本劫【自动连续挑战】
              </div>
            )}
            {victorySummary.relicDrops.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#94a3b8]">通关劫印掉落（无限累加）：</div>
                <div className="space-y-1.5">
                  {victorySummary.relicDrops.map((d) => {
                    const tMeta = RELIC_TIER_META[d.tier];
                    return (
                      <div
                        key={d.relicId}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${tMeta.borderClass} ${tMeta.badgeBgClass}`}
                      >
                        <span className={`truncate ${tMeta.fontClass}`}>
                          [{tMeta.label}] {d.name}
                        </span>
                        <span className="font-mono-num text-[#f8fafc] shrink-0">
                          {d.isNew
                            ? '新解封 劫印Lv.1'
                            : `劫印+${d.levelsAdded} → 印Lv.${d.newDropLevel} (总Lv.${d.totalLevel})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {convertedOverflowDrops.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-white/10">
                <div className="text-xs font-semibold text-[#c084fc]">
                  特殊上限遗物满印溢转（同阶神晶）：
                </div>
                {convertedOverflowDrops.map((ov) => {
                  const tMeta = RELIC_TIER_META[ov.tier];
                  return (
                    <div
                      key={ov.relicId}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[#c084fc]/35 bg-[#191529] text-xs"
                    >
                      <span className={`truncate ${tMeta.fontClass}`}>
                        [{tMeta.label}] {ov.name} ×{ov.count}
                      </span>
                      <span className="font-mono-num font-bold text-[#e9d5ff] shrink-0">
                        +{formatNumber(ov.crystalsGained, settings.numberMode)} 神晶
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {overflowBonus.gt(0) && convertedOverflowDrops.length === 0 && (
              <div className="text-[#c084fc] font-mono-num">
                本阶遗物满印溢出转化：额外 +{formatNumber(overflowBonus, settings.numberMode)} 神晶
              </div>
            )}
          </div>
        )}

        {unlockProg && (
          <div className="rounded-xl bg-[#101322] border border-[#38bdf8]/35 px-3.5 py-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between text-[#7dd3fc] font-semibold">
              <span>下劫破禁进度：{unlockProg.nextName.split('：')[0]}</span>
              <span className="text-[11px] text-[#94a3b8]">需双条件达标</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono-num text-xs">
              <div
                className={
                  unlockProg.prevClears >= unlockProg.reqClears
                    ? 'text-[#34d399]'
                    : 'text-[#cbd5e1]'
                }
              >
                前置通关：{unlockProg.prevClears}/{unlockProg.reqClears} 次
              </div>
              <div
                className={
                  unlockProg.totalRelicLevels >= unlockProg.reqRelicLevels
                    ? 'text-[#34d399]'
                    : 'text-[#cbd5e1]'
                }
              >
                遗物总阶：{unlockProg.totalRelicLevels}/{unlockProg.reqRelicLevels} 级
              </div>
            </div>
          </div>
        )}

        {autoRepeatCountdown !== null ? (
          <div className="flex items-center justify-between gap-2 bg-[#10b981]/18 border border-[#34d399]/45 rounded-lg px-3.5 py-2.5 text-xs text-[#a7f3d0]">
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="w-4 h-4" />
              无感连刷中：{autoRepeatCountdown.toFixed(2)}s 后重开…
            </span>
            <button
              type="button"
              onClick={toggleAutoRepeat}
              className="px-2.5 py-1 rounded bg-white/10 hover:text-white cursor-pointer"
            >
              暂停
            </button>
          </div>
        ) : meta.sssUnlockedAutoRepeat[victorySummary.tribulationId] ? (
          <div className="flex items-center justify-between gap-2 bg-[#101322] border border-[#2e3552] rounded-lg px-3.5 py-2 text-xs text-[#cbd5e1]">
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-[#34d399]" />
              <span>已解锁本劫 0.25s 无感连刷（结算设置可改全静默）</span>
            </span>
            <button
              type="button"
              onClick={toggleAutoRepeat}
              className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                meta.autoRepeatEnabled
                  ? 'bg-[#10b981]/25 text-[#6ee7b7]'
                  : 'bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49]'
              }`}
            >
              {meta.autoRepeatEnabled ? '连刷：开' : '开启连刷'}
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => switchTribulation(victorySummary.tribulationId)}
            className="flex-1 min-h-[46px] px-3.5 py-2 rounded-lg text-[13px] font-bold border border-[#384166] bg-[#1e2338] text-[#f1f5f9] hover:bg-[#272e49] transition-colors cursor-pointer"
          >
            再刷一次本劫
          </button>
          {nextTrib && (
            <button
              type="button"
              disabled={!nextTribUnlocked}
              onClick={() => switchTribulation(nextTrib.id)}
              className={`flex-1 min-h-[46px] px-3.5 py-2 rounded-lg text-[13px] font-bold transition-colors ${
                nextTribUnlocked
                  ? 'bg-[#e11d48] hover:bg-[#be123c] text-white cursor-pointer'
                  : 'bg-[#1e2235] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
              }`}
            >
              {nextTribUnlocked
                ? `前往下一劫：${nextTrib.name.split('：')[0]}`
                : `${nextTrib.name.split('：')[0]} 未破禁`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RestartModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { restartRun } = useGameStore();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-title"
    >
      <div className="w-full max-w-[430px] bg-[#151827] border border-[#f43f5e]/45 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 pb-safe">
        <div className="flex items-center gap-2 text-[#fda4af]">
          <AlertTriangle className="w-5 h-5" />
          <h2 id="restart-title" className="font-display text-base font-bold text-[#f4f1ea]">
            确认兵解重开本局？
          </h2>
        </div>

        <p className="text-[13px] text-[#cbd5e1] leading-relaxed">
          重开将重置古神血量、局内灵石、境界、顿悟、神通、傀儡及佣兵局内等级（归为 1 级）。
        </p>
        <p className="text-xs text-[#a7f3d0] bg-[#10b981]/14 border border-[#34d399]/35 rounded-lg p-3 leading-relaxed">
          永久传承：词缀石、神晶、已解锁护法、本命神通、十槽道纹词缀及全部遗物双轨等级 100% 保留。
        </p>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[46px] px-4 py-2 rounded-lg text-[13px] font-semibold border border-[#384166] bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              restartRun();
              onClose();
            }}
            className="flex-1 min-h-[46px] px-4 py-2 rounded-lg text-[13px] font-bold bg-[#e11d48] hover:bg-[#be123c] text-white transition-colors cursor-pointer"
          >
            确认重开
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCareerDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}时 ${pad(mins)}分 ${pad(secs)}秒`;
  }
  return `${pad(mins)}分 ${pad(secs)}秒`;
}

export function StatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { meta, settings } = useGameStore();
  if (!open) return null;

  const statRows = [
    {
      label: '累计游玩时间',
      value: formatCareerDuration(meta.totalPlayTimeMs),
      icon: Clock,
      accent: 'text-[#38bdf8]',
      border: 'border-[#38bdf8]/30',
    },
    {
      label: '累计点击次数',
      value: formatNumber(meta.totalClicks, settings.numberMode),
      icon: MousePointerClick,
      accent: 'text-[#6ee7b7]',
      border: 'border-[#34d399]/30',
    },
    {
      label: '历史最高 DPS',
      value: `${formatNumber(meta.highestDps, settings.numberMode, true)}/s`,
      icon: Activity,
      accent: 'text-[#fbbf24]',
      border: 'border-[#fbbf24]/30',
    },
    {
      label: '累计弑神次数',
      value: `${(Number(meta.totalSlays) || 0).toLocaleString('en-US')} 次`,
      icon: Trophy,
      accent: 'text-[#fda4af]',
      border: 'border-[#f43f5e]/30',
    },
    {
      label: '累计洗练次数',
      value: `${(Number(meta.totalRerolls) || 0).toLocaleString('en-US')} 次`,
      icon: Dices,
      accent: 'text-[#c084fc]',
      border: 'border-[#c084fc]/30',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
    >
      <div className="w-full max-w-[430px] bg-[#151827] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 pb-safe">
        <div className="flex items-center justify-between gap-2 border-b border-[#2e3552] pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#38bdf8]" />
            <h2 id="stats-modal-title" className="font-display text-base font-black text-[#f4f1ea]">
              生涯统计
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭生涯统计"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {statRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-3 bg-[#101322] border ${row.border} rounded-xl px-3.5 py-3`}
              >
                <span className="inline-flex items-center gap-2 text-[13px] text-[#cbd5e1]">
                  <Icon className={`w-4 h-4 shrink-0 ${row.accent}`} />
                  <span>{row.label}</span>
                </span>
                <span className={`font-mono-num text-sm font-extrabold ${row.accent}`}>
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-1">
          <span>累计兵解重开：{meta.totalRestarts} 次</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold bg-[#1e2338] border border-[#384166] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
          >
            返回设置
          </button>
        </div>
      </div>
    </div>
  );
}

const SEAL_CARDS = [
  {
    id: 'seal_run',
    label: '① 确认抹除灵石、境界与神通',
    posClass: 'col-start-1 row-start-1',
  },
  {
    id: 'seal_mercs',
    label: '② 确认抹除五人护法与全部词缀',
    posClass: 'col-start-2 row-start-1',
  },
  {
    id: 'seal_meta',
    label: '③ 确认抹除遗物、神晶与劫数记录',
    posClass: 'col-start-1 row-start-2',
  },
] as const;

export function HardResetConfirmModal({
  open,
  onClose,
  onConfirmDestroy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirmDestroy: () => void;
}) {
  const [activated, setActivated] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setActivated({});
    }
  }, [open]);

  if (!open) return null;

  const activatedCount = SEAL_CARDS.filter((s) => activated[s.id]).length;
  const allUnlocked = activatedCount === SEAL_CARDS.length;

  const toggleSeal = (id: string) => {
    setActivated((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hard-reset-title"
    >
      <div className="w-full max-w-[460px] bg-[#12131f] border border-[#f43f5e]/55 rounded-t-2xl sm:rounded-2xl p-5 shadow-[0_0_45px_rgba(225,29,72,0.28)] space-y-4 pb-safe">
        <div className="flex items-start justify-between gap-2 border-b border-[#f43f5e]/25 pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono-num tracking-wider text-[#fb7185]">
              <ShieldAlert className="w-4 h-4" />
              <span>五重异位解印 · 防误触保护</span>
            </div>
            <h2
              id="hard-reset-title"
              className="font-display text-base font-black tracking-wide text-[#ffe4e6] text-glow-crimson"
            >
              自毁道基 · 永久删档
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="取消删档"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[13px] text-[#cbd5e1] leading-relaxed">
          此操作将<span className="text-[#fda4af] font-semibold">彻底清除</span>全部本地修为与永久传承，不可逆转。请依次点击下方错位分布的 3 枚封印卡片以解除自毁禁制：
        </p>

        {/* Staggered 2x2 Seal Matrix: Top-Left, Top-Right, Bottom-Left */}
        <div className="grid grid-cols-2 grid-rows-2 gap-2.5">
          {SEAL_CARDS.map((card) => {
            const active = Boolean(activated[card.id]);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleSeal(card.id)}
                className={`${card.posClass} text-left rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between gap-2 min-h-[82px] ${
                  active
                    ? 'bg-[#e11d48]/22 border-[#fb7185] text-[#fff1f2] shadow-[0_0_16px_rgba(244,63,94,0.28)]'
                    : 'bg-[#0c0e18] border-[#2e3552] text-[#cbd5e1] hover:border-[#f43f5e]/55 hover:bg-[#191525]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[11px] font-mono-num tracking-wider text-[#94a3b8]">
                    {active ? '已解印' : '待确认'}
                  </span>
                  {active ? (
                    <CheckCircle2 className="w-4 h-4 text-[#fb7185] shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-[#64748b] shrink-0" />
                  )}
                </div>
                <span className="text-xs font-semibold leading-snug">{card.label}</span>
              </button>
            );
          })}

          {/* Bottom-Right Spacer Chamber */}
          <div className="col-start-2 row-start-2 rounded-xl border border-dashed border-[#2e3552]/70 bg-[#0a0c14]/60 flex flex-col items-center justify-center p-2 text-center select-none">
            <PhaseBreakSigilIcon
              className={`w-7 h-7 transition-colors ${
                allUnlocked ? 'text-[#f43f5e]' : 'text-[#334155]'
              }`}
            />
            <span className="mt-1 font-mono-num text-[11px] text-[#94a3b8]">
              封印解除 {activatedCount} / 3
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col items-center gap-2.5">
          <button
            type="button"
            disabled={!allUnlocked}
            onClick={onConfirmDestroy}
            className={`w-full min-h-[48px] py-2.5 px-4 rounded-lg text-[13px] font-display font-black tracking-wider transition-all ${
              allUnlocked
                ? 'bg-[#e11d48] hover:bg-[#be123c] text-white shadow-[0_0_22px_rgba(225,29,72,0.5)] cursor-pointer'
                : 'bg-[#1a1c29] border border-[#2e3552] text-[#64748b] cursor-not-allowed'
            }`}
          >
            彻底销毁全部存档（不可恢复）
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 text-xs text-[#94a3b8] hover:text-white cursor-pointer"
          >
            保留道基，返回设置
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    settings,
    lastSavedAt,
    saveNow,
    setNumberMode,
    setSoundEnabled,
    setFloatingTextMode,
    setHitVfxEnabled,
    setVibrationEnabled,
    setSilentAutoClear,
    replayIntro,
    exportSaveString,
    importSaveString,
    hardResetAll,
  } = useGameStore();

  const [saveText, setSaveText] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [showHardReset, setShowHardReset] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setNowTick(Date.now());
    const timer = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  if (!open) return null;

  const secondsSinceSave = Math.max(0, Math.floor((nowTick - lastSavedAt) / 1000));

  const handleExport = () => {
    const str = exportSaveString();
    setSaveText(str);
    setImportError(null);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard
        .writeText(str)
        .then(() => {
          setCopied(true);
          setExportNotice('存档串已生成并自动复制到剪贴板');
          window.setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          setExportNotice('已生成存档串，请手动全选文本框复制');
        });
    } else {
      setExportNotice('已生成存档串，请手动全选文本框复制');
    }
  };

  const handleImport = () => {
    setImportError(null);
    setExportNotice(null);
    const res = importSaveString(saveText);
    if (!res.ok) {
      setImportError(res.error ?? '导入失败');
    } else {
      onClose();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="w-full max-w-[480px] max-h-[92dvh] bg-[#151827] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe">
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[#2e3552] flex items-center justify-between">
            <h2 id="settings-title" className="font-display text-base font-bold text-[#f4f1ea]">
              系统设置与存档
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scroll px-5 py-3.5 space-y-4">
            {/* Performance & UX Settings */}
            <div className="space-y-3.5 border-b border-[#2e3552] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[13px] font-semibold text-[#f4f1ea] block">大数显示制式</span>
                  <span className="text-xs text-[#94a3b8]">中式单位 / 科学计数</span>
                </div>
                <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-[#101322] border border-[#2e3552] rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setNumberMode('chinese')}
                    className={`min-h-[38px] px-3 text-xs font-semibold rounded-md cursor-pointer ${
                      settings.numberMode === 'chinese'
                        ? 'bg-[#06b6d4]/25 text-[#67e8f9]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    中式大数
                  </button>
                  <button
                    type="button"
                    onClick={() => setNumberMode('scientific')}
                    className={`min-h-[38px] px-3 text-xs font-semibold rounded-md cursor-pointer ${
                      settings.numberMode === 'scientific'
                        ? 'bg-[#06b6d4]/25 text-[#67e8f9]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    科学计数
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#f4f1ea]">
                    <Type className="w-4 h-4 text-[#38bdf8]" />
                    <span>伤害飘字显示</span>
                  </span>
                  <span className="text-xs text-[#94a3b8] block">高攻速挂机时可减少屏幕遮挡</span>
                </div>
                <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-[#101322] border border-[#2e3552] rounded-lg shrink-0">
                  {(
                    [
                      { id: 'all', label: '全部显示' },
                      { id: 'crit', label: '仅暴击' },
                      { id: 'off', label: '关闭' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFloatingTextMode(opt.id)}
                      className={`min-h-[38px] px-2.5 text-xs font-semibold rounded-md cursor-pointer ${
                        settings.floatingTextMode === opt.id
                          ? 'bg-[#06b6d4]/25 text-[#67e8f9]'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#f4f1ea]">
                    <Zap className="w-4 h-4 text-[#fbbf24]" />
                    <span>受击特效与震屏</span>
                  </span>
                  <span className="text-xs text-[#94a3b8] block">
                    关闭以停用闪白、粒子与震屏（省电护眼）
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHitVfxEnabled(!settings.hitVfxEnabled)}
                  className={`min-h-[42px] min-w-[84px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer shrink-0 transition-colors ${
                    settings.hitVfxEnabled
                      ? 'border-[#34d399]/50 bg-[#10b981]/18 text-[#a7f3d0]'
                      : 'border-[#384166] bg-[#1e2338] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span>{settings.hitVfxEnabled ? '已开启' : '已关闭'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#f4f1ea]">
                    <Smartphone className="w-4 h-4 text-[#c084fc]" />
                    <span>手机震动反馈</span>
                  </span>
                  <span className="text-xs text-[#94a3b8] block">
                    破壳、天罚神雷及洗出紫/金词缀时短震
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVibrationEnabled(!settings.vibrationEnabled)}
                  className={`min-h-[42px] min-w-[84px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer shrink-0 transition-colors ${
                    settings.vibrationEnabled
                      ? 'border-[#c084fc]/50 bg-[#a855f7]/18 text-[#e9d5ff]'
                      : 'border-[#384166] bg-[#1e2338] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span>{settings.vibrationEnabled ? '已开启' : '已关闭'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#f4f1ea]">
                    <Repeat className="w-4 h-4 text-[#34d399]" />
                    <span>无感自动结算</span>
                  </span>
                  <span className="text-xs text-[#94a3b8] block">
                    非首通/解锁里程碑与连刷时跳过全屏结算窗，改为战区底栏静默展示
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSilentAutoClear(!settings.silentAutoClear)}
                  className={`min-h-[42px] min-w-[84px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer shrink-0 transition-colors ${
                    settings.silentAutoClear
                      ? 'border-[#34d399]/50 bg-[#10b981]/18 text-[#a7f3d0]'
                      : 'border-[#384166] bg-[#1e2338] text-[#94a3b8] hover:text-white'
                  }`}
                >
                  <span>{settings.silentAutoClear ? '已开启' : '已关闭'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[13px] font-semibold text-[#f4f1ea] block">合成音效</span>
                  <span className="text-xs text-[#94a3b8]">攻击、神通与破壳音效</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!settings.soundEnabled)}
                  className="min-h-[42px] min-w-[84px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-[#384166] bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer shrink-0"
                >
                  {settings.soundEnabled ? (
                    <>
                      <Volume2 className="w-4 h-4 text-[#34d399]" />
                      <span>已开启</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-[#94a3b8]" />
                      <span>已静音</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Career Stats & Story Replay */}
            <div className="grid grid-cols-2 gap-2.5 border-b border-[#2e3552] pb-4">
              <button
                type="button"
                onClick={() => setShowStats(true)}
                className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold border border-[#38bdf8]/40 bg-[#06b6d4]/12 text-[#cffafe] hover:bg-[#06b6d4]/24 cursor-pointer"
              >
                <BarChart3 className="w-4 h-4 text-[#22d3ee]" />
                <span>生涯统计</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  replayIntro();
                }}
                className="min-h-[46px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-bold border border-[#384166] bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
              >
                <Film className="w-4 h-4 text-[#38bdf8]" />
                <span>重温序章</span>
              </button>
            </div>

            {/* Base64 Export / Import */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[#f4f1ea]">Base64 存档导入/导出</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#06b6d4]/22 border border-[#22d3ee]/50 text-[#cffafe] hover:bg-[#06b6d4]/35 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '导出'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={!saveText.trim()}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10b981]/22 border border-[#34d399]/50 text-[#a7f3d0] hover:bg-[#10b981]/35 disabled:opacity-40 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>导入</span>
                  </button>
                </div>
              </div>

              <textarea
                value={saveText}
                onChange={(e) => {
                  setSaveText(e.target.value);
                  setImportError(null);
                  setExportNotice(null);
                }}
                placeholder="导出获取 Base64 存档串，或粘贴后点击导入..."
                rows={3}
                className="w-full rounded-lg bg-[#0d101b] border border-[#2e3552] p-2.5 text-xs font-mono text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
              />
              {exportNotice && <p className="text-xs text-[#6ee7b7]">{exportNotice}</p>}
              {importError && <p className="text-xs text-[#fda4af]">{importError}</p>}
            </div>
          </div>

          {/* Footer: Live Auto-Save Status + Save Now + 5-Step Hard Reset Trigger */}
          <div className="shrink-0 px-5 py-3 border-t border-[#2e3552] bg-[#111422] flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono-num text-xs text-[#94a3b8] truncate">
                已自动保存 ({secondsSinceSave}秒前)
              </span>
              <button
                type="button"
                onClick={saveNow}
                className="min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#38bdf8]/40 bg-[#06b6d4]/15 text-[#cffafe] hover:bg-[#06b6d4]/28 cursor-pointer shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>立即保存</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowHardReset(true)}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold text-[#fda4af] bg-[#f43f5e]/10 border border-[#f43f5e]/45 hover:bg-[#f43f5e]/20 cursor-pointer shrink-0"
            >
              硬重置存档
            </button>
          </div>
        </div>
      </div>

      <StatsModal open={showStats} onClose={() => setShowStats(false)} />
      <HardResetConfirmModal
        open={showHardReset}
        onClose={() => setShowHardReset(false)}
        onConfirmDestroy={() => {
          hardResetAll(true);
        }}
      />
    </>
  );
}

export function TribulationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { run, meta, settings, switchTribulation, toggleAutoRepeat } = useGameStore();
  if (!open) return null;

  const currentSssUnlocked = Boolean(meta.sssUnlockedAutoRepeat[run.tribulationId]);
  const totalRelicLevels = getTotalRelicLevels(meta);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trib-modal-title"
    >
      <div className="w-full max-w-[490px] max-h-[90dvh] bg-[#151827] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe">
        <div className="shrink-0 px-4 py-3.5 border-b border-[#2e3552] flex items-center justify-between gap-2">
          <div>
            <h2
              id="trib-modal-title"
              className="font-display text-base font-black tracking-wide text-[#f4f1ea]"
            >
              诸天劫数 · 破禁与轮回
            </h2>
            <p className="text-xs text-[#94a3b8] mt-0.5 font-mono-num">
              遗物总阶 Lv.{totalRelicLevels} · 15s内SSS开连刷 · NG+{meta.ngPlusCount}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="shrink-0 px-4 py-2.5 bg-[#101322] border-b border-white/8 flex items-center justify-between gap-2">
          <span className="text-xs text-[#cbd5e1]">当前劫数自动连刷</span>
          <button
            type="button"
            onClick={toggleAutoRepeat}
            disabled={!currentSssUnlocked}
            className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              !currentSssUnlocked
                ? 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                : meta.autoRepeatEnabled
                  ? 'bg-[#10b981]/25 border-[#34d399]/60 text-[#a7f3d0]'
                  : 'bg-[#1e2338] border-[#384166] text-[#e2e8f0] hover:bg-[#272e49]'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>
              {!currentSssUnlocked
                ? '需SSS解锁'
                : meta.autoRepeatEnabled
                  ? '连刷已开启'
                  : '连刷已关闭'}
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-2.5">
          {TRIBULATIONS.map((t, idx) => {
            const unlocked = t.order <= meta.highestUnlockedOrder;
            const isCurrent = t.id === run.tribulationId;
            const cleared = Boolean(meta.clearedTribulations[t.id]);
            const clearCount = meta.clearCounts?.[t.id] ?? 0;
            const bestMs = meta.bestClearTimesMs[t.id];
            const bestRank =
              bestMs !== undefined ? evaluateSpeedrunRank(bestMs, t.order).rank : null;
            const sssReady = Boolean(meta.sssUnlockedAutoRepeat[t.id]);
            const effectiveHp = getBossTotalHp(t.id, meta);
            const dropOdds = getTribulationEffectiveDropOdds(t.id, meta);
            const prevTrib = idx > 0 ? TRIBULATIONS[idx - 1] : null;
            const prevClears = prevTrib ? meta.clearCounts?.[prevTrib.id] ?? 0 : 0;

            return (
              <div
                key={t.id}
                className={`rounded-xl p-3.5 border flex items-center justify-between gap-3 ${
                  isCurrent
                    ? 'bg-[#f43f5e]/12 border-[#f43f5e]/55'
                    : unlocked
                      ? 'bg-[#191d2e] border-[#2e3552]'
                      : 'bg-[#111421] border-white/8 opacity-80'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-[15px] font-black tracking-wide text-[#f4f1ea]">
                      {t.name}
                      {t.id === 'tier_10' && meta.ngPlusCount > 0 ? `+${meta.ngPlusCount}` : ''}
                    </span>
                    <span className="font-mono-num text-xs font-bold text-[#fda4af]">
                      {formatNumber(effectiveHp, settings.numberMode)} HP
                    </span>
                    <span className="font-mono-num text-xs font-semibold text-[#c084fc]">
                      · {t.baseCrystalReward.toLocaleString()}神晶
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="font-mono-num font-bold text-[#f8fafc]">
                      掉落 {t.relicDropCount}件:
                    </span>
                    {dropOdds.map((o) => (
                      <span
                        key={o.tier}
                        className="font-mono-num inline-flex items-baseline gap-0.5"
                      >
                        <span className={o.meta.fontClass}>{o.meta.shortLabel}</span>
                        <span className={o.meta.colorClass}>
                          {o.effectivePct.toFixed(o.effectivePct < 10 ? 1 : 0)}%
                        </span>
                      </span>
                    ))}
                    <span className="text-[#475569]">·</span>
                    <span className="font-mono-num text-[#94a3b8]">已通关 {clearCount} 次</span>
                  </div>
                  <p className="text-xs text-[#cbd5e1]">{t.debuffSummary}</p>
                  <p className="text-xs text-[#94a3b8] leading-snug">
                    {cleared ? '已首通 · ' : '首通：'}
                    <RichLoreText text={t.firstClearSummary} /> · 推荐 {t.recommendedLv}
                  </p>
                  {!unlocked && prevTrib && (
                    <div className="text-xs font-mono-num text-[#fda4af] bg-[#1a1322] border border-[#f43f5e]/30 rounded-lg px-2.5 py-1.5 mt-1">
                      破禁条件：{prevTrib.name.split('：')[0]} {prevClears}/{t.unlockReqPrevClears}次 ·
                      遗物总阶 {totalRelicLevels}/{t.unlockReqRelicLevels}级
                    </div>
                  )}
                  {bestMs !== undefined && (
                    <p className="text-xs font-mono-num font-semibold text-[#fbbf24]">
                      最快 {formatTimeMs(bestMs)} · 评级 {bestRank}
                      {sssReady ? ' · 自动连刷已开' : ''}
                    </p>
                  )}
                </div>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      switchTribulation(t.id);
                      onClose();
                    }}
                    className={`min-h-[46px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#252b44] border-[#475569] text-white hover:bg-[#334155]'
                        : 'bg-[#06b6d4]/22 border-[#22d3ee]/50 text-[#cffafe] hover:bg-[#06b6d4]/35'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isCurrent ? '重开' : '挑战'}</span>
                  </button>
                ) : (
                  <span className="min-h-[46px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#64748b] bg-[#101322] border border-[#2e3552] shrink-0 whitespace-nowrap">
                    <Lock className="w-3.5 h-3.5" />
                    <span>未破禁</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function computeDpsSnapshot(
  slotIndex: number,
  targetMercs: MercenarySlotState[],
  run: RunState,
  meta: MetaState
): { slotDps: Decimal; teamDps: Decimal } {
  const heroStats = getHeroStats(run, targetMercs, meta);
  const globalMult = getGlobalMult(run, targetMercs, meta);
  const cloneRateNow =
    run.skills.sk_clone.activeRemaining > 0
      ? getSkillEffectiveValues('sk_clone', run.skills.sk_clone.level, targetMercs, meta)
          .effectValue
      : 0;
  const heroEstDps = heroStats.expectedHeroClick.mul(
    heroStats.puppetRate * heroStats.puppetOverflowMult + cloneRateNow
  );
  const poisonEstDps = getPoisonTickExpectedDamage(
    targetMercs,
    run,
    meta,
    heroStats.heroBasePower,
    heroStats.rawHeroClick,
    globalMult
  ).expectedPoison;

  let slotDps = new Decimal(0);
  let teamMercsDps = new Decimal(0);
  for (let i = 0; i < targetMercs.length; i++) {
    const m = targetMercs[i];
    if (!m?.unlocked || m.level <= 0) continue;
    const est = getMercenaryComputedStats(
      i,
      targetMercs,
      run,
      meta,
      heroStats.heroBasePower,
      heroStats.rawHeroClick,
      globalMult
    ).dpsEstimate;
    teamMercsDps = teamMercsDps.add(est);
    if (i === slotIndex) slotDps = est;
  }

  return {
    slotDps,
    teamDps: heroEstDps.add(poisonEstDps).add(teamMercsDps),
  };
}

function formatDpsDeltaBadge(before: Decimal, after: Decimal): {
  text: string;
  cls: string;
} {
  if (before.lte(0)) {
    return after.gt(0)
      ? { text: '新增战力', cls: 'text-[#34d399]' }
      : { text: '无变化', cls: 'text-[#94a3b8]' };
  }
  const ratio = after.div(before).sub(1).toNumber();
  if (!Number.isFinite(ratio)) {
    return after.gte(before)
      ? { text: '大幅提升 ↑', cls: 'text-[#34d399]' }
      : { text: '大幅降低 ↓', cls: 'text-[#fb7185]' };
  }
  const pct = ratio * 100;
  if (Math.abs(pct) < 0.05) {
    return { text: '机制/辅助调整', cls: 'text-[#7dd3fc]' };
  }
  if (pct > 0) {
    return { text: `+${pct.toFixed(1)}% ↑`, cls: 'text-[#34d399]' };
  }
  return { text: `${pct.toFixed(1)}% ↓`, cls: 'text-[#fb7185]' };
}

export function MercForgeModal({
  slotIndex,
  onClose,
}: {
  slotIndex: number | null;
  onClose: () => void;
}) {
  const {
    run,
    mercs,
    meta,
    settings,
    toggleAffixLock,
    rerollMercSingleSlot,
    rerollMercBatchSlots,
    confirmPendingLevelAffixes,
    rerollMercInnate,
    confirmPendingInnateAffix,
  } = useGameStore();

  if (slotIndex === null) return null;
  const slot = mercs[slotIndex];
  if (!slot || !slot.unlocked) return null;

  const crystals = toDecimal(meta.divineCrystals);
  const heroStats = getHeroStats(run, mercs, meta);
  const globalMult = getGlobalMult(run, mercs, meta);
  const computed = getMercenaryComputedStats(
    slotIndex,
    mercs,
    run,
    meta,
    heroStats.heroBasePower,
    heroStats.rawHeroClick,
    globalMult
  );
  const arch = ARCHETYPES[slot.archetype];
  const effLv = getEffectiveLevel(slot);
  const s5 = isSlot5Active(mercs);
  const hasInnateBoost = slot.innateAffix === 'sp_affix_boost';
  const firstAffixRelicLv = getRelicTotalLv(meta, 'rel_m_first_affix');

  const innateCfg =
    INNATE_AFFIXES[slot.innateAffix] ?? INNATE_AFFIXES[arch.recommendedInnate];
  const pendingInnateCfg = slot.pendingInnateAffix
    ? INNATE_AFFIXES[slot.pendingInnateAffix] ?? null
    : null;
  const canRerollInnate =
    meta.unlockedInnateReroll && crystals.gte(5) && slot.pendingInnateAffix === null;

  // DPS Before/After snapshots for both Level Affixes & Innate reroll
  const currentDps = computeDpsSnapshot(slotIndex, mercs, run, meta);

  let levelDpsAfter: { slotDps: Decimal; teamDps: Decimal } | null = null;
  if (slot.pendingLevelAffixes) {
    const candidateMercs = mercs.map((m, i) =>
      i === slotIndex ? { ...m, levelAffixes: slot.pendingLevelAffixes!.candidates } : m
    );
    levelDpsAfter = computeDpsSnapshot(slotIndex, candidateMercs, run, meta);
  }

  let innateDpsAfter: { slotDps: Decimal; teamDps: Decimal } | null = null;
  if (slot.pendingInnateAffix) {
    const candidateMercs = mercs.map((m, i) =>
      i === slotIndex ? { ...m, innateAffix: slot.pendingInnateAffix! } : m
    );
    innateDpsAfter = computeDpsSnapshot(slotIndex, candidateMercs, run, meta);
  }

  let unlockedUnlockedCount = 0;
  for (let i = 0; i < slot.unlockedLevelSlots; i++) {
    if (!slot.lockedLevelSlots[i]) unlockedUnlockedCount++;
  }
  const canBatchReroll =
    unlockedUnlockedCount > 0 &&
    meta.affixStones >= unlockedUnlockedCount &&
    slot.pendingLevelAffixes === null;
  const pityPct = Math.min(100, (meta.rerollPity / 10) * 100);

  const mercTheme = MERC_TYPOGRAPHY[slot.archetype];
  const pendingIndicesSet = new Set(slot.pendingLevelAffixes?.indices ?? []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/78 backdrop-blur-sm p-0 sm:p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forge-modal-title"
    >
      <div className="w-full max-w-[500px] max-h-[92dvh] bg-[#151827] border border-[#2e3552] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden pb-safe">
        {/* Header */}
        <div
          className="shrink-0 px-4 py-3 border-b border-[#2e3552] flex items-center justify-between gap-2"
          style={{ backgroundImage: mercTheme.radialBgStyle }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ArchetypeIcon archetype={slot.archetype} className="w-7 h-7" />
            <div className="min-w-0">
              <h2
                id="forge-modal-title"
                className="font-display text-base font-black text-[#f4f1ea] truncate flex items-center gap-1.5"
              >
                <span className="text-xs font-mono-num text-[#94a3b8] font-semibold">
                  {slotIndex + 1}号位
                </span>
                <span className={mercTheme.nameClass}>{arch.name}</span>
                <span className={`font-mono-num text-xs font-bold ${mercTheme.levelClass}`}>
                  Lv.{slot.level}
                  {effLv > slot.level ? ` (${effLv})` : ''}
                </span>
              </h2>
              <p className="font-mono-num text-xs text-[#94a3b8] mt-0.5">
                <span className={mercTheme.roleClass}>{arch.roleTag}</span> · 间隔{' '}
                {computed.interval.toFixed(2)}s
                {computed.overflowSpdMult > 1
                  ? ` (25/s转攻×${computed.overflowSpdMult.toFixed(2)})`
                  : ''}{' '}
                · DPS{' '}
                <span className="text-[#e2e8f0] font-semibold">
                  {formatNumber(computed.dpsEstimate, settings.numberMode, true)}/s
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-3">
          {/* Fixed Dual Talents Summary */}
          <div className="rounded-lg bg-[#101322] border border-[#2e3552] p-3 text-xs space-y-1.5 leading-relaxed">
            <div className="text-[#cbd5e1]">
              <span className="font-display font-bold text-[#7dd3fc]">
                天赋① {arch.talent1Name}：
              </span>
              <RichLoreText text={arch.talent1Desc} />
            </div>
            <div className="text-[#cbd5e1]">
              <span className="font-display font-bold text-[#7dd3fc]">
                天赋② {arch.talent2Name}：
              </span>
              <RichLoreText text={arch.talent2Desc} />
            </div>
          </div>

          {/* Top Section: ★ Innate Slot + Prominent Before/After Diff */}
          <div className="rounded-lg border border-[#fbbf24]/60 bg-[#78350f]/15 p-3 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[#fde68a]">
                  先天本命神通（1级常驻生效 · 永久保留）
                </div>
                {!pendingInnateCfg && (
                  <>
                    <div className="text-xs font-bold text-[#fbbf24] mt-0.5">{innateCfg.name}</div>
                    <p className="text-[11px] text-[#f1f5f9] mt-0.5 leading-snug">
                      {innateCfg.description}
                    </p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => rerollMercInnate(slotIndex)}
                disabled={!canRerollInnate}
                className={`min-h-[42px] px-3 py-2 rounded-lg text-xs font-bold border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                  canRerollInnate
                    ? 'bg-[#a855f7]/28 border-[#c084fc]/65 text-[#faf5ff] hover:bg-[#a855f7]/40'
                    : 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {!meta.unlockedInnateReroll ? '劫2解锁重铸' : '神晶重铸 (5晶)'}
              </button>
            </div>

            {pendingInnateCfg && innateDpsAfter && (
              <div className="rounded-xl bg-[#0d101b] border border-[#fbbf24]/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-[#fef08a]">
                    本命神通更替对比
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => confirmPendingInnateAffix(slotIndex, true)}
                      className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#10b981]/30 border border-[#34d399]/70 text-[#ecfdf5] hover:bg-[#10b981]/45 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>确认替换</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmPendingInnateAffix(slotIndex, false)}
                      className="min-h-[40px] inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e2338] border border-[#384166] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>保留原样</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="rounded border border-white/10 bg-[#141828]/80 px-2.5 py-1.5">
                    <div className="text-[10px] font-semibold text-[#94a3b8]">
                      原常驻：{innateCfg.name}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-snug">
                      {innateCfg.description}
                    </p>
                  </div>
                  <div className="flex justify-center text-[#fbbf24]">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                  <div className="rounded border border-[#fbbf24]/65 bg-[#78350f]/25 px-2.5 py-1.5">
                    <div className="text-[10.5px] font-bold text-[#fef08a]">
                      新重铸：{pendingInnateCfg.name}
                    </div>
                    <p className="text-[11px] text-[#fffbeb] mt-0.5 leading-snug">
                      {pendingInnateCfg.description}
                    </p>
                  </div>
                </div>

                {(() => {
                  const slotDelta = formatDpsDeltaBadge(currentDps.slotDps, innateDpsAfter.slotDps);
                  const teamDelta = formatDpsDeltaBadge(currentDps.teamDps, innateDpsAfter.teamDps);
                  return (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[10.5px] font-mono-num">
                      <div>
                        <span className="text-[#94a3b8] block text-[9.5px]">本位秒伤变化</span>
                        <span className="text-[#e2e8f0]">
                          {formatNumber(currentDps.slotDps, settings.numberMode, true)}
                        </span>
                        <span className="text-[#64748b] mx-1">→</span>
                        <span className={`font-bold ${slotDelta.cls}`}>
                          {formatNumber(innateDpsAfter.slotDps, settings.numberMode, true)} ({slotDelta.text})
                        </span>
                      </div>
                      <div>
                        <span className="text-[#94a3b8] block text-[9.5px]">全队秒伤变化</span>
                        <span className="text-[#e2e8f0]">
                          {formatNumber(currentDps.teamDps, settings.numberMode, true)}
                        </span>
                        <span className="text-[#64748b] mx-1">→</span>
                        <span className={`font-bold ${teamDelta.cls}`}>
                          {formatNumber(innateDpsAfter.teamDps, settings.numberMode, true)} ({teamDelta.text})
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Middle Section: 10 Level Affix Slots (Lv.10 ~ Lv.1000) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
              <span>10 重等级词缀槽（达对应等级激活并自身伤害 ×2）</span>
              {s5 && <span className="text-[#fb7185]">古神嗣词缀 ×1.5</span>}
            </div>

            {LEVEL_SLOT_THRESHOLDS.map((reqLv, sIdx) => {
              const permanentlyOpen = sIdx < slot.unlockedLevelSlots;
              const activeNow = effLv >= reqLv;
              const inst = slot.levelAffixes[sIdx];
              const isLocked = slot.lockedLevelSlots[sIdx];

              if (!permanentlyOpen) {
                return (
                  <div
                    key={sIdx}
                    className="rounded-md border border-dashed border-[#2e3552] bg-[#101322] px-2.5 py-1.5 flex items-center justify-between text-[11px] text-[#64748b]"
                  >
                    <span>
                      槽位 {sIdx + 1}（{LEVEL_SLOT_NAMES[sIdx]}）
                    </span>
                    <span className="font-mono-num">
                      有效 Lv.{reqLv} 永久开启{sIdx === 9 ? ' +50神晶' : ''}
                    </span>
                  </div>
                );
              }

              // Inline Prominent Before -> After Comparison if this slot has a pending candidate!
              if (pendingIndicesSet.has(sIdx) && slot.pendingLevelAffixes) {
                const newInst = slot.pendingLevelAffixes.candidates[sIdx];
                if (newInst) {
                  const oldMeta = inst ? AFFIX_TIER_META[inst.tier] : null;
                  const newMeta = AFFIX_TIER_META[newInst.tier];
                  const oldCfg = inst ? AFFIXES[inst.id] : null;
                  const newCfg = AFFIXES[newInst.id];
                  const oldTierRank = inst ? AFFIX_TIER_ORDER.indexOf(inst.tier) : -1;
                  const newTierRank = AFFIX_TIER_ORDER.indexOf(newInst.tier);
                  const tierShift =
                    !inst || newTierRank > oldTierRank
                      ? { label: '品质提升 ↑', cls: 'text-[#34d399]' }
                      : newTierRank < oldTierRank
                        ? { label: '品质降低 ↓', cls: 'text-[#fb7185]' }
                        : { label: '同阶更替', cls: 'text-[#7dd3fc]' };

                  const newEffVal = getAffixEffectiveValue(
                    newInst,
                    sIdx,
                    s5,
                    hasInnateBoost,
                    firstAffixRelicLv
                  );

                  return (
                    <div
                      key={sIdx}
                      className="rounded-lg border border-[#fbbf24]/75 bg-[#121626] p-2.5 space-y-1.5 shadow-[0_0_18px_rgba(251,191,36,0.12)]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-num text-[10px] px-1.5 py-0.5 rounded bg-[#181d31] text-[#7dd3fc]">
                            Lv.{reqLv}
                          </span>
                          <span className="font-semibold text-[#fef08a]">洗练对比中</span>
                        </div>
                        <span className={`font-semibold text-[10.5px] ${tierShift.cls}`}>
                          {tierShift.label}
                        </span>
                      </div>

                      {/* Before Box */}
                      <div className="rounded bg-[#0d101b] border border-white/8 px-2 py-1.5 opacity-80">
                        <div className="flex items-center justify-between gap-1 text-[10.5px]">
                          <span className={`font-semibold ${oldMeta?.colorClass ?? 'text-[#94a3b8]'}`}>
                            原：{oldMeta ? `[${oldMeta.label}] ` : ''}{oldCfg?.name ?? '空槽位'}
                          </span>
                          {inst && oldCfg && (
                            <span className="font-mono-num text-[10px] text-[#94a3b8]">
                              {formatAffixShortBadgeValue(
                                inst.id,
                                getAffixEffectiveValue(
                                  inst,
                                  sIdx,
                                  s5,
                                  hasInnateBoost,
                                  firstAffixRelicLv
                                )
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-[#94a3b8] mt-0.5 leading-snug whitespace-normal break-words">
                          {inst
                            ? formatAffixDescription(
                                inst,
                                sIdx,
                                s5,
                                hasInnateBoost,
                                firstAffixRelicLv
                              )
                            : '此前为空槽位'}
                        </p>
                      </div>

                      {/* After Box */}
                      <div className={`rounded px-2 py-1.5 border ${newMeta?.borderClass ?? 'border-[#38bdf8]/50'} ${newMeta?.badgeBgClass ?? 'bg-[#0f172a]'}`}>
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className={`font-bold ${newMeta?.colorClass ?? 'text-white'}`}>
                            新：{newMeta ? `[${newMeta.label}] ` : ''}{newCfg?.name ?? '未知词缀'}
                          </span>
                          {newCfg && (
                            <span className={`font-mono-num text-[10.5px] font-bold ${newMeta?.colorClass ?? 'text-white'}`}>
                              {formatAffixShortBadgeValue(newInst.id, newEffVal)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#f8fafc] mt-0.5 leading-snug whitespace-normal break-words">
                          {formatAffixDescription(
                            newInst,
                            sIdx,
                            s5,
                            hasInnateBoost,
                            firstAffixRelicLv
                          )}
                        </p>
                      </div>
                    </div>
                  );
                }
              }

              const tMeta = inst ? AFFIX_TIER_META[inst.tier] : null;
              const cfg = inst ? AFFIXES[inst.id] : null;
              const canSingleRoll =
                slot.pendingLevelAffixes === null && meta.affixStones >= 2;

              return (
                <div
                  key={sIdx}
                  className={`rounded-xl border p-3 bg-[#101322] flex items-center justify-between gap-2.5 ${
                    tMeta ? tMeta.borderClass : 'border-[#2e3552]'
                  } ${!activeNow ? 'opacity-70' : ''}`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs flex-wrap">
                      <span className="font-mono-num text-[11px] px-1.5 py-0.5 rounded bg-[#181d31] text-[#7dd3fc]">
                        Lv.{reqLv}
                      </span>
                      {cfg && tMeta ? (
                        <span className={`font-bold ${tMeta.colorClass}`}>
                          [{tMeta.label}] {cfg.name}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8] font-medium">空槽位</span>
                      )}
                      {!activeNow && (
                        <span className="text-[11px] text-[#fbbf24]">(本局未达级)</span>
                      )}
                      {sIdx <= 3 && firstAffixRelicLv > 0 && (
                        <span className="text-[11px] text-[#fbbf24]">· 古神瞳</span>
                      )}
                    </div>
                    <p className="text-xs text-[#cbd5e1] leading-snug whitespace-normal">
                      {inst
                        ? formatAffixDescription(
                            inst,
                            sIdx,
                            s5,
                            hasInnateBoost,
                            firstAffixRelicLv
                          )
                        : '点击右侧单槽洗练或下方批量洗练生成词缀'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleAffixLock(slotIndex, sIdx)}
                      className={`min-w-[42px] min-h-[42px] flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                        isLocked
                          ? 'text-[#fbbf24] bg-[#f59e0b]/18 border-[#fbbf24]/50'
                          : 'text-[#94a3b8] bg-[#191d2e] border-[#2e3552] hover:text-white'
                      }`}
                      title={
                        meta.unlockedAffixLock
                          ? isLocked
                            ? '点击解锁'
                            : '锁定（批量洗练时保留）'
                          : '通关劫数二解锁锁定功能'
                      }
                    >
                      {isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <LockOpen className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => rerollMercSingleSlot(slotIndex, sIdx)}
                      disabled={!canSingleRoll}
                      className={`min-h-[42px] px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        canSingleRoll
                          ? 'bg-[#1e2338] border-[#38bdf8]/45 text-[#e0f2fe] hover:bg-[#06b6d4]/25'
                          : 'bg-[#161929] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                      }`}
                    >
                      单洗(2石)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Bottom Operation Bar: Pity, Batch Reroll, & Clear Untruncated Pending Summary */}
        <div className="shrink-0 px-3.5 py-3 bg-[#101322] border-t border-[#2e3552] space-y-2">
          {slot.pendingLevelAffixes && levelDpsAfter ? (
            <div className="rounded-xl border border-[#fbbf24]/70 bg-[#171b2d] p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[13px] font-bold text-[#fef08a] inline-flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  <span>待确认更替（{slot.pendingLevelAffixes.indices.length} 槽）</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => confirmPendingLevelAffixes(slotIndex, true)}
                    className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#10b981]/30 border border-[#34d399]/75 text-[#ecfdf5] hover:bg-[#10b981]/45 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>确认替换</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmPendingLevelAffixes(slotIndex, false)}
                    className="min-h-[42px] inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1e2338] border border-[#384166] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>保留原样</span>
                  </button>
                </div>
              </div>

              {/* Net Merc & Team DPS Impact Comparison */}
              {(() => {
                const slotDelta = formatDpsDeltaBadge(currentDps.slotDps, levelDpsAfter.slotDps);
                const teamDelta = formatDpsDeltaBadge(currentDps.teamDps, levelDpsAfter.teamDps);
                return (
                  <div className="grid grid-cols-2 gap-2 rounded-md bg-[#0e111d] border border-[#2e3552] px-2.5 py-1.5 text-[10.5px] font-mono-num">
                    <div>
                      <span className="text-[#94a3b8] block text-[9.5px]">本位秒伤对比</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[#94a3b8]">
                          {formatNumber(currentDps.slotDps, settings.numberMode, true)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#64748b] shrink-0" />
                        <span className={`font-bold ${slotDelta.cls}`}>
                          {formatNumber(levelDpsAfter.slotDps, settings.numberMode, true)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${slotDelta.cls}`}>
                        {slotDelta.text}
                      </span>
                    </div>
                    <div className="border-l border-white/10 pl-2">
                      <span className="text-[#94a3b8] block text-[9.5px]">全队总秒伤对比</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[#94a3b8]">
                          {formatNumber(currentDps.teamDps, settings.numberMode, true)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#64748b] shrink-0" />
                        <span className={`font-bold ${teamDelta.cls}`}>
                          {formatNumber(levelDpsAfter.teamDps, settings.numberMode, true)}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold ${teamDelta.cls}`}>
                        {teamDelta.text}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Full Untruncated Change Summary */}
              <div className="max-h-36 overflow-y-auto custom-scroll space-y-1.5">
                {slot.pendingLevelAffixes.indices.map((sIdx) => {
                  const oldInst = slot.levelAffixes[sIdx];
                  const newInst = slot.pendingLevelAffixes!.candidates[sIdx];
                  if (!newInst) return null;
                  const oldMeta = oldInst ? AFFIX_TIER_META[oldInst.tier] : null;
                  const newMeta = AFFIX_TIER_META[newInst.tier];
                  const oldCfg = oldInst ? AFFIXES[oldInst.id] : null;
                  const newCfg = AFFIXES[newInst.id];
                  if (!newMeta || !newCfg) return null;

                  return (
                    <div
                      key={sIdx}
                      className="text-[10.5px] bg-[#0e111d] border border-[#2e3552] rounded p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className={oldMeta?.colorClass ?? 'text-[#94a3b8]'}>
                          Lv.{LEVEL_SLOT_THRESHOLDS[sIdx]} 原：{oldMeta ? `[${oldMeta.label}] ` : ''}{oldCfg?.name ?? '空'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#fbbf24] shrink-0" />
                        <span className={`font-bold ${newMeta.colorClass}`}>
                          新：[{newMeta.label}] {newCfg.name}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-[#f1f5f9] leading-snug whitespace-normal break-words">
                        <span className="text-[#7dd3fc] font-semibold">新效果：</span>
                        {formatAffixDescription(
                          newInst,
                          sIdx,
                          s5,
                          hasInnateBoost,
                          firstAffixRelicLv
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#cbd5e1]">气运保底进度（满 10 次必出极品/仙品）</span>
                <span className="font-mono-num text-[#fbbf24]">{meta.rerollPity} / 10</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#090b12] border border-[#2e3552] overflow-hidden">
                <div
                  className="h-full bg-[#fbbf24] transition-all"
                  style={{ width: `${pityPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                <span className="text-[#94a3b8]">
                  词缀石 <span className="font-mono-num text-[#fbbf24]">{meta.affixStones}</span> ·
                  神晶{' '}
                  <span className="font-mono-num text-[#c084fc]">
                    {formatNumber(meta.divineCrystals, settings.numberMode)}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => rerollMercBatchSlots(slotIndex)}
                  disabled={!canBatchReroll}
                  className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-bold border transition-colors cursor-pointer shrink-0 ${
                    canBatchReroll
                      ? 'bg-[#f59e0b]/22 border-[#fbbf24]/65 text-[#fef08a] hover:bg-[#f59e0b]/35'
                      : 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <Dices className="w-4 h-4" />
                  <span>
                    {slot.unlockedLevelSlots === 0
                      ? 'Lv.10 开启第1槽后洗练'
                      : unlockedUnlockedCount === 0
                        ? '已解锁槽位全锁'
                        : `批量洗练未锁槽 (${unlockedUnlockedCount}石)`}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
