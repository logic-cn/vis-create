import { useEffect, useState } from "react";
import { projectService } from "../../services/projectService";
import { useProjectStore } from "../../stores/projectStore";
import type {
  Chapter,
  Scene,
  SceneCreateParams,
  ScriptCreateParams,
} from "../../types/project";

interface ScriptPanelProps {
  projectId: string;
}

const SHOT_TYPES = [
  { id: "extreme_close_up", label: "特写", emoji: "🔍" },
  { id: "close_up", label: "近景", emoji: "👤" },
  { id: "medium_shot", label: "中景", emoji: "🧑" },
  { id: "full_shot", label: "全景", emoji: "🏃" },
  { id: "long_shot", label: "远景", emoji: "🏔️" },
  { id: "birds_eye", label: "鸟瞰", emoji: "🦅" },
  { id: "low_angle", label: "仰拍", emoji: "⬆️" },
  { id: "high_angle", label: "俯拍", emoji: "⬇️" },
  { id: "dutch_angle", label: "倾斜", emoji: "↩️" },
];

export default function ScriptPanel({ projectId }: ScriptPanelProps) {
  const {
    scripts,
    setScripts,
    addScript,
    updateScript,
    removeScript,
    chapters,
    setChapters,
    addChapter,
    updateChapter,
    removeChapter,
    scenes,
    setScenes,
    addScene,
    updateScene,
    removeScene,
  } = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ScriptCreateParams>({
    title: "",
    description: "",
  });
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editChapterTitle, setEditChapterTitle] = useState("");

  // 分镜相关状态
  const [isCreatingScene, setIsCreatingScene] = useState(false);
  const [sceneForm, setSceneForm] = useState<SceneCreateParams>({
    title: "",
    description: "",
    sort_order: 0,
    shot_type: "medium_shot",
    dialogue: "",
    background_description: "",
    mood: "",
  });
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // AI拆解相关状态
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [breakdownResults, setBreakdownResults] = useState<
    SceneCreateParams[] | null
  >(null);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  const script = scripts[0] || null;
  const scriptChapters = script ? chapters[script.id] || [] : [];
  const chapterScenes = selectedChapter ? scenes[selectedChapter.id] || [] : [];

  useEffect(() => {
    projectService.listScripts(projectId).then((res) => setScripts(res.data));
  }, [projectId, setScripts]);

  useEffect(() => {
    if (script && !chapters[script.id]) {
      projectService
        .listChapters(projectId, script.id)
        .then((res) => setChapters(script.id, res.data));
    }
  }, [projectId, script, chapters, setChapters]);

  // 加载选中章节的分镜
  useEffect(() => {
    if (selectedChapter && script && !scenes[selectedChapter.id]) {
      projectService
        .listScenes(projectId, script.id, selectedChapter.id)
        .then((res) => setScenes(selectedChapter.id, res.data));
    }
  }, [projectId, script, selectedChapter, scenes, setScenes]);

  async function handleCreateScript() {
    if (!form.title.trim()) return;
    try {
      const newScript = await projectService.createScript(projectId, form);
      addScript(newScript);
      setForm({ title: "", description: "" });
      setIsCreating(false);
    } catch (err) {
      console.error("Create script failed:", err);
    }
  }

  async function handleUpdateScript() {
    if (!script || !editForm.title.trim()) return;
    try {
      const updated = await projectService.updateScript(
        projectId,
        script.id,
        editForm,
      );
      updateScript(updated);
      setIsEditingScript(false);
    } catch (err) {
      console.error("Update script failed:", err);
    }
  }

  async function handleDeleteScript() {
    if (!script) return;
    try {
      await projectService.deleteScript(projectId, script.id);
      removeScript(script.id);
      setSelectedChapter(null);
    } catch (err) {
      console.error("Delete script failed:", err);
    }
  }

  async function handleAddChapter() {
    if (!script || !newChapterTitle.trim()) return;
    try {
      const chapter = await projectService.createChapter(projectId, script.id, {
        title: newChapterTitle.trim(),
        sort_order: scriptChapters.length + 1,
      });
      addChapter(script.id, chapter);
      setNewChapterTitle("");
      setSelectedChapter(chapter);
      setEditContent(chapter.content || "");
      setEditChapterTitle(chapter.title);
    } catch (err) {
      console.error("Create chapter failed:", err);
    }
  }

  async function handleUpdateChapter() {
    if (!script || !selectedChapter) return;
    try {
      const updated = await projectService.updateChapter(
        projectId,
        script.id,
        selectedChapter.id,
        { content: editContent, title: editChapterTitle },
      );
      updateChapter(script.id, updated);
      setSelectedChapter(updated);
    } catch (err) {
      console.error("Update chapter failed:", err);
    }
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!script) return;
    try {
      await projectService.deleteChapter(projectId, script.id, chapterId);
      removeChapter(script.id, chapterId);
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
    } catch (err) {
      console.error("Delete chapter failed:", err);
    }
  }

  function handleSelectChapter(chapter: Chapter) {
    setSelectedChapter(chapter);
    setEditContent(chapter.content || "");
    setEditChapterTitle(chapter.title);
    setEditingScene(null);
    setBreakdownResults(null);
    setBreakdownError(null);
  }

  // AI拆解分镜
  async function handleBreakdownScenes() {
    if (!script || !selectedChapter) return;
    setIsBreakingDown(true);
    setBreakdownError(null);
    setBreakdownResults(null);

    try {
      const result = await projectService.breakdownScenes(
        projectId,
        script.id,
        selectedChapter.id,
        { max_scenes: 8 },
      );
      setBreakdownResults(result.scenes);
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI拆解失败";
      setBreakdownError(message);
      console.error("Breakdown failed:", err);
    } finally {
      setIsBreakingDown(false);
    }
  }

  // 批量创建拆解结果
  async function handleCreateBreakdownScenes() {
    if (!script || !selectedChapter || !breakdownResults) return;

    try {
      for (const sceneData of breakdownResults) {
        const scene = await projectService.createScene(
          projectId,
          script.id,
          selectedChapter.id,
          { ...sceneData, sort_order: chapterScenes.length + 1 },
        );
        addScene(selectedChapter.id, scene);
      }
      setBreakdownResults(null);
    } catch (err) {
      console.error("Create breakdown scenes failed:", err);
    }
  }

  // 分镜操作
  async function handleCreateScene() {
    if (!script || !selectedChapter || !sceneForm.title.trim()) return;
    try {
      const scene = await projectService.createScene(
        projectId,
        script.id,
        selectedChapter.id,
        { ...sceneForm, sort_order: chapterScenes.length + 1 },
      );
      addScene(selectedChapter.id, scene);
      setSceneForm({
        title: "",
        description: "",
        sort_order: 0,
        shot_type: "medium_shot",
        dialogue: "",
        background_description: "",
        mood: "",
      });
      setIsCreatingScene(false);
    } catch (err) {
      console.error("Create scene failed:", err);
    }
  }

  async function handleGenerateSceneArtwork(sceneId: string) {
    if (!script || !selectedChapter) return;
    try {
      await projectService.generateSceneArtwork(
        projectId,
        script.id,
        selectedChapter.id,
        sceneId,
      );
      alert("已创建生成任务，请在任务队列中查看进度");
    } catch (err) {
      console.error("Generate scene artwork failed:", err);
      alert("创建生成任务失败");
    }
  }

  async function handleUpdateScene() {
    if (!script || !selectedChapter || !editingScene) return;
    try {
      const updated = await projectService.updateScene(
        projectId,
        script.id,
        selectedChapter.id,
        editingScene.id,
        editingScene,
      );
      updateScene(selectedChapter.id, updated);
      setEditingScene(null);
    } catch (err) {
      console.error("Update scene failed:", err);
    }
  }

  async function handleDeleteScene(sceneId: string) {
    if (!script || !selectedChapter) return;
    try {
      await projectService.deleteScene(
        projectId,
        script.id,
        selectedChapter.id,
        sceneId,
      );
      removeScene(selectedChapter.id, sceneId);
      if (editingScene?.id === sceneId) {
        setEditingScene(null);
      }
    } catch (err) {
      console.error("Delete scene failed:", err);
    }
  }

  // 无剧本时显示创建界面
  if (!script && !isCreating) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">剧本管理</h2>
        </div>
        <div className="text-center py-12 rounded-2xl bg-bg-tertiary/40 border border-white/5">
          <p className="text-4xl mb-3">📖</p>
          <p className="text-text-secondary mb-2">暂无剧本</p>
          <p className="text-xs text-text-muted mb-4">
            每个项目可以创建一个剧本
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
          >
            创建剧本
          </button>
        </div>
      </div>
    );
  }

  // 创建剧本表单
  if (isCreating) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">创建剧本</h2>
          <button
            onClick={() => setIsCreating(false)}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
          >
            取消
          </button>
        </div>
        <div className="p-5 rounded-2xl bg-bg-tertiary/40 border border-white/5 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              剧本名称 *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="输入剧本名称"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              剧本简介
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="简要描述剧本内容..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
            />
          </div>
          <button
            onClick={handleCreateScript}
            disabled={!form.title.trim()}
            className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            创建剧本
          </button>
        </div>
      </div>
    );
  }

  // 剧本详情 - 三栏布局：章节列表 | 章节内容 | 分镜列表
  return (
    <div>
      {/* 剧本头部 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">剧本管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditForm({
                title: script!.title,
                description: script!.description || "",
              });
              setIsEditingScript(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
          >
            编辑剧本
          </button>
          <button
            onClick={handleDeleteScript}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-red-400 text-sm hover:bg-red-500/10 transition-colors border border-white/5"
          >
            删除
          </button>
        </div>
      </div>

      {/* 剧本信息 */}
      <div className="mb-4 p-4 rounded-2xl bg-bg-tertiary/40 border border-white/5">
        {isEditingScript ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
              placeholder="剧本名称 *"
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
            />
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              placeholder="剧本简介"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdateScript}
                disabled={!editForm.title.trim()}
                className="px-4 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditingScript(false)}
                className="px-4 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-1">
              📖 {script!.title}
            </h3>
            {script!.description && (
              <p className="text-sm text-text-secondary">
                {script!.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 章节和分镜管理 - 三栏布局 */}
      <div className="flex gap-4 min-h-[500px]">
        {/* 第一栏：章节列表 */}
        <div className="w-56 flex-shrink-0 rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <h4 className="text-sm font-medium text-text-primary mb-2">
              章节列表
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                placeholder="新章节标题"
                className="flex-1 px-2 py-1 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
              />
              <button
                onClick={handleAddChapter}
                disabled={!newChapterTitle.trim()}
                className="px-2 py-1 rounded-lg bg-accent-primary/20 text-accent-primary text-xs hover:bg-accent-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            {scriptChapters.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p className="text-xs">暂无章节</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {scriptChapters.map((chapter, idx) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleSelectChapter(chapter)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedChapter?.id === chapter.id
                        ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/30"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary/50 border border-transparent"
                    }`}
                  >
                    <span className="text-xs text-text-muted mr-2">
                      {idx + 1}.
                    </span>
                    {chapter.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 第二栏：章节内容编辑 */}
        <div className="flex-1 rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
          {selectedChapter ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={editChapterTitle}
                    onChange={(e) => setEditChapterTitle(e.target.value)}
                    className="text-base font-semibold text-text-primary bg-transparent border-none outline-none focus:ring-0 px-0"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateChapter}
                      className="px-3 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => handleDeleteChapter(selectedChapter.id)}
                      className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-red-400 text-xs hover:bg-red-500/10 transition-colors border border-white/5"
                    >
                      删除章节
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="在此编写章节内容..."
                  className="w-full h-full min-h-[200px] px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted">
              <div className="text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm">选择一个章节开始编辑</p>
                <p className="text-xs mt-1">或在左侧添加新章节</p>
              </div>
            </div>
          )}
        </div>

        {/* 第三栏：分镜列表 */}
        <div className="w-72 flex-shrink-0 rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
          <div className="p-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-text-primary">
                🎬 分镜列表
              </h4>
              {selectedChapter && (
                <div className="flex gap-1">
                  <button
                    onClick={handleBreakdownScenes}
                    disabled={isBreakingDown || !editContent.trim()}
                    className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      editContent.trim() ? "AI自动拆解分镜" : "请先填写章节内容"
                    }
                  >
                    {isBreakingDown ? "拆解中..." : "🤖 AI拆解"}
                  </button>
                  <button
                    onClick={() => setIsCreatingScene(true)}
                    className="px-2 py-1 rounded-lg bg-accent-primary/20 text-accent-primary text-xs hover:bg-accent-primary/30 transition-colors"
                  >
                    + 新建
                  </button>
                </div>
              )}
            </div>
            {selectedChapter && (
              <p className="text-xs text-text-muted">
                {selectedChapter.title} 的分镜
              </p>
            )}
          </div>
          <div className="overflow-y-auto max-h-[420px]">
            {!selectedChapter ? (
              <div className="text-center py-8 text-text-muted">
                <p className="text-xs">请先选择章节</p>
              </div>
            ) : isBreakingDown ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-xs text-text-muted">AI正在分析章节内容...</p>
              </div>
            ) : breakdownError ? (
              <div className="p-3">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{breakdownError}</p>
                </div>
                <button
                  onClick={() => setBreakdownError(null)}
                  className="mt-2 text-xs text-text-muted hover:text-text-secondary"
                >
                  关闭
                </button>
              </div>
            ) : breakdownResults ? (
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-purple-400 font-medium">
                    AI拆解结果 ({breakdownResults.length}个分镜)
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={handleCreateBreakdownScenes}
                      className="px-2 py-1 rounded-lg bg-accent-primary text-bg-primary text-xs hover:opacity-90 transition-opacity"
                    >
                      全部创建
                    </button>
                    <button
                      onClick={() => setBreakdownResults(null)}
                      className="px-2 py-1 rounded-lg bg-bg-tertiary text-text-muted text-xs border border-white/5"
                    >
                      取消
                    </button>
                  </div>
                </div>
                {breakdownResults.map((scene, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] text-text-muted">
                            {idx + 1}.
                          </span>
                          <span className="text-xs font-medium text-text-primary">
                            {scene.title}
                          </span>
                        </div>
                        {scene.shot_type && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-bg-tertiary/60 text-text-muted">
                            {SHOT_TYPES.find((s) => s.id === scene.shot_type)
                              ?.label || scene.shot_type}
                          </span>
                        )}
                        {scene.description && (
                          <p className="text-[10px] text-text-muted mt-1 line-clamp-2">
                            {scene.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isCreatingScene ? (
              <div className="p-3 space-y-3">
                <input
                  type="text"
                  value={sceneForm.title}
                  onChange={(e) =>
                    setSceneForm({ ...sceneForm, title: e.target.value })
                  }
                  placeholder="分镜标题 *"
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                  autoFocus
                />
                <textarea
                  value={sceneForm.description || ""}
                  onChange={(e) =>
                    setSceneForm({ ...sceneForm, description: e.target.value })
                  }
                  placeholder="场景描述"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                />
                <select
                  value={sceneForm.shot_type || "medium_shot"}
                  onChange={(e) =>
                    setSceneForm({ ...sceneForm, shot_type: e.target.value })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                >
                  {SHOT_TYPES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.emoji} {st.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={sceneForm.dialogue || ""}
                  onChange={(e) =>
                    setSceneForm({ ...sceneForm, dialogue: e.target.value })
                  }
                  placeholder="台词/旁白"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateScene}
                    disabled={!sceneForm.title.trim()}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    创建
                  </button>
                  <button
                    onClick={() => setIsCreatingScene(false)}
                    className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs border border-white/5"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : editingScene ? (
              <div className="p-3 space-y-3">
                <input
                  type="text"
                  value={editingScene.title}
                  onChange={(e) =>
                    setEditingScene({ ...editingScene, title: e.target.value })
                  }
                  placeholder="分镜标题 *"
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                />
                <textarea
                  value={editingScene.description || ""}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      description: e.target.value,
                    })
                  }
                  placeholder="场景描述"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                />
                <select
                  value={editingScene.shot_type || "medium_shot"}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      shot_type: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
                >
                  {SHOT_TYPES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.emoji} {st.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={editingScene.dialogue || ""}
                  onChange={(e) =>
                    setEditingScene({
                      ...editingScene,
                      dialogue: e.target.value,
                    })
                  }
                  placeholder="台词/旁白"
                  rows={2}
                  className="w-full px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateScene}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingScene(null)}
                    className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-xs border border-white/5"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : chapterScenes.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <p className="text-2xl mb-2">🎬</p>
                <p className="text-xs">暂无分镜</p>
                <p className="text-xs mt-1">点击上方"+ 新建"添加</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {chapterScenes.map((scene, idx) => (
                  <div
                    key={scene.id}
                    className="p-2.5 rounded-lg bg-bg-secondary/50 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs text-text-muted">
                            {idx + 1}.
                          </span>
                          <span className="text-xs font-medium text-text-primary truncate">
                            {scene.title}
                          </span>
                        </div>
                        {scene.shot_type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-tertiary/60 text-text-muted">
                            {SHOT_TYPES.find((s) => s.id === scene.shot_type)
                              ?.label || scene.shot_type}
                          </span>
                        )}
                        {scene.dialogue && (
                          <p className="text-[10px] text-text-muted mt-1 truncate italic">
                            "{scene.dialogue}"
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleGenerateSceneArtwork(scene.id)}
                          className="p-1 rounded text-text-muted hover:text-accent-primary transition-colors"
                          title="生成作品"
                        >
                          🎨
                        </button>
                        <button
                          onClick={() => setEditingScene(scene)}
                          className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                          title="编辑"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteScene(scene.id)}
                          className="p-1 rounded text-text-muted hover:text-red-400 transition-colors"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
