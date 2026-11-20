import { BookMarked, ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { getTribulationConfig } from '../core/damageCalc';
import { formatNumber, formatTimeMs } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import {
  AffixStoneIcon,
  DivineCrystalIcon,
  SpiritStoneIcon,
  TimerSigilIcon,
} from './CultivationIcons';

const TRIB_ORDER_CN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function getCompactTribName(trib: { order: number; name: string }): string {
  if (trib.order >= 10) return '终焉';
  return `劫${TRIB_ORDER_CN[trib.order] ?? trib.order}`;
}

interface TopStatusBarProps {
  onOpenTribulations: () => void;
  onOpenCompendium: () => void;
  onOpenRestart: () => void;
  onOpenSettings: () => void;
}

export function TopStatusBar({
  onOpenTribulations,
  onOpenCompendium,
  onOpenRestart,
  onOpenSettings,
}: TopStatusBarProps) {
  const { run, meta, settings } = useGameStore();
  const trib = getTribulationConfig(run.tribulationId);
  const compactName = getCompactTribName(trib);
  const ngSuffix =
    run.tribulationId === 'tier_10' && meta.ngPlusCount > 0 ? `+${meta.ngPlusCount}` : '';

  return (
    <header className="shrink-0 bg-[#151827] border-b border-[#2e3552] px-3 py-2">
      <div className="flex flex-col gap-2">
        {/* Row 1: Tribulation Trigger | Timer | Compendium, Restart & Settings */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={onOpenTribulations}
            className="inline-flex items-center gap-1 min-h-[40px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#1e2338] border border-[#384166] hover:border-[#38bdf8]/70 text-[13px] font-bold text-[#f4f1ea] transition-colors cursor-pointer min-w-0 max-w-[86px] sm:max-w-[220px]"
            title={`当前${trib.name}，点击切换诸天劫数与查看速通记录`}
            aria-label={`当前${trib.name}，点击切换诸天劫数`}
          >
            <span className="sm:hidden truncate font-display tracking-wide">
              {compactName}
              {ngSuffix}
            </span>
            <span className="hidden sm:inline truncate font-display tracking-wide">
              {trib.name}
              {ngSuffix}
            </span>
            <ChevronDown className="w-4 h-4 text-[#38bdf8] shrink-0" />
          </button>

          <div className="inline-flex items-center gap-1 font-mono-num text-[13px] font-bold text-[#e2e8f0] tracking-tight whitespace-nowrap shrink-0">
            <TimerSigilIcon className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span>{formatTimeMs(run.elapsedMs)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenCompendium}
              className="inline-flex items-center gap-1 min-h-[40px] px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#38bdf8]/45 bg-[#06b6d4]/15 text-[#7dd3fc] hover:bg-[#06b6d4]/28 transition-colors cursor-pointer whitespace-nowrap"
              title="打开万劫秘藏图鉴"
            >
              <BookMarked className="w-3.5 h-3.5 shrink-0" />
              <span>图鉴</span>
            </button>
            <button
              type="button"
              onClick={onOpenRestart}
              className="inline-flex items-center gap-1 min-h-[40px] px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#f43f5e]/45 bg-[#f43f5e]/15 text-[#fda4af] hover:bg-[#f43f5e]/25 transition-colors cursor-pointer whitespace-nowrap"
              title="重开本局"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>重开</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg border border-[#384166] bg-[#1e2338] text-[#cbd5e1] hover:text-white cursor-pointer"
              aria-label="设置与存档"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: 3 Currencies with Custom SVG Icons & Stepped Hierarchy */}
        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/8 text-center">
          <div className="flex items-center justify-center gap-1.5 min-w-0">
            <SpiritStoneIcon className="w-4 h-4 shrink-0" />
            <span className="text-[#8da2c6] text-[11px] font-medium shrink-0">灵石</span>
            <span className="font-mono-num text-[13.5px] font-extrabold text-[#22d3ee] text-glow-cyan truncate">
              {formatNumber(run.spiritStones, settings.numberMode)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 min-w-0">
            <AffixStoneIcon className="w-4 h-4 shrink-0" />
            <span className="text-[#8da2c6] text-[11px] font-medium shrink-0">词缀石</span>
            <span className="font-mono-num text-[13.5px] font-extrabold text-[#fbbf24] text-glow-amber truncate">
              {meta.affixStones.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5 min-w-0">
            <DivineCrystalIcon className="w-4 h-4 shrink-0" />
            <span className="text-[#8da2c6] text-[11px] font-medium shrink-0">神晶</span>
            <span className="font-mono-num text-[13.5px] font-extrabold text-[#c084fc] text-glow-purple truncate">
              {formatNumber(meta.divineCrystals, settings.numberMode)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
