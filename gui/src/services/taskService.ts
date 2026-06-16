import { api, BASE_URL } from "./api";
import { Task, TaskListResponse, TaskCreateParams } from "../types/task";

export interface ImageEditParams {
  image_path: string;
  instruction: string;
  output_path?: string;
  mask_path?: string;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export const taskService = {
  list: (params?: TaskListParams) => {
    const queryParams = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);
    return api.get<TaskListResponse>(`/api/tasks?${queryParams}`);
  },

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
