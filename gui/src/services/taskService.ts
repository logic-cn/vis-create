import { api, BASE_URL } from "./api";
import { Task, TaskListResponse, TaskCreateParams } from "../types/task";

export interface ImageEditParams {
  image_path: string;
  instruction: string;
  output_path?: string;
  mask_path?: string;
}

export const taskService = {
  list: () => api.get<TaskListResponse>("/api/tasks"),

  get: (id: string) => api.get<Task>(`/api/tasks/${id}`),

  create: (data: TaskCreateParams) => api.post<Task>("/api/tasks", data),

  pause: (id: string) => api.put<Task>(`/api/tasks/${id}/pause`, {}),

  resume: (id: string) => api.put<Task>(`/api/tasks/${id}/resume`, {}),

  cancel: (id: string) => api.delete(`/api/tasks/${id}`),

  delete: (id: string) => api.delete(`/api/tasks/${id}/delete`),

  editImage: (data: ImageEditParams) =>
    api.post<Task>("/api/tasks/edit", data),

  getEventSource: (id: string) => {
    return new EventSource(`${BASE_URL}/api/tasks/${id}/events`);
  },
};
