import { useState, useEffect, useRef, useCallback } from 'react';

export type PomodoroPhase = 'work' | 'short-break' | 'long-break';

export const PHASE_DURATIONS: Record<PomodoroPhase, number> = {
  work: 25 * 60,
  'short-break': 5 * 60,
  'long-break': 15 * 60,
};

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  work: '作業中',
  'short-break': '短い休憩',
  'long-break': '長い休憩',
};

// Cycle: work(0), short-break(1), work(2), short-break(3), work(4), short-break(5), work(6), long-break(7)
function getPhaseForPosition(pos: number): PomodoroPhase {
  const p = pos % 8;
  if (p === 7) return 'long-break';
  if (p % 2 === 0) return 'work';
  return 'short-break';
}

export interface CompletedSession {
  phase: PomodoroPhase;
  startTime: number;
  endTime: number;
}

export interface PomodoroState {
  phase: PomodoroPhase;
  running: boolean;
  remaining: number;
  cyclePosition: number; // 0-7
}

export function usePomodoroTimer() {
  const [state, setState] = useState<PomodoroState>({
    phase: 'work',
    running: false,
    remaining: PHASE_DURATIONS.work,
    cyclePosition: 0,
  });
  const [completedSession, setCompletedSession] = useState<CompletedSession | null>(null);

  const sessionStartRef = useRef<number | null>(null);
  const pendingRef = useRef<CompletedSession | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Process session that just completed
      if (pendingRef.current) {
        setCompletedSession(pendingRef.current);
        pendingRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          const endTime = Date.now();
          pendingRef.current = {
            phase: prev.phase,
            startTime: sessionStartRef.current ?? endTime - PHASE_DURATIONS[prev.phase] * 1000,
            endTime,
          };
          sessionStartRef.current = null;
          const nextPos = (prev.cyclePosition + 1) % 8;
          const nextPhase = getPhaseForPosition(nextPos);
          return {
            phase: nextPhase,
            running: false,
            remaining: PHASE_DURATIONS[nextPhase],
            cyclePosition: nextPos,
          };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running]);

  const start = useCallback(() => {
    sessionStartRef.current = Date.now();
    setState((prev) => ({ ...prev, running: true }));
  }, []);

  const stop = useCallback(() => {
    sessionStartRef.current = null;
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  const skip = useCallback(() => {
    sessionStartRef.current = null;
    setState((prev) => {
      const nextPos = (prev.cyclePosition + 1) % 8;
      const nextPhase = getPhaseForPosition(nextPos);
      return {
        phase: nextPhase,
        running: false,
        remaining: PHASE_DURATIONS[nextPhase],
        cyclePosition: nextPos,
      };
    });
  }, []);

  const clearCompletedSession = useCallback(() => setCompletedSession(null), []);

  return { state, start, stop, skip, completedSession, clearCompletedSession };
}

export function formatRemaining(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Notification & audio utilities

export async function requestNotificationPermission(): Promise<void> {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export function sendBrowserNotification(title: string, body: string): boolean {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
    return true;
  }
  return false;
}

export function playBeep(phase: PomodoroPhase): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    // Work end: higher pitch; break end: lower pitch
    osc.frequency.value = phase === 'work' ? 880 : 660;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
    // Second beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.value = phase === 'work' ? 1100 : 550;
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc2.start(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 1.4);
  } catch {
    // AudioContext not available — silently ignore
  }
}
