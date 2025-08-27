from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models.workflow import Workflow
from ..db import SessionLocal
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


router = APIRouter(prefix="/workflows", tags=["workflows"])

class WorkflowCreate(BaseModel):
    stack_id: str
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    node_data: Dict[str, Any] = {}

class WorkflowRead(BaseModel):
    id: str
    stack_id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    data: Dict[str, Any]

    class Config:
        orm_mode = True

class WorkflowData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    data: Dict[str, Any]

    class Config:
        orm_mode = True

async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=WorkflowRead)
async def create_workflow(workflow: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    db_workflow = Workflow(
        id=f"wf-{abs(hash(workflow.name + str(datetime.now())))}", 
        **workflow.dict()
    )
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow

@router.get("/{stack_id}/list", response_model=List[WorkflowRead])
async def list_workflows(stack_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.stack_id == stack_id)
    )
    return result.scalars().all()

@router.get("/{stack_id}", response_model=WorkflowRead)
async def get_workflow(stack_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.stack_id == stack_id)
    )
    workflow = result.scalar_one_or_none()
    print("Fetched workflow:", workflow)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/{stack_id}", response_model=WorkflowData)
async def update_workflow(
    stack_id: str, 
    workflow_data: WorkflowData,
    db: AsyncSession = Depends(get_db)
):
    # Try to get existing workflow
    result = await db.execute(
        select(Workflow).where(Workflow.stack_id == stack_id)
    )
    db_workflow = result.scalar_one_or_none()
    
    if not db_workflow:
        db_workflow = Workflow(
            id=str(uuid.uuid4()),
            nodes=workflow_data.nodes,
            edges=workflow_data.edges,
            data=workflow_data.data,
            stack_id=stack_id
        )
        db.add(db_workflow)
    else:
        for key, value in workflow_data.dict().items():
            setattr(db_workflow, key, value)
    
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Workflow).where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    return {"detail": "Workflow deleted"}