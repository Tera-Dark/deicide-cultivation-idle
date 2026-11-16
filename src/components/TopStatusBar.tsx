import { ChevronDown, RotateCcw, Settings } from 'lucide-react';
import { getTribulationConfig } from '../core/damageCalc';
import { formatNumber, formatTimeMs } from '../core/formatNumber';
import { useGameStore } from '../stores/useGameStore';
import {
  AffixStoneIcon,
  DivineCrystalIcon,
  SpiritStoneIcon,
  TimerSigilIcon,
} from './CultivationIcons';

interface TopStatusBarProps {
  onOpenTribulations: () => void;
  onOpenRestart: () => void;
  onOpenSettings: () => void;
}

export function TopStatusBar({
  onOpenTribulations,
  onOpenRestart,
  onOpenSettings,
}: TopStatusBarProps) {
  const { run, meta, settings } = useGameStore();
  const trib = getTribulationConfig(run.tribulationId);
  const ngSuffix =
    run.tribulationId === 'tier_10' && meta.ngPlusCount > 0 ? `+${meta.ngPlusCount}` : '';

  return (
    <header className="shrink-0 bg-[#151827] border-b border-[#2e3552] px-3 py-2">
      <div className="flex flex-col gap-1.5">
        {/* Row 1: Tribulation Trigger | Timer | Restart & Settings */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenTribulations}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e2338] border border-[#384166] hover:border-[#38bdf8]/70 text-[13px] font-bold text-[#f4f1ea] transition-colors cursor-pointer min-w-0 max-w-[185px]"
            title="切换诸天劫数与查看速通记录"
          >
            <span className="truncate font-display tracking-wide">
              {trib.name}
              {ngSuffix}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
          </button>

          <div className="inline-flex items-center gap-1 font-mono-num text-[13px] font-bold text-[#e2e8f0] tracking-tight whitespace-nowrap shrink-0">
            <TimerSigilIcon className="w-3.5 h-3.5 text-[#94a3b8]" />
            <span>{formatTimeMs(run.elapsedMs)}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onOpenRestart}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border border-[#f43f5e]/45 bg-[#f43f5e]/15 text-[#fda4af] hover:bg-[#f43f5e]/25 transition-colors cursor-pointer whitespace-nowrap"
              title="重开本局"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重开</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-md border border-[#384166] bg-[#1e2338] text-[#cbd5e1] hover:text-white cursor-pointer"
              aria-label="设置与存档"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: 3 Currencies with Custom SVG Icons & Stepped Hierarchy */}
        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/8 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <SpiritStoneIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#8da2c6] text-[10px] font-medium">灵石</span>
            <span className="font-mono-num text-[13px] font-bold text-[#22d3ee] text-glow-cyan truncate">
              {formatNumber(run.spiritStones, settings.numberMode)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <AffixStoneIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#8da2c6] text-[10px] font-medium">词缀石</span>
            <span className="font-mono-num text-[13px] font-bold text-[#fbbf24] text-glow-amber truncate">
              {meta.affixStones.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <DivineCrystalIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[#8da2c6] text-[10px] font-medium">神晶</span>
            <span className="font-mono-num text-[13px] font-bold text-[#c084fc] text-glow-purple truncate">
              {formatNumber(meta.divineCrystals, settings.numberMode)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
