export interface Artwork {
  id: string;
  title: string;
  description?: string;
  type: "image" | "video";
  file_path: string;
  thumbnail_path?: string;
  prompt: string;
  style?: string;
  parameters?: Record<string, unknown>;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ArtworkListResponse {
  data: Artwork[];
  total: number;
  page: number;
  limit: number;
}

export interface ArtworkCreateParams {
  title: string;
  description?: string;
  type: "image" | "video";
  prompt: string;
  style?: string;
  parameters?: Record<string, unknown>;
  tags?: string[];
}

export interface ArtworkFilters {
  type?: "image" | "video";
  style?: string;
  sort?: "created_at" | "title" | "is_favorite";
  search?: string;
}
