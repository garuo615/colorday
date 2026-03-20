import React from 'react';
import { formatElapsed } from '../hooks/useTimer';

interface Props {
  running: boolean;
  elapsed: number;
  onStart: () => void;
  onStop: () => void;
}

export const TimerButton: React.FC<Props> = ({ running, elapsed, onStart, onStop }) => {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Elapsed display */}
      <div
        className={`font-mono text-4xl font-bold tracking-widest transition-colors ${
          running ? 'text-indigo-600' : 'text-gray-400'
        }`}
      >
        {formatElapsed(elapsed)}
      </div>

      {/* Start / Stop button */}
      {running ? (
        <button
          onClick={onStop}
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-red-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-30" />
          STOP
        </button>
      ) : (
        <button
          onClick={onStart}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          START
        </button>
      )}

      {running && (
        <p className="text-sm text-indigo-400 animate-pulse">記録中...</p>
      )}
    </div>
  );
};
