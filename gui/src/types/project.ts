export interface Project {
  id: string;
  name: string;
  description?: string;
  cover_path?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectCreateParams {
  name: string;
  description?: string;
}

export interface ProjectUpdateParams {
  name?: string;
  description?: string;
  cover_path?: string;
}

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  type: "image" | "video";
  file_path: string;
  thumbnail_path?: string;
  source: "generated" | "uploaded";
  original_artwork_id?: string;
  created_at: string;
}

export interface AssetListResponse {
  data: Asset[];
  total: number;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  age?: number;
  personality?: string;
  description?: string;
  avatar_path?: string;
  reference_images?: string[];
  locked_avatar_id?: string;
  visual_features?: string;
  created_at: string;
  updated_at: string;
}

export interface CharacterListResponse {
  data: Character[];
  total: number;
}

export interface CharacterCreateParams {
  name: string;
  age?: number;
  personality?: string;
  description?: string;
  visual_features?: string;
}

export interface CharacterUpdateParams {
  name?: string;
  age?: number;
  personality?: string;
  description?: string;
  avatar_path?: string;
  visual_features?: string;
}

export interface Script {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ScriptListResponse {
  data: Script[];
  total: number;
}

export interface ScriptCreateParams {
  title: string;
  description?: string;
}

export interface ScriptUpdateParams {
  title?: string;
  description?: string;
}

export interface Chapter {
  id: string;
  script_id: string;
  title: string;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterListResponse {
  data: Chapter[];
  total: number;
}

export interface ChapterCreateParams {
  title: string;
  content?: string;
  sort_order?: number;
}

export interface ChapterUpdateParams {
  title?: string;
  content?: string;
  sort_order?: number;
}

export interface Scene {
  id: string;
  chapter_id: string;
  title: string;
  description?: string;
  sort_order: number;
  shot_type?: string;
  camera_movement?: string;
  character_ids?: string[];
  background_description?: string;
  mood?: string;
  dialogue?: string;
  artwork_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SceneListResponse {
  data: Scene[];
  total: number;
}

export interface SceneCreateParams {
  title: string;
  description?: string;
  sort_order?: number;
  shot_type?: string;
  camera_movement?: string;
  character_ids?: string[];
  background_description?: string;
  mood?: string;
  dialogue?: string;
}

export interface SceneUpdateParams {
  title?: string;
  description?: string;
  sort_order?: number;
  shot_type?: string;
  camera_movement?: string;
  character_ids?: string[];
  background_description?: string;
  mood?: string;
  dialogue?: string;
  artwork_id?: string;
}
