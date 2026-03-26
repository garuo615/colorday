import React, { useState } from 'react';
import { FIXED_CATEGORIES, getCategoryColor } from '../utils/colors';
import type { Task } from '../types';

interface Props {
  initialStartMinutes: number;
  existingTasks: Task[];
  onSave: (category: string, name: string, startTime: number, endTime: number) => void;
  onCancel: () => void;
}

function getTextColor(bg: string): string {
  if (bg.startsWith('hsl')) return '#333';
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#333' : '#fff';
}

function minutesToHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(minutes)));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

function hhmmToTimestamp(hhmm: string): number | null {
  const match = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (h > 23 || m > 59) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export const AddTaskModal: React.FC<Props> = ({
  initialStartMinutes,
  existingTasks,
  onSave,
  onCancel,
}) => {
  const defaultEnd = Math.min(initialStartMinutes + 30, 1439);
  const [startStr, setStartStr] = useState(minutesToHHMM(initialStartMinutes));
  const [endStr, setEndStr] = useState(minutesToHHMM(defaultEnd));
  const [selectedCategory, setSelectedCategory] = useState<string>('仕事');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    const startTime = hhmmToTimestamp(startStr);
    const endTime = hhmmToTimestamp(endStr);

    if (!startTime) { setError('開始時刻の形式が正しくありません（HH:MM）'); return; }
    if (!endTime) { setError('終了時刻の形式が正しくありません（HH:MM）'); return; }
    if (startTime >= endTime) { setError('開始時刻は終了時刻より前にしてください'); return; }

    const hasOverlap = existingTasks.some(
      (t) => startTime < t.endTime && endTime > t.startTime
    );
    if (hasOverlap) { setError('既存のタスクと時間が重複しています'); return; }

    const category = useCustom ? customCategory.trim() || 'カスタム' : selectedCategory;
    onSave(category, taskName.trim(), startTime, endTime);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800">タスクを追加</h2>

        {/* Time inputs */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">開始時刻</label>
            <input
              type="text"
              placeholder="HH:MM"
              value={startStr}
              onChange={(e) => { setStartStr(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-2">終了時刻</label>
            <input
              type="text"
              placeholder="HH:MM"
              value={endStr}
              onChange={(e) => { setEndStr(e.target.value); setError(''); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">カテゴリ</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {FIXED_CATEGORIES.map((cat) => {
              const color = getCategoryColor(cat);
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setUseCustom(false); }}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${
                    !useCustom && selectedCategory === cat
                      ? 'border-indigo-500 shadow-sm scale-105'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color, color: getTextColor(color) }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              id="addUseCustom"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="addUseCustom" className="text-sm text-gray-600">カスタムカテゴリを使う</label>
          </div>
          {useCustom && (
            <input
              type="text"
              placeholder="カテゴリ名を入力"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          )}
        </div>

        {/* Task name */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">タスク名（任意）</label>
          <input
            type="text"
            placeholder="例：ランチミーティング"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition shadow"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
