"""
数据模型模块

定义数据库模型和Pydantic schemas
"""

from .artwork import Artwork, ArtworkCreate, ArtworkUpdate, ArtworkResponse
from .task import Task, TaskCreate, TaskResponse, TaskStatus
from .project import Project, ProjectCreate, ProjectUpdate, ProjectResponse
from .asset import Asset, AssetCreate, AssetResponse, AssetSource
from .character import (
    Character,
    CharacterCreate,
    CharacterUpdate,
    CharacterResponse,
    CharacterLockAvatar,
)
from .scene import (
    Scene,
    SceneCreate,
    SceneUpdate,
    SceneResponse,
    SceneListResponse,
    ShotType,
)
from .script import (
    Script,
    ScriptCreate,
    ScriptUpdate,
    ScriptResponse,
    Chapter,
    ChapterCreate,
    ChapterUpdate,
    ChapterResponse,
)
from .model_provider import (
    ModelProvider,
    ModelProviderCreate,
    ModelProviderUpdate,
    ModelProviderResponse,
    ModelProviderListResponse,
    Model,
    ModelCreate,
    ModelUpdate,
    ModelResponse,
    ModelListResponse,
    ModelType,
    ProviderType,
    DefaultModelsResponse,
    DefaultModelsUpdate,
)

__all__ = [
    "Artwork",
    "ArtworkCreate",
    "ArtworkUpdate",
    "ArtworkResponse",
    "Task",
    "TaskCreate",
    "TaskResponse",
    "TaskStatus",
    "Project",
    "ProjectCreate",
    "ProjectUpdate",
    "ProjectResponse",
    "Asset",
    "AssetCreate",
    "AssetResponse",
    "AssetSource",
    "Character",
    "CharacterCreate",
    "CharacterUpdate",
    "CharacterResponse",
    "CharacterLockAvatar",
    "Scene",
    "SceneCreate",
    "SceneUpdate",
    "SceneResponse",
    "SceneListResponse",
    "ShotType",
    "Script",
    "ScriptCreate",
    "ScriptUpdate",
    "ScriptResponse",
    "Chapter",
    "ChapterCreate",
    "ChapterUpdate",
    "ChapterResponse",
    "ModelProvider",
    "ModelProviderCreate",
    "ModelProviderUpdate",
    "ModelProviderResponse",
    "ModelProviderListResponse",
    "Model",
    "ModelCreate",
    "ModelUpdate",
    "ModelResponse",
    "ModelListResponse",
    "ModelType",
    "ProviderType",
    "DefaultModelsResponse",
    "DefaultModelsUpdate",
]
