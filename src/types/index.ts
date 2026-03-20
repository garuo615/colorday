export type FixedCategory =
  | '仕事'
  | '食事'
  | '趣味'
  | '睡眠'
  | '移動'
  | '運動'
  | '身支度'
  | '休憩';

export interface Task {
  id: string;
  category: string; // fixed or custom
  name: string;
  startTime: number; // Unix timestamp (ms)
  endTime: number;   // Unix timestamp (ms)
  color: string;
}

export interface TimerState {
  running: boolean;
  startTime: number | null; // Unix timestamp (ms)
  elapsed: number; // seconds
}
