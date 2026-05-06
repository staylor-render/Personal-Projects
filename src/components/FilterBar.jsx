import { SlidersHorizontal } from 'lucide-react';

const DRIVE_OPTIONS = [
  { label: 'All rivers', value: 999 },
  { label: 'Under 2hr', value: 2 },
  { label: 'Under 3hr', value: 3 },
  { label: 'Under 4hr', value: 4 },
];

const CONDITION_OPTIONS = [
  { label: 'All conditions', value: 'all' },
  { label: 'Ideal only',     value: 'ideal' },
  { label: 'Ideal + Fair',   value: 'good' },
];

export default function FilterBar({ maxDrive, onMaxDrive, condFilter, onCondFilter, count, total }) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <SlidersHorizontal size={14} className="text-slate-500" />

      <select
        value={maxDrive}
        onChange={e => onMaxDrive(Number(e.target.value))}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-river-500"
      >
        {DRIVE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={condFilter}
        onChange={e => onCondFilter(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-river-500"
      >
        {CONDITION_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <span className="text-xs text-slate-500 ml-auto">
        Showing <span className="text-slate-300 font-medium">{count}</span> of {total} rivers
      </span>
    </div>
  );
}
