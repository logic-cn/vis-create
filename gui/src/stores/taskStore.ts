import { create } from "zustand";
import { Task, TaskStatus } from "../types/task";

interface TaskStore {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;

  setTasks: (tasks: Task[]) => void;
  selectTask: (task: Task | null) => void;
  setLoading: (loading: boolean) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  updateTaskProgress: (id: string, progress: number, status?: TaskStatus) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,

  setTasks: (tasks) => set({ tasks }),
  selectTask: (task) => set({ selectedTask: task }),
  setLoading: (loading) => set({ isLoading: loading }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (id, updates) => {
    const { tasks } = get();
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks: updated });
  },
  removeTask: (id) => {
    const { tasks } = get();
    set({ tasks: tasks.filter((t) => t.id !== id) });
  },
  updateTaskProgress: (id, progress, status) => {
    const { tasks } = get();
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, progress, ...(status && { status }) } : t
    );
    set({ tasks: updated });
  },
}));
