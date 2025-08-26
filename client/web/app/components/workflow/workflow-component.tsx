"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Database,
  Brain,
  Monitor,
  Settings,
} from "lucide-react";

interface WorkflowComponentData {
  label: string;
  config: Record<string, any>;
  onSelect?: () => void;
  onUpdate?: (updates: any) => void;
}

const componentIcons = {
  "user-query": MessageSquare,
  "knowledge-base": Database,
  "llm-engine": Brain,
  output: Monitor,
};

const componentColors = {
  "user-query": "border-blue-200 bg-blue-50",
  "knowledge-base": "border-green-200 bg-green-50",
  "llm-engine": "border-purple-200 bg-purple-50",
  output: "border-orange-200 bg-orange-50",
};

export const WorkflowComponent = ({
  data,
  type,
  selected,
}: NodeProps<WorkflowComponentData>) => {
  const Icon = componentIcons[type as keyof typeof componentIcons];
  const colorClass = componentColors[type as keyof typeof componentColors];

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    data.onSelect?.();
  };

  const handleSettingsClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    data.onSelect?.();
  };

  const getHandles = () => {
    switch (type) {
      case "user-query":
        return (
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 bg-blue-500"
          />
        );
      case "knowledge-base":
        return (
          <>
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 bg-green-500"
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-green-500"
            />
          </>
        );
      case "llm-engine":
        return (
          <>
            <Handle
              type="target"
              position={Position.Left}
              className="w-3 h-3 bg-purple-500"
            />
            <Handle
              type="source"
              position={Position.Right}
              className="w-3 h-3 bg-purple-500"
            />
          </>
        );
      case "output":
        return (
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 bg-orange-500"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "min-w-[200px] cursor-pointer transition-all duration-200 hover:shadow-md",
        colorClass,
        selected && "ring-2 ring-primary ring-offset-2",
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {Icon && <Icon className="w-4 h-4" />}
          {data.label}
          <button
            onClick={handleSettingsClick}
            className="ml-auto p-1 rounded hover:bg-black/10 transition-colors"
            title="Configure component"
          >
            <Settings className="w-3 h-3 opacity-60 hover:opacity-100" />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground">
          {getComponentDescription(type, data.config)}
        </div>
      </CardContent>
      {getHandles()}
    </Card>
  );
};

function getComponentDescription(
  type: string,
  config: Record<string, any>,
): string {
  switch (type) {
    case "user-query":
      return `Input: "${config.placeholder || "Enter your question..."}"`;
    case "knowledge-base":
      return `Files: ${config.allowedFileTypes?.join(", ") || "pdf, txt, docx"}`;
         case "llm-engine":
       return `Model: ${config.model || "gemini-2.5-flash"} | Temp: ${config.temperature || 0.7}`;
    case "output":
      return `Mode: ${config.displayMode || "chat"}${config.showTimestamp ? " | With timestamps" : ""}`;
    default:
      return "Component configuration";
  }
}
