import { useEffect, useRef } from "react";
import { Task, TaskStatus } from "../types/task";
import { taskService } from "../services/taskService";
import { useTaskStore } from "../stores/taskStore";

const ACTIVE_STATUSES: TaskStatus[] = ["pending", "processing"];
const FINAL_STATUSES: TaskStatus[] = ["completed", "failed"];

function handleProgressEvent(
  source: EventSource,
  taskId: string,
  status: TaskStatus,
  updateTask: (id: string, updates: Partial<Task>) => void,
  closeSource: (id: string) => void,
) {
  source.addEventListener(status, (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      updateTask(taskId, {
        status: data.status,
        progress: data.progress,
      });
      if (FINAL_STATUSES.includes(data.status)) {
        closeSource(taskId);
      }
    } catch {
      // ignore parse errors
    }
  });
}

export function useTaskEvents(tasks: Task[]) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const sourcesRef = useRef<Map<string, EventSource>>(new Map());

  function closeSource(id: string) {
    const source = sourcesRef.current.get(id);
    if (source) {
      source.close();
      sourcesRef.current.delete(id);
    }
  }

  useEffect(() => {
    const activeTasks = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status));

    for (const task of activeTasks) {
      if (!sourcesRef.current.has(task.id)) {
        const source = taskService.getEventSource(task.id);

        for (const status of ["pending", "processing", "completed", "failed"]) {
          handleProgressEvent(
            source,
            task.id,
            status as TaskStatus,
            updateTask,
            closeSource,
          );
        }

        source.onerror = () => {
          closeSource(task.id);
        };

        sourcesRef.current.set(task.id, source);
      }
    }

    for (const [id, source] of sourcesRef.current) {
      if (!activeTasks.some((t) => t.id === id)) {
        source.close();
        sourcesRef.current.delete(id);
      }
    }
  }, [tasks, updateTask]);

  useEffect(() => {
    return () => {
      for (const source of sourcesRef.current.values()) {
        source.close();
      }
      sourcesRef.current.clear();
    };
  }, []);
}
