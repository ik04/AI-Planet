from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.stack import Stack
from ..db import SessionLocal
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/stacks", tags=["stacks"])

class StackCreate(BaseModel):
    name: str
    description: Optional[str] = None

class StackRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime  # Changed from Optional[str] to datetime

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=StackRead)
async def create_stack(stack: StackCreate, db: AsyncSession = Depends(get_db)):
    new_stack = Stack(
        id=str(uuid.uuid4()),  # Use UUID instead of hash
        name=stack.name,
        description=stack.description
    )
    db.add(new_stack)
    await db.commit()
    await db.refresh(new_stack)
    return new_stack

@router.get("/", response_model=List[StackRead])
async def list_stacks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stack))
    stacks = result.scalars().all()
    return stacks

@router.get("/{stack_id}", response_model=StackRead)
async def get_stack(stack_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stack).where(Stack.id == stack_id))
    stack = result.scalar_one_or_none()
    if not stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    return stack

@router.put("/{stack_id}", response_model=StackRead)
async def update_stack(stack_id: str, stack: StackCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stack).where(Stack.id == stack_id))
    db_stack = result.scalar_one_or_none()
    if not db_stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    db_stack.name = stack.name
    db_stack.description = stack.description
    await db.commit()
    await db.refresh(db_stack)
    return db_stack

@router.delete("/{stack_id}")
async def delete_stack(stack_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Stack).where(Stack.id == stack_id))
    db_stack = result.scalar_one_or_none()
    if not db_stack:
        raise HTTPException(status_code=404, detail="Stack not found")
    await db.delete(db_stack)
    await db.commit()
    return {"detail": "Stack deleted"}