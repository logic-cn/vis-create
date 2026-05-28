export type TaskStatus = "pending" | "processing" | "completed" | "failed" | "paused";

export interface Task {
  id: string;
  artwork_id?: string;
  type: "image" | "video";
  status: TaskStatus;
  progress: number;
  prompt: string;
  parameters?: Record<string, unknown>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TaskListResponse {
  data: Task[];
  total: number;
}

export interface TaskCreateParams {
  type: "image" | "video";
  prompt: string;
  parameters?: Record<string, unknown>;
}

export interface TaskProgressEvent {
  task_id: string;
  status: TaskStatus;
  progress: number;
  message?: string;
}
