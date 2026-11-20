import { Loader2, PlayCircle } from 'lucide-react';

interface AdRewardButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  hint?: string;
  tone?: 'amber' | 'cyan' | 'violet';
  fullWidth?: boolean;
}

const TONE_CLASS: Record<NonNullable<AdRewardButtonProps['tone']>, string> = {
  amber:
    'bg-[#f59e0b]/18 border-[#fbbf24]/55 text-[#fef08a] hover:bg-[#f59e0b]/28',
  cyan:
    'bg-[#06b6d4]/16 border-[#22d3ee]/55 text-[#cffafe] hover:bg-[#06b6d4]/26',
  violet:
    'bg-[#a855f7]/16 border-[#c084fc]/55 text-[#f3e8ff] hover:bg-[#a855f7]/26',
};

export function AdRewardButton({
  label,
  onClick,
  loading = false,
  disabled = false,
  hint,
  tone = 'amber',
  fullWidth = false,
}: AdRewardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
        fullWidth ? 'w-full' : ''
      } ${
        disabled || loading
          ? 'bg-[#161929] border-[#2e3552] text-[#64748b] cursor-not-allowed'
          : `cursor-pointer ${TONE_CLASS[tone]}`
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
      ) : (
        <PlayCircle className="w-4 h-4 shrink-0" />
      )}
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 rounded-[3px] border border-current/40 px-1 py-[1px] text-[9px] leading-none tracking-wider opacity-80">
          广告
        </span>
        <span className="truncate">{loading ? '广告加载中…' : label}</span>
      </span>
      {hint && <span className="text-[10px] font-medium opacity-65 shrink-0">{hint}</span>}
    </button>
  );
}
