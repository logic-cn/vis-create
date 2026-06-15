export type CreationType = "image" | "video";

// 摄影师视角参数
export interface PhotographyParams {
  lighting?: string; // 光线
  lens?: string; // 镜头
  depthOfField?: string; // 景深
  composition?: string; // 构图
  angle?: string; // 视角
}

// 后期视角参数
export interface PostProductionParams {
  tone?: string; // 色调
  saturation?: string; // 饱和度
  contrast?: string; // 对比度
  filter?: string; // 氛围滤镜
}

// 导演视角参数（视频专用）
export interface DirectorParams {
  cameraMovement?: string; // 运镜
  pace?: string; // 节奏
  mood?: string; // 情绪基调
  scene?: string; // 场景
}

// 主体视角参数
export interface SubjectParams {
  type?: string; // 主体类型
  emotion?: string; // 情绪
  era?: string; // 时代
  detail?: string; // 细节程度
}

// 环境视角参数
export interface EnvironmentParams {
  weather?: string; // 天气
  timeOfDay?: string; // 时间
  material?: string; // 材质
  colorScheme?: string; // 色彩方案
}

// 完整创作参数
export interface CreationParams {
  style: string; // 风格（必选）
  photography?: PhotographyParams;
  postProduction?: PostProductionParams;
  director?: DirectorParams;
  subject?: SubjectParams;
  environment?: EnvironmentParams;
}

// 参数选项定义
export interface ParamOption {
  id: string;
  label: string;
  emoji: string;
}

// 参数分组定义
export interface ParamGroup {
  id: string;
  label: string;
  emoji: string;
  options: ParamOption[];
  videoOnly?: boolean; // 是否仅视频类型可用
}
