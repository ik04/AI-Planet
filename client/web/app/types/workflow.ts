export type ComponentType =
  | "user-query"
  | "knowledge-base"
  | "llm-engine"
  | "output";

export interface WorkflowComponent {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  data: ComponentData;
}

export interface ComponentData {
  label: string;
  config: Record<string, unknown>;
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  components: WorkflowComponent[];
  connections: WorkflowConnection[];
  createdAt: Date;
  updatedAt: Date;
}

// Component-specific configurations
export interface UserQueryConfig {
  placeholder: string;
}

export interface KnowledgeBaseConfig {
  allowedFileTypes: string[];
  maxFileSize: number;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
}

export interface LLMEngineConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  useWebSearch: boolean;
  webSearchProvider: "serpapi" | "brave";
}

export interface OutputConfig {
  displayMode: "chat" | "formatted";
  showTimestamp: boolean;
}

// Chat interface types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  workflowId?: string;
}

export interface ChatSession {
  id: string;
  workflowId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Document types
export interface Document {
  id: string;
  filename: string;
  content: string;
  metadata: DocumentMetadata;
  embeddings?: number[][];
  chunks?: DocumentChunk[];
  uploadedAt: Date;
}

export interface DocumentMetadata {
  fileType: string;
  fileSize: number;
  pageCount?: number;
  extractedAt: Date;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    pageNumber?: number;
    chunkIndex: number;
  };
}

// API response types
export interface WorkflowExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

export interface ComponentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
