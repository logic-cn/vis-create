import { create } from "zustand";
import type {
  Project,
  Asset,
  Character,
  Script,
  Chapter,
} from "../types/project";

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  assets: Asset[];
  characters: Character[];
  scripts: Script[];
  chapters: Record<string, Chapter[]>;

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  removeAsset: (id: string) => void;

  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (character: Character) => void;
  removeCharacter: (id: string) => void;

  setScripts: (scripts: Script[]) => void;
  addScript: (script: Script) => void;
  updateScript: (script: Script) => void;
  removeScript: (id: string) => void;

  setChapters: (scriptId: string, chapters: Chapter[]) => void;
  addChapter: (scriptId: string, chapter: Chapter) => void;
  updateChapter: (scriptId: string, chapter: Chapter) => void;
  removeChapter: (scriptId: string, chapterId: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  assets: [],
  characters: [],
  scripts: [],
  chapters: {},

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject:
        state.currentProject?.id === id ? null : state.currentProject,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
  removeAsset: (id) =>
    set((state) => ({ assets: state.assets.filter((a) => a.id !== id) })),

  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) =>
    set((state) => ({ characters: [character, ...state.characters] })),
  updateCharacter: (character) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === character.id ? character : c,
      ),
    })),
  removeCharacter: (id) =>
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
    })),

  setScripts: (scripts) => set({ scripts }),
  addScript: (script) =>
    set((state) => ({ scripts: [script, ...state.scripts] })),
  updateScript: (script) =>
    set((state) => ({
      scripts: state.scripts.map((s) => (s.id === script.id ? script : s)),
    })),
  removeScript: (id) =>
    set((state) => ({
      scripts: state.scripts.filter((s) => s.id !== id),
    })),

  setChapters: (scriptId, chapters) =>
    set((state) => ({
      chapters: { ...state.chapters, [scriptId]: chapters },
    })),
  addChapter: (scriptId, chapter) =>
    set((state) => ({
      chapters: {
        ...state.chapters,
        [scriptId]: [...(state.chapters[scriptId] || []), chapter],
      },
    })),
  updateChapter: (scriptId, chapter) =>
    set((state) => ({
      chapters: {
        ...state.chapters,
        [scriptId]: (state.chapters[scriptId] || []).map((ch) =>
          ch.id === chapter.id ? chapter : ch,
        ),
      },
    })),
  removeChapter: (scriptId, chapterId) =>
    set((state) => ({
      chapters: {
        ...state.chapters,
        [scriptId]: (state.chapters[scriptId] || []).filter(
          (ch) => ch.id !== chapterId,
        ),
      },
    })),
}));
