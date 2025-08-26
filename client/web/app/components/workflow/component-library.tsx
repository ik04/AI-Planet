"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Database,
  Brain,
  Monitor,
  GripVertical,
} from "lucide-react";
import { ComponentType } from "@/types/workflow";

interface ComponentLibraryProps {
  className?: string;
}

const componentDefinitions = [
  {
    type: "user-query" as ComponentType,
    name: "User Query",
    description: "Accepts user input and queries",
    icon: MessageSquare,
    color: "border-blue-200 bg-blue-50 hover:bg-blue-100",
  },
  {
    type: "knowledge-base" as ComponentType,
    name: "Knowledge Base",
    description: "Process and store documents with embeddings",
    icon: Database,
    color: "border-green-200 bg-green-50 hover:bg-green-100",
  },
  {
    type: "llm-engine" as ComponentType,
    name: "LLM Engine",
    description: "Generate responses using language models",
    icon: Brain,
    color: "border-purple-200 bg-purple-50 hover:bg-purple-100",
  },
  {
    type: "output" as ComponentType,
    name: "Output",
    description: "Display results in chat interface",
    icon: Monitor,
    color: "border-orange-200 bg-orange-50 hover:bg-orange-100",
  },
];

export const ComponentLibrary = ({ className }: ComponentLibraryProps) => {
  const onDragStart = (
    event: React.DragEvent,
    componentType: ComponentType,
  ) => {
    event.dataTransfer.setData("application/reactflow", componentType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className={cn("p-4 space-y-3", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Component Library</h3>
        <p className="text-sm text-muted-foreground">
          Drag components to the canvas to build your workflow
        </p>
      </div>

      <div className="space-y-2">
        {componentDefinitions.map((component) => {
          const Icon = component.icon;

          return (
            <Card
              key={component.type}
              className={cn(
                "cursor-grab active:cursor-grabbing transition-colors duration-200",
                component.color,
              )}
              draggable
              onDragStart={(e) => onDragStart(e, component.type)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="w-4 h-4" />
                  {component.name}
                  <GripVertical className="w-3 h-3 ml-auto opacity-60" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  {component.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">How to use:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Drag components to the canvas</li>
          <li>• Connect components with arrows</li>
          <li>• Click components to configure</li>
          <li>• Build Stack to validate workflow</li>
          <li>• Chat with Stack to test</li>
        </ul>
      </div>
    </div>
  );
};
