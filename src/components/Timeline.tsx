import { useEffect, useRef, useState } from 'react';
import type { Task } from '../types';
import { getCategoryColor } from '../utils/colors';

interface Props {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onAddTask: (startMinutes: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;

function timeToPercent(ts: number): number {
  const d = new Date(ts);
  const minutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  return (minutes / (24 * 60)) * 100;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function durationMin(task: Task): number {
  return Math.round((task.endTime - task.startTime) / 60000);
}

export const Timeline: React.FC<Props> = ({ tasks, onEditTask, onAddTask }) => {
  const [nowPercent, setNowPercent] = useState(() => timeToPercent(Date.now()));
  const nowLineRef = useRef<HTMLDivElement>(null);

  // Update current time line every 30s
  useEffect(() => {
    const update = () => setNowPercent(timeToPercent(Date.now()));
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const handleBlankClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalMinutes = Math.floor((y / TOTAL_HEIGHT) * 24 * 60);
    onAddTask(Math.max(0, Math.min(1439, totalMinutes)));
  };

  return (
    <div
      className="relative w-full overflow-y-auto bg-white rounded-2xl shadow-inner border border-gray-100"
      style={{ height: '70vh' }}
    >
      <div
        className="relative"
        style={{ height: TOTAL_HEIGHT }}
        onClick={handleBlankClick}
      >
        {/* Hour lines & labels */}
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-start pointer-events-none"
            style={{ top: h * HOUR_HEIGHT }}
          >
            <span className="text-xs text-gray-400 w-10 text-right pr-2 leading-none select-none">
              {String(h).padStart(2, '0')}:00
            </span>
            <div className="flex-1 border-t border-gray-100" />
          </div>
        ))}

        {/* Task blocks */}
        {tasks.map((task) => {
          const top = timeToPercent(task.startTime) * TOTAL_HEIGHT / 100;
          const height = Math.max(
            ((task.endTime - task.startTime) / (24 * 3600 * 1000)) * TOTAL_HEIGHT,
            18
          );
          const color = task.color || getCategoryColor(task.category);

          return (
            <div
              key={task.id}
              onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
              className="absolute left-11 right-2 rounded-lg cursor-pointer transition-all overflow-hidden hover:opacity-100"
              style={{
                top,
                height,
                backgroundColor: color,
                opacity: 0.9,
                zIndex: 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <div className="px-2 py-0.5 h-full flex flex-col justify-center">
                <p
                  className="text-xs font-semibold leading-tight truncate"
                  style={{ color: getTextColor(color) }}
                >
                  {task.name || task.category}
                </p>
                {height > 28 && (
                  <p className="text-xs opacity-75" style={{ color: getTextColor(color) }}>
                    {formatTime(task.startTime)}–{formatTime(task.endTime)} ({durationMin(task)}分)
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Current time line */}
        <div
          ref={nowLineRef}
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: `${nowPercent}%` }}
        >
          <div className="relative flex items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 ml-8 shadow" />
            <div className="flex-1 border-t-2 border-red-400 border-dashed" />
          </div>
        </div>
      </div>
    </div>
  );
};

function getTextColor(bg: string): string {
  if (bg.startsWith('hsl')) return '#333';
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#333' : '#fff';
}
