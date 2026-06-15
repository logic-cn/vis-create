"""参数到提示词的映射配置"""

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
            "studio": "studio lighting, professional",
            "dramatic": "dramatic lighting, high contrast",
            "soft": "soft lighting, diffused",
            "golden_hour": "golden hour, warm tones",
            "blue_hour": "blue hour, cool tones",
            "backlit": "backlit, silhouette effect",
            "rim_light": "rim lighting, edge glow",
        },
        "lens": {
            "wide_angle": "wide angle lens, 24mm",
            "standard": "standard lens, 50mm",
            "telephoto": "telephoto lens, compressed perspective",
            "macro": "macro lens, extreme close-up",
            "fisheye": "fisheye lens, distorted perspective",
            "tilt_shift": "tilt-shift, miniature effect",
        },
        "depth_of_field": {
            "shallow": "shallow depth of field, bokeh background",
            "deep": "deep depth of field, everything in focus",
            "selective": "selective focus, subject isolation",
        },
        "composition": {
            "rule_of_thirds": "rule of thirds composition",
            "centered": "centered composition, symmetrical",
            "golden_ratio": "golden ratio composition",
            "leading_lines": "leading lines, dynamic composition",
            "frame_within_frame": "framing composition, natural frame",
        },
        "angle": {
            "eye_level": "eye level angle",
            "low_angle": "low angle, looking up, powerful",
            "high_angle": "high angle, looking down",
            "birds_eye": "bird's eye view, overhead",
            "dutch_angle": "dutch angle, tilted, dynamic",
        },
    },
    "post_production": {
        "tone": {
            "warm": "warm color tones",
            "cool": "cool color tones",
            "neutral": "neutral color balance",
            "muted": "muted, desaturated tones",
            "vibrant": "vibrant, saturated colors",
        },
        "saturation": {
            "low": "desaturated, subtle colors",
            "medium": "balanced saturation",
            "high": "highly saturated, vivid colors",
        },
        "contrast": {
            "low": "low contrast, flat",
            "medium": "balanced contrast",
            "high": "high contrast, dramatic",
        },
        "mood_filter": {
            "cinematic": "cinematic look, film color grading",
            "dreamy": "dreamy, ethereal atmosphere",
            "moody": "moody, atmospheric",
            "bright": "bright, cheerful atmosphere",
            "dark": "dark, mysterious atmosphere",
        },
    },
    "subject": {
        "type": {
            "person": "person, portrait",
            "animal": "animal, wildlife",
            "landscape": "landscape, scenery",
            "architecture": "architecture, building",
            "object": "object, still life",
            "abstract": "abstract, conceptual",
        },
        "emotion": {
            "happy": "happy, joyful expression",
            "sad": "sad, melancholic mood",
            "calm": "calm, peaceful, serene",
            "energetic": "energetic, dynamic",
            "mysterious": "mysterious, enigmatic",
        },
        "era": {
            "modern": "modern, contemporary",
            "retro": "retro, vintage style",
            "futuristic": "futuristic, sci-fi",
            "classical": "classical, traditional",
        },
        "detail_level": {
            "minimal": "minimalist, simple",
            "moderate": "moderate detail",
            "high": "highly detailed, intricate",
            "ultra": "ultra detailed, hyper-realistic",
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
        },
        "time_of_day": {
            "dawn": "dawn, sunrise, early morning",
            "morning": "morning light",
            "noon": "midday, bright sunlight",
            "afternoon": "afternoon, warm light",
            "sunset": "sunset, golden hour",
            "dusk": "dusk, twilight",
            "night": "nighttime, dark sky",
            "blue_hour": "blue hour, twilight",
        },
        "material": {
            "metal": "metallic, reflective surface",
            "wood": "wooden texture, natural grain",
            "glass": "glass, transparent, reflective",
            "fabric": "fabric texture, soft material",
            "stone": "stone, rocky texture",
            "organic": "organic, natural materials",
        },
        "color_scheme": {
            "monochrome": "monochrome, black and white",
            "analogous": "analogous colors, harmonious",
            "complementary": "complementary colors, high contrast",
            "triadic": "triadic color scheme, vibrant",
            "pastel": "pastel colors, soft tones",
            "earth_tones": "earth tones, natural colors",
        },
    },
}

# 参数优先级（用于提示词排序）
PARAMETER_PRIORITY = [
    "style",  # 风格最重要
    "subject",  # 主体其次
    "environment",  # 环境再次
    "photography",  # 摄影参数
    "post_production",  # 后期参数
]
