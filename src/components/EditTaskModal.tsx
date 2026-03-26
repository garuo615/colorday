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

function minutesToTimestamp(hour: number, minute: number, reference: number): number {
  const d = new Date(reference);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const selectClass =
  'border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white';

interface TimePickerProps {
  label: string;
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}

function TimePicker({ label, hour, minute, onHourChange, onMinuteChange }: TimePickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      <div className="flex items-center gap-1">
        <select value={hour} onChange={(e) => onHourChange(Number(e.target.value))} className={selectClass}>
          {HOURS.map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="text-gray-500 font-medium">:</span>
        <select value={minute} onChange={(e) => onMinuteChange(Number(e.target.value))} className={selectClass}>
          {MINUTES.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export const EditTaskModal: React.FC<Props> = ({ task, onSave, onCancel, onDelete }) => {
  const isFixedCategory = (FIXED_CATEGORIES as readonly string[]).includes(task.category);
  const [taskName, setTaskName] = useState(task.name);
  const [selectedCategory, setSelectedCategory] = useState(isFixedCategory ? task.category : '仕事');
  const [customCategory, setCustomCategory] = useState(isFixedCategory ? '' : task.category);
  const [useCustom, setUseCustom] = useState(!isFixedCategory);

  const startDate = new Date(task.startTime);
  const endDate = new Date(task.endTime);
  const [startHour, setStartHour] = useState(startDate.getHours());
  const [startMin, setStartMin] = useState(
    MINUTES.includes(startDate.getMinutes()) ? startDate.getMinutes() : 0
  );
  const [endHour, setEndHour] = useState(endDate.getHours());
  const [endMin, setEndMin] = useState(
    MINUTES.includes(endDate.getMinutes()) ? endDate.getMinutes() : 0
  );
  const [error, setError] = useState('');

  const handleSave = () => {
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    if (startTotal >= endTotal) {
      setError('開始時刻は終了時刻より前にしてください');
      return;
    }
    const category = useCustom ? customCategory.trim() || 'カスタム' : selectedCategory;
    const updated: Task = {
      ...task,
      name: taskName.trim(),
      category,
      color: getCategoryColor(category),
      startTime: minutesToTimestamp(startHour, startMin, task.startTime),
      endTime: minutesToTimestamp(endHour, endMin, task.endTime),
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

        {/* Time pickers */}
        <div className="flex gap-4">
          <TimePicker
            label="開始時刻"
            hour={startHour}
            minute={startMin}
            onHourChange={(h) => { setStartHour(h); setError(''); }}
            onMinuteChange={(m) => { setStartMin(m); setError(''); }}
          />
          <TimePicker
            label="終了時刻"
            hour={endHour}
            minute={endMin}
            onHourChange={(h) => { setEndHour(h); setError(''); }}
            onMinuteChange={(m) => { setEndMin(m); setError(''); }}
          />
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
