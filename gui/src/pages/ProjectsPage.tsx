import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/projectService";
import { useProjectStore } from "../stores/projectStore";
import type { Project } from "../types/project";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, setProjects, addProject, removeProject } =
    useProjectStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    projectService
      .list(1, 100)
      .then((res) => setProjects(res.data))
      .catch((err) => {
        const message = err instanceof Error ? err.message : "加载项目失败";
        setError(message);
        console.error("Failed to load projects:", err);
      })
      .finally(() => setIsLoading(false));
  }, [setProjects]);

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const project = await projectService.create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      addProject(project);
      setNewName("");
      setNewDesc("");
      setIsCreating(false);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "创建项目失败";
      setError(message);
      console.error("Create project failed:", err);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    try {
      await projectService.delete(id);
      removeProject(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "删除项目失败";
      setError(message);
      console.error("Delete project failed:", err);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">项目管理</h1>
            <p className="text-text-secondary text-sm mt-1">
              以项目维度组织你的创作
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-tertiary text-bg-primary font-medium hover:shadow-lg hover:shadow-accent-primary/30 transition-all"
          >
            新建项目
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {isCreating && (
          <div className="mb-6 p-5 rounded-2xl bg-bg-secondary border border-white/10 space-y-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="项目名称 *"
              className="w-full px-4 py-2.5 rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
              autoFocus
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="项目描述（可选）"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-tertiary text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-5 py-2 rounded-xl bg-accent-primary text-bg-primary font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewName("");
                  setNewDesc("");
                }}
                className="px-5 py-2 rounded-xl bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📂</p>
            <p className="text-text-secondary text-lg mb-2">暂无项目</p>
            <p className="text-text-muted text-sm">
              创建你的第一个项目，开始有组织地创作
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project: Project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group p-5 rounded-2xl bg-bg-secondary/60 border border-white/5 hover:border-accent-primary/30 hover:bg-bg-secondary cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">📂</span>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm"
                  >
                    删除
                  </button>
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                    {project.description}
                  </p>
                )}
                <p className="text-xs text-text-muted">
                  {new Date(project.created_at).toLocaleDateString("zh-CN")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
