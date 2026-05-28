import { useEffect } from "react";
import { useArtworkStore } from "../stores/artworkStore";
import { artworkService } from "../services/artworkService";
import ArtworkCard from "../components/gallery/ArtworkCard";

export default function GalleryPage() {
  const { artworks, isLoading, setArtworks, setLoading, setError } =
    useArtworkStore();

  useEffect(() => {
    loadArtworks();
  }, []);

  async function loadArtworks() {
    setLoading(true);
    try {
      const response = await artworkService.list();
      setArtworks(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load artworks");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">作品画廊</h1>
          <p className="text-text-secondary text-sm mt-1">
            共 {artworks.length} 个作品
          </p>
        </div>
        <button className="btn-primary">+ 新建创作</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-text-muted">加载中...</div>
        </div>
      ) : artworks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-4xl mb-4">🖼️</div>
          <p className="text-text-secondary">还没有作品</p>
          <p className="text-text-muted text-sm mt-1">点击上方按钮开始创作</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}
