"use client";

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  IoArrowForward,
  IoSparkles,
  IoBookOutline,
  IoGlobeOutline,
  IoSwapHorizontalOutline,
  IoArrowBack,
  IoSave,
  IoPerson,
  IoChatbubbleOutline,
  IoSettingsOutline,
  IoCloudUploadOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoSendOutline,
  IoReorderThreeOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoExpandOutline,
  IoPlayOutline,
  IoHourglass,
} from "react-icons/io5";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { saveWorkflowBackend, getWorkflow } from "../../utils/actions";

const CustomNode = ({ data, selected }: any) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpApi, setShowSerpApi] = useState(false);
  const [showKbApiKey, setShowKbApiKey] = useState(false);
  const getIcon = (type: string) => {
    switch (type) {
      case "user-input":
        return <IoArrowForward className="w-4 h-4" />;
      case "llm":
        return <IoSparkles className="w-4 h-4" />;
      case "knowledge-base":
        return <IoBookOutline className="w-4 h-4" />;
      case "web-search":
        return <IoGlobeOutline className="w-4 h-4" />;
      case "output":
        return <IoSwapHorizontalOutline className="w-4 h-4" />;
      default:
        return <IoSettingsOutline className="w-4 h-4" />;
    }
  };

  const getNodeStyle = (type: string) => {
    switch (type) {
      case "user-input":
        return "bg-blue-50 border-blue-200";
      case "llm":
        return "bg-blue-50 border-blue-200";
      case "knowledge-base":
        return "bg-blue-50 border-blue-200";
      case "web-search":
        return "bg-gray-50 border-gray-200";
      case "output":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-white border-gray-200";
    }
  };

  return (
    <div
      className={`relative min-w-[320px] max-w-[460px] bg-white border border-gray-200 rounded-lg shadow-sm ${
        selected ? "ring-2 ring-blue-500" : ""
      }`}
    >
      {/* Input Handles - Different for each type */}
      {data.type === "knowledge-base" && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-[#FF7A38] !border-2 !absolute !left-[-4px] !top-[96%] !border-[#FF7A38]"
        />
      )}

      {data.type === "llm" && (
        <>
          {/* Query Input Handle */}
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-[#6344BE] !border-2 !border-[#6344BE] !absolute !left-[-4px] !top-[56.2%]"
            id="query"
          />
          {/* Context Input Handle */}
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 !bg-[#6344BE] !border-2 !border-[#6344BE] !absolute !left-[-4px] !top-[59%]"
            id="context"
          />
        </>
      )}

      {data.type === "output" && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-[#50DF5F] !border-2 !border-[#50DF5F] !absolute !left-[-4px] !top-[92.5%]"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 rounded-t-lg group">
        {getIcon(data.type)}
        <span className="font-semibold text-gray-900 text-lg">
          {data.label}
        </span>
        <IoSettingsOutline className="w-4 h-4 ml-auto text-gray-500 transition-opacity" />
      </div>

      {/* Content */}
      <div>
        {data.type === "user-input" && (
          <div className="">
            <div className="bg-[#EDF3FF] py-2 px-3 w-full">
              <p className="text-sm text-gray-600">Enter point for querys</p>
            </div>
            <div
              className={`p-3 pt-2 ${data.type === "llm" ? "pb-16" : "pb-10"}`}
            >
              <label className="text-xs font-medium text-gray-700">Query</label>
              <Textarea
                value={data.nodeData?.query || ""}
                onChange={(e) =>
                  data.updateNodeData?.(data.nodeId, "query", e.target.value)
                }
                placeholder="Write your query here"
                className="mt-1 text-xs min-h-[60px] resize-none"
              />
            </div>
          </div>
        )}

        {data.type === "llm" && (
          <div className="">
            <div className="bg-[#EDF3FF] py-2 px-3 w-full">
              <p className="text-sm text-gray-600">Run a query with LLM</p>
            </div>
            <div
              className={`p-3 pt-2 ${
                data.type === "llm" ? "pb-16" : "pb-10"
              } space-y-2`}
            >
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Model
                </label>
                <Select
                  value={data.nodeData?.model || "gpt-5"}
                  onValueChange={(value: any) =>
                    data.updateNodeData?.(data.nodeId, "model", value)
                  }
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.0-flash">
                      Gemini 2.0 Flash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  API Key
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={data.nodeData?.apiKey || ""}
                    onChange={(e) =>
                      data.updateNodeData?.(
                        data.nodeId,
                        "apiKey",
                        e.target.value
                      )
                    }
                    placeholder="Enter API key"
                    className="h-8 text-xs pr-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {showApiKey ? (
                      <IoEyeOutline className="w-3 h-3" />
                    ) : (
                      <IoEyeOffOutline className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Prompt
                </label>
                <Textarea
                  value={
                    data.nodeData?.prompt ||
                    "You are a helpful PDF assistant. Use web search if the PDF lacks context"
                  }
                  onChange={(e) =>
                    data.updateNodeData?.(data.nodeId, "prompt", e.target.value)
                  }
                  className="mt-1 text-xs min-h-[60px] resize-none"
                />
                <div className="mt-1 text-xs text-gray-500">
                  <span className="text-[#6344BE]">
                    CONTEXT: &#123;context&#125;
                  </span>
                  <br />
                  <span className="text-[#6344BE]">
                    User Query: &#123;query&#125;
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Temperature
                </label>
                <Input
                  type="number"
                  value={data.nodeData?.temperature || 0.75}
                  onChange={(e) =>
                    data.updateNodeData?.(
                      data.nodeId,
                      "temperature",
                      parseFloat(e.target.value)
                    )
                  }
                  step="0.01"
                  min="0"
                  max="1"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between mt-4 border-b border-gray-200 pb-2">
                <label className="text-xs font-medium text-gray-700">
                  WebSearch Tool
                </label>
                <Switch
                  checked={data.nodeData?.webSearch ?? true}
                  onCheckedChange={(checked: any) =>
                    data.updateNodeData?.(data.nodeId, "webSearch", checked)
                  }
                />
              </div>
              <div className="mt-2">
                <label className="text-xs font-medium text-gray-700">
                  SERF API
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showSerpApi ? "text" : "password"}
                    value={data.nodeData?.serpApi || ""}
                    onChange={(e) =>
                      data.updateNodeData?.(
                        data.nodeId,
                        "serpApi",
                        e.target.value
                      )
                    }
                    placeholder="Enter SERF API key"
                    className="h-8 text-xs pr-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSerpApi(!showSerpApi)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {showSerpApi ? (
                      <IoEyeOutline className="w-3 h-3" />
                    ) : (
                      <IoEyeOffOutline className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {data.type === "knowledge-base" && (
          <div className="">
            <div className="bg-[#EDF3FF] py-2 px-3 w-full">
              <p className="text-sm text-gray-600">
                Let LLM search info in your file
              </p>
            </div>
            <div
              className={`p-3 pt-2 ${data.type === "llm" ? "pb-16" : "pb-10"}`}
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  File for Knowledge Base
                </label>
                {data.nodeData?.fileName ? (
                  <div className="mt-1 p-3 border-2 border-dashed border-[#44924C] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#44924C] font-medium">
                        {data.nodeData.fileName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1"
                        onClick={() =>
                          data.updateNodeData?.(data.nodeId, "fileName", null)
                        }
                      >
                        <IoCloudUploadOutline className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 p-3 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <div className="text-center">
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        className="hidden"
                        id={`file-upload-${data.nodeId}`}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log(
                              "Starting upload for file:",
                              file.name,
                              "Type:",
                              file.type,
                              "Size:",
                              file.size
                            );
                            data.updateNodeData?.(
                              data.nodeId,
                              "fileName",
                              file.name
                            );
                            data.updateNodeData?.(
                              data.nodeId,
                              "uploadStatus",
                              "uploading"
                            );

                            try {
                              const fd = new FormData();
                              fd.append("file", file);

                              const response = await fetch(
                                `${process.env.NEXT_PUBLIC_SERVER_URL}/workflows/${data.stackId}/upload`,
                                {
                                  method: "POST",
                                  body: fd,
                                }
                              );

                              const result = await response.json();
                              console.log("Upload response:", {
                                status: response.status,
                                result,
                              });

                              if (response.ok) {
                                const documentId =
                                  result.id || result.document_id || result.uid;
                                console.log(
                                  "Upload successful, document ID:",
                                  documentId
                                );
                                data.updateNodeData?.(
                                  data.nodeId,
                                  "documentId",
                                  documentId
                                );
                                data.updateNodeData?.(
                                  data.nodeId,
                                  "uploadStatus",
                                  "success"
                                );
                              } else {
                                console.error("Upload failed:", result);
                                data.updateNodeData?.(
                                  data.nodeId,
                                  "uploadStatus",
                                  "error"
                                );
                                data.updateNodeData?.(
                                  data.nodeId,
                                  "uploadError",
                                  result.error || "Upload failed"
                                );
                              }
                            } catch (err) {
                              console.error("Upload error:", err);
                              data.updateNodeData?.(
                                data.nodeId,
                                "uploadStatus",
                                "error"
                              );
                              data.updateNodeData?.(
                                data.nodeId,
                                "uploadError",
                                "Network error during upload"
                              );
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor={`file-upload-${data.nodeId}`}
                        className="cursor-pointer flex items-center gap-2 text-xs text-gray-600 hover:text-primary justify-center py-4"
                      >
                        <IoCloudUploadOutline className="w-4 h-4" />
                        {data.nodeData?.uploadStatus === "uploading"
                          ? "Uploading..."
                          : data.nodeData?.uploadStatus === "success"
                          ? "File Uploaded"
                          : data.nodeData?.uploadStatus === "error"
                          ? "Upload Failed"
                          : "Upload File"}
                      </label>
                      {data.nodeData?.uploadError && (
                        <div className="text-xs text-red-600 px-3 pb-2">
                          Error: {data.nodeData.uploadError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Embedding Model
                </label>
                <Select
                  value={
                    data.nodeData?.embeddingModel || "text-embedding-3-large"
                  }
                  onValueChange={(value: any) =>
                    data.updateNodeData?.(data.nodeId, "embeddingModel", value)
                  }
                >
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-MiniLM-L6-v2">
                      all-MiniLM-L6-v2
                    </SelectItem>
                    <SelectItem value="intfloat/e5-small">
                      intfloat/e5-small
                    </SelectItem>
                    <SelectItem value="intfloat/e5-base">
                      intfloat/e5-base
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  API Key
                </label>
                <div className="relative mt-1">
                  <Input
                    type={showKbApiKey ? "text" : "password"}
                    value={data.nodeData?.apiKey || ""}
                    onChange={(e) =>
                      data.updateNodeData?.(
                        data.nodeId,
                        "apiKey",
                        e.target.value
                      )
                    }
                    placeholder="Enter API key"
                    className="h-8 text-xs pr-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKbApiKey(!showKbApiKey)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    {showKbApiKey ? (
                      <IoEyeOutline className="w-3 h-3" />
                    ) : (
                      <IoEyeOffOutline className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {data.type === "output" && (
          <div className="">
            <div className="bg-[#EDF3FF] py-2 px-3 w-full">
              <p className="text-sm text-gray-600">
                Output of the result nodes as text
              </p>
            </div>
            <div
              className={`p-3 pt-2 ${data.type === "llm" ? "pb-16" : "pb-10"} `}
            >
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Output Text
                </label>
                <Textarea
                  placeholder="Output will be generated based on query"
                  className="text-xs min-h-[60px] bg-[#F6F6F6] shadow-none border-none resize-none"
                  value={data.nodeData?.outputText || ""}
                  onChange={(e) =>
                    data.updateNodeData?.(
                      data.nodeId,
                      "outputText",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Output Handle */}
      {data.type == "knowledge-base" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-[#FF7A38] !border-2 !border-[#FF7A38] !absolute !right-[-4px] !top-[96%]"
        />
      ) : data.type == "llm" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-[#6344BE] !border-2 !border-[#6344BE] !absolute !right-[-4px] !top-[97.5%]"
        />
      ) : data.type !== "output" ? (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 !bg-[#50DF5F] !border-2 !border-[#50DF5F] !absolute !right-[-4px] !top-[92.5%]"
        />
      ) : null}

      {data.type === "knowledge-base" && (
        <>
          <div className="absolute left-3 bottom-2 text-[11px] text-gray-600 font-medium">
            Query
          </div>
          <div className="absolute right-3 bottom-2 text-[11px] text-gray-600 font-medium">
            Context
          </div>
        </>
      )}

      {data.type === "llm" && (
        <>
          <div className="absolute right-3 bottom-2 text-[11px] text-gray-600 font-medium">
            Output
          </div>
        </>
      )}

      {data.type === "user-input" && (
        <div className="absolute right-3 bottom-2 text-[11px] text-gray-600 font-medium">
          Query
        </div>
      )}

      {data.type === "output" && (
        <div className="absolute left-3 bottom-2 text-[11px] text-gray-600 font-medium">
          Output
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const CustomZoomControls = () => {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const updateZoom = () => {
      const currentZoom = getZoom();
      setZoomLevel(Math.round(currentZoom * 100));
    };

    updateZoom();
    const interval = setInterval(updateZoom, 100);
    return () => clearInterval(interval);
  }, [getZoom]);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center divide-x divide-gray-200 z-50">
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 p-0 rounded-none hover:bg-gray-50"
        onClick={() => zoomIn()}
      >
        <IoAddOutline className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 p-0 rounded-none hover:bg-gray-50"
        onClick={() => zoomOut()}
      >
        <IoRemoveOutline className="w-5 h-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-10 w-10 p-0 rounded-none hover:bg-gray-50"
        onClick={() => fitView()}
      >
        <IoExpandOutline className="w-5 h-5" />
      </Button>
      <div className="px-4 py-2 text-sm font-medium text-gray-700 min-w-[60px] text-center">
        {zoomLevel}%
      </div>
    </div>
  );
};

interface ComponentType {
  type: "user-input" | "llm" | "knowledge-base" | "web-search" | "output";
  name: string;
  icon: React.ReactNode;
}

const WorkflowBuilder = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = React.use(params);
  const [stackName, setStackName] = useState("Chat With AI");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeData, setNodeData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);

  const compileWorkflow = () => {
    const workflowData = {
      nodes: nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          nodeData: nodeData[node.id] || {},
        },
      })),
      edges,
      data: nodeData,
    };
    return workflowData;
  };

  // Update node data
  const updateNodeData = useCallback(
    (nodeId: string, field: string, value: any) => {
      setNodeData((prev) => ({
        ...prev,
        [nodeId]: {
          ...prev[nodeId],
          [field]: value,
        },
      }));
    },
    []
  );

  const saveWorkflow = useCallback(async () => {
    setIsSaving(true);
    try {
      const workflowData = compileWorkflow();

      await saveWorkflowBackend(resolvedParams.id, workflowData);
      console.log("Workflow saved successfully");
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [resolvedParams.id, nodes, edges, nodeData]);

  useEffect(() => {
    const loadWorkflow = async () => {
      try {
        const workflow = await getWorkflow(resolvedParams.id);
        if (workflow) {
          if (workflow.nodes) {
            setNodes(workflow.nodes);
          }
          if (workflow.edges) {
            setEdges(workflow.edges);
          }
          if (workflow.data) {
            setNodeData(workflow.data);
          }
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
      }
    };

    loadWorkflow();
  }, [resolvedParams.id, setNodes, setEdges]);

  // Auto-save
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (nodes.length > 0 || Object.keys(nodeData).length > 0) {
        saveWorkflow();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [nodes, nodeData, saveWorkflow]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isThinking]);

  const componentTypes: ComponentType[] = [
    {
      type: "user-input",
      name: "User Query",
      icon: <IoArrowForward className="w-4 h-4" />,
    },
    { type: "llm", name: "LLM", icon: <IoSparkles className="w-4 h-4" /> },
    {
      type: "knowledge-base",
      name: "Knowledge Base",
      icon: <IoBookOutline className="w-4 h-4" />,
    },
    {
      type: "output",
      name: "Output",
      icon: <IoSwapHorizontalOutline className="w-4 h-4" />,
    },
  ];

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeName: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/nodename", nodeName);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = (event.target as Element).getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const name = event.dataTransfer.getData("application/nodename");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const nodeId = `${type}-${Date.now()}`;
      const newNode: Node = {
        id: nodeId,
        type: "custom",
        position,
        data: {
          label: name,
          type: type,
          nodeId: nodeId,
          stackId: resolvedParams.id,
          updateNodeData: updateNodeData,
          nodeData: nodeData[nodeId] || {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes, updateNodeData, nodeData]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          updateNodeData: updateNodeData,
          nodeData: nodeData[node.id] || {},
        },
      }))
    );
  }, [nodeData, setNodes, updateNodeData]);

  const handlePlayWorkflow = async () => {
    setIsBuilding(true);
    const workflowData = compileWorkflow();
    await saveWorkflowBackend(resolvedParams.id, workflowData);
    try {
      const workflowData = {
        nodes: nodes.map((node) => ({
          ...node,
          data: { ...node.data, nodeData: nodeData[node.id] || {} },
        })),
        edges,
        nodeData,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/workflows/${resolvedParams.id}/build`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);
      setChatMessages([]);

      setIsChatOpen(true);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer || "Workflow executed successfully.",
        },
      ]);
    } catch (error: any) {
      console.error("Error building workflow:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Workflow execution failed: ${
            error.message || "Unknown error"
          }`,
        },
      ]);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setIsThinking(true);
    setChatInput("");

    try {
      const workflowData = compileWorkflow();
      await saveWorkflowBackend(resolvedParams.id, workflowData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/workflows/${resolvedParams.id}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            result.response || result.message || "No response from server.",
        },
      ]);
    } catch (error: any) {
      console.error("Error sending chat message:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message || "Failed to process message."}`,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="p-2"
              >
                <IoArrowBack className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-3">
                <Image
                  src="/assets/logo.png"
                  alt="GenAI Stack"
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <h1 className="text-lg font-semibold text-gray-900">
                  GenAI Stack
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={saveWorkflow}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <IoSave className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Components */}
        <div className="w-56 bg-white border-r border-gray-200">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-gray-900">{stackName}</h2>
              <Button variant="ghost" size="sm" className="p-1">
                <IoArrowBack className="w-3 h-3" />
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Components
              </h3>
              <div className="space-y-2">
                {componentTypes.map((component) => (
                  <div
                    key={component.type}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e, component.type, component.name)
                    }
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm cursor-grab hover:bg-gray-100 transition-colors"
                  >
                    {component.icon}
                    <span className="flex-1">{component.name}</span>
                    <IoReorderThreeOutline className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            className="bg-gray-50"
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
            connectionLineStyle={{ stroke: "#d1d5db", strokeWidth: 2 }}
            defaultEdgeOptions={{
              style: { stroke: "#d1d5db", strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <CustomZoomControls />
          </ReactFlow>

          {/* Empty state when no nodes */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-18 h-18 flex items-center justify-center mx-auto mb-4">
                  <Image
                    src="/assets/drop.png"
                    alt="Drag and drop"
                    width={54}
                    height={54}
                    className="w-full h-full"
                  />
                </div>
                <p className="text-gray-600">Drag & drop to get started</p>
              </div>
            </div>
          )}

          {/* Chat Button */}
          <Button
            onClick={() => setIsChatOpen(true)}
            className="absolute bottom-4 right-4 w-12 h-12 p-0 rounded-full"
            style={{ backgroundColor: "hsl(var(--chat-button))" }}
          >
            <IoChatbubbleOutline className="w-5 h-5" />
          </Button>
          {!isBuilding ? (
            <Button
              onClick={() => handlePlayWorkflow()}
              className="absolute bottom-20 right-4 w-12 h-12 p-0 rounded-full shadow-lg"
              style={{ backgroundColor: "#4CAF50" }}
            >
              <IoPlayOutline className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              disabled
              className="absolute bottom-20 right-4 w-12 h-12 p-0 rounded-full shadow-lg"
              style={{ backgroundColor: "#4CAF50" }}
            >
              <IoHourglass className="w-5 h-5 animate-spin" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/logo.png"
                alt="GenAI Stack"
                width={32}
                height={32}
                className="rounded-full"
              />
              <DialogTitle className="text-lg font-semibold">
                GenAI Stack Chat
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col h-[500px] ">
            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="flex items-center justify-center gap-3">
                  <div className="rounded-full">
                    <Image
                      src="/assets/logo.png"
                      alt="AI"
                      width={32}
                      height={32}
                      className="rounded-full mb-2"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    GenAI Stack Chat
                  </h3>
                </div>
                <p className="text-gray-500 text-center">
                  Start a conversation to test your stack
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {chatMessages.map((message, index) => (
                    <div key={index} className="flex gap-4">
                      {message.role === "assistant" ? (
                        <>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                            style={{ backgroundColor: "#D2FFD1" }}
                          >
                            <IoSparkles className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-lg pt-1.5 prose prose-sm max-w-none text-gray-800">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-3 last:mb-0">{children}</p>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-lg font-semibold mb-2">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-base font-semibold mb-2">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-sm font-semibold mb-1">
                                      {children}
                                    </h3>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="list-disc pl-4 mb-3 space-y-1">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="list-decimal pl-4 mb-3 space-y-1">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-gray-800">
                                      {children}
                                    </li>
                                  ),
                                  code: ({ children }) => (
                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">
                                      {children}
                                    </code>
                                  ),
                                  pre: ({ children }) => (
                                    <pre className="bg-gray-200 p-3 rounded-lg overflow-x-auto text-xs font-mono mb-3">
                                      {children}
                                    </pre>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic">{children}</em>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                            style={{ backgroundColor: "#C0DAFF" }}
                          >
                            <IoPerson className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-2xl pt-2 py-3">
                              <p className="text-sm text-gray-800">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl"
                        style={{ backgroundColor: "#D2FFD1" }}
                      >
                        🤖
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="pt-2">
                          <p className="text-gray-600 text-sm">Thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>
              </ScrollArea>
            )}

            <div className="p-6 border-t">
              <div className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send a message"
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isThinking}
                  className="px-4"
                  style={{ backgroundColor: "hsl(var(--chat-button))" }}
                >
                  <IoSendOutline className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowBuilder;
