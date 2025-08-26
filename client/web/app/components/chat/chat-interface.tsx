"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "../..//components/ui/input";
import { Button } from "../..//components/ui/button";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useWorkflowStore } from "../../store/workflow-store";
import { ChatMessage } from "../../types/workflow";
import { cn } from "../../lib/utils";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
  MessageCircle,
  X,
} from "lucide-react";

interface ChatInterfaceProps {
  className?: string;
  onClose?: () => void;
}

export const ChatInterface = ({ className, onClose }: ChatInterfaceProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentWorkflow } = useWorkflowStore();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentWorkflow || isExecuting) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
      workflowId: currentWorkflow.id,
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsExecuting(true);

    try {
      // Get recent messages for context (last 5 messages)
      const recentMessages = messages.slice(-5).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Execute workflow with context
      const response = await executeWorkflow(
        currentWorkflow,
        userMessage.content,
        recentMessages
      );

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        workflowId: currentWorkflow.id,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat execution error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        timestamp: new Date(),
        workflowId: currentWorkflow.id,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsExecuting(false);
      // Focus input again after response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-b from-background to-background/95 border rounded-xl shadow-lg animate-in fade-in-0 zoom-in-95 duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-accent/5 to-accent/10 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">AI Workflow Chat</h2>
            <p className="text-sm text-muted-foreground">
              {currentWorkflow
                ? `Connected to ${currentWorkflow.name}`
                : "No workflow selected"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            disabled={messages.length === 0}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-6 pr-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center mb-4 shadow-inner">
                  <MessageCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ready to Chat!</h3>
                <p className="text-muted-foreground max-w-sm">
                  Start a conversation with your AI workflow. Ask questions, get
                  insights, and explore possibilities.
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Workflow connected</span>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-4 max-w-[80%] group",
                    message.role === "user"
                      ? "ml-auto flex-row-reverse"
                      : "mr-auto"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105",
                      message.role === "user"
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        : "bg-gradient-to-br from-accent to-accent/80 text-white"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 shadow-sm border backdrop-blur-sm transition-all group-hover:shadow-md",
                        message.role === "user"
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500/20 rounded-tr-md"
                          : "bg-white/80 text-foreground border-border rounded-tl-md"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-xs text-muted-foreground px-2 transition-opacity opacity-0 group-hover:opacity-100",
                        message.role === "user" ? "text-right" : "text-left"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isExecuting && (
              <div className="flex gap-4 max-w-[80%] mr-auto group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent/80 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white/80 border border-border shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                        <div
                          className="w-2 h-2 rounded-full bg-accent animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-accent animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-gradient-to-r from-background to-background/95">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask your AI workflow anything..."
              disabled={isExecuting}
              className="pr-12 py-3 rounded-full border-2 border-border/50 focus:border-accent transition-colors shadow-sm bg-white/50 backdrop-blur-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <kbd className="text-xs bg-muted px-1.5 py-0.5 rounded">↵</kbd>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isExecuting}
            size="lg"
            className="rounded-full w-12 h-12 p-0 bg-gradient-to-br from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isExecuting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Status Bar */}
        {currentWorkflow && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>{currentWorkflow.components.length} components active</span>
            </div>
            <span>•</span>
            <span>
              Context window:{" "}
              {messages.length > 5
                ? "5 messages"
                : `${messages.length} messages`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Execute workflow function
async function executeWorkflow(
  workflow: any,
  query: string,
  context: any[] = []
): Promise<string> {
  try {
    console.log("Executing workflow with:", {
      query,
      context,
      workflow: workflow.name,
    });

    // Call the Next.js API route
    const response = await fetch("/api/chat/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: workflow.id,
        workflow: workflow,
        message: query,
        context: context,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response error:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Received response:", data);

    // Clean up the response - remove timestamp if present
    let cleanResponse =
      data.response || "No response received from the workflow.";

    // Remove timestamp pattern like "[2025-08-25 20:06:46]" from the beginning
    cleanResponse = cleanResponse.replace(
      /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]\s*/,
      ""
    );

    return cleanResponse;
  } catch (error) {
    console.error("Workflow execution error:", error);
    throw new Error(
      `Failed to execute workflow: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
