import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Workflow,
  WorkflowComponent,
  WorkflowConnection,
  ChatSession,
  ChatMessage,
  ComponentType,
} from "..//types/workflow";

interface WorkflowState {
  currentWorkflow: Workflow | null;

  workflows: Workflow[];

  availableComponents: ComponentType[];

  selectedComponent: WorkflowComponent | null;

  chatSessions: ChatSession[];
  currentChatSession: ChatSession | null;

  isConfigPanelOpen: boolean;
  isChatModalOpen: boolean;
  isExecuting: boolean;

  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addComponent: (component: WorkflowComponent) => void;
  updateComponent: (id: string, updates: Partial<WorkflowComponent>) => void;
  removeComponent: (id: string) => void;
  addConnection: (connection: WorkflowConnection) => void;
  removeConnection: (id: string) => void;
  setSelectedComponent: (component: WorkflowComponent | null) => void;
  setConfigPanelOpen: (open: boolean) => void;
  setChatModalOpen: (open: boolean) => void;
  setExecuting: (executing: boolean) => void;

  saveWorkflow: (workflow: Workflow) => void;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;

  createChatSession: (workflowId: string) => ChatSession;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  setCurrentChatSession: (session: ChatSession | null) => void;

  validateWorkflow: (workflow: Workflow) => boolean;
}

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      currentWorkflow: null,
      workflows: [],
      availableComponents: [
        "user-query",
        "knowledge-base",
        "llm-engine",
        "output",
      ],
      selectedComponent: null,
      chatSessions: [],
      currentChatSession: null,
      isConfigPanelOpen: false,
      isChatModalOpen: false,
      isExecuting: false,

      setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),

      addComponent: (component) =>
        set((state) => ({
          currentWorkflow: state.currentWorkflow
            ? {
                ...state.currentWorkflow,
                components: [...state.currentWorkflow.components, component],
                updatedAt: new Date(),
              }
            : null,
        })),

      updateComponent: (id, updates) =>
        set((state) => ({
          currentWorkflow: state.currentWorkflow
            ? {
                ...state.currentWorkflow,
                components: state.currentWorkflow.components.map((comp) =>
                  comp.id === id ? { ...comp, ...updates } : comp
                ),
                updatedAt: new Date(),
              }
            : null,
        })),

      removeComponent: (id) =>
        set((state) => ({
          currentWorkflow: state.currentWorkflow
            ? {
                ...state.currentWorkflow,
                components: state.currentWorkflow.components.filter(
                  (comp) => comp.id !== id
                ),
                connections: state.currentWorkflow.connections.filter(
                  (conn) => conn.source !== id && conn.target !== id
                ),
                updatedAt: new Date(),
              }
            : null,
        })),

      addConnection: (connection) =>
        set((state) => ({
          currentWorkflow: state.currentWorkflow
            ? {
                ...state.currentWorkflow,
                connections: [...state.currentWorkflow.connections, connection],
                updatedAt: new Date(),
              }
            : null,
        })),

      removeConnection: (id) =>
        set((state) => ({
          currentWorkflow: state.currentWorkflow
            ? {
                ...state.currentWorkflow,
                connections: state.currentWorkflow.connections.filter(
                  (conn) => conn.id !== id
                ),
                updatedAt: new Date(),
              }
            : null,
        })),

      setSelectedComponent: (component) =>
        set({ selectedComponent: component }),

      setConfigPanelOpen: (open) => set({ isConfigPanelOpen: open }),

      setChatModalOpen: (open) => set({ isChatModalOpen: open }),

      setExecuting: (executing) => set({ isExecuting: executing }),

      // Workflow management
      saveWorkflow: (workflow) =>
        set((state) => ({
          workflows: state.workflows.some((w) => w.id === workflow.id)
            ? state.workflows.map((w) => (w.id === workflow.id ? workflow : w))
            : [...state.workflows, workflow],
        })),

      loadWorkflow: (id) => {
        const workflow = get().workflows.find((w) => w.id === id);
        if (workflow) {
          set({ currentWorkflow: workflow });
        }
      },

      deleteWorkflow: (id) =>
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          currentWorkflow:
            state.currentWorkflow?.id === id ? null : state.currentWorkflow,
        })),

      // Chat management
      createChatSession: (workflowId) => {
        const session: ChatSession = {
          id: `session-${Date.now()}`,
          workflowId,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          chatSessions: [...state.chatSessions, session],
          currentChatSession: session,
        }));

        return session;
      },

      addMessage: (sessionId, message) =>
        set((state) => ({
          chatSessions: state.chatSessions.map((session) =>
            session.id === sessionId
              ? {
                  ...session,
                  messages: [...session.messages, message],
                  updatedAt: new Date(),
                }
              : session
          ),
        })),

      setCurrentChatSession: (session) => set({ currentChatSession: session }),

      // Validation
      validateWorkflow: (workflow) => {
        // Basic validation logic
        const hasUserQuery = workflow.components.some(
          (comp) => comp.type === "user-query"
        );
        const hasOutput = workflow.components.some(
          (comp) => comp.type === "output"
        );
        const hasConnections = workflow.connections.length > 0;

        return hasUserQuery && hasOutput && hasConnections;
      },
    }),
    {
      name: "workflow-store",
    }
  )
);
