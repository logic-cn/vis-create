/**
 * 模型设置服务
 */

import { api } from "./api";
import type {
  ModelProvider,
  ModelProviderCreateParams,
  ModelProviderListResponse,
  ModelProviderUpdateParams,
  Model,
  ModelCreateParams,
  ModelListResponse,
  ModelUpdateParams,
  DefaultModels,
  DefaultModelsUpdateParams,
  ModelType,
  ProviderType,
} from "../types/model";

const BASE = "/api/model-settings";

export const modelService = {
  // ── 模型提供商 CRUD ──

  listProviders: (providerType?: ProviderType) => {
    const params = new URLSearchParams();
    if (providerType) params.append("provider_type", providerType);
    const query = params.toString();
    return api.get<ModelProviderListResponse>(
      `${BASE}/providers${query ? `?${query}` : ""}`,
    );
  },

  getProvider: (id: string) =>
    api.get<ModelProvider>(`${BASE}/providers/${id}`),

  createProvider: (data: ModelProviderCreateParams) => {
    // 清理空字符串字段
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    return api.post<ModelProvider>(`${BASE}/providers`, cleaned);
  },

  updateProvider: (id: string, data: ModelProviderUpdateParams) => {
    // 清理空字符串字段
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );
    return api.put<ModelProvider>(`${BASE}/providers/${id}`, cleaned);
  },

  deleteProvider: (id: string) => api.delete(`${BASE}/providers/${id}`),

  // ── 模型 CRUD ──

  listModels: (providerId?: string, modelType?: ModelType) => {
    const params = new URLSearchParams();
    if (providerId) params.append("provider_id", providerId);
    if (modelType) params.append("model_type", modelType);
    const query = params.toString();
    return api.get<ModelListResponse>(
      `${BASE}/models${query ? `?${query}` : ""}`,
    );
  },

  getModel: (id: string) => api.get<Model>(`${BASE}/models/${id}`),

  createModel: (data: ModelCreateParams) =>
    api.post<Model>(`${BASE}/models`, data),

  updateModel: (id: string, data: ModelUpdateParams) =>
    api.put<Model>(`${BASE}/models/${id}`, data),

  deleteModel: (id: string) => api.delete(`${BASE}/models/${id}`),

  // ── 默认模型配置 ──

  getDefaultModels: () => api.get<DefaultModels>(`${BASE}/default-models`),

  updateDefaultModels: (data: DefaultModelsUpdateParams) =>
    api.put<DefaultModels>(`${BASE}/default-models`, data),
};
