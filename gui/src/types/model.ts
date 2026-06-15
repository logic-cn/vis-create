/**
 * 模型提供商和模型配置类型定义
 */

export type ModelType =
  | "text_to_image"
  | "text_to_video"
  | "image_to_image"
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
  default_image_model_id?: string;
  default_video_model_id?: string;
}

export interface DefaultModelsUpdateParams {
  default_image_model_id?: string;
  default_video_model_id?: string;
}

// 预定义的云服务商提供商
export const CLOUD_PROVIDERS: ModelProviderCreateParams[] = [
  {
    name: "openai",
    display_name: "OpenAI",
    provider_type: "cloud",
    icon: "🤖",
    description: "DALL-E 系列文生图模型",
  },
  {
    name: "stability",
    display_name: "Stability AI",
    provider_type: "cloud",
    icon: "🎨",
    description: "Stable Diffusion 系列模型",
  },
  {
    name: "midjourney",
    display_name: "Midjourney",
    provider_type: "cloud",
    icon: "🌄",
    description: "Midjourney 文生图模型",
  },
  {
    name: "runway",
    display_name: "Runway",
    provider_type: "cloud",
    icon: "🎬",
    description: "Gen-1/Gen-2 视频生成模型",
  },
  {
    name: "pika",
    display_name: "Pika Labs",
    provider_type: "cloud",
    icon: "⚡",
    description: "Pika 视频生成模型",
  },
  {
    name: "kling",
    display_name: "可灵 AI",
    provider_type: "cloud",
    icon: "🐉",
    description: "快手可灵视频生成模型",
  },
  {
    name: "zhipu",
    display_name: "智谱 AI",
    provider_type: "cloud",
    icon: "🔮",
    description: "智谱 CogView 文生图模型",
  },
  {
    name: "baidu",
    display_name: "百度文心",
    provider_type: "cloud",
    icon: "🐻",
    description: "文心一格文生图模型",
  },
];

// 预定义的本地部署提供商
export const LOCAL_PROVIDERS: ModelProviderCreateParams[] = [
  {
    name: "ollama",
    display_name: "Ollama",
    provider_type: "local",
    base_url: "http://localhost:11434",
    icon: "🦙",
    description: "本地运行的开源模型",
  },
  {
    name: "lmstudio",
    display_name: "LM Studio",
    provider_type: "local",
    base_url: "http://localhost:1234",
    icon: "🖥️",
    description: "本地运行的 LLM 模型",
  },
  {
    name: "comfyui",
    display_name: "ComfyUI",
    provider_type: "local",
    base_url: "http://localhost:8188",
    icon: "🎨",
    description: "本地运行的 Stable Diffusion",
  },
  {
    name: "automatic1111",
    display_name: "Stable Diffusion WebUI",
    provider_type: "local",
    base_url: "http://localhost:7860",
    icon: "🖼️",
    description: "Automatic1111 WebUI",
  },
];

// 模型类型显示配置
export const MODEL_TYPE_CONFIG: Record<
  ModelType,
  { label: string; emoji: string; description: string }
> = {
  text_to_image: {
    label: "文生图",
    emoji: "🖼️",
    description: "根据文本描述生成图片",
  },
  text_to_video: {
    label: "文生视频",
    emoji: "🎬",
    description: "根据文本描述生成视频",
  },
  image_to_image: {
    label: "图生图",
    emoji: "🔄",
    description: "根据参考图片生成新图片",
  },
  image_to_video: {
    label: "图生视频",
    emoji: "📹",
    description: "根据图片生成视频",
  },
};
