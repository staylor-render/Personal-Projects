import { CONDITION_CONFIG } from '../utils/conditions.js';

export default function ConditionBadge({ condition, size = 'md' }) {
  const cfg = CONDITION_CONFIG[condition] ?? CONDITION_CONFIG.unknown;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding  = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const dotSize  = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide border
        ${textSize} ${padding} ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      <span className={`rounded-full flex-shrink-0 ${dotSize} ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
