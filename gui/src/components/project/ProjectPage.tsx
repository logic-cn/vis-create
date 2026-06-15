import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../../services/projectService";
import AssetPanel from "./AssetPanel";
import CharacterPanel from "./CharacterPanel";
import ScriptPanel from "./ScriptPanel";
import type { Project } from "../../types/project";

type Tab = "assets" | "scripts";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("assets");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    projectService
      .get(id)
      .then(setProject)
      .catch(() => navigate("/projects"))
      .finally(() => setIsLoading(false));
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-muted">加载中...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 项目头部 */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {project.name}
          </h1>
        </div>
        {project.description && (
          <p className="text-text-secondary text-sm mt-1 ml-10">
            {project.description}
          </p>
        )}
      </div>

      {/* Tab 切换 */}
      <div className="px-6 border-b border-white/10">
        <div className="flex gap-1">
          {[
            { id: "assets" as Tab, label: "素材区", emoji: "🖼️" },
            { id: "scripts" as Tab, label: "脚本区", emoji: "📝" },
          ].map((tab) => (
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
      <div className="flex-1 overflow-y-auto">
        {id && activeTab === "assets" && <AssetPanel projectId={id} />}
        {id && activeTab === "scripts" && (
          <div className="p-6 space-y-6">
            <CharacterPanel projectId={id} />
            <ScriptPanel projectId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
