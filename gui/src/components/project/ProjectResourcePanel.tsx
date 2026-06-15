import { useState, useEffect } from "react";
import { projectService } from "../../services/projectService";
import type {
  Asset,
  Character,
  Script,
  Chapter,
  Scene,
} from "../../types/project";

interface ProjectResourcePanelProps {
  projectId: string;
  onReferenceSelect: (asset: Asset | null) => void;
  onCharacterSelect: (character: Character | null) => void;
  onChapterSelect: (chapter: Chapter | null, script: Script | null) => void;
  onSceneSelect: (scene: Scene | null) => void;
  selectedReference: Asset | null;
  selectedCharacter: Character | null;
  selectedChapter: Chapter | null;
  selectedScene: Scene | null;
}

export default function ProjectResourcePanel({
  projectId,
  onReferenceSelect,
  onCharacterSelect,
  onChapterSelect,
  onSceneSelect,
  selectedReference,
  selectedCharacter,
  selectedChapter,
  selectedScene,
}: ProjectResourcePanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [scenes, setScenes] = useState<Record<string, Scene[]>>({});
  const [activeTab, setActiveTab] = useState<
    "reference" | "character" | "chapter"
  >("reference");

  useEffect(() => {
    projectService.listAssets(projectId).then((res) => setAssets(res.data));
    projectService
      .listCharacters(projectId)
      .then((res) => setCharacters(res.data));
    projectService.listScripts(projectId).then((res) => setScripts(res.data));
  }, [projectId]);

  async function handleScriptExpand(scriptId: string) {
    if (chapters[scriptId]) return;
    const res = await projectService.listChapters(projectId, scriptId);
    setChapters((prev) => ({ ...prev, [scriptId]: res.data }));
  }

  async function handleChapterExpand(scriptId: string, chapterId: string) {
    if (scenes[chapterId]) return;
    const res = await projectService.listScenes(projectId, scriptId, chapterId);
    setScenes((prev) => ({ ...prev, [chapterId]: res.data }));
  }

  const tabs = [
    { id: "reference" as const, label: "参考图", emoji: "🖼️" },
    { id: "character" as const, label: "角色", emoji: "🎭" },
    { id: "chapter" as const, label: "章节/分镜", emoji: "📖" },
  ];

  return (
    <div className="mx-8 mb-4 rounded-xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="p-3 max-h-60 overflow-y-auto">
        {/* 参考图 */}
        {activeTab === "reference" && (
          <div>
            {assets.filter((a) => a.type === "image").length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                项目中暂无图片素材
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assets
                  .filter((a) => a.type === "image")
                  .map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() =>
                        onReferenceSelect(
                          selectedReference?.id === asset.id ? null : asset,
                        )
                      }
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedReference?.id === asset.id
                          ? "border-accent-primary ring-1 ring-accent-primary/50"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={asset.file_path}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedReference?.id === asset.id && (
                        <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            )}
            {selectedReference && (
              <p className="text-xs text-accent-primary mt-2">
                已选择: {selectedReference.name}
              </p>
            )}
          </div>
        )}

        {/* 角色 */}
        {activeTab === "character" && (
          <div>
            {characters.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                项目中暂无角色
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() =>
                      onCharacterSelect(
                        selectedCharacter?.id === char.id ? null : char,
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedCharacter?.id === char.id
                        ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                        : "border-white/5 bg-bg-secondary/50 text-text-secondary hover:text-text-primary hover:border-white/20"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-bg-tertiary overflow-hidden flex-shrink-0">
                      {char.avatar_path ? (
                        <img
                          src={char.avatar_path}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">
                          🎭
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{char.name}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedCharacter && (
              <p className="text-xs text-accent-primary mt-2">
                已选择: {selectedCharacter.name}
                {selectedCharacter.personality &&
                  ` - ${selectedCharacter.personality}`}
              </p>
            )}
          </div>
        )}

        {/* 章节/分镜 - 内嵌结构 */}
        {activeTab === "chapter" && (
          <div>
            {scripts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                项目中暂无剧本
              </p>
            ) : (
              <div className="space-y-1">
                {scripts.map((script) => (
                  <div key={script.id}>
                    {/* 剧本 */}
                    <button
                      onClick={() => handleScriptExpand(script.id)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span>📝</span>
                      <span className="font-medium">{script.title}</span>
                    </button>
                    {chapters[script.id] && (
                      <div className="ml-4 space-y-0.5">
                        {chapters[script.id].map((chapter) => (
                          <div key={chapter.id}>
                            {/* 章节 */}
                            <div className="flex items-center">
                              <button
                                onClick={() => {
                                  onChapterSelect(
                                    selectedChapter?.id === chapter.id
                                      ? null
                                      : chapter,
                                    selectedChapter?.id === chapter.id
                                      ? null
                                      : script,
                                  );
                                  // 同时加载分镜
                                  handleChapterExpand(script.id, chapter.id);
                                }}
                                className={`flex-1 text-left px-2 py-1.5 rounded text-xs transition-all ${
                                  selectedChapter?.id === chapter.id
                                    ? "bg-accent-primary/10 text-accent-primary"
                                    : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50"
                                }`}
                              >
                                <span className="mr-1">📖</span>
                                {chapter.title}
                              </button>
                              <button
                                onClick={() =>
                                  handleChapterExpand(script.id, chapter.id)
                                }
                                className="px-1.5 py-1 text-text-muted hover:text-text-secondary transition-colors"
                                title="展开分镜"
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`transition-transform ${
                                    scenes[chapter.id] ? "rotate-90" : ""
                                  }`}
                                >
                                  <polyline points="9 6 15 12 9 18" />
                                </svg>
                              </button>
                            </div>

                            {/* 分镜列表（内嵌在章节下方） */}
                            {scenes[chapter.id] && (
                              <div className="ml-6 space-y-0.5 mt-0.5 mb-1">
                                {scenes[chapter.id].length === 0 ? (
                                  <p className="text-[10px] text-text-muted py-1 px-2">
                                    暂无分镜
                                  </p>
                                ) : (
                                  scenes[chapter.id].map((scene) => (
                                    <button
                                      key={scene.id}
                                      onClick={() =>
                                        onSceneSelect(
                                          selectedScene?.id === scene.id
                                            ? null
                                            : scene,
                                        )
                                      }
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] transition-all ${
                                        selectedScene?.id === scene.id
                                          ? "bg-accent-primary/10 text-accent-primary"
                                          : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50"
                                      }`}
                                    >
                                      <span className="mr-1">🎬</span>
                                      <span>{scene.title}</span>
                                      {scene.shot_type && (
                                        <span className="ml-1 text-[9px] opacity-60">
                                          [{scene.shot_type}]
                                        </span>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 选中状态显示 */}
            {(selectedChapter || selectedScene) && (
              <div className="mt-2 p-2 rounded-lg bg-bg-secondary/30">
                {selectedChapter && !selectedScene && (
                  <p className="text-xs text-accent-primary">
                    已选择章节: {selectedChapter.title}
                  </p>
                )}
                {selectedScene && (
                  <div>
                    <p className="text-xs text-accent-primary font-medium">
                      已选择分镜: {selectedScene.title}
                    </p>
                    {selectedScene.description && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {selectedScene.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
