import { api } from "./api";
import { Artwork, ArtworkListResponse, ArtworkCreateParams, ArtworkFilters } from "../types/artwork";

export const artworkService = {
  list: (page = 1, limit = 20, filters?: ArtworkFilters) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters?.type) params.append("type", filters.type);
    if (filters?.style) params.append("style", filters.style);
    if (filters?.sort) params.append("sort", filters.sort);
    if (filters?.search) params.append("search", filters.search);
    return api.get<ArtworkListResponse>(`/api/artworks?${params}`);
  },

  get: (id: string) => api.get<Artwork>(`/api/artworks/${id}`),

  create: (data: ArtworkCreateParams) =>
    api.post<Artwork>("/api/artworks", data),

  update: (id: string, data: Partial<Artwork>) =>
    api.put<Artwork>(`/api/artworks/${id}`, data),

  delete: (id: string) => api.delete(`/api/artworks/${id}`),

  toggleFavorite: (id: string) =>
    api.post<Artwork>(`/api/artworks/${id}/favorite`, {}),
};
