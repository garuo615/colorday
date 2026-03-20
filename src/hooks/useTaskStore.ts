import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';

const STORAGE_KEY = 'colorday_tasks';
const STORAGE_DATE_KEY = 'colorday_date';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadTasks(): Task[] {
  try {
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
    const today = todayStr();
    if (savedDate !== today) {
      // New day — reset
      localStorage.setItem(STORAGE_DATE_KEY, today);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_DATE_KEY, todayStr());
}

export function useTaskStore() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());

  // Check for day rollover every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
      if (savedDate !== todayStr()) {
        setTasks([]);
        saveTasks([]);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => {
      const next = [...prev, task];
      saveTasks(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTasks(next);
      return next;
    });
  }, []);

  return { tasks, addTask, deleteTask };
}
