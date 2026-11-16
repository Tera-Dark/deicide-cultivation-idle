import type { ArchetypeId } from '../types/game';

export function ArchetypeIcon({
  archetype,
  className = 'w-6 h-6',
}: {
  archetype: ArchetypeId;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 32 32" className={`${className} overflow-visible shrink-0`} aria-hidden="true">
      {archetype === 'merc_sword' && (
        <polygon
          points="16,3 24,27 16,22 8,27"
          fill="#06b6d4"
          fillOpacity="0.25"
          stroke="#22d3ee"
          strokeWidth="1.8"
          style={{ filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.75))' }}
        />
      )}
      {archetype === 'merc_tentacle' && (
        <polygon
          points="16,3 27,16 16,29 5,16"
          fill="#a855f7"
          fillOpacity="0.28"
          stroke="#c084fc"
          strokeWidth="1.8"
          style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.75))' }}
        />
      )}
      {archetype === 'merc_cannon' && (
        <polygon
          points="16,3 27,9.5 27,22.5 16,29 5,22.5 5,9.5"
          fill="#f59e0b"
          fillOpacity="0.25"
          stroke="#fbbf24"
          strokeWidth="1.8"
          style={{ filter: 'drop-shadow(0 0 5px rgba(245,158,11,0.8))' }}
        />
      )}
      {archetype === 'merc_array' && (
        <g style={{ filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.7))' }}>
          <circle cx="16" cy="16" r="11" fill="none" stroke="#38bdf8" strokeWidth="1.6" />
          <circle cx="16" cy="16" r="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      )}
      {archetype === 'merc_god' && (
        <g style={{ filter: 'drop-shadow(0 0 5px rgba(244,63,94,0.8))' }}>
          <polygon
            points="16,2.5 19.6,12.4 29.5,16 19.6,19.6 16,29.5 12.4,19.6 2.5,16 12.4,12.4"
            fill="#f43f5e"
            fillOpacity="0.26"
            stroke="#fb7185"
            strokeWidth="1.6"
          />
          <circle cx="16" cy="16" r="3" fill="#fef08a" />
        </g>
      )}
    </svg>
  );
}
