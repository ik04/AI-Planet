import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models.workflow import Workflow
from db import SessionLocal
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid
from fastapi import UploadFile, File
from fastapi.responses import FileResponse
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
import chromadb
import fitz
import logging
from serpapi import GoogleSearch
import json

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


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

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    context_used: dict



async def get_db():
    async with SessionLocal() as session:
        yield session

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

chroma_client = chromadb.PersistentClient(path="chroma_db")

def parse_pdf(path: str) -> str:
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text("text")
    return text


def chunk_text(text: str, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunks.append(" ".join(words[start:end]))
        start += chunk_size - overlap
    return chunks

@router.post("/{stack_id}/build")
async def build_workflow(stack_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Fetch workflow from DB
    result = await db.execute(select(Workflow).where(Workflow.stack_id == stack_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        logger.error("❌ Workflow not found")
        raise HTTPException(status_code=404, detail="Workflow not found")
    logger.info("✅ Workflow loaded from DB")

    nodes = workflow.nodes or []
    node_types = {n["data"]["type"]: n for n in nodes}
    logger.info(f"📦 Found {len(nodes)} nodes: {list(node_types.keys())}")

    # 2. Validate workflow
    if "llm" not in node_types or "output" not in node_types:
        logger.error("❌ Missing required nodes (llm/output)")
        raise HTTPException(
            status_code=400,
            detail="Workflow must include both an LLM node and an Output node"
        )

    context_chunks: list[str] = []   # <-- now declared here
    model = None
    collection = None

    # 3. Knowledge Base (optional)
    if "knowledge-base" in node_types:
        logger.info("📖 Processing knowledge base node")
        kb_node = node_types["knowledge-base"]
        embedding_model_name = (
            kb_node["data"].get("nodeData", {}).get("embeddingModel", "all-MiniLM-L6-v2")
        )
        logger.info(f"🔑 Using embedding model: {embedding_model_name}")
        model = SentenceTransformer(embedding_model_name)

        # 🔍 Ensure workflow.data is a dict
        raw_data = workflow.data or {}
        print("Raw workflow data:", raw_data)
        if isinstance(raw_data, str):
            try:
                raw_data = json.loads(raw_data)
                logger.info("🪣 Parsed workflow.data from JSON string")
            except Exception as e:
                logger.error(f"❌ Failed to parse workflow.data JSON: {e}")
                raw_data = {}

        logger.info(f"📂 Workflow data keys: {list(raw_data.keys())}")
        documents = raw_data.get("documents", [])
        if not documents:
            for key, value in raw_data.items():
                if key.startswith("knowledge-base") and isinstance(value, dict):
                    doc_meta = {
                        "id": value.get("documentId"),
                        "file_name": value.get("fileName"),
                        "path": os.path.join(UPLOAD_DIR, f"{value.get('documentId')}_{value.get('fileName')}")
                    }
                    documents.append(doc_meta)
        logger.info(f"📄 Found {len(documents)} documents for KB: {documents}")

        for doc in documents:
            file_path = doc.get("path")
            logger.info(f"➡️ Looking for document at: {file_path}")
            if file_path and os.path.exists(file_path):
                logger.info(f"📥 Parsing {file_path}")
                text = parse_pdf(file_path)
                chunks = chunk_text(text)
                logger.info(f"   ✅ {len(chunks)} chunks extracted")
                context_chunks.extend(chunks)
            else:
                logger.warning(f"⚠️ File not found: {file_path}")

        if context_chunks:
            logger.info(f"🪣 Adding {len(context_chunks)} chunks to Chroma collection")
            collection_name = f"kb-{stack_id}"
            existing_collections = [c.name for c in chroma_client.list_collections()]
            if collection_name in existing_collections:
                chroma_client.delete_collection(name=collection_name)

            # Create a fresh collection
            collection = chroma_client.get_or_create_collection(name=collection_name)
            embeddings = model.encode(context_chunks).tolist()
            collection.add(
                documents=context_chunks,
                embeddings=embeddings,
                ids=[f"{stack_id}-doc-{i}" for i in range(len(context_chunks))]
            )
        else:
            logger.info("⚠️ No context chunks extracted from KB")

    # 4. User Input
    user_query = node_types.get("user-input", {}).get("data", {}).get("nodeData", {}).get("query")
    if not user_query:
        logger.error("❌ Missing user query in input node")
        raise HTTPException(status_code=400, detail="User input node must contain a query")
    logger.info(f"🙋 User query: {user_query}")

    retrieved_docs = []
    if collection and model:
        logger.info("🔎 Querying knowledge base for context")
        query_embedding = model.encode(user_query).tolist()
        results = collection.query(query_embeddings=[query_embedding], n_results=3)
        retrieved_docs = results["documents"][0]
        logger.info(f"   Retrieved {len(retrieved_docs)} docs from Chroma")


    # 5. LLM Node Config
    llm_node = node_types["llm"]
    node_data = llm_node["data"].get("nodeData", {})

    gemini_key = node_data.get("apiKey")
    gemini_model = node_data.get("model", "gemini-2.0-flash")
    serpapi_key = node_data.get("serpApi")   # renamed for clarity
    use_web = node_data.get("webSearch", False)

    if not gemini_key:
        logger.error("❌ Gemini API key missing in workflow")
        raise HTTPException(status_code=400, detail="Gemini API key missing in workflow")

    genai.configure(api_key=gemini_key)
    logger.info(f"🤖 Configured Gemini with model={gemini_model}")

    # 6. Web Search (SerpAPI integration)
    web_context = ""
    if use_web and serpapi_key:
        logger.info("🌐 Performing web search with SerpAPI")
        try:
            search = GoogleSearch({
                "engine": "google",
                "q": user_query,
                "api_key": serpapi_key
            })
            results = search.get_dict()

            snippets = []
            for item in results.get("organic_results", [])[:3]:
                title = item.get("title", "")
                link = item.get("link", "")
                snippet = item.get("snippet", "")
                snippets.append(f"{title} ({link}): {snippet}")

            web_context = "\n".join(snippets)
            logger.info(f"   Retrieved {len(snippets)} web snippets")

        except Exception as e:
            logger.error(f"❌ SerpAPI search failed: {e}")

    # 7. Build final prompt
    kb_context = "\n".join(retrieved_docs) if retrieved_docs else ""
    combined_context = "\n\n".join([c for c in [kb_context, web_context] if c.strip()])

    output_node = node_types.get("output")
    output_data_str = ""
    if output_node:
        output_node_data = output_node.get("data", {}).get("nodeData", {})
        if output_data_data := output_node_data.get("outputText"):
            output_data_str = f"\n\nOutput: {output_data_data}"


    logger.info(f"📝 Building prompt (context length={len(combined_context)})")
    prompt = f"Context:\n{combined_context}{output_data_str}\n\nUser Query: {user_query}\nAnswer:"

    # 8. Call Gemini
    llm = genai.GenerativeModel(gemini_model)
    logger.info("🚀 Sending prompt to Gemini")
    response = llm.generate_content(prompt)
    logger.info("✅ Gemini response received")

    return {
        "stack_id": stack_id,
        "answer": response.text,
        "context_used": {
            "knowledge_base": retrieved_docs,
            "web_search": web_context.split("\n") if web_context else []
        }
    }

@router.post("/{stack_id}/chat", response_model=ChatResponse)
async def chat_with_workflow(stack_id: str, req: ChatRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch workflow
    result = await db.execute(select(Workflow).where(Workflow.stack_id == stack_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    nodes = workflow.nodes or []
    print(nodes)
    node_types = {n["data"]["type"]: n for n in nodes}

    if "llm" not in node_types:
        raise HTTPException(status_code=400, detail="Workflow missing LLM node")

    # 2. User query
    user_query = req.message

    # 3. Knowledge base (just query existing vectors)
    retrieved_docs = []
    model = None
    collection = None

    if "knowledge-base" in node_types:
        kb_node = node_types["knowledge-base"]
        embedding_model_name = (
            kb_node["data"].get("nodeData", {}).get("embeddingModel", "all-MiniLM-L6-v2")
        )
        model = SentenceTransformer(embedding_model_name)

        try:
            collection = chroma_client.get_collection(name=f"kb-{stack_id}")
            query_embedding = model.encode(user_query).tolist()
            results = collection.query(query_embeddings=[query_embedding], n_results=3)
            retrieved_docs = results["documents"][0]
        except Exception as e:
            logger.warning(f"⚠️ No existing Chroma collection for {stack_id}: {e}")

    # 4. LLM Node Config
    llm_node = node_types["llm"]
    node_data = llm_node["data"].get("nodeData", {})

    gemini_key = node_data.get("apiKey")
    gemini_model = node_data.get("model", "gemini-2.0-flash")
    serpapi_key = node_data.get("serpApi")
    use_web = node_data.get("webSearch", False)

    if not gemini_key:
        raise HTTPException(status_code=400, detail="Gemini API key missing")

    genai.configure(api_key=gemini_key)

    # 5. Optional web search
    web_context = ""
    if use_web and serpapi_key:
        try:
            search = GoogleSearch({"engine": "google", "q": user_query, "api_key": serpapi_key})
            results = search.get_dict()
            snippets = []
            for item in results.get("organic_results", [])[:3]:
                snippets.append(f"{item.get('title')} ({item.get('link')}): {item.get('snippet')}")
            web_context = "\n".join(snippets)
        except Exception as e:
            logger.error(f"SerpAPI search failed: {e}")

    # 6. Build final prompt
    kb_context = "\n".join(retrieved_docs) if retrieved_docs else ""

    output_node = node_types.get("output")
    output_data_str = ""
    if output_node:
        output_node_data = output_node.get("data", {}).get("nodeData", {})
        if output_data_data := output_node_data.get("outputText"):
            output_data_str = f"\n\nOutput: {output_data_data}"
    
    print("Output Node Data:", output_data_str)

    combined_context = "\n\n".join([c for c in [kb_context, web_context] if c.strip()])
    prompt = f"Context:\n{combined_context}{output_data_str}\n\nUser Query: {user_query}\nAnswer:"

    # 7. Call Gemini
    llm = genai.GenerativeModel(gemini_model)
    response = llm.generate_content(prompt)

    return ChatResponse(
        response=response.text,
        context_used={
            "knowledge_base": retrieved_docs,
            "web_search": web_context.split("\n") if web_context else []
        }
    )




@router.post("/{stack_id}/upload")
async def upload_document(
    stack_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    # Save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Fetch workflow
    result = await db.execute(select(Workflow).where(Workflow.stack_id == stack_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Ensure workflow.data is a dict
    if not isinstance(workflow.data, dict):
        try:
            workflow.data = json.loads(workflow.data) if workflow.data else {}
        except Exception:
            workflow.data = {}

    # Append doc metadata
    workflow.data.setdefault("documents", [])
    workflow.data["documents"].append({
        "id": file_id,
        "file_name": file.filename,
        "path": file_path
    })

    # Commit
    db.add(workflow)
    await db.commit()
    await db.refresh(workflow)

    logger.info(f"📂 Document added to workflow {stack_id}: {workflow.data}")

    return {"id": file_id, "file_name": file.filename}


@router.get("/{stack_id}/documents/{doc_id}")
async def download_document(stack_id: str, doc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).where(Workflow.stack_id == stack_id))
    workflow = result.scalar_one_or_none()
    if not workflow or "documents" not in workflow.data:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = next((d for d in workflow.data["documents"] if d["id"] == doc_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(doc["path"], filename=doc["file_name"])



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

