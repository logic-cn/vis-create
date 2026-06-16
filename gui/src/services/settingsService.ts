/**
 * 系统设置服务
 */

import { api } from "./api";

export interface SystemSettings {
  openai_model: string;
  video_provider: string;
  video_api_key: string;
  video_api_endpoint: string;
  video_model: string;
  output_dir: string;
  verbose: boolean;
  log_level: string;
}

export interface SystemSettingsUpdate {
  openai_model?: string;
  video_provider?: string;
  video_api_key?: string;
  video_api_endpoint?: string;
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

// 视频提供商配置
export const VIDEO_PROVIDERS = [
  {
    id: "happyhorse",
    name: "HappyHorse",
    description: "阿里云百炼 - 物理真实、运动流畅",
    defaultEndpoint: "https://dashscope.aliyuncs.com",
    defaultModel: "happyhorse-1.0-t2v",
    models: ["happyhorse-1.0-t2v"],
  },
  {
    id: "seedance",
    name: "Seedance",
    description: "字节跳动火山引擎 - 高质量视频生成",
    defaultEndpoint: "https://ark.cn-beijing.volces.com",
    defaultModel: "seedance-2.0",
    models: ["seedance-2.0"],
  },
];
