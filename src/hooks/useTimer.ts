import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerState } from '../types';

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    running: false,
    startTime: null,
    elapsed: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.running) {
      intervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsed: prev.startTime
            ? Math.floor((Date.now() - prev.startTime) / 1000)
            : 0,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running]);

  const start = useCallback(() => {
    const now = Date.now();
    setState({ running: true, startTime: now, elapsed: 0 });
  }, []);

  // Returns startTime for saving the task
  const stop = useCallback((): number | null => {
    setState((prev) => ({ ...prev, running: false }));
    return state.startTime;
  }, [state.startTime]);

  const reset = useCallback(() => {
    setState({ running: false, startTime: null, elapsed: 0 });
  }, []);

  return { state, start, stop, reset };
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}
