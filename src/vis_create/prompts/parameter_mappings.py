"""参数到提示词的映射配置

命名规范：使用驼峰命名（camelCase），与前端保持一致
"""

# 参数到英文提示词的映射
PARAMETER_MAPPINGS = {
    "style": {
        "realistic": "photorealistic, high quality, detailed, 8k resolution",
        "anime": "anime style, cel shading, vibrant colors, Japanese animation",
        "cartoon": "cartoon style, bold outlines, flat colors, playful",
        "artistic": "artistic, creative expression, unique style",
        "cyberpunk": "cyberpunk, neon lights, futuristic, high-tech",
        "watercolor": "watercolor painting, soft edges, flowing colors",
        "oil_painting": "oil painting, textured brushstrokes, rich colors",
        "pixel": "pixel art, retro game style, 8-bit aesthetic",
        "minimalist": "minimalist, clean lines, simple, modern",
        "vintage": "vintage, retro, nostalgic, film grain",
    },
    "photography": {
        "lighting": {
            "natural": "natural lighting",
            "golden-hour": "golden hour, warm tones",
            "blue-hour": "blue hour, cool tones",
            "top-light": "top lighting, overhead",
            "side-light": "side lighting, dramatic shadows",
            "backlight": "backlit, silhouette effect",
            "soft-light": "soft lighting, diffused",
            "hard-light": "hard lighting, high contrast",
            "neon": "neon lighting, colorful",
            "candlelight": "candlelight, warm glow",
        },
        "lens": {
            "wide-angle": "wide angle lens, 24mm",
            "standard": "standard lens, 50mm",
            "telephoto": "telephoto lens, compressed perspective",
            "macro": "macro lens, extreme close-up",
            "fisheye": "fisheye lens, distorted perspective",
            "tilt-shift": "tilt-shift, miniature effect",
        },
        "depthOfField": {
            "shallow": "shallow depth of field, bokeh background",
            "deep": "deep depth of field, everything in focus",
            "ultra-shallow": "ultra shallow depth of field, extreme bokeh",
        },
        "composition": {
            "rule-of-thirds": "rule of thirds composition",
            "center": "centered composition, symmetrical",
            "diagonal": "diagonal composition, dynamic",
            "leading-lines": "leading lines, dynamic composition",
            "framing": "framing composition, natural frame",
            "negative-space": "negative space, minimalist composition",
        },
        "angle": {
            "eye-level": "eye level angle",
            "high-angle": "high angle, looking down",
            "low-angle": "low angle, looking up, powerful",
            "birds-eye": "bird's eye view, overhead",
            "worms-eye": "worm's eye view, from below",
            "dutch-angle": "dutch angle, tilted, dynamic",
        },
    },
    "postProduction": {
        "tone": {
            "warm": "warm color tones",
            "cool": "cool color tones",
            "neutral": "neutral color balance",
            "vintage-film": "vintage film color grading, nostalgic",
            "japanese": "Japanese style, soft pastel tones",
        },
        "saturation": {
            "high": "highly saturated, vivid colors",
            "normal": "balanced saturation",
            "low": "desaturated, subtle colors",
            "monochrome": "monochrome, single color",
            "bw": "black and white",
        },
        "contrast": {
            "high": "high contrast, dramatic",
            "normal": "balanced contrast",
            "low": "low contrast, soft",
            "hdr": "HDR, high dynamic range",
            "soft": "soft contrast, gentle",
        },
        "filter": {
            "cinematic": "cinematic look, film color grading",
            "vaporwave": "vaporwave aesthetic, retro digital",
            "dreamy": "dreamy, ethereal atmosphere",
            "dark": "dark, mysterious atmosphere",
            "fresh": "fresh, clean, bright",
            "noir": "film noir, dark and moody",
            "documentary": "documentary style, natural",
        },
    },
    "director": {
        "cameraMovement": {
            "push-in": "camera push in, zooming closer",
            "pull-out": "camera pull out, revealing wider scene",
            "pan": "camera pan, horizontal movement",
            "track": "camera tracking shot",
            "follow": "camera following subject",
            "crane": "crane shot, vertical movement",
            "orbit": "orbiting camera, circular movement",
            "handheld": "handheld camera, slight shake",
            "static": "static camera, no movement",
        },
        "pace": {
            "fast": "fast paced, dynamic editing",
            "slow": "slow paced, contemplative",
            "accelerating": "accelerating pace, building tension",
            "decelerating": "decelerating pace, calming down",
            "steady": "steady pace, consistent rhythm",
        },
        "mood": {
            "epic": "epic, grand, cinematic",
            "romantic": "romantic, soft, intimate",
            "suspense": "suspenseful, tense, mysterious",
            "joyful": "joyful, happy, uplifting",
            "melancholic": "melancholic, sad, reflective",
            "tense": "tense, anxious, dramatic",
            "calm": "calm, peaceful, serene",
        },
        "scene": {
            "indoor": "indoor scene, interior",
            "outdoor": "outdoor scene, exterior",
            "urban": "urban environment, city",
            "nature": "natural environment, wilderness",
            "virtual": "virtual space, digital environment",
            "stage": "stage setting, theatrical",
        },
    },
    "subject": {
        "type": {
            "person": "person, portrait",
            "animal": "animal, wildlife",
            "landscape": "landscape, scenery",
            "architecture": "architecture, building",
            "abstract": "abstract, conceptual",
            "product": "product photography",
            "food": "food photography, appetizing",
            "vehicle": "vehicle, transportation",
        },
        "emotion": {
            "joyful": "joyful, happy expression",
            "melancholic": "melancholic, sad mood",
            "tense": "tense, anxious expression",
            "calm": "calm, peaceful, serene",
            "mysterious": "mysterious, enigmatic",
            "romantic": "romantic, loving",
            "epic": "epic, heroic",
            "nostalgic": "nostalgic, reminiscent",
        },
        "era": {
            "ancient": "ancient times, classical",
            "medieval": "medieval period",
            "modern": "modern era, contemporary",
            "contemporary": "contemporary, present day",
            "future": "futuristic, sci-fi",
            "retro-80s": "1980s retro style",
            "retro-90s": "1990s retro style",
        },
        "detail": {
            "minimal": "minimalist, simple",
            "simple": "simple, clean",
            "standard": "standard detail level",
            "detailed": "highly detailed, intricate",
            "ultra-detailed": "ultra detailed, hyper-realistic",
        },
    },
    "environment": {
        "weather": {
            "sunny": "sunny, clear sky",
            "cloudy": "cloudy, overcast",
            "rainy": "rainy, wet surfaces",
            "snowy": "snowy, winter scene",
            "foggy": "foggy, misty atmosphere",
            "stormy": "stormy, dramatic sky",
            "windy": "windy, flowing elements",
        },
        "timeOfDay": {
            "dawn": "dawn, sunrise, early morning",
            "morning": "morning light",
            "noon": "midday, bright sunlight",
            "afternoon": "afternoon, warm light",
            "dusk": "dusk, twilight",
            "night": "nighttime, dark sky",
            "midnight": "midnight, deep night",
        },
        "material": {
            "metal": "metallic, reflective surface",
            "wood": "wooden texture, natural grain",
            "glass": "glass, transparent, reflective",
            "fabric": "fabric texture, soft material",
            "paper": "paper texture, delicate",
            "stone": "stone, rocky texture",
            "plastic": "plastic, smooth surface",
            "organic": "organic, natural materials",
        },
        "colorScheme": {
            "monochrome": "monochrome, single color palette",
            "complementary": "complementary colors, high contrast",
            "analogous": "analogous colors, harmonious",
            "triadic": "triadic color scheme, vibrant",
            "full-color": "full color spectrum",
            "pastel": "pastel colors, soft tones",
            "neon": "neon colors, glowing",
        },
    },
}

# 参数优先级（用于提示词排序）
PARAMETER_PRIORITY = [
    "style",  # 风格最重要
    "subject",  # 主体其次
    "environment",  # 环境再次
    "photography",  # 摄影参数
    "postProduction",  # 后期参数
    "director",  # 导演参数（视频）
]
