import React, { useCallback, useEffect, useState } from 'react';
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
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? '#333' : '#fff';
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

function timeStrToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  color: '#111827',
  appearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#4b5563',
  marginBottom: 8,
};

export const EditTaskModal: React.FC<Props> = ({ task, onSave, onCancel, onDelete }) => {
  const isFixed = (FIXED_CATEGORIES as readonly string[]).includes(task.category);
  const [taskName, setTaskName] = useState(task.name);
  const [selectedCategory, setSelectedCategory] = useState(isFixed ? task.category : '仕事');
  const [customCategory, setCustomCategory] = useState(isFixed ? '' : task.category);
  const [useCustom, setUseCustom] = useState(!isFixed);
  const [startStr, setStartStr] = useState(tsToTimeStr(task.startTime));
  const [endStr, setEndStr] = useState(tsToTimeStr(task.endTime));
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9998,
      }} />

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: '20px 20px 0 0',
        maxHeight: '85dvh',
        overflowY: 'auto',
        background: '#ffffff',
        zIndex: 9999,
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        {/* Drag bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d1d5db' }} />
        </div>

        {/* Scrollable inner content */}
        <div style={{
          padding: '12px 24px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', margin: '0 0 20px 0' }}>
            タスクを編集
          </h2>

          {/* Category */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>カテゴリ</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {FIXED_CATEGORIES.map(cat => {
                const color = getCategoryColor(cat);
                const selected = !useCustom && selectedCategory === cat;
                return (
                  <button key={cat}
                    onClick={() => { setSelectedCategory(cat); setUseCustom(false); }}
                    style={{
                      padding: '7px 0',
                      borderRadius: 8,
                      border: selected ? '2px solid #6366f1' : '2px solid transparent',
                      background: color,
                      color: getTextColor(color),
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: selected ? 1 : 0.75,
                      transform: selected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s',
                      boxSizing: 'border-box',
                    }}
                  >{cat}</button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <input type="checkbox" id="edit-useCustom" checked={useCustom}
                onChange={e => setUseCustom(e.target.checked)}
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              <label htmlFor="edit-useCustom" style={{ fontSize: 14, color: '#4b5563', cursor: 'pointer' }}>
                カスタムカテゴリを使う
              </label>
            </div>
            {useCustom && (
              <input type="text" placeholder="カテゴリ名を入力" value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                style={inputStyle}
              />
            )}
          </div>

          {/* Task name */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>タスク名（任意）</label>
            <input type="text" placeholder="例：ランチミーティング" value={taskName}
              onChange={e => setTaskName(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Time pickers */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>開始時刻</label>
              <input type="time" value={startStr}
                onChange={e => { setStartStr(e.target.value); setError(''); }}
                onFocus={scrollToInput}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>終了時刻</label>
              <input type="time" value={endStr}
                onChange={e => { setEndStr(e.target.value); setError(''); }}
                onFocus={scrollToInput}
                style={inputStyle}
              />
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: 14, margin: '0 0 16px 0' }}>{error}</p>}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onDelete(task.id)} style={{
              padding: '14px 16px', borderRadius: 12,
              border: '1px solid #fca5a5', background: '#fff',
              color: '#ef4444', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>削除</button>
            <button onClick={onCancel} style={{
              flex: 1, padding: 14, borderRadius: 12,
              border: '1px solid #d1d5db', background: '#fff',
              color: '#6b7280', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>キャンセル</button>
            <button onClick={handleSave} style={{
              flex: 1, padding: 14, borderRadius: 12,
              border: 'none', background: '#6366f1',
              color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}>保存</button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
