import { useState, useEffect } from "react";
import { modelService } from "../services/modelService";
import { useModelStore } from "../stores/modelStore";
import type {
  Model,
  ModelType,
  ModelCreateParams,
  ProviderPreset,
} from "../types/model";
import {
  PROVIDER_PRESETS,
  MODEL_TYPE_CONFIG,
  DEFAULT_MODEL_TYPES,
} from "../types/model";

type SettingsTab = "models" | "defaults";

export default function SettingsPage() {
  const {
    providers,
    setProviders,
    addProvider,
    models,
    setModels,
    addModel,
    updateModel,
    removeModel,
    defaultModels,
    setDefaultModels,
    isLoading,
    setLoading,
  } = useModelStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>("models");
  const [error, setError] = useState<string | null>(null);

  // 添加模型相关状态
  const [showAddModel, setShowAddModel] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null);
  const [isCustomProvider, setIsCustomProvider] = useState(false);
  const [customProviderForm, setCustomProviderForm] = useState({
    name: "",
    display_name: "",
    base_url: "",
    api_key: "",
  });
  const [modelForm, setModelForm] = useState<ModelCreateParams>({
    provider_id: "",
    name: "",
    display_name: "",
    model_type: "text_to_image",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [providersRes, modelsRes, defaultsRes] = await Promise.all([
        modelService.listProviders(),
        modelService.listModels(),
        modelService.getDefaultModels(),
      ]);
      setProviders(providersRes.data);
      setModels(modelsRes.data);
      setDefaultModels(defaultsRes);
    } catch (err) {
      console.error("Failed to load model settings:", err);
    } finally {
      setLoading(false);
    }
  }

  // 获取供应商下的模型
  function getProviderModels(providerId: string) {
    return models.filter((m) => m.provider_id === providerId);
  }

  // 选择预设供应商
  function handleSelectPreset(preset: ProviderPreset) {
    setSelectedPreset(preset);
    setIsCustomProvider(false);

    // 检查是否已存在该供应商
    const existingProvider = providers.find((p) => p.name === preset.name);
    if (existingProvider) {
      setModelForm({
        ...modelForm,
        provider_id: existingProvider.id,
      });
    } else {
      // 创建供应商
      handleCreateProviderFromPreset(preset);
    }
  }

  // 从预设创建供应商
  async function handleCreateProviderFromPreset(preset: ProviderPreset) {
    try {
      const provider = await modelService.createProvider({
        name: preset.name,
        display_name: preset.display_name,
        provider_type: preset.provider_type,
        base_url: preset.base_url,
        icon: preset.icon,
        description: preset.description,
      });
      addProvider(provider);
      setModelForm({
        ...modelForm,
        provider_id: provider.id,
      });
    } catch (err) {
      console.error("Create provider failed:", err);
      setError("创建供应商失败");
    }
  }

  // 创建自定义供应商并添加模型
  async function handleCreateCustomProviderAndModel() {
    if (!customProviderForm.name.trim() || !customProviderForm.display_name.trim()) {
      setError("请填写供应商名称和显示名称");
      return;
    }
    if (!modelForm.name.trim() || !modelForm.display_name.trim()) {
      setError("请填写模型名称和显示名称");
      return;
    }

    setError(null);
    try {
      // 创建供应商
      const provider = await modelService.createProvider({
        name: customProviderForm.name,
        display_name: customProviderForm.display_name,
        provider_type: "cloud",
        base_url: customProviderForm.base_url || undefined,
        api_key: customProviderForm.api_key || undefined,
      });
      addProvider(provider);

      // 创建模型
      const model = await modelService.createModel({
        ...modelForm,
        provider_id: provider.id,
      });
      addModel(model);

      // 重置表单
      resetAddModelForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建失败";
      setError(message);
    }
  }

  // 添加模型到已有供应商
  async function handleAddModel() {
    if (!modelForm.provider_id || !modelForm.name.trim() || !modelForm.display_name.trim()) {
      setError("请填写完整的模型信息");
      return;
    }

    setError(null);
    try {
      const model = await modelService.createModel(modelForm);
      addModel(model);
      resetAddModelForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "添加模型失败";
      setError(message);
    }
  }

  // 删除模型
  async function handleDeleteModel(id: string) {
    try {
      await modelService.deleteModel(id);
      removeModel(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除模型失败";
      setError(message);
    }
  }

  // 切换默认模型
  async function handleToggleDefault(model: Model) {
    try {
      const updated = await modelService.updateModel(model.id, {
        is_default: !model.is_default,
      });
      updateModel(updated);
      // 重新加载默认配置
      const defaults = await modelService.getDefaultModels();
      setDefaultModels(defaults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "设置默认模型失败";
      setError(message);
    }
  }

  // 设置默认模型
  async function handleSetDefault(modelType: ModelType, modelId: string) {
    try {
      const fieldMap: Record<ModelType, string> = {
        text_generation: "default_text_generation_model_id",
        text_to_image: "default_image_model_id",
        image_to_image: "default_image_to_image_model_id",
        text_to_video: "default_video_model_id",
        image_to_video: "default_image_to_video_model_id",
      };

      const updateData = {
        [fieldMap[modelType]]: modelId || undefined,
      };

      const updated = await modelService.updateDefaultModels(updateData);
      setDefaultModels(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "设置默认模型失败";
      setError(message);
    }
  }

  // 获取默认模型ID
  function getDefaultModelId(modelType: ModelType): string {
    const fieldMap: Record<ModelType, string> = {
      text_generation: "default_text_generation_model_id",
      text_to_image: "default_image_model_id",
      image_to_image: "default_image_to_image_model_id",
      text_to_video: "default_video_model_id",
      image_to_video: "default_image_to_video_model_id",
    };
    return (defaultModels as Record<string, string | undefined>)[fieldMap[modelType]] || "";
  }

  // 重置添加模型表单
  function resetAddModelForm() {
    setShowAddModel(false);
    setSelectedPreset(null);
    setIsCustomProvider(false);
    setCustomProviderForm({
      name: "",
      display_name: "",
      base_url: "",
      api_key: "",
    });
    setModelForm({
      provider_id: "",
      name: "",
      display_name: "",
      model_type: "text_to_image",
    });
  }

  // 按供应商分组的模型
  const providersWithModels = providers
    .filter((p) => {
      const providerModels = getProviderModels(p.id);
      return providerModels.length > 0;
    })
    .map((p) => ({
      provider: p,
      models: getProviderModels(p.id),
    }));

  const tabs = [
    { id: "models" as SettingsTab, label: "模型管理", emoji: "🤖" },
    { id: "defaults" as SettingsTab, label: "默认模型", emoji: "⭐" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-text-primary">模型设置</h1>
        <p className="text-text-secondary text-sm mt-1">
          管理 AI 模型和默认配置
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="px-6 border-b border-white/10">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 错误提示 */}
        {error && (
          <div className="max-w-4xl mx-auto mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-text-muted">加载中...</div>
          </div>
        ) : (
          <>
            {/* 模型管理 */}
            {activeTab === "models" && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 添加模型按钮 */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    已配置的模型
                  </h2>
                  <button
                    onClick={() => setShowAddModel(true)}
                    className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    + 添加模型
                  </button>
                </div>

                {/* 添加模型表单 */}
                {showAddModel && (
                  <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-6">
                    <h3 className="text-base font-semibold text-text-primary mb-4">
                      添加模型
                    </h3>

                    {/* 选择供应商 */}
                    <div className="mb-6">
                      <label className="block text-sm text-text-secondary mb-3">
                        选择供应商
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {PROVIDER_PRESETS.map((preset) => {
                          const existing = providers.find(
                            (p) => p.name === preset.name
                          );
                          return (
                            <button
                              key={preset.name}
                              onClick={() => handleSelectPreset(preset)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                selectedPreset?.name === preset.name
                                  ? "border-accent-primary bg-accent-primary/10"
                                  : "border-white/5 bg-bg-secondary hover:border-white/10"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span>{preset.icon}</span>
                                <span className="text-sm font-medium text-text-primary">
                                  {preset.display_name}
                                </span>
                              </div>
                              <div className="text-xs text-text-muted">
                                {preset.description}
                              </div>
                              {existing && (
                                <div className="text-xs text-accent-primary mt-1">
                                  已配置
                                </div>
                              )}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => {
                            setSelectedPreset(null);
                            setIsCustomProvider(true);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isCustomProvider
                              ? "border-accent-primary bg-accent-primary/10"
                              : "border-white/5 bg-bg-secondary hover:border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span>➕</span>
                            <span className="text-sm font-medium text-text-primary">
                              自定义
                            </span>
                          </div>
                          <div className="text-xs text-text-muted">
                            自定义 OpenAI 兼容 API
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* 自定义供应商表单 */}
                    {isCustomProvider && (
                      <div className="mb-6 p-4 rounded-xl bg-bg-secondary border border-white/5 space-y-3">
                        <h4 className="text-sm font-medium text-text-primary">
                          自定义供应商信息
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={customProviderForm.name}
                            onChange={(e) =>
                              setCustomProviderForm({
                                ...customProviderForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="标识 (如: my-api)"
                            className="px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                          <input
                            type="text"
                            value={customProviderForm.display_name}
                            onChange={(e) =>
                              setCustomProviderForm({
                                ...customProviderForm,
                                display_name: e.target.value,
                              })
                            }
                            placeholder="显示名称 (如: 我的API)"
                            className="px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                        <input
                          type="text"
                          value={customProviderForm.base_url}
                          onChange={(e) =>
                            setCustomProviderForm({
                              ...customProviderForm,
                              base_url: e.target.value,
                            })
                          }
                          placeholder="API Base URL (如: https://api.example.com/v1)"
                          className="w-full px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                        />
                        <input
                          type="password"
                          value={customProviderForm.api_key}
                          onChange={(e) =>
                            setCustomProviderForm({
                              ...customProviderForm,
                              api_key: e.target.value,
                            })
                          }
                          placeholder="API Key (可选)"
                          className="w-full px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                        />
                      </div>
                    )}

                    {/* 模型信息表单 */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-text-primary">
                        模型信息
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            模型标识 *
                          </label>
                          <input
                            type="text"
                            value={modelForm.name}
                            onChange={(e) =>
                              setModelForm({ ...modelForm, name: e.target.value })
                            }
                            placeholder="如: gpt-4-turbo"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-muted mb-1">
                            显示名称 *
                          </label>
                          <input
                            type="text"
                            value={modelForm.display_name}
                            onChange={(e) =>
                              setModelForm({
                                ...modelForm,
                                display_name: e.target.value,
                              })
                            }
                            placeholder="如: GPT-4 Turbo"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">
                          模型类型 *
                        </label>
                        <select
                          value={modelForm.model_type}
                          onChange={(e) =>
                            setModelForm({
                              ...modelForm,
                              model_type: e.target.value as ModelType,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                        >
                          {DEFAULT_MODEL_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {MODEL_TYPE_CONFIG[type].emoji}{" "}
                              {MODEL_TYPE_CONFIG[type].label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 预设模型快速选择 */}
                      {selectedPreset && selectedPreset.defaultModels && (
                        <div>
                          <label className="block text-xs text-text-muted mb-2">
                            快速选择预设模型
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedPreset.defaultModels.map((m) => (
                              <button
                                key={m.name}
                                onClick={() =>
                                  setModelForm({
                                    ...modelForm,
                                    name: m.name,
                                    display_name: m.display_name,
                                    model_type: m.model_type,
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                              >
                                {MODEL_TYPE_CONFIG[m.model_type].emoji}{" "}
                                {m.display_name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={
                            isCustomProvider
                              ? handleCreateCustomProviderAndModel
                              : handleAddModel
                          }
                          disabled={
                            !modelForm.name.trim() ||
                            !modelForm.display_name.trim() ||
                            (!isCustomProvider && !modelForm.provider_id)
                          }
                          className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                          添加模型
                        </button>
                        <button
                          onClick={resetAddModelForm}
                          className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 模型列表 - 按供应商分组 */}
                {providersWithModels.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl bg-bg-tertiary/40 border border-white/5">
                    <p className="text-4xl mb-3">🤖</p>
                    <p className="text-text-secondary">暂无配置的模型</p>
                    <p className="text-xs text-text-muted mt-1">
                      点击上方"添加模型"按钮开始配置
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {providersWithModels.map(({ provider, models: providerModels }) => (
                      <div
                        key={provider.id}
                        className="rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden"
                      >
                        {/* 供应商头部 */}
                        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {provider.icon || "🏢"}
                            </span>
                            <div>
                              <h3 className="text-base font-semibold text-text-primary">
                                {provider.display_name}
                              </h3>
                              <p className="text-xs text-text-muted">
                                {provider.provider_type === "cloud"
                                  ? "云服务商"
                                  : "本地部署"}
                                {provider.base_url &&
                                  ` • ${provider.base_url}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPreset(
                                PROVIDER_PRESETS.find(
                                  (p) => p.name === provider.name
                                ) || null
                              );
                              setModelForm({
                                ...modelForm,
                                provider_id: provider.id,
                              });
                              setShowAddModel(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                          >
                            + 添加模型
                          </button>
                        </div>

                        {/* 模型列表 */}
                        <div className="p-4 space-y-2">
                          {providerModels.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-bg-secondary/50 border border-white/5"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">
                                  {MODEL_TYPE_CONFIG[model.model_type]?.emoji || "🤖"}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-primary">
                                      {model.display_name}
                                    </span>
                                    {model.is_default && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                                        默认
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-text-muted">
                                    {model.name} •{" "}
                                    {MODEL_TYPE_CONFIG[model.model_type]?.label}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleDefault(model)}
                                  className={`px-2 py-1 rounded text-xs transition-colors border ${
                                    model.is_default
                                      ? "bg-accent-primary/20 text-accent-primary border-accent-primary/30"
                                      : "bg-bg-tertiary text-text-muted hover:text-text-secondary border-white/5"
                                  }`}
                                >
                                  {model.is_default ? "取消默认" : "设为默认"}
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model.id)}
                                  className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 默认模型配置 */}
            {activeTab === "defaults" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-6">
                    ⭐ 默认模型配置
                  </h3>
                  <p className="text-sm text-text-secondary mb-6">
                    设置各类任务的默认模型，创建任务时将自动选中
                  </p>

                  <div className="space-y-6">
                    {DEFAULT_MODEL_TYPES.map((modelType) => {
                      const config = MODEL_TYPE_CONFIG[modelType];
                      const defaultId = getDefaultModelId(modelType);
                      const availableModels = models.filter(
                        (m) => m.model_type === modelType && m.is_enabled
                      );

                      return (
                        <div key={modelType}>
                          <label className="flex items-center gap-2 text-base font-medium text-text-primary mb-3">
                            <span className="text-xl">{config.emoji}</span>
                            {config.label}
                          </label>
                          <p className="text-xs text-text-muted mb-3">
                            {config.description}
                          </p>
                          <select
                            value={defaultId}
                            onChange={(e) =>
                              handleSetDefault(modelType, e.target.value)
                            }
                            className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          >
                            <option value="">未设置</option>
                            {availableModels.map((m) => {
                              const provider = providers.find(
                                (p) => p.id === m.provider_id
                              );
                              return (
                                <option key={m.id} value={m.id}>
                                  {provider?.icon || ""} {m.display_name}{" "}
                                  ({provider?.display_name})
                                </option>
                              );
                            })}
                          </select>
                          {availableModels.length === 0 && (
                            <p className="text-xs text-text-muted mt-2">
                              暂无可用的{config.label}模型，请先在"模型管理"中添加
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="rounded-2xl bg-bg-secondary/50 border border-white/5 p-5">
                  <h4 className="text-sm font-medium text-text-primary mb-2">
                    💡 使用提示
                  </h4>
                  <ul className="text-sm text-text-secondary space-y-1.5">
                    <li>• 默认模型会在创建新任务时自动选中</li>
                    <li>• 你可以在创建任务时手动切换其他模型</li>
                    <li>• 本地模型需要确保对应服务已启动</li>
                    <li>• 云服务商模型需要配置正确的 API 密钥</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
