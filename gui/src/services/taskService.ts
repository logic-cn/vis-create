import { api } from "./api";
import { Task, TaskListResponse, TaskCreateParams } from "../types/task";

export const taskService = {
  list: () => api.get<TaskListResponse>("/api/tasks"),

  get: (id: string) => api.get<Task>(`/api/tasks/${id}`),

  create: (data: TaskCreateParams) => api.post<Task>("/api/tasks", data),

  pause: (id: string) => api.put<Task>(`/api/tasks/${id}/pause`, {}),

  resume: (id: string) => api.put<Task>(`/api/tasks/${id}/resume`, {}),

  cancel: (id: string) => api.delete(`/api/tasks/${id}`),

  getEventSource: (id: string) => {
    return new EventSource(`http://localhost:8000/api/tasks/${id}/events`);
  },
};
