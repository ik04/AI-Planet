"use client";

import React, { useCallback, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

import { useWorkflowStore } from "@/store/workflow-store";
import {
  WorkflowComponent as WorkflowComponentType,
  WorkflowConnection,
} from "@/types/workflow";
import { WorkflowComponent } from "./workflow-component";

// Custom node types
const nodeTypes = {
  "user-query": WorkflowComponent,
  "knowledge-base": WorkflowComponent,
  "llm-engine": WorkflowComponent,
  output: WorkflowComponent,
};

interface WorkflowCanvasProps {
  className?: string;
}

export const WorkflowCanvas = ({ className }: WorkflowCanvasProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    React.useState<ReactFlowInstance | null>(null);

  const {
    currentWorkflow,
    addComponent,
    updateComponent,
    removeComponent,
    addConnection,
    removeConnection,
    setSelectedComponent,
    setConfigPanelOpen,
  } = useWorkflowStore();

  // Convert workflow components to React Flow nodes
  const workflowNodes: Node[] =
    currentWorkflow?.components.map((comp) => ({
      id: comp.id,
      type: comp.type,
      position: comp.position,
      data: {
        ...comp.data,
        onSelect: () => {
          setSelectedComponent(comp);
          setConfigPanelOpen(true);
        },
        onUpdate: (updates: Partial<WorkflowComponentType>) =>
          updateComponent(comp.id, updates),
      },
    })) || [];

  // Convert workflow connections to React Flow edges
  const workflowEdges: Edge[] =
    currentWorkflow?.connections.map((conn) => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      animated: true,
      style: { stroke: "#6366f1" },
    })) || [];

  const [nodes, setNodes, onNodesChange] = useNodesState(workflowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflowEdges);

  // Sync React Flow state with Zustand store
  React.useEffect(() => {
    setNodes(workflowNodes);
  }, [currentWorkflow?.components, setNodes]);

  React.useEffect(() => {
    setEdges(workflowEdges);
  }, [currentWorkflow?.connections, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      const newConnection: WorkflowConnection = {
        id: `connection-${Date.now()}`,
        source: params.source!,
        target: params.target!,
        sourceHandle: params.sourceHandle || undefined,
        targetHandle: params.targetHandle || undefined,
      };

      addConnection(newConnection);
      setEdges((eds) => addEdge(params, eds));
    },
    [addConnection, setEdges],
  );

  // Handle drag over for dropping components
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle dropping components from the component library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newComponent: WorkflowComponentType = {
        id: `${type}-${Date.now()}`,
        type: type as any,
        position,
        data: {
          label: type
            .replace("-", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          config: getDefaultConfig(type as any),
        },
      };

      addComponent(newComponent);

      const newNode: Node = {
        id: newComponent.id,
        type: newComponent.type,
        position: newComponent.position,
        data: {
          ...newComponent.data,
          onSelect: () => {
            setSelectedComponent(newComponent);
            setConfigPanelOpen(true);
          },
          onUpdate: (updates: Partial<WorkflowComponentType>) =>
            updateComponent(newComponent.id, updates),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [
      reactFlowInstance,
      addComponent,
      setNodes,
      updateComponent,
      setSelectedComponent,
    ],
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const component = currentWorkflow?.components.find(
        (comp) => comp.id === node.id,
      );
      if (component) {
        setSelectedComponent(component);
        setConfigPanelOpen(true);
      }
    },
    [currentWorkflow, setSelectedComponent, setConfigPanelOpen],
  );

  // Handle node deletion
  const onNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => {
        removeComponent(node.id);
      });
    },
    [removeComponent],
  );

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        removeConnection(edge.id);
      });
    },
    [removeConnection],
  );

  return (
    <div className={className} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={["Backspace", "Delete"]}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
      >
        <MiniMap />
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

// Default configurations for each component type
function getDefaultConfig(type: string) {
  switch (type) {
    case "user-query":
      return { placeholder: "Enter your question..." };
         case "knowledge-base":
       return {
         allowedFileTypes: ["pdf", "txt", "docx"],
         maxFileSize: 10485760, // 10MB
         chunkSize: 1000,
         chunkOverlap: 200,
         embeddingModel: "gemini",
       };
     case "llm-engine":
       return {
         model: "gemini-2.5-flash",
         temperature: 0.7,
         maxTokens: 2000,
         systemPrompt: "You are a helpful assistant.",
         useWebSearch: false,
         webSearchProvider: "serpapi",
       };
    case "output":
      return {
        displayMode: "chat",
        showTimestamp: true,
      };
    default:
      return {};
  }
}

// Wrapper component with ReactFlowProvider
export const WorkflowCanvasWrapper = ({ className }: WorkflowCanvasProps) => (
  <ReactFlowProvider>
    <WorkflowCanvas className={className} />
  </ReactFlowProvider>
);
