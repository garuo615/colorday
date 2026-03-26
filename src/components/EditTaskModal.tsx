import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
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

function tsToTimeStr(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeStrToTs(timeStr: string, reference: number): number {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(reference);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function timeStrToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

const timeInputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400';

export const EditTaskModal: React.FC<Props> = ({ task, onSave, onCancel, onDelete }) => {
  const isFixedCategory = (FIXED_CATEGORIES as readonly string[]).includes(task.category);
  const [taskName, setTaskName] = useState(task.name);
  const [selectedCategory, setSelectedCategory] = useState(isFixedCategory ? task.category : '仕事');
  const [customCategory, setCustomCategory] = useState(isFixedCategory ? '' : task.category);
  const [useCustom, setUseCustom] = useState(!isFixedCategory);
  const [startStr, setStartStr] = useState(tsToTimeStr(task.startTime));
  const [endStr, setEndStr] = useState(tsToTimeStr(task.endTime));
  const [error, setError] = useState('');

  const scrollToInput = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
  }, []);

  const handleSave = () => {
    if (timeStrToMinutes(startStr) >= timeStrToMinutes(endStr)) {
      setError('開始時刻は終了時刻より前にしてください');
      return;
    }
    const category = useCustom ? customCategory.trim() || 'カスタム' : selectedCategory;
    onSave({
      ...task,
      name: taskName.trim(),
      category,
      color: getCategoryColor(category),
      startTime: timeStrToTs(startStr, task.startTime),
      endTime: timeStrToTs(endStr, task.endTime),
    });
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50" style={{ zIndex: 9999 }}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Drag bar */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div
          className="overflow-y-auto flex-1 px-6 space-y-5"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
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
                className={timeInputClass}
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
              className={timeInputClass}
            />
          </div>

          {/* Time pickers */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">開始時刻</label>
              <input
                type="time"
                value={startStr}
                onChange={(e) => { setStartStr(e.target.value); setError(''); }}
                onFocus={scrollToInput}
                className={timeInputClass}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-2">終了時刻</label>
              <input
                type="time"
                value={endStr}
                onChange={(e) => { setEndStr(e.target.value); setError(''); }}
                onFocus={scrollToInput}
                className={timeInputClass}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Buttons */}
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => onDelete(task.id)}
              className="py-3 px-4 rounded-xl border border-red-300 text-red-500 text-sm font-medium hover:bg-red-50 transition"
            >
              削除
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition shadow"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
