import { create } from "zustand";
import { Artwork, ArtworkFilters } from "../types/artwork";

interface ArtworkStore {
  artworks: Artwork[];
  selectedArtwork: Artwork | null;
  filters: ArtworkFilters;
  isLoading: boolean;
  error: string | null;
  favorites: Artwork[];

  setArtworks: (artworks: Artwork[]) => void;
  selectArtwork: (artwork: Artwork | null) => void;
  setFilters: (filters: ArtworkFilters) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleFavorite: (id: string) => void;
  updateFavorites: () => void;
}

export const useArtworkStore = create<ArtworkStore>((set, get) => ({
  artworks: [],
  selectedArtwork: null,
  filters: {},
  isLoading: false,
  error: null,
  favorites: [],

  setArtworks: (artworks) => set({ artworks }),
  selectArtwork: (artwork) => set({ selectedArtwork: artwork }),
  setFilters: (filters) => set({ filters }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  toggleFavorite: (id) => {
    const { artworks } = get();
    const updated = artworks.map((a) =>
      a.id === id ? { ...a, is_favorite: !a.is_favorite } : a
    );
    set({ artworks: updated });
    get().updateFavorites();
  },
  updateFavorites: () => {
    const { artworks } = get();
    set({ favorites: artworks.filter((a) => a.is_favorite) });
  },
}));
