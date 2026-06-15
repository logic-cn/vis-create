import { useState, useEffect, useRef } from "react";
import { projectService } from "../../services/projectService";
import { useProjectStore } from "../../stores/projectStore";

interface ProjectSelectorProps {
  selectedId?: string;
  onSelect: (projectId: string | undefined) => void;
}

export default function ProjectSelector({
  selectedId,
  onSelect,
}: ProjectSelectorProps) {
  const { projects, setProjects, addProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find((p) => p.id === selectedId);

  useEffect(() => {
    projectService.list(1, 100).then((res) => setProjects(res.data));
  }, [setProjects]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsCreating(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleQuickCreate() {
    if (!newName.trim()) return;
    try {
      const project = await projectService.create({ name: newName.trim() });
      addProject(project);
      onSelect(project.id);
      setNewName("");
      setIsCreating(false);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  }

  function handleSelect(id: string | undefined) {
    onSelect(id);
    setIsOpen(false);
    setSearch("");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-secondary/50 hover:bg-bg-secondary border border-white/5 hover:border-white/10 transition-all text-sm"
      >
        <div
          className={`w-2 h-2 rounded-full ${selectedId ? "bg-accent-primary" : "bg-text-muted/40"}`}
        />
        <span className="text-text-muted">
          {selectedProject ? selectedProject.name : "项目"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 max-h-[320px] overflow-y-auto rounded-xl bg-bg-secondary border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl z-50">
          {/* 标题 */}
          <div className="p-3 border-b border-white/5">
            <div className="text-xs text-text-muted font-medium">选择项目</div>
          </div>

          {/* 搜索 */}
          <div className="p-2 border-b border-white/5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目..."
              className="w-full px-3 py-1.5 rounded-lg bg-bg-tertiary/60 text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
              autoFocus
            />
          </div>

          {/* 选项列表 */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => handleSelect(undefined)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                !selectedId
                  ? "bg-accent-primary/10 border border-accent-primary/30"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <span className="text-lg">🚫</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-text-primary">
                  不使用项目
                </span>
              </div>
              {!selectedId && (
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

            {filtered.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  selectedId === project.id
                    ? "bg-accent-primary/10 border border-accent-primary/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <span className="text-lg">📂</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {project.name}
                  </span>
                </div>
                {selectedId === project.id && (
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
            ))}

            {filtered.length === 0 && search && (
              <div className="text-center py-6 text-text-muted text-sm">
                未找到匹配项目
              </div>
            )}
          </div>

          {/* 快速创建 */}
          <div className="p-2 border-t border-white/5">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleQuickCreate()}
                  placeholder="项目名称"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary/60 text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                  autoFocus
                />
                <button
                  onClick={handleQuickCreate}
                  disabled={!newName.trim()}
                  className="px-3 py-1.5 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  创建
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-primary hover:bg-white/5 transition-colors"
              >
                <span>+</span>
                <span>新建项目</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
