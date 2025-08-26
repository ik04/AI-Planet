"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useWorkflowStore } from "@/store/workflow-store";
import { cn } from "@/lib/utils";
import { X, Settings } from "lucide-react";

interface ComponentConfigPanelProps {
  className?: string;
}

export const ComponentConfigPanel = ({
  className,
}: ComponentConfigPanelProps) => {
  const {
    selectedComponent,
    setSelectedComponent,
    updateComponent,
    isConfigPanelOpen,
    setConfigPanelOpen,
    currentWorkflow,
  } = useWorkflowStore();

  // Keep selected component in sync with workflow state
  React.useEffect(() => {
    if (selectedComponent && currentWorkflow) {
      const latestComponent = currentWorkflow.components.find(
        (comp) => comp.id === selectedComponent.id
      );
      if (latestComponent && JSON.stringify(latestComponent) !== JSON.stringify(selectedComponent)) {
        setSelectedComponent(latestComponent);
      }
    }
  }, [currentWorkflow?.components, selectedComponent, setSelectedComponent]);

  if (!isConfigPanelOpen || !selectedComponent) {
    return null;
  }

  const handleConfigChange = (key: string, value: any) => {
    if (!selectedComponent) return;
    
    const updatedComponent = {
      ...selectedComponent,
      data: {
        ...selectedComponent.data,
        config: {
          ...selectedComponent.data.config,
          [key]: value,
        },
      },
    };
    
    updateComponent(selectedComponent.id, updatedComponent);
    setSelectedComponent(updatedComponent); // Update selected component immediately
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedComponent) return;

    const uploadedFiles = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    }));

    const currentFiles = selectedComponent.data.config.uploadedFiles || [];
    const newFiles = [...currentFiles, ...uploadedFiles];

    handleConfigChange('uploadedFiles', newFiles);

    // TODO: In a real implementation, you would upload files to the backend here
    // For now, we just store the file metadata
    console.log('Files selected for upload:', uploadedFiles);
  };

  const handleRemoveFile = (index: number) => {
    if (!selectedComponent) return;
    
    const currentFiles = selectedComponent.data.config.uploadedFiles || [];
    const newFiles = currentFiles.filter((_: any, i: number) => i !== index);
    
    handleConfigChange('uploadedFiles', newFiles);
  };

  const handleClose = () => {
    setSelectedComponent(null);
    setConfigPanelOpen(false);
  };

  const renderConfigFields = () => {
    switch (selectedComponent.type) {
      case "user-query":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="placeholder">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={selectedComponent.data.config.placeholder || ""}
                onChange={(e) =>
                  handleConfigChange("placeholder", e.target.value)
                }
                placeholder="Enter placeholder text..."
              />
            </div>
          </div>
        );

      case "knowledge-base":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={
                  selectedComponent.data.config.allowedFileTypes?.join(", ") ||
                  ""
                }
                onChange={(e) =>
                  handleConfigChange(
                    "allowedFileTypes",
                    e.target.value.split(",").map((t) => t.trim()),
                  )
                }
                placeholder="pdf, txt, docx"
              />
            </div>

            <div>
              <Label htmlFor="maxFileSize">Max File Size (bytes)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={selectedComponent.data.config.maxFileSize || ""}
                onChange={(e) =>
                  handleConfigChange("maxFileSize", parseInt(e.target.value))
                }
                placeholder="10485760"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="chunkSize">Chunk Size</Label>
                <Input
                  id="chunkSize"
                  type="number"
                  value={selectedComponent.data.config.chunkSize || ""}
                  onChange={(e) =>
                    handleConfigChange("chunkSize", parseInt(e.target.value))
                  }
                  placeholder="1000"
                />
              </div>

              <div>
                <Label htmlFor="chunkOverlap">Chunk Overlap</Label>
                <Input
                  id="chunkOverlap"
                  type="number"
                  value={selectedComponent.data.config.chunkOverlap || ""}
                  onChange={(e) =>
                    handleConfigChange("chunkOverlap", parseInt(e.target.value))
                  }
                  placeholder="200"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="embeddingModel">Embedding Model</Label>
                             <Select
                 value={selectedComponent.data.config.embeddingModel || "gemini"}
                 onValueChange={(value) =>
                   handleConfigChange("embeddingModel", value)
                 }
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="gemini">Gemini Embeddings</SelectItem>
                   <SelectItem value="openai">OpenAI Embeddings</SelectItem>
                 </SelectContent>
               </Select>
            </div>

            <div>
              <Label htmlFor="pdfUpload">Upload PDF Documents</Label>
              <Input
                id="pdfUpload"
                type="file"
                multiple
                accept=".pdf"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload PDF files to create your knowledge base
              </p>
              {selectedComponent.data.config.uploadedFiles && selectedComponent.data.config.uploadedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Uploaded files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {selectedComponent.data.config.uploadedFiles.map((file: any, index: number) => (
                      <li key={index} className="flex justify-between items-center">
                        <span>{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case "llm-engine":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model">Language Model</Label>
                             <Select
                 value={selectedComponent.data.config.model || "gemini-2.5-flash"}
                 onValueChange={(value) => handleConfigChange("model", value)}
               >
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                                 <SelectContent>
                  <SelectItem value="gemini-2.5-flash">
                    Gemini 2.5 Flash (Default)
                  </SelectItem>
                  <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                  <SelectItem value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                </SelectContent>
               </Select>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={selectedComponent.data.config.apiKey || ""}
                onChange={(e) =>
                  handleConfigChange("apiKey", e.target.value)
                }
                placeholder="Enter your API key (OpenAI or Google AI)"
              />
            </div>

            {selectedComponent.data.config.useWebSearch && (
              <div>
                <Label htmlFor="serpapiKey">SerpAPI Key (for web search)</Label>
                <Input
                  id="serpapiKey"
                  type="password"
                  value={selectedComponent.data.config.serpapiKey || ""}
                  onChange={(e) =>
                    handleConfigChange("serpapiKey", e.target.value)
                  }
                  placeholder="Enter your SerpAPI key"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={selectedComponent.data.config.temperature || ""}
                  onChange={(e) =>
                    handleConfigChange(
                      "temperature",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="0.7"
                />
              </div>

              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={selectedComponent.data.config.maxTokens || ""}
                  onChange={(e) =>
                    handleConfigChange("maxTokens", parseInt(e.target.value))
                  }
                  placeholder="2000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={selectedComponent.data.config.systemPrompt || ""}
                onChange={(e) =>
                  handleConfigChange("systemPrompt", e.target.value)
                }
                placeholder="You are a helpful assistant..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="useWebSearch">Enable Web Search</Label>
              <Switch
                id="useWebSearch"
                checked={selectedComponent.data.config.useWebSearch || false}
                onCheckedChange={(checked) =>
                  handleConfigChange("useWebSearch", checked)
                }
              />
            </div>


          </div>
        );

      case "output":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="displayMode">Display Mode</Label>
              <Select
                value={selectedComponent.data.config.displayMode || "chat"}
                onValueChange={(value) =>
                  handleConfigChange("displayMode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat Interface</SelectItem>
                  <SelectItem value="formatted">Formatted Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showTimestamp">Show Timestamps</Label>
              <Switch
                id="showTimestamp"
                checked={selectedComponent.data.config.showTimestamp || false}
                onCheckedChange={(checked) =>
                  handleConfigChange("showTimestamp", checked)
                }
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration available for this component.
          </div>
        );
    }
  };

  return (
    <Card className={cn("min-w-[320px]", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <CardTitle className="text-base">Configure Component</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <CardDescription>
          {selectedComponent.data.label} - {selectedComponent.type}
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">{renderConfigFields()}</CardContent>
    </Card>
  );
};
