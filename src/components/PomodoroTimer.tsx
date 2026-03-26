import React from 'react';
import type { PomodoroState } from '../hooks/usePomodoroTimer';
import { formatRemaining, PHASE_LABELS, PHASE_DURATIONS } from '../hooks/usePomodoroTimer';

interface Props {
  state: PomodoroState;
  pomodoroCount: number;
  onStart: () => void;
  onStop: () => void;
  onSkip: () => void;
}

const PHASE_BG: Record<string, string> = {
  work: 'from-indigo-400 to-violet-500',
  'short-break': 'from-sky-400 to-cyan-500',
  'long-break': 'from-emerald-400 to-teal-500',
};

const PHASE_ACCENT: Record<string, string> = {
  work: '#6C63FF',
  'short-break': '#63D4FF',
  'long-break': '#63FFB0',
};

export const PomodoroTimer: React.FC<Props> = ({
  state,
  pomodoroCount,
  onStart,
  onStop,
  onSkip,
}) => {
  const total = PHASE_DURATIONS[state.phase];
  const progress = ((total - state.remaining) / total) * 100;
  const accentColor = PHASE_ACCENT[state.phase];
  const gradientClass = PHASE_BG[state.phase];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Phase badge */}
      <span
        className="px-3 py-1 rounded-full text-sm font-semibold text-white shadow-sm"
        style={{ backgroundColor: accentColor }}
      >
        {PHASE_LABELS[state.phase]}
      </span>

      {/* Countdown */}
      <div
        className={`font-mono text-5xl font-bold tracking-widest transition-colors ${
          state.running ? 'text-indigo-600' : 'text-gray-400'
        }`}
      >
        {formatRemaining(state.remaining)}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        {state.running ? (
          <button
            onClick={onStop}
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-red-500 text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-30" />
            停止
          </button>
        ) : (
          <button
            onClick={onStart}
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradientClass} text-white font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all`}
          >
            開始
          </button>
        )}
        <button
          onClick={onSkip}
          className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-all flex items-center justify-center"
          title="スキップ"
        >
          ⏭
        </button>
      </div>

      {state.running && (
        <p className="text-sm animate-pulse" style={{ color: accentColor }}>記録中...</p>
      )}

      {/* Pomodoro count */}
      {pomodoroCount > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span>🍅</span>
          <span className="font-semibold text-gray-700">× {pomodoroCount}</span>
          <span className="text-xs text-gray-400">本日完了</span>
        </div>
      )}
    </div>
  );
};
