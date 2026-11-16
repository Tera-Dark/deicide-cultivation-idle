export function SpiritStoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <polygon
        points="12,2 19,7.5 19,16.5 12,22 5,16.5 5,7.5"
        fill="#06b6d4"
        fillOpacity="0.22"
        stroke="#22d3ee"
        strokeWidth="1.7"
      />
      <polygon
        points="12,5.5 16,9 12,18.5 8,9"
        fill="#67e8f9"
        fillOpacity="0.35"
      />
      <line x1="12" y1="2" x2="12" y2="22" stroke="#a5f3fc" strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  );
}

export function AffixStoneIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <polygon
        points="12,2.5 20.5,12 12,21.5 3.5,12"
        fill="#f59e0b"
        fillOpacity="0.22"
        stroke="#fbbf24"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" fill="#fde68a" fillOpacity="0.85" />
      <path d="M12 6V9M12 15V18M6 12H9M15 12H18" stroke="#fbbf24" strokeWidth="1.2" />
    </svg>
  );
}

export function DivineCrystalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <path
        d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"
        fill="#a855f7"
        fillOpacity="0.28"
        stroke="#d8b4fe"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.1" fill="#f3e8ff" />
    </svg>
  );
}

export function TimerSigilIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9V13L14.8 14.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.5 3H14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function HeroDaoIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <polygon
        points="12,5.5 16.5,12 12,18.5 7.5,12"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function MercSwordIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <path
        d="M17.5 3.5L20.5 6.5L9.5 17.5L6.5 14.5L17.5 3.5Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 19L8 16M5.5 13.5L10.5 18.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function RelicHallIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <polygon
        points="12,3 20,8 17.5,19 6.5,19 4,8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PhaseBreakSigilIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <path
        d="M12 2L14.5 8.5L21 9.5L16 14L17.5 21L12 17.5L6.5 21L8 14L3 9.5L9.5 8.5L12 2Z"
        fill="#fbbf24"
        fillOpacity="0.35"
        stroke="#fde68a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
