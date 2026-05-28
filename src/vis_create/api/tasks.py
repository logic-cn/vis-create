"""
任务API路由
"""

import uuid
import asyncio
from typing import Generator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.task import (
    Task,
    TaskCreate,
    TaskResponse,
    TaskListResponse,
    TaskStatus,
    TaskProgressEvent,
)

router = APIRouter()


@router.get("", response_model=TaskListResponse)
def list_tasks(db: Session = Depends(get_db)):
    """获取任务列表"""
    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    return TaskListResponse(
        data=[TaskResponse.from_orm(t) for t in tasks],
        total=len(tasks),
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """获取任务详情"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm(task)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    """创建任务"""
    task = Task(
        type=data.type,
        prompt=data.prompt,
        parameters=data.parameters,
        status=TaskStatus.PENDING,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.from_orm(task)


@router.put("/{task_id}/pause", response_model=TaskResponse)
def pause_task(task_id: str, db: Session = Depends(get_db)):
    """暂停任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != TaskStatus.PROCESSING:
        raise HTTPException(status_code=400, detail="Task is not processing")

    task.status = TaskStatus.PAUSED
    db.commit()
    db.refresh(task)
    return TaskResponse.from_orm(task)


@router.put("/{task_id}/resume", response_model=TaskResponse)
def resume_task(task_id: str, db: Session = Depends(get_db)):
    """恢复任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status != TaskStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Task is not paused")

    task.status = TaskStatus.PROCESSING
    db.commit()
    db.refresh(task)
    return TaskResponse.from_orm(task)


@router.delete("/{task_id}", status_code=204)
def cancel_task(task_id: str, db: Session = Depends(get_db)):
    """取消任务"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
        raise HTTPException(status_code=400, detail="Task already finished")

    task.status = TaskStatus.FAILED
    task.error_message = "Cancelled by user"
    db.commit()


@router.get("/{task_id}/events")
async def task_events(task_id: str, db: Session = Depends(get_db)):
    """SSE进度推送"""
    task = db.query(Task).filter(Task.id == uuid.UUID(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    async def event_generator() -> Generator[str, None, None]:
        while True:
            # 刷新任务状态
            db.refresh(task)

            event = TaskProgressEvent(
                task_id=str(task.id),
                status=task.status,
                progress=task.progress,
            )

            yield f"event: {task.status.value}\ndata: {event.json()}\n\n"

            if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
