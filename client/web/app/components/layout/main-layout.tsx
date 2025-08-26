"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWorkflowStore } from "@/store/workflow-store";
import { WorkflowCanvasWrapper } from "@/components/workflow/workflow-canvas";
import { ComponentLibrary } from "@/components/workflow/component-library";
import { ComponentConfigPanel } from "@/components/workflow/component-config-panel";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Workflow } from "@/types/workflow";
import { cn } from "@/lib/utils";
import {
  Play,
  MessageSquare,
  Save,
  FolderOpen,
  Settings,
  CheckCircle,
  AlertCircle,
  Layers,
} from "lucide-react";

interface MainLayoutProps {
  className?: string;
}

export const MainLayout = ({ className }: MainLayoutProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    currentWorkflow,
    setCurrentWorkflow,
    selectedComponent,
    isConfigPanelOpen,
    setConfigPanelOpen,
    validateWorkflow,
    saveWorkflow,
  } = useWorkflowStore();

  // Initialize a default workflow if none exists
  React.useEffect(() => {
    if (!currentWorkflow) {
      const defaultWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: "My Workflow",
        components: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentWorkflow(defaultWorkflow);
    }
  }, [currentWorkflow, setCurrentWorkflow]);

  const handleBuildStack = () => {
    if (!currentWorkflow) {
      // Create new workflow if none exists
      const newWorkflow: Workflow = {
        id: `workflow-${Date.now()}`,
        name: "New Workflow",
        components: [],
        connections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentWorkflow(newWorkflow);
      alert(
        "📝 New workflow created! Add components and connect them to build your workflow."
      );
      return;
    }

    console.log("Validating workflow:", currentWorkflow); // Debug log
    const isValid = validateWorkflow(currentWorkflow);
    if (isValid) {
      alert("✅ Workflow is valid and ready to use!");
    } else {
      const hasUserQuery = currentWorkflow.components.some(
        (comp) => comp.type === "user-query"
      );
      const hasOutput = currentWorkflow.components.some(
        (comp) => comp.type === "output"
      );
      const hasConnections = currentWorkflow.connections.length > 0;

      let errorMsg = "❌ Workflow validation failed. Missing:\n";
      if (!hasUserQuery) errorMsg += "- User Query component\n";
      if (!hasOutput) errorMsg += "- Output component\n";
      if (!hasConnections) errorMsg += "- Connections between components\n";
      errorMsg += `\nCurrent state: ${currentWorkflow.components.length} components, ${currentWorkflow.connections.length} connections`;

      alert(errorMsg);
    }
  };

  const handleChatWithStack = () => {
    if (!currentWorkflow) {
      alert("Please create and build a workflow first.");
      return;
    }

    const isValid = validateWorkflow(currentWorkflow);
    if (!isValid) {
      alert("Please build and validate your workflow first.");
      return;
    }

    setIsChatOpen(true);
  };

  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;

    saveWorkflow({
      ...currentWorkflow,
      updatedAt: new Date(),
    });

    alert("Workflow saved successfully!");
  };

  const handleComponentSelect = (component: any) => {
    setConfigPanelOpen(true);
  };

  return (
    <div className={cn("h-screen flex flex-col bg-background", className)}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">Workflow Builder</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuildStack}
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Build Stack
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleChatWithStack}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Stack
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveWorkflow}
              disabled={!currentWorkflow}
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm">
              <FolderOpen className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Component Library */}
        <div
          className={cn(
            "border-r bg-card transition-all duration-300",
            isSidebarCollapsed ? "w-12" : "w-80"
          )}
        >
          {!isSidebarCollapsed && (
            <ComponentLibrary className="h-full overflow-y-auto" />
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <WorkflowCanvasWrapper className="w-full h-full" />
          </div>

          {/* Status Bar */}
          <div className="border-t bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>
                  Components: {currentWorkflow?.components.length || 0}
                </span>
                <span>
                  Connections: {currentWorkflow?.connections.length || 0}
                </span>
                {currentWorkflow && (
                  <span className="flex items-center gap-1">
                    {validateWorkflow(currentWorkflow) ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        Valid
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        Incomplete
                      </>
                    )}
                  </span>
                )}
              </div>

              <div>{currentWorkflow?.name || "Untitled Workflow"}</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Configuration Panel */}
        {isConfigPanelOpen && selectedComponent && (
          <div className="border-l bg-card w-80">
            <ComponentConfigPanel className="h-full overflow-y-auto" />
          </div>
        )}
      </div>

      {/* Chat Dialog */}
      <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
        <DialogContent
          className="max-w-5xl max-h-[85vh] p-0 gap-0 border-0 shadow-2xl bg-transparent"
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside during execution
            e.preventDefault();
          }}
        >
          <ChatInterface
            className="h-[700px]"
            onClose={() => setIsChatOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
