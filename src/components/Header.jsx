import { RefreshCw, Fish, MapPin, Clock } from 'lucide-react';

export default function Header({ lastFetched, onRefresh, loading }) {
  const timeStr = lastFetched
    ? lastFetched.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null;

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-river-700/60 flex items-center justify-center text-xl">
            🎣
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white leading-tight">
              NorCal Fly Fishing
            </h1>
            <p className="text-xs text-slate-400 leading-tight">
              Live river conditions for Northern California
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="text-river-400" />
            Within 4hr of Orinda, CA
          </span>
          <span className="flex items-center gap-1">
            <Fish size={12} className="text-river-400" />
            Trout conditions
          </span>
          {timeStr && (
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-river-400" />
              Updated {timeStr}
            </span>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-river-700/40 hover:bg-river-700/70 text-river-300 text-sm transition-colors disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </header>
  );
}
