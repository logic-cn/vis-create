import { useState, useEffect } from "react";
import { modelService } from "../services/modelService";
import { useModelStore } from "../stores/modelStore";
import type {
  ModelProvider,
  Model,
  ModelType,
  ProviderType,
  ModelProviderCreateParams,
  ModelCreateParams,
} from "../types/model";
import {
  CLOUD_PROVIDERS,
  LOCAL_PROVIDERS,
  MODEL_TYPE_CONFIG,
} from "../types/model";

type SettingsTab = "providers" | "models" | "defaults";

export default function SettingsPage() {
  const {
    providers,
    setProviders,
    addProvider,
    updateProvider,
    removeProvider,
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

  const [activeTab, setActiveTab] = useState<SettingsTab>("providers");
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(
    null,
  );
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // 表单状态
  const [providerForm, setProviderForm] = useState<ModelProviderCreateParams>({
    name: "",
    display_name: "",
    provider_type: "cloud",
    base_url: "",
    api_key: "",
    description: "",
    icon: "",
  });
  const [modelForm, setModelForm] = useState<ModelCreateParams>({
    provider_id: "",
    name: "",
    display_name: "",
    model_type: "text_to_image",
    description: "",
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

  // ── 提供商操作 ──

  async function handleCreateProvider() {
    if (!providerForm.name.trim() || !providerForm.display_name.trim()) return;
    setError(null);
    try {
      // 清理空字符串字段，转换为 null
      const cleanedData = {
        ...providerForm,
        base_url: providerForm.base_url || undefined,
        api_key: providerForm.api_key || undefined,
        description: providerForm.description || undefined,
        icon: providerForm.icon || undefined,
      };
      const provider = await modelService.createProvider(cleanedData);
      addProvider(provider);
      resetProviderForm();
      setShowAddProvider(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "创建失败";
      setError(message);
      console.error("Create provider failed:", err);
    }
  }

  async function handleUpdateProvider() {
    if (!editingProvider) return;
    try {
      const updated = await modelService.updateProvider(editingProvider.id, {
        display_name: providerForm.display_name,
        base_url: providerForm.base_url || undefined,
        api_key: providerForm.api_key || undefined,
        description: providerForm.description || undefined,
        icon: providerForm.icon || undefined,
      });
      updateProvider(updated);
      setEditingProvider(null);
      resetProviderForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "更新失败";
      setError(message);
      console.error("Update provider failed:", err);
    }
  }

  async function handleDeleteProvider(id: string) {
    try {
      await modelService.deleteProvider(id);
      removeProvider(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "删除失败";
      setError(message);
      console.error("Delete provider failed:", err);
    }
  }

  function resetProviderForm() {
    setProviderForm({
      name: "",
      display_name: "",
      provider_type: "cloud",
      base_url: "",
      api_key: "",
      description: "",
      icon: "",
    });
  }

  function startEditProvider(provider: ModelProvider) {
    setEditingProvider(provider);
    setProviderForm({
      name: provider.name,
      display_name: provider.display_name,
      provider_type: provider.provider_type,
      base_url: provider.base_url || "",
      api_key: provider.api_key || "",
      description: provider.description || "",
      icon: provider.icon || "",
    });
  }

  function addPresetProvider(preset: ModelProviderCreateParams) {
    setProviderForm(preset);
    setShowAddProvider(true);
  }

  // ── 模型操作 ──

  async function handleCreateModel() {
    if (
      !modelForm.provider_id ||
      !modelForm.name.trim() ||
      !modelForm.display_name.trim()
    )
      return;
    try {
      const model = await modelService.createModel(modelForm);
      addModel(model);
      resetModelForm();
      setShowAddModel(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "创建失败";
      setError(message);
      console.error("Create model failed:", err);
    }
  }

  async function handleUpdateModel() {
    if (!editingModel) return;
    try {
      const updated = await modelService.updateModel(editingModel.id, {
        display_name: modelForm.display_name,
        description: modelForm.description,
      });
      updateModel(updated);
      setEditingModel(null);
      resetModelForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "更新失败";
      setError(message);
      console.error("Update model failed:", err);
    }
  }

  async function handleDeleteModel(id: string) {
    try {
      await modelService.deleteModel(id);
      removeModel(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "删除失败";
      setError(message);
      console.error("Delete model failed:", err);
    }
  }

  async function handleToggleModelDefault(model: Model) {
    try {
      const updated = await modelService.updateModel(model.id, {
        is_default: !model.is_default,
      });
      updateModel(updated);
      // 重新加载默认配置
      const defaults = await modelService.getDefaultModels();
      setDefaultModels(defaults);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "设置默认模型失败";
      setError(message);
      console.error("Toggle model default failed:", err);
    }
  }

  function resetModelForm() {
    setModelForm({
      provider_id: "",
      name: "",
      display_name: "",
      model_type: "text_to_image",
      description: "",
    });
  }

  function startEditModel(model: Model) {
    setEditingModel(model);
    setModelForm({
      provider_id: model.provider_id,
      name: model.name,
      display_name: model.display_name,
      model_type: model.model_type,
      description: model.description || "",
    });
  }

  // 获取提供商下的模型
  function getProviderModels(providerId: string) {
    return models.filter((m) => m.provider_id === providerId);
  }

  // 获取默认模型名称
  function getDefaultModelName(type: ModelType): string {
    const modelId =
      type === "text_to_image"
        ? defaultModels.default_image_model_id
        : defaultModels.default_video_model_id;
    if (!modelId) return "未设置";
    const model = models.find((m) => m.id === modelId);
    return model ? model.display_name : "未设置";
  }

  const tabs = [
    { id: "providers" as SettingsTab, label: "模型提供商", emoji: "🏢" },
    { id: "models" as SettingsTab, label: "模型管理", emoji: "🤖" },
    { id: "defaults" as SettingsTab, label: "默认模型", emoji: "⭐" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 页面头部 */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-text-primary">模型设置</h1>
        <p className="text-text-secondary text-sm mt-1">
          管理文生图、文生视频模型配置
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
            {/* 提供商管理 */}
            {activeTab === "providers" && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* 快速添加预设提供商 */}
                <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5">
                  <h3 className="text-base font-semibold text-text-primary mb-3">
                    快速添加云服务商
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {CLOUD_PROVIDERS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => addPresetProvider(preset)}
                        className="px-3 py-1.5 rounded-lg bg-bg-secondary text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80 transition-colors border border-white/5"
                      >
                        {preset.icon} {preset.display_name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5">
                  <h3 className="text-base font-semibold text-text-primary mb-3">
                    快速添加本地模型
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {LOCAL_PROVIDERS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => addPresetProvider(preset)}
                        className="px-3 py-1.5 rounded-lg bg-bg-secondary text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80 transition-colors border border-white/5"
                      >
                        {preset.icon} {preset.display_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 添加/编辑提供商表单 */}
                {(showAddProvider || editingProvider) && (
                  <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-4">
                      {editingProvider ? "编辑提供商" : "添加提供商"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            提供商标识 *
                          </label>
                          <input
                            type="text"
                            value={providerForm.name}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="如：openai"
                            disabled={!!editingProvider}
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            显示名称 *
                          </label>
                          <input
                            type="text"
                            value={providerForm.display_name}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                display_name: e.target.value,
                              })
                            }
                            placeholder="如：OpenAI"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            类型
                          </label>
                          <select
                            value={providerForm.provider_type}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                provider_type: e.target.value as ProviderType,
                              })
                            }
                            disabled={!!editingProvider}
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40 disabled:opacity-50"
                          >
                            <option value="cloud">云服务商</option>
                            <option value="local">本地部署</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            图标
                          </label>
                          <input
                            type="text"
                            value={providerForm.icon || ""}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                icon: e.target.value,
                              })
                            }
                            placeholder="emoji 图标"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                      </div>
                      {providerForm.provider_type === "local" && (
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            API 地址
                          </label>
                          <input
                            type="text"
                            value={providerForm.base_url || ""}
                            onChange={(e) =>
                              setProviderForm({
                                ...providerForm,
                                base_url: e.target.value,
                              })
                            }
                            placeholder="http://localhost:11434"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm text-text-secondary mb-1.5">
                          API 密钥
                        </label>
                        <input
                          type="password"
                          value={providerForm.api_key || ""}
                          onChange={(e) =>
                            setProviderForm({
                              ...providerForm,
                              api_key: e.target.value,
                            })
                          }
                          placeholder="输入 API 密钥（本地模型可留空）"
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1.5">
                          描述
                        </label>
                        <textarea
                          value={providerForm.description || ""}
                          onChange={(e) =>
                            setProviderForm({
                              ...providerForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="提供商描述"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={
                            editingProvider
                              ? handleUpdateProvider
                              : handleCreateProvider
                          }
                          disabled={
                            !providerForm.name.trim() ||
                            !providerForm.display_name.trim()
                          }
                          className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                          {editingProvider ? "保存修改" : "添加提供商"}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddProvider(false);
                            setEditingProvider(null);
                            resetProviderForm();
                          }}
                          className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 提供商列表 */}
                <div className="space-y-3">
                  {providers.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-bg-tertiary/40 border border-white/5">
                      <p className="text-4xl mb-3">🏢</p>
                      <p className="text-text-secondary">暂无模型提供商</p>
                      <p className="text-xs text-text-muted mt-1">
                        点击上方按钮添加提供商
                      </p>
                    </div>
                  ) : (
                    providers.map((provider) => (
                      <div
                        key={provider.id}
                        className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {provider.icon || "🏢"}
                            </span>
                            <div>
                              <h4 className="text-base font-semibold text-text-primary">
                                {provider.display_name}
                              </h4>
                              <p className="text-xs text-text-muted">
                                {provider.provider_type === "cloud"
                                  ? "云服务商"
                                  : "本地部署"}
                                {provider.base_url && ` • ${provider.base_url}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditProvider(provider)}
                              className="px-3 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteProvider(provider.id)}
                              className="px-3 py-1.5 rounded-lg bg-bg-secondary text-xs text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                        {provider.description && (
                          <p className="text-sm text-text-secondary mt-2">
                            {provider.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getProviderModels(provider.id).map((model) => (
                            <span
                              key={model.id}
                              className={`px-2 py-1 rounded text-xs ${
                                model.is_default
                                  ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
                                  : "bg-bg-secondary text-text-muted border border-white/5"
                              }`}
                            >
                              {MODEL_TYPE_CONFIG[model.model_type].emoji}{" "}
                              {model.display_name}
                              {model.is_default && " ⭐"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 模型管理 */}
            {activeTab === "models" && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <select
                      value={selectedProviderId || ""}
                      onChange={(e) =>
                        setSelectedProviderId(e.target.value || null)
                      }
                      className="px-3 py-2 rounded-lg bg-bg-tertiary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                    >
                      <option value="">全部提供商</option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.icon} {p.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => setShowAddModel(true)}
                    disabled={providers.length === 0}
                    className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    + 添加模型
                  </button>
                </div>

                {/* 添加/编辑模型表单 */}
                {(showAddModel || editingModel) && (
                  <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5">
                    <h3 className="text-base font-semibold text-text-primary mb-4">
                      {editingModel ? "编辑模型" : "添加模型"}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            所属提供商 *
                          </label>
                          <select
                            value={modelForm.provider_id}
                            onChange={(e) =>
                              setModelForm({
                                ...modelForm,
                                provider_id: e.target.value,
                              })
                            }
                            disabled={!!editingModel}
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40 disabled:opacity-50"
                          >
                            <option value="">选择提供商</option>
                            {providers.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.icon} {p.display_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
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
                            disabled={!!editingModel}
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40 disabled:opacity-50"
                          >
                            {Object.entries(MODEL_TYPE_CONFIG).map(
                              ([key, config]) => (
                                <option key={key} value={key}>
                                  {config.emoji} {config.label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
                            模型标识 *
                          </label>
                          <input
                            type="text"
                            value={modelForm.name}
                            onChange={(e) =>
                              setModelForm({
                                ...modelForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="如：dall-e-3"
                            disabled={!!editingModel}
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-1.5">
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
                            placeholder="如：DALL-E 3"
                            className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-text-secondary mb-1.5">
                          描述
                        </label>
                        <textarea
                          value={modelForm.description || ""}
                          onChange={(e) =>
                            setModelForm({
                              ...modelForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="模型描述"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={
                            editingModel ? handleUpdateModel : handleCreateModel
                          }
                          disabled={
                            !modelForm.provider_id ||
                            !modelForm.name.trim() ||
                            !modelForm.display_name.trim()
                          }
                          className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                          {editingModel ? "保存修改" : "添加模型"}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddModel(false);
                            setEditingModel(null);
                            resetModelForm();
                          }}
                          className="px-4 py-2 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 模型列表 */}
                <div className="space-y-3">
                  {models.filter(
                    (m) =>
                      !selectedProviderId ||
                      m.provider_id === selectedProviderId,
                  ).length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-bg-tertiary/40 border border-white/5">
                      <p className="text-4xl mb-3">🤖</p>
                      <p className="text-text-secondary">暂无模型</p>
                      <p className="text-xs text-text-muted mt-1">
                        {providers.length === 0
                          ? "请先添加模型提供商"
                          : "点击上方按钮添加模型"}
                      </p>
                    </div>
                  ) : (
                    models
                      .filter(
                        (m) =>
                          !selectedProviderId ||
                          m.provider_id === selectedProviderId,
                      )
                      .map((model) => {
                        const provider = providers.find(
                          (p) => p.id === model.provider_id,
                        );
                        return (
                          <div
                            key={model.id}
                            className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">
                                  {MODEL_TYPE_CONFIG[model.model_type].emoji}
                                </span>
                                <div>
                                  <h4 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                    {model.display_name}
                                    {model.is_default && (
                                      <span className="px-2 py-0.5 rounded text-xs bg-accent-primary/20 text-accent-primary border border-accent-primary/30">
                                        默认
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-text-muted">
                                    {provider?.display_name} •{" "}
                                    {MODEL_TYPE_CONFIG[model.model_type].label}{" "}
                                    • {model.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleToggleModelDefault(model)
                                  }
                                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                                    model.is_default
                                      ? "bg-accent-primary/20 text-accent-primary border-accent-primary/30"
                                      : "bg-bg-secondary text-text-secondary hover:text-text-primary border-white/5"
                                  }`}
                                >
                                  {model.is_default ? "取消默认" : "设为默认"}
                                </button>
                                <button
                                  onClick={() => startEditModel(model)}
                                  className="px-3 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(model.id)}
                                  className="px-3 py-1.5 rounded-lg bg-bg-secondary text-xs text-red-400 hover:bg-red-500/10 transition-colors border border-white/5"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                            {model.description && (
                              <p className="text-sm text-text-secondary mt-2">
                                {model.description}
                              </p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* 默认模型配置 */}
            {activeTab === "defaults" && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="rounded-2xl bg-bg-tertiary/40 border border-white/5 p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-6">
                    默认模型配置
                  </h3>
                  <p className="text-sm text-text-secondary mb-6">
                    设置默认的文生图和文生视频模型，创建任务时将自动使用默认模型
                  </p>

                  <div className="space-y-6">
                    {/* 默认文生图模型 */}
                    <div>
                      <label className="flex items-center gap-2 text-base font-medium text-text-primary mb-3">
                        <span className="text-xl">
                          {MODEL_TYPE_CONFIG.text_to_image.emoji}
                        </span>
                        默认文生图模型
                      </label>
                      <select
                        value={defaultModels.default_image_model_id || ""}
                        onChange={async (e) => {
                          const newDefaults = {
                            ...defaultModels,
                            default_image_model_id: e.target.value || undefined,
                          };
                          const updated =
                            await modelService.updateDefaultModels(newDefaults);
                          setDefaultModels(updated);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                      >
                        <option value="">未设置</option>
                        {models
                          .filter((m) => m.model_type === "text_to_image")
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {providers.find((p) => p.id === m.provider_id)
                                ?.icon || ""}{" "}
                              {m.display_name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-text-muted mt-2">
                        当前：{getDefaultModelName("text_to_image")}
                      </p>
                    </div>

                    {/* 默认文生视频模型 */}
                    <div>
                      <label className="flex items-center gap-2 text-base font-medium text-text-primary mb-3">
                        <span className="text-xl">
                          {MODEL_TYPE_CONFIG.text_to_video.emoji}
                        </span>
                        默认文生视频模型
                      </label>
                      <select
                        value={defaultModels.default_video_model_id || ""}
                        onChange={async (e) => {
                          const newDefaults = {
                            ...defaultModels,
                            default_video_model_id: e.target.value || undefined,
                          };
                          const updated =
                            await modelService.updateDefaultModels(newDefaults);
                          setDefaultModels(updated);
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-sm text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                      >
                        <option value="">未设置</option>
                        {models
                          .filter((m) => m.model_type === "text_to_video")
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {providers.find((p) => p.id === m.provider_id)
                                ?.icon || ""}{" "}
                              {m.display_name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-text-muted mt-2">
                        当前：{getDefaultModelName("text_to_video")}
                      </p>
                    </div>
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
