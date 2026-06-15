import type { ParamGroup, ParamOption } from "../types/creation";

// 风格选项
export const STYLE_OPTIONS: ParamOption[] = [
  { id: "realistic", label: "写实", emoji: "📷" },
  { id: "anime", label: "动漫", emoji: "🎌" },
  { id: "cartoon", label: "卡通", emoji: "🎨" },
  { id: "artistic", label: "艺术", emoji: "🖌️" },
  { id: "cyberpunk", label: "赛博朋克", emoji: "🌆" },
  { id: "watercolor", label: "水彩", emoji: "🎭" },
  { id: "oil_painting", label: "油画", emoji: "🖼️" },
  { id: "pixel", label: "像素风", emoji: "👾" },
  { id: "minimalist", label: "极简", emoji: "◻️" },
  { id: "vintage", label: "复古", emoji: "📽️" },
];

// 摄影师参数分组
export const PHOTOGRAPHY_GROUPS: ParamGroup[] = [
  {
    id: "lighting",
    label: "光线",
    emoji: "💡",
    options: [
      { id: "natural", label: "自然光", emoji: "☀️" },
      { id: "golden-hour", label: "黄金时刻", emoji: "🌅" },
      { id: "blue-hour", label: "蓝色时刻", emoji: "🌆" },
      { id: "top-light", label: "顶光", emoji: "⬇️" },
      { id: "side-light", label: "侧光", emoji: "➡️" },
      { id: "backlight", label: "逆光", emoji: "🌅" },
      { id: "soft-light", label: "柔光", emoji: "☁️" },
      { id: "hard-light", label: "硬光", emoji: "🔆" },
      { id: "neon", label: "霓虹灯", emoji: "💜" },
      { id: "candlelight", label: "烛光", emoji: "🕯️" },
    ],
  },
  {
    id: "lens",
    label: "镜头",
    emoji: "🔭",
    options: [
      { id: "wide-angle", label: "广角", emoji: "🔲" },
      { id: "standard", label: "标准", emoji: "📷" },
      { id: "telephoto", label: "长焦", emoji: "🔭" },
      { id: "macro", label: "微距", emoji: "🔍" },
      { id: "fisheye", label: "鱼眼", emoji: "👁️" },
      { id: "tilt-shift", label: "移轴", emoji: "🏗️" },
    ],
  },
  {
    id: "depthOfField",
    label: "景深",
    emoji: "🎯",
    options: [
      { id: "shallow", label: "浅景深", emoji: "🔵" },
      { id: "deep", label: "深景深", emoji: "🏔️" },
      { id: "ultra-shallow", label: "极浅景深", emoji: "⚪" },
    ],
  },
  {
    id: "composition",
    label: "构图",
    emoji: "📐",
    options: [
      { id: "rule-of-thirds", label: "三分法", emoji: "📐" },
      { id: "center", label: "中心对称", emoji: "🎯" },
      { id: "diagonal", label: "对角线", emoji: "↗️" },
      { id: "leading-lines", label: "引导线", emoji: "↗️" },
      { id: "framing", label: "框架构图", emoji: "🪟" },
      { id: "negative-space", label: "留白", emoji: "⬜" },
    ],
  },
  {
    id: "angle",
    label: "视角",
    emoji: "👁️",
    options: [
      { id: "eye-level", label: "平视", emoji: "👀" },
      { id: "high-angle", label: "俯拍", emoji: "⬇️" },
      { id: "low-angle", label: "仰拍", emoji: "⬆️" },
      { id: "birds-eye", label: "鸟瞰", emoji: "🦅" },
      { id: "worms-eye", label: "虫眼", emoji: "🐛" },
      { id: "dutch-angle", label: "荷兰角", emoji: "↩️" },
    ],
  },
];

// 后期参数分组
export const POST_PRODUCTION_GROUPS: ParamGroup[] = [
  {
    id: "tone",
    label: "色调",
    emoji: "🎨",
    options: [
      { id: "warm", label: "暖色调", emoji: "🟠" },
      { id: "cool", label: "冷色调", emoji: "🔵" },
      { id: "neutral", label: "中性色调", emoji: "⚪" },
      { id: "vintage-film", label: "复古胶片", emoji: "📽️" },
      { id: "japanese", label: "日系清新", emoji: "🌸" },
    ],
  },
  {
    id: "saturation",
    label: "饱和度",
    emoji: "🌈",
    options: [
      { id: "high", label: "高饱和", emoji: "🌈" },
      { id: "normal", label: "正常", emoji: "🎨" },
      { id: "low", label: "低饱和", emoji: "🌫️" },
      { id: "monochrome", label: "单色", emoji: "⬛" },
      { id: "bw", label: "黑白", emoji: "🖤" },
    ],
  },
  {
    id: "contrast",
    label: "对比度",
    emoji: "◐",
    options: [
      { id: "high", label: "高对比", emoji: "⬛⬜" },
      { id: "normal", label: "正常", emoji: "◐" },
      { id: "low", label: "低对比", emoji: "🌫️" },
      { id: "hdr", label: "HDR", emoji: "✨" },
      { id: "soft", label: "柔和", emoji: "☁️" },
    ],
  },
  {
    id: "filter",
    label: "氛围滤镜",
    emoji: "🎬",
    options: [
      { id: "cinematic", label: "电影感", emoji: "🎬" },
      { id: "vaporwave", label: "蒸汽波", emoji: "💜" },
      { id: "dreamy", label: "梦幻", emoji: "💭" },
      { id: "dark", label: "暗黑", emoji: "🖤" },
      { id: "fresh", label: "清新", emoji: "🌿" },
      { id: "noir", label: "黑色电影", emoji: "🎥" },
      { id: "documentary", label: "纪录片", emoji: "📹" },
    ],
  },
];

// 导演参数分组（视频专用）
export const DIRECTOR_GROUPS: ParamGroup[] = [
  {
    id: "cameraMovement",
    label: "运镜",
    emoji: "🎥",
    videoOnly: true,
    options: [
      { id: "push-in", label: "推", emoji: "➡️" },
      { id: "pull-out", label: "拉", emoji: "⬅️" },
      { id: "pan", label: "摇", emoji: "↔️" },
      { id: "track", label: "移", emoji: "🚃" },
      { id: "follow", label: "跟拍", emoji: "🏃" },
      { id: "crane", label: "升降", emoji: "🏗️" },
      { id: "orbit", label: "环绕", emoji: "🔄" },
      { id: "handheld", label: "手持", emoji: "✋" },
      { id: "static", label: "固定", emoji: "📹" },
    ],
  },
  {
    id: "pace",
    label: "节奏",
    emoji: "⏱️",
    videoOnly: true,
    options: [
      { id: "fast", label: "快节奏", emoji: "⚡" },
      { id: "slow", label: "慢节奏", emoji: "🐢" },
      { id: "accelerating", label: "渐快", emoji: "📈" },
      { id: "decelerating", label: "渐慢", emoji: "📉" },
      { id: "steady", label: "匀速", emoji: "➡️" },
    ],
  },
  {
    id: "mood",
    label: "情绪基调",
    emoji: "🎭",
    videoOnly: true,
    options: [
      { id: "epic", label: "史诗", emoji: "⚔️" },
      { id: "romantic", label: "浪漫", emoji: "💕" },
      { id: "suspense", label: "悬疑", emoji: "🔍" },
      { id: "joyful", label: "欢乐", emoji: "🎉" },
      { id: "melancholic", label: "悲伤", emoji: "😢" },
      { id: "tense", label: "紧张", emoji: "😰" },
      { id: "calm", label: "平静", emoji: "🧘" },
    ],
  },
  {
    id: "scene",
    label: "场景",
    emoji: "🏞️",
    videoOnly: true,
    options: [
      { id: "indoor", label: "室内", emoji: "🏠" },
      { id: "outdoor", label: "室外", emoji: "🌳" },
      { id: "urban", label: "城市", emoji: "🏙️" },
      { id: "nature", label: "自然", emoji: "🏔️" },
      { id: "virtual", label: "虚拟空间", emoji: "🎮" },
      { id: "stage", label: "舞台", emoji: "🎭" },
    ],
  },
];

// 主体参数分组
export const SUBJECT_GROUPS: ParamGroup[] = [
  {
    id: "type",
    label: "主体类型",
    emoji: "🎭",
    options: [
      { id: "person", label: "人物", emoji: "👤" },
      { id: "animal", label: "动物", emoji: "🐾" },
      { id: "landscape", label: "风景", emoji: "🏞️" },
      { id: "architecture", label: "建筑", emoji: "🏛️" },
      { id: "abstract", label: "抽象", emoji: "🎨" },
      { id: "product", label: "产品", emoji: "📦" },
      { id: "food", label: "美食", emoji: "🍽️" },
      { id: "vehicle", label: "载具", emoji: "🚗" },
    ],
  },
  {
    id: "emotion",
    label: "情绪",
    emoji: "💭",
    options: [
      { id: "joyful", label: "欢乐", emoji: "😊" },
      { id: "melancholic", label: "忧郁", emoji: "😢" },
      { id: "tense", label: "紧张", emoji: "😰" },
      { id: "calm", label: "平静", emoji: "😌" },
      { id: "mysterious", label: "神秘", emoji: "🔮" },
      { id: "romantic", label: "浪漫", emoji: "💕" },
      { id: "epic", label: "史诗", emoji: "⚔️" },
      { id: "nostalgic", label: "怀旧", emoji: "📼" },
    ],
  },
  {
    id: "era",
    label: "时代",
    emoji: "⏳",
    options: [
      { id: "ancient", label: "古代", emoji: "🏛️" },
      { id: "medieval", label: "中世纪", emoji: "⚔️" },
      { id: "modern", label: "现代", emoji: "🏙️" },
      { id: "contemporary", label: "当代", emoji: "🌆" },
      { id: "future", label: "未来", emoji: "🚀" },
      { id: "retro-80s", label: "80年代", emoji: "📼" },
      { id: "retro-90s", label: "90年代", emoji: "💿" },
    ],
  },
  {
    id: "detail",
    label: "细节程度",
    emoji: "🔍",
    options: [
      { id: "minimal", label: "极简", emoji: "◻️" },
      { id: "simple", label: "简约", emoji: "◾" },
      { id: "standard", label: "标准", emoji: "◼️" },
      { id: "detailed", label: "精细", emoji: "⬛" },
      { id: "ultra-detailed", label: "超精细", emoji: "🔲" },
    ],
  },
];

// 环境参数分组
export const ENVIRONMENT_GROUPS: ParamGroup[] = [
  {
    id: "weather",
    label: "天气",
    emoji: "🌤️",
    options: [
      { id: "sunny", label: "晴天", emoji: "☀️" },
      { id: "cloudy", label: "多云", emoji: "☁️" },
      { id: "rainy", label: "雨天", emoji: "🌧️" },
      { id: "snowy", label: "雪天", emoji: "❄️" },
      { id: "foggy", label: "雾天", emoji: "🌫️" },
      { id: "stormy", label: "暴风雨", emoji: "⛈️" },
      { id: "windy", label: "大风", emoji: "💨" },
    ],
  },
  {
    id: "timeOfDay",
    label: "时间",
    emoji: "🕐",
    options: [
      { id: "dawn", label: "黎明", emoji: "🌅" },
      { id: "morning", label: "上午", emoji: "🌞" },
      { id: "noon", label: "正午", emoji: "☀️" },
      { id: "afternoon", label: "下午", emoji: "🌤️" },
      { id: "dusk", label: "黄昏", emoji: "🌇" },
      { id: "night", label: "夜晚", emoji: "🌙" },
      { id: "midnight", label: "深夜", emoji: "🌃" },
    ],
  },
  {
    id: "material",
    label: "材质",
    emoji: "🪨",
    options: [
      { id: "metal", label: "金属", emoji: "⚙️" },
      { id: "wood", label: "木材", emoji: "🪵" },
      { id: "glass", label: "玻璃", emoji: "🪟" },
      { id: "fabric", label: "布料", emoji: "🧵" },
      { id: "paper", label: "纸张", emoji: "📄" },
      { id: "stone", label: "石材", emoji: "🪨" },
      { id: "plastic", label: "塑料", emoji: "🧴" },
      { id: "organic", label: "有机物", emoji: "🌿" },
    ],
  },
  {
    id: "colorScheme",
    label: "色彩方案",
    emoji: "🎨",
    options: [
      { id: "monochrome", label: "单色", emoji: "⬛" },
      { id: "complementary", label: "互补色", emoji: "🔵🟠" },
      { id: "analogous", label: "类似色", emoji: "🟢🔵" },
      { id: "triadic", label: "三色", emoji: "🔴🟡🔵" },
      { id: "full-color", label: "全彩", emoji: "🌈" },
      { id: "pastel", label: "粉彩", emoji: "🎀" },
      { id: "neon", label: "霓虹", emoji: "💜" },
    ],
  },
];
