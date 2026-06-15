import { useEffect, useState } from "react";
import { projectService } from "../../services/projectService";
import { useProjectStore } from "../../stores/projectStore";
import type { Chapter, ScriptCreateParams } from "../../types/project";

interface ScriptPanelProps {
  projectId: string;
}

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

  const script = scripts[0] || null;
  const scriptChapters = script ? chapters[script.id] || [] : [];

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

  // 剧本详情 - 左右布局
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

      {/* 章节管理 - 左右布局 */}
      <div className="flex gap-4 min-h-[400px]">
        {/* 左侧：章节列表 */}
        <div className="w-64 flex-shrink-0 rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
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
          <div className="overflow-y-auto max-h-[320px]">
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

        {/* 右侧：章节内容编辑区 */}
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
                  className="w-full h-full min-h-[300px] px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
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
      </div>
    </div>
  );
}
