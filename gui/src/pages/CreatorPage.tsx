import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../services/taskService";
import { useTaskStore } from "../stores/taskStore";
import { modelService } from "../services/modelService";
import { useModelStore } from "../stores/modelStore";
import ProjectSelector from "../components/project/ProjectSelector";
import ProjectResourcePanel from "../components/project/ProjectResourcePanel";
import type {
  Asset,
  Character,
  Chapter,
  Script,
  Scene,
} from "../types/project";
import type { CreationType, ParamGroup } from "../types/creation";
import type { Model } from "../types/model";
import {
  STYLE_OPTIONS,
  PHOTOGRAPHY_GROUPS,
  POST_PRODUCTION_GROUPS,
  DIRECTOR_GROUPS,
  SUBJECT_GROUPS,
  ENVIRONMENT_GROUPS,
} from "../constants/creation-options";

const TYPE_OPTIONS: { id: CreationType; label: string; emoji: string }[] = [
  { id: "image", label: "图片", emoji: "🖼️" },
  { id: "video", label: "视频", emoji: "🎬" },
];

const SIZE_OPTIONS: {
  id: string;
  label: string;
  desc: string;
  type: "image" | "video" | "both";
}[] = [
  { id: "1:1", label: "1:1", desc: "正方形", type: "both" },
  { id: "4:3", label: "4:3", desc: "标准横屏", type: "image" },
  { id: "3:4", label: "3:4", desc: "标准竖屏", type: "image" },
  { id: "16:9", label: "16:9", desc: "宽屏横屏", type: "both" },
  { id: "9:16", label: "9:16", desc: "竖屏视频", type: "both" },
  { id: "3:2", label: "3:2", desc: "摄影横屏", type: "image" },
  { id: "2:3", label: "2:3", desc: "摄影竖屏", type: "image" },
  { id: "21:9", label: "21:9", desc: "超宽电影", type: "video" },
];

export default function CreatorPage() {
  const navigate = useNavigate();
  const { addTask } = useTaskStore();
  const {
    models,
    setModels,
    providers,
    setProviders,
    defaultModels,
    setDefaultModels,
  } = useModelStore();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<CreationType>("image");
  const [style, setStyle] = useState("realistic");
  const [isCreating, setIsCreating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [selectedReference, setSelectedReference] = useState<Asset | null>(
    null,
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null,
  );
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>(
    undefined,
  );
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("9:16");
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const sizePickerRef = useRef<HTMLDivElement>(null);

  // 加载模型数据
  useEffect(() => {
    async function loadModels() {
      try {
        const [modelsRes, providersRes, defaultsRes] = await Promise.all([
          modelService.listModels(),
          modelService.listProviders(),
          modelService.getDefaultModels(),
        ]);
        setModels(modelsRes.data);
        setProviders(providersRes.data);
        setDefaultModels(defaultsRes);
      } catch (err) {
        console.error("Failed to load models:", err);
      }
    }
    loadModels();
  }, [setModels, setProviders, setDefaultModels]);

  // 根据创作类型设置默认模型
  useEffect(() => {
    const modelType = type === "image" ? "text_to_image" : "text_to_video";
    const defaultId =
      type === "image"
        ? defaultModels.default_image_model_id
        : defaultModels.default_video_model_id;

    if (defaultId && models.find((m) => m.id === defaultId)) {
      setSelectedModelId(defaultId);
    } else {
      const firstModel = models.find(
        (m) => m.model_type === modelType && m.is_enabled,
      );
      setSelectedModelId(firstModel?.id);
    }
  }, [type, defaultModels, models]);

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        modelPickerRef.current &&
        !modelPickerRef.current.contains(e.target as Node)
      ) {
        setShowModelPicker(false);
      }
      if (
        sizePickerRef.current &&
        !sizePickerRef.current.contains(e.target as Node)
      ) {
        setShowSizePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [photographyParams, setPhotographyParams] = useState<
    Record<string, string>
  >({});
  const [postProductionParams, setPostProductionParams] = useState<
    Record<string, string>
  >({});
  const [directorParams, setDirectorParams] = useState<Record<string, string>>(
    {},
  );
  const [subjectParams, setSubjectParams] = useState<Record<string, string>>(
    {},
  );
  const [environmentParams, setEnvironmentParams] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [prompt]);

  function handleParamChange(
    category:
      | "photography"
      | "postProduction"
      | "director"
      | "subject"
      | "environment",
    groupId: string,
    optionId: string,
  ) {
    const setters = {
      photography: setPhotographyParams,
      postProduction: setPostProductionParams,
      director: setDirectorParams,
      subject: setSubjectParams,
      environment: setEnvironmentParams,
    };
    const setter = setters[category];
    setter((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === optionId ? "" : optionId,
    }));
  }

  function buildParameters(): Record<string, unknown> {
    const params: Record<string, unknown> = {
      style,
      size: selectedSize,
      model_id: selectedModelId,
    };
    if (Object.keys(photographyParams).length > 0)
      params.photography = photographyParams;
    if (Object.keys(postProductionParams).length > 0)
      params.postProduction = postProductionParams;
    if (Object.keys(directorParams).length > 0)
      params.director = directorParams;
    if (Object.keys(subjectParams).length > 0) params.subject = subjectParams;
    if (Object.keys(environmentParams).length > 0)
      params.environment = environmentParams;

    // 项目资源关联
    if (selectedReference) {
      params.referenceImageUrl = selectedReference.file_path;
    }
    if (selectedCharacter) {
      const charDesc = [
        selectedCharacter.name,
        selectedCharacter.age && `${selectedCharacter.age}岁`,
        selectedCharacter.personality,
        selectedCharacter.visual_features,
        selectedCharacter.description,
      ]
        .filter(Boolean)
        .join("，");
      params.characterDescription = charDesc;
      // 传递角色参考图
      if (
        selectedCharacter.reference_images &&
        selectedCharacter.reference_images.length > 0
      ) {
        params.referenceImages = selectedCharacter.reference_images;
      }
    }
    if (selectedChapter && selectedScript) {
      params.chapterContext = {
        scriptTitle: selectedScript.title,
        chapterTitle: selectedChapter.title,
        chapterContent: selectedChapter.content,
      };
    }
    // 场景分镜
    if (selectedScene) {
      params.sceneContext = {
        description: selectedScene.description,
        mood: selectedScene.mood,
        shotType: selectedScene.shot_type,
        background: selectedScene.background_description,
        dialogue: selectedScene.dialogue,
      };
      params.scene_id = selectedScene.id;
    }

    return params;
  }

  async function handleCreate() {
    if (!prompt.trim() || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const task = await taskService.create({
        type,
        prompt: prompt.trim(),
        parameters: buildParameters(),
        project_id: projectId,
      });
      addTask(task);
      setPrompt("");
      navigate("/tasks");
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建任务失败";
      setError(message);
      console.error("Failed to create task:", err);
    } finally {
      setIsCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
  }

  function getSelectedCount() {
    return (
      Object.values(photographyParams).filter(Boolean).length +
      Object.values(postProductionParams).filter(Boolean).length +
      Object.values(directorParams).filter(Boolean).length +
      Object.values(subjectParams).filter(Boolean).length +
      Object.values(environmentParams).filter(Boolean).length
    );
  }

  function getSelectedModel(): Model | undefined {
    return models.find((m) => m.id === selectedModelId);
  }

  function getAvailableModels(): Model[] {
    const modelType = type === "image" ? "text_to_image" : "text_to_video";
    return models.filter((m) => m.model_type === modelType && m.is_enabled);
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full transition-all duration-1000 ${
            isFocused ? "opacity-15" : "opacity-5"
          }`}
          style={{
            background:
              "radial-gradient(ellipse, var(--accent-primary) 0%, transparent 70%)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(var(--text-muted) 1px, transparent 1px),
                              linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* 标题 */}
          <div className="text-center mb-5">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-accent-primary via-accent-tertiary to-accent-primary bg-clip-text text-transparent animate-gradient-x">
              VisCreate
            </h1>
            <p className="text-text-secondary text-lg">AI 驱动的视觉创作引擎</p>
          </div>

          {/* 主卡片 */}
          <div className="relative rounded-3xl transition-all duration-500 shadow-2xl shadow-black/30">
            {/* 边框光效 */}
            <div
              className={`absolute -inset-[1px] rounded-3xl transition-opacity duration-700 ${
                isFocused ? "opacity-100" : "opacity-0"
              }`}
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary), var(--accent-primary))",
                backgroundSize: "200% 200%",
                animation: "gradient-rotate 4s linear infinite",
              }}
            />

            <div className="relative bg-bg-secondary/95 backdrop-blur-2xl rounded-3xl">
              {/* 顶部工具栏 */}
              <div className="flex items-center justify-between px-8 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setType(opt.id)}
                      className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        type === opt.id
                          ? "bg-accent-primary text-bg-primary shadow-lg shadow-accent-primary/30"
                          : "bg-bg-tertiary/80 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                      }`}
                    >
                      <span className="mr-2">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-text-muted text-sm">
                  {prompt.length > 0 && <span>{prompt.length} 字</span>}
                  {getSelectedCount() > 0 && (
                    <span className="text-accent-primary">
                      {getSelectedCount()} 个参数
                    </span>
                  )}
                </div>
              </div>

              {/* 分隔线 */}
              <div className="mx-8 border-t border-white/5" />

              {/* 提示词输入区 */}
              <div className="px-8 py-5">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="描述你想要创作的内容..."
                  className="w-full bg-transparent text-base text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none min-h-[80px] max-h-[160px] leading-relaxed"
                  rows={3}
                />
              </div>

              {/* 风格选择 */}
              <div className="mx-8 mb-3">
                <StyleSection
                  options={STYLE_OPTIONS}
                  selected={style}
                  onSelect={setStyle}
                />
              </div>

              {/* 参数分组 - 输入框内部 */}
              {showParams && (
                <div className="mx-8 mb-4 space-y-3">
                  <ParamSection
                    title="主体"
                    emoji="🎭"
                    groups={SUBJECT_GROUPS}
                    selectedParams={subjectParams}
                    onChange={(g, o) => handleParamChange("subject", g, o)}
                  />
                  <ParamSection
                    title="摄影师"
                    emoji="📷"
                    groups={PHOTOGRAPHY_GROUPS}
                    selectedParams={photographyParams}
                    onChange={(g, o) => handleParamChange("photography", g, o)}
                  />
                  <ParamSection
                    title="环境"
                    emoji="🌍"
                    groups={ENVIRONMENT_GROUPS}
                    selectedParams={environmentParams}
                    onChange={(g, o) => handleParamChange("environment", g, o)}
                  />
                  <ParamSection
                    title="后期"
                    emoji="🎨"
                    groups={POST_PRODUCTION_GROUPS}
                    selectedParams={postProductionParams}
                    onChange={(g, o) =>
                      handleParamChange("postProduction", g, o)
                    }
                  />
                  {type === "video" && (
                    <ParamSection
                      title="导演"
                      emoji="🎬"
                      groups={DIRECTOR_GROUPS}
                      selectedParams={directorParams}
                      onChange={(g, o) => handleParamChange("director", g, o)}
                    />
                  )}
                </div>
              )}

              {/* 项目资源选择 */}
              {projectId && (
                <ProjectResourcePanel
                  projectId={projectId}
                  onReferenceSelect={setSelectedReference}
                  onCharacterSelect={(char) => {
                    setSelectedCharacter(char);
                  }}
                  onChapterSelect={(chapter, script) => {
                    setSelectedChapter(chapter);
                    setSelectedScript(script);
                  }}
                  onSceneSelect={setSelectedScene}
                  selectedReference={selectedReference}
                  selectedCharacter={selectedCharacter}
                  selectedChapter={selectedChapter}
                  selectedScene={selectedScene}
                />
              )}

              {/* 底部操作栏 */}
              <div className="flex items-center justify-between px-8 py-4 bg-bg-tertiary/30 rounded-b-3xl">
                <div className="flex items-center gap-4">
                  {/* 就绪状态 + 模型选择 */}
                  <div className="relative" ref={modelPickerRef}>
                    <button
                      onClick={() => setShowModelPicker(!showModelPicker)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary border border-white/5 hover:border-white/10 transition-all text-sm"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isCreating ? "bg-accent-secondary animate-pulse" : "bg-accent-primary"}`}
                      />
                      <span className="text-text-muted">
                        {isCreating ? "生成中" : "就绪"}
                      </span>
                      {getSelectedModel() && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-text-secondary font-medium">
                            {getSelectedModel()?.display_name}
                          </span>
                        </>
                      )}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-text-muted transition-transform ${showModelPicker ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* 模型选择下拉 */}
                    {showModelPicker && (
                      <div className="absolute bottom-full left-0 mb-2 w-80 max-h-[320px] overflow-y-auto rounded-xl bg-bg-secondary border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl z-50">
                        <div className="p-3 border-b border-white/5">
                          <div className="text-xs text-text-muted font-medium">
                            选择模型
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          {getAvailableModels().map((model) => {
                            const provider = providers.find(
                              (p) => p.id === model.provider_id,
                            );
                            const isDefault =
                              (type === "image" &&
                                model.id ===
                                  defaultModels.default_image_model_id) ||
                              (type === "video" &&
                                model.id ===
                                  defaultModels.default_video_model_id);
                            return (
                              <button
                                key={model.id}
                                onClick={() => {
                                  setSelectedModelId(model.id);
                                  setShowModelPicker(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                                  selectedModelId === model.id
                                    ? "bg-accent-primary/10 border border-accent-primary/30"
                                    : "hover:bg-white/5 border border-transparent"
                                }`}
                              >
                                <span className="text-lg">
                                  {provider?.icon || "🤖"}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-text-primary truncate">
                                      {model.display_name}
                                    </span>
                                    {isDefault && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent-primary/20 text-accent-primary">
                                        默认
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-text-muted truncate">
                                    {provider?.display_name}
                                  </div>
                                </div>
                                {selectedModelId === model.id && (
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-accent-primary flex-shrink-0"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                          {getAvailableModels().length === 0 && (
                            <div className="text-center py-6 text-text-muted text-sm">
                              <p>暂无可用模型</p>
                              <button
                                onClick={() => {
                                  navigate("/settings");
                                  setShowModelPicker(false);
                                }}
                                className="mt-2 text-accent-primary hover:underline"
                              >
                                前往设置添加模型 →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <ProjectSelector
                    selectedId={projectId}
                    onSelect={(id) => {
                      setProjectId(id);
                      setSelectedReference(null);
                      setSelectedCharacter(null);
                      setSelectedChapter(null);
                      setSelectedScript(null);
                    }}
                  />

                  {/* 参数按钮 */}
                  <button
                    onClick={() => setShowParams(!showParams)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      showParams
                        ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                        : "bg-bg-secondary/50 text-text-muted hover:text-text-secondary hover:bg-bg-secondary border border-white/5 hover:border-white/10"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>参数</span>
                    {getSelectedCount() > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary text-[10px]">
                        {getSelectedCount()}
                      </span>
                    )}
                  </button>

                  {/* 尺寸选择 */}
                  <div className="relative" ref={sizePickerRef}>
                    <button
                      onClick={() => setShowSizePicker(!showSizePicker)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary border border-white/5 hover:border-white/10 transition-all text-sm"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 21V9" />
                      </svg>
                      <span className="text-text-secondary">
                        {selectedSize}
                      </span>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`text-text-muted transition-transform ${showSizePicker ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {showSizePicker && (
                      <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl bg-bg-secondary border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl z-50">
                        <div className="p-2 space-y-0.5">
                          {SIZE_OPTIONS.filter(
                            (s) => s.type === "both" || s.type === type,
                          ).map((size) => (
                            <button
                              key={size.id}
                              onClick={() => {
                                setSelectedSize(size.id);
                                setShowSizePicker(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                                selectedSize === size.id
                                  ? "bg-accent-primary/10 border border-accent-primary/30"
                                  : "hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <span className="text-sm font-medium text-text-primary">
                                {size.label}
                              </span>
                              <span className="text-xs text-text-muted">
                                {size.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCreate}
                    disabled={!prompt.trim() || isCreating}
                    className={`group px-6 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                      prompt.trim() && !isCreating
                        ? "bg-gradient-to-r from-accent-primary to-accent-tertiary text-bg-primary hover:shadow-lg hover:shadow-accent-primary/30 hover:scale-105 active:scale-95"
                        : "bg-bg-tertiary text-text-muted cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {isCreating ? (
                        <>
                          <LoadingSpinner />
                          创作中
                        </>
                      ) : (
                        <>
                          开始创作
                          <SendIcon />
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 mx-auto max-w-4xl">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 快捷提示 */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              "一只在月光下奔跑的狼",
              "未来城市的天际线",
              "水墨风格的山水画",
              "赛博朋克风格的街头",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="px-4 py-2 rounded-xl bg-bg-secondary/40 text-text-muted text-sm hover:bg-bg-secondary hover:text-text-secondary transition-all border border-white/5 hover:border-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 风格选择组件 - 可折叠
function StyleSection({
  options,
  selected,
  onSelect,
}: {
  options: { id: string; label: string; emoji: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.id === selected);

  return (
    <div className="bg-bg-tertiary/40 rounded-xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>🎨</span>
          <span className="text-text-primary text-sm font-medium">风格</span>
          {selectedOption && (
            <span className="px-2 py-0.5 rounded-full bg-accent-tertiary/20 text-accent-tertiary text-xs">
              {selectedOption.emoji} {selectedOption.label}
            </span>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-5 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelect(opt.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                  selected === opt.id
                    ? "bg-accent-tertiary/25 text-accent-tertiary border border-accent-tertiary/40"
                    : "bg-bg-secondary/50 text-text-muted hover:text-text-secondary hover:bg-bg-secondary border border-transparent"
                }`}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 参数分组组件 - 可折叠
function ParamSection({
  title,
  emoji,
  groups,
  selectedParams,
  onChange,
}: {
  title: string;
  emoji: string;
  groups: ParamGroup[];
  selectedParams: Record<string, string>;
  onChange: (groupId: string, optionId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // 获取选中的选项详情
  const selectedOptions = groups.flatMap((group) =>
    group.options
      .filter((opt) => selectedParams[group.id] === opt.id)
      .map((opt) => ({ emoji: opt.emoji, label: opt.label })),
  );
  const selectedCount = selectedOptions.length;

  return (
    <div className="bg-bg-tertiary/40 rounded-xl border border-white/5 overflow-hidden">
      {/* 头部 - 可点击折叠 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span>{emoji}</span>
          <span className="text-text-primary text-sm font-medium">{title}</span>
          {selectedCount > 0 && (
            <>
              {selectedOptions.slice(0, 4).map((opt, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-accent-tertiary/20 text-accent-tertiary text-xs whitespace-nowrap"
                >
                  {opt.emoji} {opt.label}
                </span>
              ))}
              {selectedCount > 4 && (
                <span className="px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary text-xs">
                  +{selectedCount - 4}
                </span>
              )}
            </>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 内容 */}
      {isOpen && (
        <div className="px-5 pb-4 space-y-3">
          {groups.map((group) => (
            <div key={group.id}>
              <div className="text-text-muted text-xs mb-1.5 flex items-center gap-1">
                <span>{group.emoji}</span>
                <span>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onChange(group.id, opt.id)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                      selectedParams[group.id] === opt.id
                        ? "bg-accent-tertiary/25 text-accent-tertiary border border-accent-tertiary/40"
                        : "bg-bg-secondary/50 text-text-muted hover:text-text-secondary hover:bg-bg-secondary border border-transparent"
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  );
}
