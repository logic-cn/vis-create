import { useEffect, useRef } from "react";
import { Task } from "../../types/task";
import { taskService } from "../../services/taskService";
import { useTaskStore } from "../../stores/taskStore";

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const { updateTaskProgress } = useTaskStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE 实时进度订阅
  useEffect(() => {
    if (task.status === "processing" || task.status === "pending") {
      const eventSource = taskService.getEventSource(task.id);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("processing", (event) => {
        try {
          const data = JSON.parse(event.data);
          updateTaskProgress(task.id, data.progress, "processing");
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      });

      eventSource.addEventListener("completed", (event) => {
        try {
          JSON.parse(event.data);
          updateTaskProgress(task.id, 100, "completed");
          eventSource.close();
          onUpdate();
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      });

      eventSource.addEventListener("failed", (event) => {
        try {
          const data = JSON.parse(event.data);
          updateTaskProgress(task.id, data.progress, "failed");
          eventSource.close();
          onUpdate();
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      });

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [task.id, task.status, updateTaskProgress, onUpdate]);

  async function handlePause() {
    try {
      await taskService.pause(task.id);
      updateTaskProgress(task.id, task.progress, "paused");
      onUpdate();
    } catch (err) {
      console.error("Failed to pause task:", err);
    }
  }

  async function handleResume() {
    try {
      await taskService.resume(task.id);
      updateTaskProgress(task.id, task.progress, "processing");
      onUpdate();
    } catch (err) {
      console.error("Failed to resume task:", err);
    }
  }

  async function handleCancel() {
    try {
      await taskService.cancel(task.id);
      onUpdate();
    } catch (err) {
      console.error("Failed to cancel task:", err);
    }
  }

  const statusColors = {
    pending: "text-text-muted",
    processing: "text-accent-primary",
    completed: "text-accent-primary",
    failed: "text-accent-secondary",
    paused: "text-yellow-500",
  };

  const statusLabels = {
    pending: "等待中",
    processing: "生成中",
    completed: "已完成",
    failed: "失败",
    paused: "已暂停",
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {task.type === "video" ? "🎬" : "🖼️"}
            </span>
            <span
              className={`text-xs font-medium ${statusColors[task.status]}`}
            >
              {statusLabels[task.status]}
            </span>
          </div>
          <p className="text-sm text-text-primary truncate">{task.prompt}</p>
          <p className="text-xs text-text-muted mt-1">
            {new Date(task.created_at).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2 ml-4">
          {task.status === "processing" && (
            <button
              onClick={handlePause}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              暂停
            </button>
          )}
          {task.status === "paused" && (
            <button
              onClick={handleResume}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              恢复
            </button>
          )}
          {(task.status === "processing" ||
            task.status === "paused" ||
            task.status === "pending") && (
            <button
              onClick={handleCancel}
              className="btn-secondary text-xs px-3 py-1.5 text-accent-secondary"
            >
              取消
            </button>
          )}
          {(task.status === "completed" ||
            task.status === "failed" ||
            task.status === "paused") && (
            <button
              onClick={() => onDelete(task.id)}
              className="btn-secondary text-xs px-3 py-1.5 text-accent-secondary"
            >
              删除
            </button>
          )}
        </div>
      </div>

      {(task.status === "processing" || task.status === "paused") && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>进度</span>
            <span>{Math.round(task.progress)}%</span>
          </div>
          <div className="w-full bg-bg-tertiary rounded-full h-2">
            <div
              className="bg-accent-primary h-2 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.error_message && (
        <p className="text-xs text-accent-secondary mt-2">
          {task.error_message}
        </p>
      )}
    </div>
  );
}
