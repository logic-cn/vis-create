import { api } from "./api";
import {
  Artwork,
  ArtworkListResponse,
  ArtworkCreateParams,
} from "../types/artwork";

export interface ArtworkListParams {
  page?: number;
  limit?: number;
  type?: string;
  style?: string;
  sort?: string;
  search?: string;
  is_favorite?: boolean;
}

export const artworkService = {
  list: (params?: ArtworkListParams) => {
    const queryParams = new URLSearchParams({
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
    if (params?.type) queryParams.append("type", params.type);
    if (params?.style) queryParams.append("style", params.style);
    if (params?.sort) queryParams.append("sort", params.sort);
    if (params?.search) queryParams.append("search", params.search);
    return api.get<ArtworkListResponse>(`/api/artworks?${queryParams}`);
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
