import { useEffect, useRef } from "react";
import { projectService } from "../../services/projectService";
import { useProjectStore } from "../../stores/projectStore";

interface AssetPanelProps {
  projectId: string;
}

export default function AssetPanel({ projectId }: AssetPanelProps) {
  const { assets, setAssets, addAsset, removeAsset } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    projectService.listAssets(projectId).then((res) => setAssets(res.data));
  }, [projectId, setAssets]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const asset = await projectService.uploadAsset(projectId, file);
      addAsset(asset);
    } catch (err) {
      console.error("Upload failed:", err);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(assetId: string) {
    try {
      await projectService.deleteAsset(projectId, assetId);
      removeAsset(assetId);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text-primary">素材库</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-medium hover:opacity-90 transition-opacity"
        >
          上传素材
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <p className="text-4xl mb-2">🖼️</p>
          <p>暂无素材，点击上方按钮上传</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-xl overflow-hidden bg-bg-tertiary border border-white/5"
            >
              <div className="aspect-square">
                {asset.type === "image" ? (
                  <img
                    src={asset.file_path}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🎬
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs text-text-secondary truncate">
                  {asset.name}
                </p>
                <p className="text-xs text-text-muted">
                  {asset.source === "generated" ? "AI生成" : "手动上传"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(asset.id)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
