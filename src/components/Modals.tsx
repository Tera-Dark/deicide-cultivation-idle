import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Dices,
  Lock,
  LockOpen,
  Play,
  RefreshCw,
  Repeat,
  Sparkles,
  Trophy,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  AFFIXES,
  AFFIX_TIER_META,
  INNATE_AFFIXES,
  formatAffixDescription,
} from '../config/affixes';
import { ARCHETYPES } from '../config/archetypes';
import { TRIBULATIONS } from '../config/bosses';
import { LEVEL_SLOT_NAMES, LEVEL_SLOT_THRESHOLDS } from '../config/constants';
import {
  evaluateSpeedrunRank,
  getBossTotalHp,
  getEffectiveLevel,
  getGlobalMult,
  getHeroStats,
  getMercenaryComputedStats,
  isSlot5Active,
} from '../core/damageCalc';
import { formatNumber, formatTimeMs, toDecimal } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import type { TutorialNodeId } from '../types/game';
import { ArchetypeIcon } from './ArchetypeIcon';
import { PhaseBreakSigilIcon } from './CultivationIcons';

const INTRO_SLIDES = [
  {
    title: '【伪善之天】',
    body: '凡人皆言，吐纳灵气、苦修飞升即可得道长生。直到你修成天眼，刺破云端，看清了苍穹之上的恐怖真相——',
  },
  {
    title: '【天道古神】',
    body: '所谓的“天道”，竟是一尊盘踞在星海深处、由高维法则构成的【不可名状古神】！众生万年苦修化作的灵气，皆是祂沉睡中的食粮。',
  },
  {
    title: '【亵渎道胎 · 弑神夺果】',
    body: '今日，你自斩凡根，觉醒【弑神道胎】！直面古神本源，你的每一次叩击都将强行剥离祂的【灵石】并永久化为自身修为！召集五大本命护法，轰碎十重躯壳，窃取古神道果！',
  },
];

const TUTORIAL_CONTENT: Record<TutorialNodeId, { title: string; body: string }> = {
  tut_phase1: {
    title: '躯壳初裂 · 傀儡认主',
    body: '你轰碎了古神最外层的腐朽外皮，获赠【80 灵石 & 2 词缀石】！主角面板已解锁【机关傀儡】，仅需 60 灵石即可开启全自动点击！',
  },
  tut_merc1: {
    title: '护法降临 · 青冥剑侍参上',
    body: '你解救出第一位固定本命护法【1号位：青冥剑侍】（自带连斩与御剑双天赋，以及 1 个神晶本命词缀槽）！每位护法从 10 级升至 1000 级可逐层点亮 10 个专属词缀槽，且每次到达词缀槽节点自身伤害直接 ×4 倍！',
  },
  tut_affix: {
    title: '道纹觉醒 · 十槽词缀开启',
    body: '护法已达 10 级，成功点亮第 1 重等级词缀槽！点击护法卡片打开【道纹洗练面板】，消耗【词缀石】即可从 48 种三六九等词缀中洗练神技（10 次必出极品/仙品，支持先看后换，重开 100% 永久保留）！',
  },
  tut_tier1_win: {
    title: '弑神功成 · 遗物圣殿开启',
    body: '恭喜轰杀古神第一尊分身，获得 15 颗【神晶】！建议先去【五人佣兵】面板花 10 神晶解锁 2 号位【深渊触母】开启叠毒引爆流，再去【古神遗物】面板抽取永久遗物！',
  },
};

export function IntroModal() {
  const { meta, completeIntro } = useGameStore();
  const [step, setStep] = useState(0);

  if (meta.hasSeenIntro) return null;

  const slide = INTRO_SLIDES[step];
  const isLast = step === INTRO_SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <div className="w-full max-w-[420px] bg-[#151827] border border-[#38bdf8]/45 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono-num text-[#7dd3fc]">
            <PhaseBreakSigilIcon className="w-3.5 h-3.5" />
            <span>序章 {step + 1} / 3</span>
          </div>
          <button
            type="button"
            onClick={completeIntro}
            className="text-[11px] text-[#94a3b8] hover:text-white px-2 py-0.5 rounded border border-white/10 cursor-pointer"
          >
            跳过
          </button>
        </div>

        <div className="py-2 space-y-3">
          <h2
            id="intro-title"
            className="font-display text-lg font-bold text-[#f4f1ea] tracking-wide"
          >
            {slide.title}
          </h2>
          <p className="text-xs sm:text-[13px] text-[#cbd5e1] leading-relaxed">{slide.body}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            {INTRO_SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-5 bg-[#38bdf8]' : 'w-1.5 bg-[#2e3552]'
                }`}
              />
            ))}
          </div>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#06b6d4]/25 border border-[#22d3ee]/60 text-[#ecfeff] hover:bg-[#06b6d4]/40 transition-colors cursor-pointer"
            >
              <span>继续</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={completeIntro}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-[#e11d48] hover:bg-[#be123c] text-white transition-colors cursor-pointer"
            >
              <span>燃血叩击 · 逆伐天道</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function UnlockTutorialModal() {
  const { activeTutorial, dismissTutorial } = useGameStore();
  if (!activeTutorial) return null;

  const content = TUTORIAL_CONTENT[activeTutorial];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tut-modal-title"
    >
      <div className="w-full max-w-[400px] bg-[#151827] border border-[#fbbf24]/55 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-[#fbbf24]">
          <Sparkles className="w-4 h-4 shrink-0" />
          <h2 id="tut-modal-title" className="font-display text-base font-bold text-[#f4f1ea]">
            {content.title}
          </h2>
        </div>

        <p className="text-xs text-[#cbd5e1] leading-relaxed">{content.body}</p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={dismissTutorial}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-[#06b6d4]/25 border border-[#22d3ee]/60 text-[#ecfeff] hover:bg-[#06b6d4]/40 transition-colors cursor-pointer"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
    >
      <div className="w-full max-w-[440px] max-h-[85dvh] bg-[#151827] border border-[#2e3552] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-3 border-b border-[#2e3552] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#38bdf8]" />
            <h2 id="guide-modal-title" className="font-display text-sm font-bold text-[#f4f1ea]">
              五大本命护法 · 终局协同指南
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-2.5 text-xs">
          <div className="bg-[#101322] border border-[#2e3552] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#22d3ee]">
              <ArchetypeIcon archetype="merc_sword" className="w-4 h-4" />
              <ArchetypeIcon archetype="merc_tentacle" className="w-4 h-4" />
              <span>1. 高频毒爆流（1号青冥剑侍 + 2号深渊触母）</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              给剑侍洗出【万毒催熟】与【残影连击】/★【万剑归宗】，利用 0.4 秒超高频多段斩击疯狂引爆触母叠加的永久腐蚀毒（触母本命推荐 ★【万毒之源】指数叠毒）！
            </p>
          </div>

          <div className="bg-[#101322] border border-[#2e3552] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#fbbf24]">
              <ArchetypeIcon archetype="merc_sword" className="w-4 h-4" />
              <ArchetypeIcon archetype="merc_cannon" className="w-4 h-4" />
              <span>2. 无限核弹流（1号青冥剑侍 + 3号雷火机神）</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              机神自带“剑侍与主角每攻 15 次缩减 1 秒冷却”，给剑侍洗【雷火装填】、给机神洗【伴生剑意】与本命神通 ★【歼星连射】，让 5 秒重炮化为每秒轰炸的毁灭加特林！
            </p>
          </div>

          <div className="bg-[#101322] border border-[#2e3552] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-[#fb7185]">
              <ArchetypeIcon archetype="merc_array" className="w-4 h-4" />
              <ArchetypeIcon archetype="merc_god" className="w-4 h-4" />
              <span>3. 千级登神流（4号天机阵尊 + 5号混沌古神嗣）</span>
            </div>
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
              全员洗出【缩资减耗】与本命神通 ★【天道酬勤】，快速冲上 Lv.1000 激活全部 10 槽（每次里程碑伤害 ×4），触发 5 号位“每 100 总有效级复利 ×1.5”与 ★【千级共鸣】，轰穿 1e120 终焉古神！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VictoryModal() {
  const {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-title"
    >
      <div className="w-full max-w-[430px] bg-[#151827] border border-[#fbbf24]/50 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#fbbf24]">
              <Trophy className="w-4 h-4" />
              <span>弑神胜利结算</span>
            </div>
            <h2 id="victory-title" className="font-display text-lg font-bold text-[#f4f1ea] mt-1">
              {victorySummary.tribulationName}
            </h2>
          </div>
          <button
            type="button"
            onClick={clearVictorySummary}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[#101322] border border-[#2e3552] rounded-lg p-3.5">
          <div>
            <span className="text-[11px] text-[#94a3b8] block">本局耗时</span>
            <span className="font-mono-num text-base font-bold text-[#f4f1ea]">
              {formatTimeMs(victorySummary.clearTimeMs)}
            </span>
            {victorySummary.isNewRecord && (
              <span className="block text-[11px] text-[#34d399] mt-0.5">刷新最快纪录</span>
            )}
          </div>
          <div>
            <span className="text-[11px] text-[#94a3b8] block">竞速评级</span>
            <span className="font-mono-num text-base font-bold text-[#fbbf24]">
              {victorySummary.rank} 级 (×{victorySummary.rankCrystalMult})
            </span>
            <span className="block text-xs font-mono-num text-[#c084fc] mt-0.5">
              +{formatNumber(victorySummary.crystalsEarned, settings.numberMode)} 神晶
            </span>
          </div>
        </div>

        {(victorySummary.firstClearNote ||
          victorySummary.unlockedSssAutoRepeat ||
          victorySummary.grantedRelicUpgrades.length > 0 ||
          victorySummary.mythicDropped) && (
          <div className="space-y-2 text-xs bg-[#101322] border border-[#2e3552] rounded-lg p-3 max-h-40 overflow-y-auto custom-scroll">
            {victorySummary.firstClearNote && (
              <div className="text-[#fde68a]">首通解锁：{victorySummary.firstClearNote}</div>
            )}
            {victorySummary.unlockedSssAutoRepeat && (
              <div className="text-[#6ee7b7]">
                SSS 瞬杀降维：已永久解锁本劫【自动连续挑战】
              </div>
            )}
            {victorySummary.mythicDropped && (
              <div className="text-[#fbbf24] font-semibold">
                天降神迹：获得【神阶·古神遗物】{victorySummary.mythicDropped.name}（
                {victorySummary.mythicDropped.isNew
                  ? '新解锁 Lv.1'
                  : `升至 Lv.${victorySummary.mythicDropped.newLevel}`}
                ）
              </div>
            )}
            {victorySummary.grantedRelicUpgrades.length > 0 && (
              <div className="text-[#e2e8f0]">
                <span className="text-[#94a3b8]">随机遗物升级：</span>
                {victorySummary.grantedRelicUpgrades
                  .map((g) => `${g.name} +${g.levelsAdded} (Lv.${g.newLevel})`)
                  .join(' · ')}
              </div>
            )}
          </div>
        )}

        {autoRepeatCountdown !== null && (
          <div className="flex items-center justify-between gap-2 bg-[#10b981]/18 border border-[#34d399]/45 rounded-md px-3 py-2 text-xs text-[#a7f3d0]">
            <span className="inline-flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5" />
              自动连刷中：{autoRepeatCountdown.toFixed(1)}s 后重开…
            </span>
            <button
              type="button"
              onClick={toggleAutoRepeat}
              className="underline hover:text-white cursor-pointer"
            >
              暂停
            </button>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => switchTribulation(victorySummary.tribulationId)}
            className="px-3.5 py-2 rounded-md text-xs font-medium border border-[#384166] bg-[#1e2338] text-[#f1f5f9] hover:bg-[#272e49] transition-colors cursor-pointer"
          >
            再刷一次本劫
          </button>
          {nextTrib && (
            <button
              type="button"
              onClick={() => switchTribulation(nextTrib.id)}
              className="px-3.5 py-2 rounded-md text-xs font-medium bg-[#e11d48] hover:bg-[#be123c] text-white transition-colors cursor-pointer"
            >
              前往下一劫：{nextTrib.name.split('：')[0]}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-title"
    >
      <div className="w-full max-w-[400px] bg-[#151827] border border-[#f43f5e]/45 rounded-xl p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center gap-2 text-[#fda4af]">
          <AlertTriangle className="w-5 h-5" />
          <h2 id="restart-title" className="font-display text-base font-bold text-[#f4f1ea]">
            确认兵解重开本局？
          </h2>
        </div>

        <p className="text-xs text-[#cbd5e1] leading-relaxed">
          重开将重置古神血量、局内灵石、境界、顿悟、神通、傀儡及佣兵局内等级（归为 1 级）。
        </p>
        <p className="text-xs text-[#a7f3d0] bg-[#10b981]/14 border border-[#34d399]/35 rounded-md p-2.5">
          永久传承：词缀石、神晶、已解锁护法、本命神通、十槽道纹词缀及全部遗物等级 100% 保留。
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-xs font-medium border border-[#384166] bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49] transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              restartRun();
              onClose();
            }}
            className="px-4 py-2 rounded-md text-xs font-medium bg-[#e11d48] hover:bg-[#be123c] text-white transition-colors cursor-pointer"
          >
            确认重开
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    settings,
    setNumberMode,
    setSoundEnabled,
    exportSaveString,
    importSaveString,
    hardResetAll,
  } = useGameStore();

  const [saveText, setSaveText] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  const handleExport = () => {
    const str = exportSaveString();
    setSaveText(str);
    setImportError(null);
    navigator.clipboard
      ?.writeText(str)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  };

  const handleImport = () => {
    setImportError(null);
    const res = importSaveString(saveText);
    if (!res.ok) {
      setImportError(res.error ?? '导入失败');
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-[430px] bg-[#151827] border border-[#2e3552] rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-base font-bold text-[#f4f1ea]">
            系统设置与存档
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#2e3552] pb-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-[#f4f1ea] block">大数显示制式</span>
              <span className="text-[11px] text-[#94a3b8]">中式单位 / 科学计数</span>
            </div>
            <div className="flex items-center gap-1 p-1 bg-[#101322] border border-[#2e3552] rounded-md shrink-0">
              <button
                type="button"
                onClick={() => setNumberMode('chinese')}
                className={`px-2.5 py-1 text-[11px] rounded cursor-pointer ${
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
                className={`px-2.5 py-1 text-[11px] rounded cursor-pointer ${
                  settings.numberMode === 'scientific'
                    ? 'bg-[#06b6d4]/25 text-[#67e8f9]'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                科学计数
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-[#f4f1ea] block">合成音效</span>
              <span className="text-[11px] text-[#94a3b8]">攻击、神通与破壳音效</span>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled(!settings.soundEnabled)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[#384166] bg-[#1e2338] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer shrink-0"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#34d399]" />
                  <span>已开启</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>已静音</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#f4f1ea]">Base64 存档导入/导出</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#06b6d4]/22 border border-[#22d3ee]/50 text-[#cffafe] hover:bg-[#06b6d4]/35 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '导出'}</span>
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!saveText.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-[#10b981]/22 border border-[#34d399]/50 text-[#a7f3d0] hover:bg-[#10b981]/35 disabled:opacity-40 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>导入</span>
              </button>
            </div>
          </div>

          <textarea
            value={saveText}
            onChange={(e) => setSaveText(e.target.value)}
            placeholder="导出获取 Base64 存档串，或粘贴后点击导入..."
            rows={3}
            className="w-full rounded-md bg-[#0d101b] border border-[#2e3552] p-2 text-xs font-mono text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
          />
          {importError && <p className="text-xs text-[#fda4af]">{importError}</p>}
        </div>

        <div className="pt-3 border-t border-[#2e3552] flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#94a3b8]">自动保存至本地</span>
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[#fda4af] border border-[#f43f5e]/45 hover:bg-[#f43f5e]/15 cursor-pointer"
            >
              硬重置存档
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 rounded text-xs text-[#94a3b8] hover:text-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  hardResetAll();
                  setConfirmReset(false);
                  onClose();
                }}
                className="px-2.5 py-1 rounded text-xs font-medium bg-[#e11d48] text-white hover:bg-[#be123c] cursor-pointer"
              >
                确认清空
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TribulationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { run, meta, settings, switchTribulation, toggleAutoRepeat } = useGameStore();
  if (!open) return null;

  const currentSssUnlocked = Boolean(meta.sssUnlockedAutoRepeat[run.tribulationId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trib-modal-title"
    >
      <div className="w-full max-w-[440px] max-h-[86dvh] bg-[#151827] border border-[#2e3552] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-3 border-b border-[#2e3552] flex items-center justify-between gap-2">
          <div>
            <h2 id="trib-modal-title" className="font-display text-sm font-bold text-[#f4f1ea]">
              诸天劫数 · 速通与轮回
            </h2>
            <p className="text-[11px] text-[#94a3b8]">
              15秒内 SSS 通关解锁自动连刷 · 轮回 NG+{meta.ngPlusCount}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="shrink-0 px-4 py-2 bg-[#101322] border-b border-white/8 flex items-center justify-between gap-2">
          <span className="text-[11px] text-[#cbd5e1]">当前劫数自动连刷</span>
          <button
            type="button"
            onClick={toggleAutoRepeat}
            disabled={!currentSssUnlocked}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              !currentSssUnlocked
                ? 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                : meta.autoRepeatEnabled
                  ? 'bg-[#10b981]/25 border-[#34d399]/60 text-[#a7f3d0]'
                  : 'bg-[#1e2338] border-[#384166] text-[#e2e8f0] hover:bg-[#272e49]'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>
              {!currentSssUnlocked
                ? '需SSS解锁'
                : meta.autoRepeatEnabled
                  ? '连刷已开启'
                  : '连刷已关闭'}
            </span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3 space-y-2">
          {TRIBULATIONS.map((t) => {
            const unlocked = t.order <= meta.highestUnlockedOrder;
            const isCurrent = t.id === run.tribulationId;
            const cleared = Boolean(meta.clearedTribulations[t.id]);
            const bestMs = meta.bestClearTimesMs[t.id];
            const bestRank =
              bestMs !== undefined ? evaluateSpeedrunRank(bestMs, t.order).rank : null;
            const sssReady = Boolean(meta.sssUnlockedAutoRepeat[t.id]);
            const effectiveHp = getBossTotalHp(t.id, meta);

            return (
              <div
                key={t.id}
                className={`rounded-lg p-2.5 border flex items-center justify-between gap-2.5 ${
                  isCurrent
                    ? 'bg-[#f43f5e]/12 border-[#f43f5e]/55'
                    : unlocked
                      ? 'bg-[#191d2e] border-[#2e3552]'
                      : 'bg-[#111421] border-white/8 opacity-65'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-display text-xs font-bold text-[#f4f1ea]">
                      {t.name}
                      {t.id === 'tier_10' && meta.ngPlusCount > 0 ? `+${meta.ngPlusCount}` : ''}
                    </span>
                    <span className="font-mono-num text-[11px] text-[#fda4af]">
                      {formatNumber(effectiveHp, settings.numberMode)} HP
                    </span>
                    <span className="font-mono-num text-[11px] text-[#c084fc]">
                      · {t.baseCrystalReward.toLocaleString()}神晶
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cbd5e1]">{t.debuffSummary}</p>
                  <p className="text-[10px] text-[#94a3b8]">
                    {cleared ? '已首通 · ' : '首通：'}
                    {t.firstClearSummary} · 推荐 {t.recommendedLv}
                  </p>
                  {bestMs !== undefined && (
                    <p className="text-[10px] font-mono-num text-[#fbbf24]">
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
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#252b44] border-[#475569] text-white hover:bg-[#334155]'
                        : 'bg-[#06b6d4]/22 border-[#22d3ee]/50 text-[#cffafe] hover:bg-[#06b6d4]/35'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>{isCurrent ? '重开' : '挑战'}</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] text-[#64748b] bg-[#101322] border border-[#2e3552] shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>未解</span>
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
  const firstAffixRelicLv = meta.relicLevels.rel_m_first_affix ?? 0;

  const innateCfg = INNATE_AFFIXES[slot.innateAffix];
  const pendingInnateCfg = slot.pendingInnateAffix
    ? INNATE_AFFIXES[slot.pendingInnateAffix]
    : null;
  const canRerollInnate =
    meta.unlockedInnateReroll && crystals.gte(5) && slot.pendingInnateAffix === null;

  let unlockedUnlockedCount = 0;
  for (let i = 0; i < slot.unlockedLevelSlots; i++) {
    if (!slot.lockedLevelSlots[i]) unlockedUnlockedCount++;
  }
  const canBatchReroll =
    unlockedUnlockedCount > 0 &&
    meta.affixStones >= unlockedUnlockedCount &&
    slot.pendingLevelAffixes === null;
  const pityPct = Math.min(100, (meta.rerollPity / 10) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 backdrop-blur-sm p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forge-modal-title"
    >
      <div className="w-full max-w-[445px] max-h-[90dvh] bg-[#151827] border border-[#2e3552] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-[#2e3552] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ArchetypeIcon archetype={slot.archetype} className="w-6 h-6" />
            <div className="min-w-0">
              <h2
                id="forge-modal-title"
                className="font-display text-sm font-bold text-[#f4f1ea] truncate"
              >
                {slotIndex + 1}号位 · {arch.name} Lv.{slot.level}
                {effLv > slot.level ? ` (有效Lv.${effLv})` : ''}
              </h2>
              <p className="font-mono-num text-[11px] text-[#94a3b8]">
                {arch.roleTag} · 间隔 {computed.interval.toFixed(2)}s · DPS{' '}
                {formatNumber(computed.dpsEstimate, settings.numberMode, true)}/s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3.5 space-y-3">
          {/* Fixed Dual Talents Summary */}
          <div className="rounded-lg bg-[#101322] border border-[#2e3552] p-2.5 text-[11px] space-y-1">
            <div className="text-[#cbd5e1]">
              <span className="font-semibold text-[#7dd3fc]">天赋① {arch.talent1Name}：</span>
              {arch.talent1Desc}
            </div>
            <div className="text-[#cbd5e1]">
              <span className="font-semibold text-[#7dd3fc]">天赋② {arch.talent2Name}：</span>
              {arch.talent2Desc}
            </div>
          </div>

          {/* Top Section: ★ Innate Slot (Gold thin border card) */}
          <div className="rounded-lg border border-[#fbbf24]/60 bg-[#78350f]/15 p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[#fde68a]">
                  先天本命神通（1级常驻生效 · 永久保留）
                </div>
                <div className="text-xs font-bold text-[#fbbf24] mt-0.5">{innateCfg.name}</div>
                <p className="text-[11px] text-[#f1f5f9] mt-0.5 leading-snug">
                  {innateCfg.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => rerollMercInnate(slotIndex)}
                disabled={!canRerollInnate}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold border shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                  canRerollInnate
                    ? 'bg-[#a855f7]/28 border-[#c084fc]/65 text-[#faf5ff] hover:bg-[#a855f7]/40'
                    : 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {!meta.unlockedInnateReroll ? '劫2解锁重铸' : '神晶重铸 (5晶)'}
              </button>
            </div>

            {pendingInnateCfg && (
              <div className="rounded-md bg-[#101322] border border-[#fbbf24]/50 p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#fef08a]">
                    新本命神通：{pendingInnateCfg.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => confirmPendingInnateAffix(slotIndex, true)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#10b981]/28 border border-[#34d399]/65 text-[#a7f3d0] hover:bg-[#10b981]/40 cursor-pointer"
                    >
                      替换
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmPendingInnateAffix(slotIndex, false)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#1e2338] border border-[#384166] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
                    >
                      保留原样
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-[#cbd5e1]">{pendingInnateCfg.description}</p>
              </div>
            )}
          </div>

          {/* Middle Section: 10 Level Affix Slots (Lv.10 ~ Lv.1000) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
              <span>10 重等级词缀槽（达对应等级激活并自身伤害 ×4）</span>
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

              const tMeta = inst ? AFFIX_TIER_META[inst.tier] : null;
              const cfg = inst ? AFFIXES[inst.id] : null;
              const canSingleRoll =
                slot.pendingLevelAffixes === null && meta.affixStones >= 2;

              return (
                <div
                  key={sIdx}
                  className={`rounded-md border p-2 bg-[#101322] flex items-center justify-between gap-2 ${
                    tMeta ? tMeta.borderClass : 'border-[#2e3552]'
                  } ${!activeNow ? 'opacity-70' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                      <span className="font-mono-num text-[10px] px-1 rounded bg-[#181d31] text-[#7dd3fc]">
                        Lv.{reqLv}
                      </span>
                      {cfg && tMeta ? (
                        <span className={`font-semibold ${tMeta.colorClass}`}>
                          [{tMeta.label}] {cfg.name}
                        </span>
                      ) : (
                        <span className="text-[#94a3b8] font-medium">空槽位</span>
                      )}
                      {!activeNow && (
                        <span className="text-[10px] text-[#fbbf24]">(本局未达级)</span>
                      )}
                      {sIdx <= 3 && firstAffixRelicLv > 0 && (
                        <span className="text-[10px] text-[#fbbf24]">· 古神瞳</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#cbd5e1] mt-0.5 leading-snug">
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

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleAffixLock(slotIndex, sIdx)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
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
                        <Lock className="w-3 h-3" />
                      ) : (
                        <LockOpen className="w-3 h-3" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => rerollMercSingleSlot(slotIndex, sIdx)}
                      disabled={!canSingleRoll}
                      className={`px-2 py-1 rounded border text-[10px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
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

        {/* Sticky Bottom Operation Bar: Pity, Batch Reroll, & Pending Comparison */}
        <div className="shrink-0 px-3.5 py-2.5 bg-[#101322] border-t border-[#2e3552] space-y-2">
          {slot.pendingLevelAffixes ? (
            <div className="rounded-lg border border-[#fbbf24]/60 bg-[#f59e0b]/12 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#fef08a] inline-flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  洗练对比预览（{slot.pendingLevelAffixes.indices.length} 个槽位）
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => confirmPendingLevelAffixes(slotIndex, true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#10b981]/28 border border-[#34d399]/65 text-[#a7f3d0] hover:bg-[#10b981]/40 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>确认替换</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmPendingLevelAffixes(slotIndex, false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-[#1e2338] border border-[#384166] text-[#e2e8f0] hover:bg-[#272e49] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>保留原样</span>
                  </button>
                </div>
              </div>

              <div className="max-h-28 overflow-y-auto custom-scroll space-y-1">
                {slot.pendingLevelAffixes.indices.map((sIdx) => {
                  const oldInst = slot.levelAffixes[sIdx];
                  const newInst = slot.pendingLevelAffixes!.candidates[sIdx];
                  if (!newInst) return null;
                  const oldMeta = oldInst ? AFFIX_TIER_META[oldInst.tier] : null;
                  const newMeta = AFFIX_TIER_META[newInst.tier];
                  const oldCfg = oldInst ? AFFIXES[oldInst.id] : null;
                  const newCfg = AFFIXES[newInst.id];

                  return (
                    <div
                      key={sIdx}
                      className="grid grid-cols-2 gap-1.5 text-[10px] bg-[#101322] border border-[#2e3552] rounded p-1.5"
                    >
                      <div className="pr-1.5 border-r border-white/10 opacity-80">
                        <div className={`font-semibold ${oldMeta?.colorClass ?? 'text-[#94a3b8]'}`}>
                          Lv.{LEVEL_SLOT_THRESHOLDS[sIdx]} 原：{oldCfg?.name ?? '空'}
                        </div>
                        <div className="text-[#94a3b8] truncate">
                          {oldInst
                            ? formatAffixDescription(
                                oldInst,
                                sIdx,
                                s5,
                                hasInnateBoost,
                                firstAffixRelicLv
                              )
                            : '无'}
                        </div>
                      </div>
                      <div className="pl-1">
                        <div className={`font-semibold ${newMeta.colorClass}`}>
                          新：[{newMeta.label}] {newCfg.name}
                        </div>
                        <div className="text-[#f1f5f9] truncate">
                          {formatAffixDescription(
                            newInst,
                            sIdx,
                            s5,
                            hasInnateBoost,
                            firstAffixRelicLv
                          )}
                        </div>
                      </div>
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                    canBatchReroll
                      ? 'bg-[#f59e0b]/22 border-[#fbbf24]/65 text-[#fef08a] hover:bg-[#f59e0b]/35'
                      : 'bg-[#1e2235] border-[#2e3552] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
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
