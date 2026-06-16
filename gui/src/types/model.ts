/**
 * 模型提供商和模型配置类型定义
 */

export type ModelType =
  | "text_generation"
  | "text_to_image"
  | "image_to_image"
  | "text_to_video"
  | "image_to_video";

export type ProviderType = "cloud" | "local";

export interface ModelProvider {
  id: string;
  name: string;
  display_name: string;
  provider_type: ProviderType;
  base_url?: string;
  api_key?: string;
  description?: string;
  icon?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelProviderCreateParams {
  name: string;
  display_name: string;
  provider_type?: ProviderType;
  base_url?: string;
  api_key?: string;
  description?: string;
  icon?: string;
  is_enabled?: boolean;
}

export interface ModelProviderUpdateParams {
  display_name?: string;
  base_url?: string;
  api_key?: string;
  description?: string;
  icon?: string;
  is_enabled?: boolean;
}

export interface ModelProviderListResponse {
  data: ModelProvider[];
  total: number;
}

export interface Model {
  id: string;
  provider_id: string;
  name: string;
  display_name: string;
  model_type: ModelType;
  description?: string;
  config?: string;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelCreateParams {
  provider_id: string;
  name: string;
  display_name: string;
  model_type: ModelType;
  description?: string;
  config?: string;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface ModelUpdateParams {
  display_name?: string;
  description?: string;
  config?: string;
  is_enabled?: boolean;
  is_default?: boolean;
}

export interface ModelListResponse {
  data: Model[];
  total: number;
}

export interface DefaultModels {
  default_text_generation_model_id?: string;
  default_image_model_id?: string;
  default_image_to_image_model_id?: string;
  default_video_model_id?: string;
  default_image_to_video_model_id?: string;
}

export interface DefaultModelsUpdateParams {
  default_text_generation_model_id?: string;
  default_image_model_id?: string;
  default_image_to_image_model_id?: string;
  default_video_model_id?: string;
  default_image_to_video_model_id?: string;
}

// 内置供应商预设
export interface ProviderPreset {
  name: string;
  display_name: string;
  provider_type: ProviderType;
  icon: string;
  description: string;
  base_url?: string;
  defaultModels?: { name: string; display_name: string; model_type: ModelType }[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    name: "openai",
    display_name: "OpenAI",
    provider_type: "cloud",
    icon: "🤖",
    description: "GPT-4、DALL-E、Whisper 等",
    defaultModels: [
      { name: "gpt-4-turbo-preview", display_name: "GPT-4 Turbo", model_type: "text_generation" },
      { name: "gpt-4o", display_name: "GPT-4o", model_type: "text_generation" },
      { name: "dall-e-3", display_name: "DALL-E 3", model_type: "text_to_image" },
      { name: "dall-e-2", display_name: "DALL-E 2", model_type: "text_to_image" },
    ],
  },
  {
    name: "aliyun",
    display_name: "阿里云百炼",
    provider_type: "cloud",
    icon: "☁️",
    description: "通义千问、HappyHorse 视频生成",
    defaultModels: [
      { name: "qwen-turbo", display_name: "通义千问 Turbo", model_type: "text_generation" },
      { name: "qwen-plus", display_name: "通义千问 Plus", model_type: "text_generation" },
      { name: "happyhorse-1.0-t2v", display_name: "HappyHorse 文生视频", model_type: "text_to_video" },
    ],
  },
  {
    name: "volcengine",
    display_name: "火山引擎",
    provider_type: "cloud",
    icon: "🌋",
    description: "豆包、Seedance 视频生成",
    defaultModels: [
      { name: "doubao-pro", display_name: "豆包 Pro", model_type: "text_generation" },
      { name: "seedance-2.0", display_name: "Seedance 2.0", model_type: "text_to_video" },
    ],
  },
  {
    name: "zhipu",
    display_name: "智谱 AI",
    provider_type: "cloud",
    icon: "🔮",
    description: "GLM、CogView、CogVideo",
    defaultModels: [
      { name: "glm-4", display_name: "GLM-4", model_type: "text_generation" },
      { name: "cogview-3", display_name: "CogView 3", model_type: "text_to_image" },
      { name: "cogvideox", display_name: "CogVideoX", model_type: "text_to_video" },
    ],
  },
  {
    name: "comfyui",
    display_name: "ComfyUI",
    provider_type: "local",
    icon: "🎨",
    description: "本地 Stable Diffusion 工作流",
    base_url: "http://localhost:8188",
  },
  {
    name: "lmstudio",
    display_name: "LM Studio",
    provider_type: "local",
    icon: "🖥️",
    description: "本地运行的 LLM 模型",
    base_url: "http://localhost:1234",
  },
  {
    name: "ollama",
    display_name: "Ollama",
    provider_type: "local",
    icon: "🦙",
    description: "本地运行的开源模型",
    base_url: "http://localhost:11434",
  },
];

// 模型类型显示配置
export const MODEL_TYPE_CONFIG: Record<
  ModelType,
  { label: string; emoji: string; description: string }
> = {
  text_generation: {
    label: "文生文",
    emoji: "💬",
    description: "文本对话、文本生成",
  },
  text_to_image: {
    label: "文生图",
    emoji: "🖼️",
    description: "根据文本描述生成图片",
  },
  image_to_image: {
    label: "图生图",
    emoji: "🔄",
    description: "根据参考图片生成新图片",
  },
  text_to_video: {
    label: "文生视频",
    emoji: "🎬",
    description: "根据文本描述生成视频",
  },
  image_to_video: {
    label: "图生视频",
    emoji: "📹",
    description: "根据图片生成视频",
  },
};

// 默认模型类型列表
export const DEFAULT_MODEL_TYPES: ModelType[] = [
  "text_generation",
  "text_to_image",
  "image_to_image",
  "text_to_video",
  "image_to_video",
];
