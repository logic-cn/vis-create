/**
 * 系统设置服务
 */

import { api } from "./api";

export interface SystemSettings {
  openai_model: string;
  video_model: string;
  output_dir: string;
  verbose: boolean;
  log_level: string;
}

export interface SystemSettingsUpdate {
  openai_model?: string;
  video_model?: string;
  output_dir?: string;
  verbose?: boolean;
  log_level?: string;
}

export interface ApiTestResult {
  success: boolean;
  message: string;
}

const BASE = "/api/settings";

export const settingsService = {
  getSettings: () => api.get<SystemSettings>(BASE),

  updateSettings: (data: SystemSettingsUpdate) =>
    api.put<SystemSettings>(BASE, data),

  testApiConnection: (provider: string) =>
    api.post<ApiTestResult>(`${BASE}/test`, { provider }),
};
