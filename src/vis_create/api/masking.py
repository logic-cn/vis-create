"""
密钥脱敏工具

后端 API 只返回脱敏后的密钥，绝不回传明文；
前端把脱敏占位值回传时，不得覆盖数据库中的真实密钥。
"""

MASK_PREFIX = "••••"


def mask_secret(value: str | None) -> str | None:
    """把密钥脱敏为仅保留末 4 位的占位值，未设置时返回 None。"""
    if not value:
        return None
    if len(value) <= 4:
        return MASK_PREFIX
    return f"{MASK_PREFIX}{value[-4:]}"


def is_masked_secret(value: str | None) -> bool:
    """判断客户端提交的值是否为脱敏占位值。"""
    return bool(value) and value.startswith(MASK_PREFIX)
