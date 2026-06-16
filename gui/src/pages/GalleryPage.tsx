import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useArtworkStore } from "../stores/artworkStore";
import { artworkService } from "../services/artworkService";
import ArtworkCard from "../components/gallery/ArtworkCard";
import PreviewModal from "../components/gallery/PreviewModal";

type SortOption = "created_at" | "title" | "is_favorite";

export default function GalleryPage() {
  const navigate = useNavigate();
  const { artworks, isLoading, setArtworks, setLoading, setError } =
    useArtworkStore();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  // 筛选状态
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("created_at");
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    loadArtworks();
  }, [typeFilter, sort, showFavorites]);

  async function loadArtworks() {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        limit: 100,
        sort: showFavorites ? "is_favorite" : sort,
      };
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;

      const response = await artworkService.list(params);
      setArtworks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load artworks");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadArtworks();
  }

  const previewArtwork =
    previewIndex !== null ? (artworks[previewIndex] ?? null) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">作品画廊</h1>
          <p className="text-text-secondary text-sm mt-1">
            共 {artworks.length} 个作品
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/create")}>
          + 新建创作
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        {/* 类型筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">类型:</span>
          <div className="flex gap-1">
            {[
              { value: "", label: "全部" },
              { value: "image", label: "🖼️ 图片" },
              { value: "video", label: "🎬 视频" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTypeFilter(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  typeFilter === option.value
                    ? "bg-accent-primary text-bg-primary"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 排序 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">排序:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary border border-white/5 focus:outline-none focus:border-accent-primary/40"
          >
            <option value="created_at">最新创建</option>
            <option value="title">按名称</option>
          </select>
        </div>

        {/* 收藏筛选 */}
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            showFavorites
              ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/30"
              : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
          }`}
        >
          ⭐ 收藏
        </button>

        {/* 搜索 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs ml-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索作品..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-primary placeholder:text-text-muted/50 border border-white/5 focus:outline-none focus:border-accent-primary/40"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-bg-tertiary text-xs text-text-secondary hover:text-text-primary transition-colors border border-white/5"
            >
              🔍
            </button>
          </div>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">加载中...</div>
        </div>
      ) : artworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-text-secondary">
            {search || typeFilter || showFavorites
              ? "没有找到匹配的作品"
              : "还没有作品"}
          </p>
          <p className="text-text-muted text-sm mt-1">
            {search || typeFilter || showFavorites
              ? "尝试调整筛选条件"
              : "点击上方按钮开始创作"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                onClick={() => setPreviewIndex(index)}
              />
            ))}
          </div>
          <PreviewModal
            artwork={previewArtwork}
            onClose={() => setPreviewIndex(null)}
            onPrev={() => setPreviewIndex((i) => (i !== null ? i - 1 : null))}
            onNext={() => setPreviewIndex((i) => (i !== null ? i + 1 : null))}
            hasPrev={previewIndex !== null && previewIndex > 0}
            hasNext={
              previewIndex !== null && previewIndex < artworks.length - 1
            }
          />
        </>
      )}
    </div>
  );
}
