import { Artwork } from "../../types/artwork";
import { useArtworkStore } from "../../stores/artworkStore";
import { artworkService } from "../../services/artworkService";

interface ArtworkCardProps {
  artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  const { toggleFavorite } = useArtworkStore();

  async function handleToggleFavorite() {
    try {
      await artworkService.toggleFavorite(artwork.id);
      toggleFavorite(artwork.id);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }

  return (
    <div className="card group cursor-pointer">
      <div className="aspect-square bg-bg-tertiary rounded-lg overflow-hidden mb-3 relative">
        {artwork.thumbnail_path || artwork.file_path ? (
          <img
            src={artwork.thumbnail_path || artwork.file_path}
            alt={artwork.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {artwork.type === "video" ? "🎬" : "🖼️"}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleFavorite();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {artwork.is_favorite ? "❤️" : "🤍"}
        </button>
      </div>
      <h3 className="text-sm font-medium truncate">{artwork.title}</h3>
      <p className="text-xs text-text-muted mt-1 truncate">{artwork.style || "默认风格"}</p>
    </div>
  );
}
