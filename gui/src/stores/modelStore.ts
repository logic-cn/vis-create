/**
 * 模型设置状态管理
 */

import { create } from "zustand";
import type { ModelProvider, Model, DefaultModels } from "../types/model";

interface ModelStore {
  // 状态
  providers: ModelProvider[];
  models: Model[];
  defaultModels: DefaultModels;
  isLoading: boolean;
  error: string | null;

  // 提供商操作
  setProviders: (providers: ModelProvider[]) => void;
  addProvider: (provider: ModelProvider) => void;
  updateProvider: (provider: ModelProvider) => void;
  removeProvider: (id: string) => void;

  // 模型操作
  setModels: (models: Model[]) => void;
  addModel: (model: Model) => void;
  updateModel: (model: Model) => void;
  removeModel: (id: string) => void;

  // 默认模型操作
  setDefaultModels: (defaults: DefaultModels) => void;

  // 通用操作
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useModelStore = create<ModelStore>((set) => ({
  providers: [],
  models: [],
  defaultModels: {},
  isLoading: false,
  error: null,

  // 提供商操作
  setProviders: (providers) => set({ providers }),
  addProvider: (provider) =>
    set((state) => ({ providers: [provider, ...state.providers] })),
  updateProvider: (provider) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === provider.id ? provider : p,
      ),
    })),
  removeProvider: (id) =>
    set((state) => ({
      providers: state.providers.filter((p) => p.id !== id),
    })),

  // 模型操作
  setModels: (models) => set({ models }),
  addModel: (model) => set((state) => ({ models: [model, ...state.models] })),
  updateModel: (model) =>
    set((state) => ({
      models: state.models.map((m) => (m.id === model.id ? model : m)),
    })),
  removeModel: (id) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
    })),

  // 默认模型操作
  setDefaultModels: (defaults) => set({ defaultModels: defaults }),

  // 通用操作
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
