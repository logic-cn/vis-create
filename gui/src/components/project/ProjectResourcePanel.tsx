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
    "reference" | "character" | "chapter" | "scene"
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

  async function handleChapterExpand(chapterId: string) {
    if (scenes[chapterId]) return;
    // 查找对应的 scriptId
    const scriptId = Object.keys(chapters).find((sId) =>
      chapters[sId]?.some((c) => c.id === chapterId),
    );
    if (!scriptId) return;
    const res = await projectService.listScenes(projectId, scriptId, chapterId);
    setScenes((prev) => ({ ...prev, [chapterId]: res.data }));
  }

  const tabs = [
    { id: "reference" as const, label: "参考图", emoji: "🖼️" },
    { id: "character" as const, label: "角色", emoji: "🎭" },
    { id: "chapter" as const, label: "章节", emoji: "📖" },
    { id: "scene" as const, label: "分镜", emoji: "🎬" },
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
      <div className="p-3 max-h-48 overflow-y-auto">
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

        {/* 章节 */}
        {activeTab === "chapter" && (
          <div>
            {scripts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                项目中暂无剧本
              </p>
            ) : (
              <div className="space-y-2">
                {scripts.map((script) => (
                  <div key={script.id}>
                    <button
                      onClick={() => handleScriptExpand(script.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span>📝</span>
                      <span className="font-medium">{script.title}</span>
                    </button>
                    {chapters[script.id] && (
                      <div className="ml-6 space-y-1">
                        {chapters[script.id].length === 0 ? (
                          <p className="text-xs text-text-muted py-1">无章节</p>
                        ) : (
                          chapters[script.id].map((chapter) => (
                            <button
                              key={chapter.id}
                              onClick={() =>
                                onChapterSelect(
                                  selectedChapter?.id === chapter.id
                                    ? null
                                    : chapter,
                                  selectedChapter?.id === chapter.id
                                    ? null
                                    : script,
                                )
                              }
                              className={`w-full text-left px-2 py-1 rounded text-xs transition-all ${
                                selectedChapter?.id === chapter.id
                                  ? "bg-accent-primary/10 text-accent-primary"
                                  : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50"
                              }`}
                            >
                              {chapter.title}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {selectedChapter && (
              <p className="text-xs text-accent-primary mt-2">
                已选择: {selectedChapter.title}
              </p>
            )}
          </div>
        )}

        {/* 分镜 */}
        {activeTab === "scene" && (
          <div>
            {scripts.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-4">
                项目中暂无剧本
              </p>
            ) : (
              <div className="space-y-2">
                {scripts.map((script) => (
                  <div key={script.id}>
                    <button
                      onClick={() => handleScriptExpand(script.id)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span>📝</span>
                      <span className="font-medium">{script.title}</span>
                    </button>
                    {chapters[script.id] && (
                      <div className="ml-4 space-y-1">
                        {chapters[script.id].map((chapter) => (
                          <div key={chapter.id}>
                            <button
                              onClick={() => handleChapterExpand(chapter.id)}
                              className="w-full flex items-center gap-2 px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
                            >
                              <span>📖</span>
                              <span>{chapter.title}</span>
                            </button>
                            {scenes[chapter.id] && (
                              <div className="ml-6 space-y-1">
                                {scenes[chapter.id].length === 0 ? (
                                  <p className="text-xs text-text-muted py-1">
                                    无分镜
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
                                      className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all ${
                                        selectedScene?.id === scene.id
                                          ? "bg-accent-primary/10 text-accent-primary"
                                          : "text-text-muted hover:text-text-secondary hover:bg-bg-secondary/50"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>🎬</span>
                                        <span>{scene.title}</span>
                                        {scene.shot_type && (
                                          <span className="text-[10px] px-1 py-0.5 rounded bg-bg-tertiary/60">
                                            {scene.shot_type}
                                          </span>
                                        )}
                                      </div>
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
            {selectedScene && (
              <div className="mt-2 p-2 rounded-lg bg-bg-secondary/30">
                <p className="text-xs text-accent-primary font-medium">
                  已选择: {selectedScene.title}
                </p>
                {selectedScene.description && (
                  <p className="text-xs text-text-muted mt-1">
                    {selectedScene.description}
                  </p>
                )}
                {selectedScene.dialogue && (
                  <p className="text-xs text-text-secondary mt-1 italic">
                    台词: {selectedScene.dialogue}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
