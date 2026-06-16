import { api, BASE_URL } from "./api";
import type {
  Project,
  ProjectListResponse,
  ProjectCreateParams,
  ProjectUpdateParams,
  Asset,
  AssetListResponse,
  Character,
  CharacterListResponse,
  CharacterCreateParams,
  CharacterUpdateParams,
  Script,
  ScriptListResponse,
  ScriptCreateParams,
  ScriptUpdateParams,
  Chapter,
  ChapterListResponse,
  ChapterCreateParams,
  ChapterUpdateParams,
  Scene,
  SceneListResponse,
  SceneCreateParams,
  SceneUpdateParams,
} from "../types/project";

const BASE = "/api/projects";

export const projectService = {
  // ── 项目 CRUD ──
  list: (page = 1, limit = 20, search?: string) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) params.append("search", search);
    return api.get<ProjectListResponse>(`${BASE}?${params}`);
  },

  get: (id: string) => api.get<Project>(`${BASE}/${id}`),

  create: (data: ProjectCreateParams) => api.post<Project>(BASE, data),

  update: (id: string, data: ProjectUpdateParams) =>
    api.put<Project>(`${BASE}/${id}`, data),

  delete: (id: string) => api.delete(`${BASE}/${id}`),

  // ── 素材 ──
  listAssets: (projectId: string) =>
    api.get<AssetListResponse>(`${BASE}/${projectId}/assets`),

  uploadAsset: async (projectId: string, file: File, name?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);

    const response = await fetch(
      `${BASE_URL}${BASE}/${projectId}/assets`,
      { method: "POST", body: formData },
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<Asset>;
  },

  deleteAsset: (projectId: string, assetId: string) =>
    api.delete(`${BASE}/${projectId}/assets/${assetId}`),

  // ── 角色 ──
  listCharacters: (projectId: string) =>
    api.get<CharacterListResponse>(`${BASE}/${projectId}/characters`),

  createCharacter: (projectId: string, data: CharacterCreateParams) =>
    api.post<Character>(`${BASE}/${projectId}/characters`, data),

  updateCharacter: (
    projectId: string,
    characterId: string,
    data: CharacterUpdateParams,
  ) =>
    api.put<Character>(`${BASE}/${projectId}/characters/${characterId}`, data),

  uploadCharacterAvatar: async (
    projectId: string,
    characterId: string,
    file: File,
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${BASE_URL}${BASE}/${projectId}/characters/${characterId}/avatar`,
      { method: "POST", body: formData },
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json() as Promise<Character>;
  },

  deleteCharacter: (projectId: string, characterId: string) =>
    api.delete(`${BASE}/${projectId}/characters/${characterId}`),

  // ── 剧本 ──
  listScripts: (projectId: string) =>
    api.get<ScriptListResponse>(`${BASE}/${projectId}/scripts`),

  createScript: (projectId: string, data: ScriptCreateParams) =>
    api.post<Script>(`${BASE}/${projectId}/scripts`, data),

  updateScript: (
    projectId: string,
    scriptId: string,
    data: ScriptUpdateParams,
  ) => api.put<Script>(`${BASE}/${projectId}/scripts/${scriptId}`, data),

  deleteScript: (projectId: string, scriptId: string) =>
    api.delete(`${BASE}/${projectId}/scripts/${scriptId}`),

  // ── 章节 ──
  listChapters: (projectId: string, scriptId: string) =>
    api.get<ChapterListResponse>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters`,
    ),

  createChapter: (
    projectId: string,
    scriptId: string,
    data: ChapterCreateParams,
  ) =>
    api.post<Chapter>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters`,
      data,
    ),

  updateChapter: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    data: ChapterUpdateParams,
  ) =>
    api.put<Chapter>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}`,
      data,
    ),

  deleteChapter: (projectId: string, scriptId: string, chapterId: string) =>
    api.delete(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}`,
    ),

  // ── 场景（分镜）──
  listScenes: (projectId: string, scriptId: string, chapterId: string) =>
    api.get<SceneListResponse>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes`,
    ),

  breakdownScenes: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    data: { chapter_content?: string; max_scenes?: number },
  ) =>
    api.post<{ scenes: SceneCreateParams[] }>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes/breakdown`,
      data,
    ),

  createScene: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    data: SceneCreateParams,
  ) =>
    api.post<Scene>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes`,
      data,
    ),

  getScene: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    sceneId: string,
  ) =>
    api.get<Scene>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes/${sceneId}`,
    ),

  updateScene: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    sceneId: string,
    data: SceneUpdateParams,
  ) =>
    api.put<Scene>(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes/${sceneId}`,
      data,
    ),

  deleteScene: (
    projectId: string,
    scriptId: string,
    chapterId: string,
    sceneId: string,
  ) =>
    api.delete(
      `${BASE}/${projectId}/scripts/${scriptId}/chapters/${chapterId}/scenes/${sceneId}`,
    ),
};
