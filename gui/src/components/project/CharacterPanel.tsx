import { useEffect, useState, useRef } from "react";
import { projectService } from "../../services/projectService";
import { useProjectStore } from "../../stores/projectStore";
import type { CharacterCreateParams } from "../../types/project";

interface CharacterPanelProps {
  projectId: string;
}

export default function CharacterPanel({ projectId }: CharacterPanelProps) {
  const {
    characters,
    setCharacters,
    addCharacter,
    updateCharacter,
    removeCharacter,
    assets,
    setAssets,
  } = useProjectStore();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<CharacterCreateParams>({
    name: "",
    age: undefined,
    personality: "",
    description: "",
  });
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    projectService
      .listCharacters(projectId)
      .then((res) => setCharacters(res.data));
    if (assets.length === 0) {
      projectService.listAssets(projectId).then((res) => setAssets(res.data));
    }
  }, [projectId, setCharacters, setAssets, assets.length]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      const char = await projectService.createCharacter(projectId, form);
      addCharacter(char);
      if (selectedAvatar) {
        const updated = await projectService.updateCharacter(
          projectId,
          char.id,
          { avatar_path: selectedAvatar },
        );
        updateCharacter(updated);
      }
      setForm({ name: "", age: undefined, personality: "", description: "" });
      setSelectedAvatar(null);
      setIsAdding(false);
    } catch (err) {
      console.error("Create character failed:", err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await projectService.deleteCharacter(projectId, id);
      removeCharacter(id);
    } catch (err) {
      console.error("Delete character failed:", err);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await projectService.uploadAsset(
        projectId,
        file,
        file.name,
      );
      setAssets([asset, ...assets]);
      setSelectedAvatar(asset.file_path);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCharacterAvatarUpload(
    characterId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await projectService.uploadCharacterAvatar(
        projectId,
        characterId,
        file,
      );
      updateCharacter(updated);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  }

  async function handleReferenceImageUpload(
    characterId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await projectService.uploadCharacterReferenceImage(
        projectId,
        characterId,
        file,
      );
      updateCharacter(updated);
    } catch (err) {
      console.error("Reference image upload failed:", err);
    }
  }

  async function handleDeleteReferenceImage(
    characterId: string,
    imageIndex: number,
  ) {
    try {
      await projectService.deleteCharacterReferenceImage(
        projectId,
        characterId,
        imageIndex,
      );
      // Reload characters to get updated reference images
      const res = await projectService.listCharacters(projectId);
      setCharacters(res.data);
    } catch (err) {
      console.error("Delete reference image failed:", err);
    }
  }

  const imageAssets = assets.filter((a) => a.type === "image");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">角色管理</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-secondary text-sm hover:text-text-primary transition-colors border border-white/5"
        >
          {isAdding ? "取消" : "+ 新建角色"}
        </button>
      </div>

      {/* 新建角色表单 - 左右布局 */}
      {isAdding && (
        <div className="mb-4 rounded-2xl bg-bg-tertiary/40 border border-white/5 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* 左侧：形象预览区域 */}
            <div className="w-full md:w-48 p-4 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center gap-3">
              <div className="relative w-32 h-40 rounded-xl bg-bg-secondary overflow-hidden border border-white/10">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt="角色形象"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <span className="text-4xl">🎭</span>
                    <span className="text-xs text-text-muted">角色形象</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setShowAssetPicker(!showAssetPicker)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                >
                  选取
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-bg-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
                >
                  上传
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 右侧：信息输入区域 */}
            <div className="flex-1 p-4 space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="角色姓名 *"
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                autoFocus
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  value={form.age ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      age: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="年龄"
                  className="w-24 px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                />
                <input
                  type="text"
                  value={form.personality ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, personality: e.target.value })
                  }
                  placeholder="性格特点"
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
                />
              </div>
              <textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="角色描述"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-bg-secondary text-sm text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40 resize-none"
              />
              <button
                onClick={handleCreate}
                disabled={!form.name.trim()}
                className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                创建角色
              </button>
            </div>
          </div>

          {/* 素材选择器弹窗 */}
          {showAssetPicker && (
            <div className="border-t border-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-text-secondary">
                  从素材库选取
                </h4>
                <button
                  onClick={() => setShowAssetPicker(false)}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  关闭
                </button>
              </div>
              {imageAssets.length === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">
                  暂无图片素材，请先上传
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {imageAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAvatar(asset.file_path);
                        setShowAssetPicker(false);
                      }}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedAvatar === asset.file_path
                          ? "border-accent-primary ring-1 ring-accent-primary/50"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={asset.file_path}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                      {selectedAvatar === asset.file_path && (
                        <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 角色列表 */}
      {characters.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          <p className="text-3xl mb-2">🎭</p>
          <p>暂无角色</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              className="p-4 rounded-xl bg-bg-tertiary/40 border border-white/5"
            >
              <div className="flex items-start gap-3">
                <div className="relative w-12 h-12 rounded-full bg-bg-secondary overflow-hidden flex-shrink-0">
                  {char.avatar_path ? (
                    <img
                      src={char.avatar_path}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🎭
                    </div>
                  )}
                  <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 bg-black/40 flex items-center justify-center text-white text-xs transition-opacity">
                    📷
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleCharacterAvatarUpload(char.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text-primary">
                    {char.name}
                  </h3>
                  {char.age && (
                    <p className="text-xs text-text-muted">{char.age}岁</p>
                  )}
                  {char.personality && (
                    <p className="text-xs text-accent-tertiary mt-0.5">
                      {char.personality}
                    </p>
                  )}
                  {char.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {char.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(char.id)}
                  className="text-text-muted hover:text-red-400 transition-colors text-sm"
                >
                  ×
                </button>
              </div>

              {/* 参考图区域 */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-muted">参考图</span>
                  <label className="px-2 py-1 rounded bg-bg-secondary text-[10px] text-text-secondary hover:text-text-primary transition-colors border border-white/5 cursor-pointer">
                    + 添加
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleReferenceImageUpload(char.id, e)
                      }
                      className="hidden"
                    />
                  </label>
                </div>
                {char.reference_images && char.reference_images.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {char.reference_images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`参考图 ${idx + 1}`}
                          className="w-14 h-14 rounded-lg object-cover border border-white/10"
                        />
                        <button
                          onClick={() =>
                            handleDeleteReferenceImage(char.id, idx)
                          }
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-text-muted">
                    暂无参考图，上传后可保持角色一致性
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
