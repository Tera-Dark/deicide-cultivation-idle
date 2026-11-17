import type { ReactNode } from 'react';
import type { ArchetypeId } from '../types/game';

export interface MercTypographyTheme {
  nameClass: string;
  roleClass: string;
  levelClass: string;
  cardBorderClass: string;
  accentBarClass: string;
  radialBgStyle: string;
}

export const MERC_TYPOGRAPHY: Record<ArchetypeId, MercTypographyTheme> = {
  merc_sword: {
    nameClass:
      'font-display font-black text-[#22d3ee] text-glow-cyan tracking-wide',
    roleClass: 'text-[#67e8f9]/85',
    levelClass: 'text-[#22d3ee]',
    cardBorderClass: 'border-[#06b6d4]/40 hover:border-[#22d3ee]/65',
    accentBarClass: 'bg-gradient-to-b from-[#22d3ee] via-[#06b6d4] to-[#0891b2]',
    radialBgStyle:
      'radial-gradient(circle at 0% 50%, rgba(6,182,212,0.14) 0%, transparent 55%)',
  },
  merc_tentacle: {
    nameClass:
      'font-display font-black text-[#c084fc] text-glow-purple tracking-wide',
    roleClass: 'text-[#d8b4fe]/85',
    levelClass: 'text-[#c084fc]',
    cardBorderClass: 'border-[#a855f7]/40 hover:border-[#c084fc]/65',
    accentBarClass: 'bg-gradient-to-b from-[#c084fc] via-[#a855f7] to-[#7e22ce]',
    radialBgStyle:
      'radial-gradient(circle at 0% 50%, rgba(168,85,247,0.14) 0%, transparent 55%)',
  },
  merc_cannon: {
    nameClass:
      'font-display font-black text-[#fbbf24] text-glow-amber tracking-wide',
    roleClass: 'text-[#fde68a]/85',
    levelClass: 'text-[#fbbf24]',
    cardBorderClass: 'border-[#f59e0b]/40 hover:border-[#fbbf24]/65',
    accentBarClass: 'bg-gradient-to-b from-[#fde047] via-[#f59e0b] to-[#d97706]',
    radialBgStyle:
      'radial-gradient(circle at 0% 50%, rgba(245,158,11,0.14) 0%, transparent 55%)',
  },
  merc_array: {
    nameClass:
      'font-display font-black text-[#38bdf8] text-glow-sky tracking-wide',
    roleClass: 'text-[#7dd3fc]/85',
    levelClass: 'text-[#38bdf8]',
    cardBorderClass: 'border-[#38bdf8]/40 hover:border-[#7dd3fc]/65',
    accentBarClass: 'bg-gradient-to-b from-[#7dd3fc] via-[#38bdf8] to-[#0284c7]',
    radialBgStyle:
      'radial-gradient(circle at 0% 50%, rgba(56,189,248,0.14) 0%, transparent 55%)',
  },
  merc_god: {
    nameClass:
      'font-display font-black text-[#fb7185] text-glow-crimson tracking-wide',
    roleClass: 'text-[#fda4af]/85',
    levelClass: 'text-[#fb7185]',
    cardBorderClass: 'border-[#f43f5e]/45 hover:border-[#fb7185]/75',
    accentBarClass: 'bg-gradient-to-b from-[#fda4af] via-[#f43f5e] to-[#be123c]',
    radialBgStyle:
      'radial-gradient(circle at 0% 50%, rgba(244,63,94,0.16) 0%, transparent 55%)',
  },
};

interface HighlightRule {
  tokens: string[];
  className: string;
}

const HIGHLIGHT_RULES: HighlightRule[] = [
  {
    tokens: ['1号位：青冥剑侍', '1号青冥剑侍', '青冥剑侍', '剑侍'],
    className:
      'font-display font-extrabold text-[#22d3ee] text-glow-cyan border-b border-[#22d3ee]/45 pb-[0.5px] mx-[1px]',
  },
  {
    tokens: ['2号位：深渊触母', '2号深渊触母', '深渊触母', '触母'],
    className:
      'font-display font-extrabold text-[#c084fc] text-glow-purple border-b border-[#c084fc]/45 pb-[0.5px] mx-[1px]',
  },
  {
    tokens: ['3号位：雷火机神', '3号雷火机神', '雷火机神', '机神'],
    className:
      'font-display font-extrabold text-[#fbbf24] text-glow-amber border-b border-[#fbbf24]/45 pb-[0.5px] mx-[1px]',
  },
  {
    tokens: ['4号位：天机阵尊', '4号天机阵尊', '天机阵尊', '阵尊'],
    className:
      'font-display font-extrabold text-[#38bdf8] text-glow-sky border-b border-[#38bdf8]/45 pb-[0.5px] mx-[1px]',
  },
  {
    tokens: ['5号位：混沌古神嗣', '5号混沌古神嗣', '混沌古神嗣', '古神嗣'],
    className:
      'font-display font-extrabold text-[#fb7185] text-glow-crimson border-b border-[#fb7185]/45 pb-[0.5px] mx-[1px]',
  },
  {
    tokens: [
      '原初混沌古神道果',
      '不可名状古神',
      '天道古神',
      '古神道果',
      '1e120 终焉古神',
      '十重躯壳',
    ],
    className:
      'font-display font-extrabold text-[#fda4af] text-glow-crimson mx-[1px]',
  },
  {
    tokens: ['弑神道胎', '亵渎道胎', '先天本命神通', '本命神通'],
    className:
      'font-display font-extrabold text-[#fde047] text-glow-gold mx-[1px]',
  },
  {
    tokens: ['机关傀儡', '万毒之源', '万毒催熟', '毒爆共鸣', '剧毒蔓延', '腐蚀毒'],
    className:
      'font-semibold text-[#34d399] text-glow-emerald mx-[1px]',
  },
  {
    tokens: ['神·古神遗物', '神遗物'],
    className: 'font-tier-mythic font-bold mx-[1px]',
  },
  {
    tokens: ['五大本命护法', '道纹洗练面板', '遗物圣殿', '古神遗物'],
    className:
      'font-display font-bold text-[#fbbf24] text-glow-gold mx-[1px]',
  },
  {
    tokens: ['仙遗物'],
    className: 'font-tier-epic font-bold mx-[1px]',
  },
  {
    tokens: ['圣遗物', '圣阶遗物'],
    className: 'font-tier-saint font-bold mx-[1px]',
  },
  {
    tokens: ['玄遗物'],
    className: 'font-tier-mystic font-bold mx-[1px]',
  },
  {
    tokens: ['灵遗物'],
    className: 'font-tier-rare font-bold mx-[1px]',
  },
  {
    tokens: ['凡遗物'],
    className: 'font-tier-common font-bold mx-[1px]',
  },
  {
    tokens: [
      '万剑归宗',
      '残影连击',
      '雷火装填',
      '伴生剑意',
      '歼星连射',
      '缩资减耗',
      '天道酬勤',
      '千级共鸣',
      '自动连续挑战',
      '自动连续释放',
      '自动破境',
      '自动傀儡',
      '自动顿悟',
      '自动强化神通',
      '护法自动升级',
      '批量锁槽',
      '神晶本命神通洗练',
    ],
    className: 'font-semibold text-[#fef08a] text-glow-amber mx-[1px]',
  },
  {
    tokens: ['80 灵石 & 2 词缀石', '灵石'],
    className: 'font-semibold text-[#67e8f9] text-glow-cyan',
  },
  {
    tokens: ['词缀石'],
    className: 'font-semibold text-[#fbbf24] text-glow-amber',
  },
  {
    tokens: ['15 颗', '神晶'],
    className: 'font-semibold text-[#d8b4fe] text-glow-purple',
  },
];

// Build lookup map & longest-first token regex
const TOKEN_CLASS_MAP = new Map<string, string>();
const ALL_TOKENS: string[] = [];

for (const rule of HIGHLIGHT_RULES) {
  for (const t of rule.tokens) {
    TOKEN_CLASS_MAP.set(t, rule.className);
    ALL_TOKENS.push(t);
  }
}

ALL_TOKENS.sort((a, b) => b.length - a.length);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TOKEN_PATTERN = ALL_TOKENS.map(escapeRegex).join('|');
// Also match numeric multiplier callouts like ×4 倍, ×1.5, ×3, 1000 级, Lv.1000, 0.4 秒, 15 颗
const NUMERIC_CALLOUT_PATTERN =
  '(?:×\\s*\\d+(?:\\.\\d+)?\\s*倍?|Lv\\.\\s*\\d+\\+?|\\d+(?:\\.\\d+)?\\s*(?:级|重|层|秒|次|颗|石|晶)|1e\\d+|\\d+(?:\\.\\d+)?%)';

const COMBINED_PATTERN = `【([^】]+)】|(${TOKEN_PATTERN})|(${NUMERIC_CALLOUT_PATTERN})`;

// Bracket-only single-character tier labels (【凡】【灵】【玄】【圣】【仙】【神】)
const BRACKET_ONLY_TOKEN_MAP = new Map<string, string>([
  ['凡', 'font-tier-common font-bold mx-[1px]'],
  ['灵', 'font-tier-rare font-bold mx-[1px]'],
  ['玄', 'font-tier-mystic font-bold mx-[1px]'],
  ['圣', 'font-tier-saint font-bold mx-[1px]'],
  ['仙', 'font-tier-epic font-bold mx-[1px]'],
  ['神', 'font-tier-mythic font-bold mx-[1px]'],
]);

/**
 * Renders lore, tutorials, guides, and skill descriptions with semantic color luminescence
 * and clean editorial emphasis (no noisy pill chips or raw bracket clutter).
 */
export function RichLoreText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  if (typeof text !== 'string' || !text) {
    return null;
  }

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;
  const regex = new RegExp(COMBINED_PATTERN, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[0].length === 0) {
      regex.lastIndex += 1;
      continue;
    }

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const bracketInner = match[1];
    const entityToken = match[2];
    const numericToken = match[3];

    if (bracketInner !== undefined) {
      // Render bracketed phrase recursively so multi-part phrases like "1号位：青冥剑侍" or "80 灵石 & 2 词缀石" get exact highlights cleanly without 【】 clutter
      const mapped = TOKEN_CLASS_MAP.get(bracketInner) ?? BRACKET_ONLY_TOKEN_MAP.get(bracketInner);
      if (mapped) {
        nodes.push(
          <span key={`hl-${keyCounter++}`} className={mapped}>
            {bracketInner}
          </span>
        );
      } else {
        nodes.push(
          <span
            key={`br-${keyCounter++}`}
            className="font-semibold text-[#f8fafc] underline decoration-[#38bdf8]/35 underline-offset-4"
          >
            <RichLoreText text={bracketInner} />
          </span>
        );
      }
    } else if (entityToken !== undefined) {
      const cls = TOKEN_CLASS_MAP.get(entityToken) ?? 'font-semibold text-[#f8fafc]';
      nodes.push(
        <span key={`en-${keyCounter++}`} className={cls}>
          {entityToken}
        </span>
      );
    } else if (numericToken !== undefined) {
      nodes.push(
        <span
          key={`nm-${keyCounter++}`}
          className="font-mono-num font-bold text-[#f8fafc] mx-[1px]"
        >
          {numericToken}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <span className={className}>{nodes}</span>;
}
