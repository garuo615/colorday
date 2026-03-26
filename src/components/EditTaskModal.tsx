import React, { useState } from 'react';
import { FIXED_CATEGORIES, getCategoryColor } from '../utils/colors';
import type { Task } from '../types';

interface Props {
  task: Task;
  onSave: (updated: Task) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
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

function timeToMinutes(ts: number): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

function minutesToTimestamp(minutes: number, reference: number): number {
  const d = new Date(reference);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime();
}

function minutesToHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export const EditTaskModal: React.FC<Props> = ({ task, onSave, onCancel, onDelete }) => {
  const isFixedCategory = (FIXED_CATEGORIES as readonly string[]).includes(task.category);
  const [taskName, setTaskName] = useState(task.name);
  const [selectedCategory, setSelectedCategory] = useState(isFixedCategory ? task.category : '仕事');
  const [customCategory, setCustomCategory] = useState(isFixedCategory ? '' : task.category);
  const [useCustom, setUseCustom] = useState(!isFixedCategory);
  const [startMinutes, setStartMinutes] = useState(timeToMinutes(task.startTime));
  const [endMinutes, setEndMinutes] = useState(timeToMinutes(task.endTime));
  const [error, setError] = useState('');

  const handleSave = () => {
    if (startMinutes >= endMinutes) {
      setError('開始時刻は終了時刻より前にしてください');
      return;
    }
    const category = useCustom ? customCategory.trim() || 'カスタム' : selectedCategory;
    const updated: Task = {
      ...task,
      name: taskName.trim(),
      category,
      color: getCategoryColor(category),
      startTime: minutesToTimestamp(startMinutes, task.startTime),
      endTime: minutesToTimestamp(endMinutes, task.endTime),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800">タスクを編集</h2>

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
              id="editUseCustom"
              checked={useCustom}
              onChange={(e) => setUseCustom(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="editUseCustom" className="text-sm text-gray-600">カスタムカテゴリを使う</label>
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
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Start time slider */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            開始時刻：<span className="font-bold text-indigo-600">{minutesToHHMM(startMinutes)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1439}
            value={startMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              setStartMinutes(v);
              if (v >= endMinutes) setEndMinutes(Math.min(v + 1, 1439));
              setError('');
            }}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0:00</span><span>23:59</span>
          </div>
        </div>

        {/* End time slider */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            終了時刻：<span className="font-bold text-indigo-600">{minutesToHHMM(endMinutes)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={1439}
            value={endMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              setEndMinutes(v);
              if (v <= startMinutes) setStartMinutes(Math.max(v - 1, 0));
              setError('');
            }}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>0:00</span><span>23:59</span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onDelete(task.id)}
            className="py-2.5 px-4 rounded-xl border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 transition"
          >
            削除
          </button>
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
