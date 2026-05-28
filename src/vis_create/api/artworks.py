"""
作品API路由
"""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.artwork import (
    Artwork,
    ArtworkCreate,
    ArtworkUpdate,
    ArtworkResponse,
    ArtworkListResponse,
)

router = APIRouter()


@router.get("", response_model=ArtworkListResponse)
def list_artworks(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None, pattern="^(image|video)$"),
    style: Optional[str] = None,
    sort: str = Query("created_at", pattern="^(created_at|title|is_favorite)$"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """获取作品列表"""
    query = db.query(Artwork)

    # 筛选
    if type:
        query = query.filter(Artwork.type == type)
    if style:
        query = query.filter(Artwork.style == style)
    if search:
        query = query.filter(
            Artwork.title.ilike(f"%{search}%") | Artwork.prompt.ilike(f"%{search}%")
        )

    # 排序
    if sort == "created_at":
        query = query.order_by(Artwork.created_at.desc())
    elif sort == "title":
        query = query.order_by(Artwork.title)
    elif sort == "is_favorite":
        query = query.order_by(Artwork.is_favorite.desc())

    # 分页
    total = query.count()
    artworks = query.offset((page - 1) * limit).limit(limit).all()

    return ArtworkListResponse(
        data=[ArtworkResponse.from_orm(a) for a in artworks],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{artwork_id}", response_model=ArtworkResponse)
def get_artwork(artwork_id: str, db: Session = Depends(get_db)):
    """获取作品详情"""
    artwork = db.query(Artwork).filter(Artwork.id == uuid.UUID(artwork_id)).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")
    return ArtworkResponse.from_orm(artwork)


@router.post("", response_model=ArtworkResponse, status_code=201)
def create_artwork(data: ArtworkCreate, db: Session = Depends(get_db)):
    """创建作品"""
    artwork = Artwork(
        title=data.title,
        description=data.description,
        type=data.type,
        file_path="",  # 将由生成器填充
        prompt=data.prompt,
        style=data.style,
        parameters=data.parameters,
        tags=data.tags,
    )
    db.add(artwork)
    db.commit()
    db.refresh(artwork)
    return ArtworkResponse.from_orm(artwork)


@router.put("/{artwork_id}", response_model=ArtworkResponse)
def update_artwork(
    artwork_id: str, data: ArtworkUpdate, db: Session = Depends(get_db)
):
    """更新作品信息"""
    artwork = db.query(Artwork).filter(Artwork.id == uuid.UUID(artwork_id)).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(artwork, key, value)

    db.commit()
    db.refresh(artwork)
    return ArtworkResponse.from_orm(artwork)


@router.delete("/{artwork_id}", status_code=204)
def delete_artwork(artwork_id: str, db: Session = Depends(get_db)):
    """删除作品"""
    artwork = db.query(Artwork).filter(Artwork.id == uuid.UUID(artwork_id)).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    db.delete(artwork)
    db.commit()


@router.post("/{artwork_id}/favorite", response_model=ArtworkResponse)
def toggle_favorite(artwork_id: str, db: Session = Depends(get_db)):
    """收藏/取消收藏作品"""
    artwork = db.query(Artwork).filter(Artwork.id == uuid.UUID(artwork_id)).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="Artwork not found")

    artwork.is_favorite = not artwork.is_favorite
    db.commit()
    db.refresh(artwork)
    return ArtworkResponse.from_orm(artwork)
