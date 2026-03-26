import { useState, useCallback } from 'react';
import { Timeline } from './components/Timeline';
import { TimerButton } from './components/TimerButton';
import { TaskModal } from './components/TaskModal';
import { EditTaskModal } from './components/EditTaskModal';
import { AddTaskModal } from './components/AddTaskModal';
import { useTimer } from './hooks/useTimer';
import { useTaskStore } from './hooks/useTaskStore';
import { getCategoryColor } from './utils/colors';
import type { Task } from './types';

export default function App() {
  const { state: timerState, start, stop, reset } = useTimer();
  const { tasks, addTask, deleteTask, updateTask } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [pendingStart, setPendingStart] = useState<number | null>(null);
  const [pendingEnd, setPendingEnd] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [addingFromTimeline, setAddingFromTimeline] = useState<number | null>(null);

  const handleStop = useCallback(() => {
    const startTime = stop();
    setPendingStart(startTime);
    setPendingEnd(Date.now());
    setShowModal(true);
  }, [stop]);

  const handleSave = useCallback(
    (category: string, name: string, startTime: number, endTime: number) => {
      addTask({
        id: crypto.randomUUID(),
        category,
        name,
        startTime,
        endTime,
        color: getCategoryColor(category),
      });
      setShowModal(false);
      setPendingStart(null);
      setPendingEnd(null);
      reset();
    },
    [addTask, reset]
  );

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setPendingStart(null);
    setPendingEnd(null);
    reset();
  }, [reset]);

  const handleEditSave = useCallback(
    (updated: Task) => { updateTask(updated); setEditingTask(null); },
    [updateTask]
  );

  const handleEditDelete = useCallback(
    (id: string) => { deleteTask(id); setEditingTask(null); },
    [deleteTask]
  );

  const handleAddFromTimeline = useCallback(
    (category: string, name: string, startTime: number, endTime: number) => {
      addTask({
        id: crypto.randomUUID(),
        category,
        name,
        startTime,
        endTime,
        color: getCategoryColor(category),
      });
      setAddingFromTimeline(null);
    },
    [addTask]
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-700 ${
        timerState.running
          ? 'bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50'
          : 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50'
      }`}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            ColorDay
          </h1>
          <p className="text-xs text-gray-400">{formatDate(new Date())}</p>
        </div>
        {timerState.running && (
          <div className="h-1 bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 animate-pulse" />
        )}
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Timer section */}
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-md p-6 flex flex-col items-center">
          <TimerButton
            running={timerState.running}
            elapsed={timerState.elapsed}
            onStart={start}
            onStop={handleStop}
          />
        </section>

        {/* Timeline section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-700">今日のタイムライン</h2>
            <span className="text-xs text-gray-400">タップで編集 / 空白をタップで追加</span>
          </div>
          <Timeline
            tasks={tasks}
            onEditTask={setEditingTask}
            onAddTask={setAddingFromTimeline}
          />
        </section>

        {/* Category legend */}
        {tasks.length > 0 && (
          <section className="bg-white/80 backdrop-blur rounded-2xl shadow-md p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">内訳</h3>
            <CategorySummary tasks={tasks} />
          </section>
        )}
      </main>

      {/* Modals */}
      {showModal && pendingStart !== null && pendingEnd !== null && (
        <TaskModal
          initialStartTime={pendingStart}
          initialEndTime={pendingEnd}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onSave={handleEditSave}
          onCancel={() => setEditingTask(null)}
          onDelete={handleEditDelete}
        />
      )}
      {addingFromTimeline !== null && (
        <AddTaskModal
          initialStartMinutes={addingFromTimeline}
          existingTasks={tasks}
          onSave={handleAddFromTimeline}
          onCancel={() => setAddingFromTimeline(null)}
        />
      )}
    </div>
  );
}

function formatDate(d: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function CategorySummary({ tasks }: { tasks: Task[] }) {
  const map = new Map<string, number>();
  for (const t of tasks) {
    map.set(t.category, (map.get(t.category) ?? 0) + (t.endTime - t.startTime) / 60000);
  }
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {Array.from(map.entries()).map(([cat, mins]) => (
        <div key={cat} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(cat) }}
          />
          <span className="text-xs text-gray-600 flex-1">{cat}</span>
          <span className="text-xs text-gray-500">{Math.round(mins)}分</span>
          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(mins / total) * 100}%`,
                backgroundColor: getCategoryColor(cat),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
