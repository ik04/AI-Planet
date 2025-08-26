"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Plus, ExternalLink, User, Loader2 } from "lucide-react";
import { fetchStacks, createStack } from "./utils/actions";

export default function Home() {
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newStackName, setNewStackName] = useState("");
  const [newStackDescription, setNewStackDescription] = useState("");

  useEffect(() => {
    const loadStacks = async () => {
      try {
        setIsLoading(true);
        const data = await fetchStacks();
        setStacks(data);
      } catch (error) {
        console.error("Failed to fetch stacks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStacks();
  }, []);

  const handleCreateStack = async () => {
    if (!newStackName.trim()) return;

    try {
      const newStack = await createStack(newStackName, newStackDescription);
      setStacks([...stacks, newStack]);
      setNewStackName("");
      setNewStackDescription("");
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create stack:", error);
    }
  };

  const handleEditStack = (stackId: string) => {
    window.location.href = `/workflow/${stackId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#E4E8EE] bg-white">
        <div className="flex items-center gap-2">
          <div className="rounded-full w-9 h-9 flex items-center justify-center">
            <img src="/assets/logo.png" alt="" />
          </div>
          <span className="font-semibold text-lg">GenAI Stack</span>
        </div>
      </header>

      <main className="px-8 pt-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            My Stacks
          </h2>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#44924C] text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
            >
              + New Stack
            </Button>
          </div>
        </div>
        <hr className="mb-12 border-[#E4E8EE]" />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-2 text-sm text-gray-600">Loading stacks...</p>
          </div>
        ) : stacks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="text-start max-w-md p-10 flex flex-col items-start">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create New Stack
              </h3>
              <p className="text-gray-600 mb-6">
                Start building your generative AI apps with our essential tools
                and frameworks
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#44924C] text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition"
              >
                + New Stack
              </Button>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stacks.map((stack) => (
              <Card
                key={stack.id}
                className="bg-white border border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {stack.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 min-h-[2.5rem]">
                    {stack.description}
                  </p>
                  <Button
                    onClick={() => handleEditStack(stack.id)}
                    variant="outline"
                    className="w-full flex items-center gap-2 text-gray-700 hover:text-[#44924C] border-gray-300 hover:bg-gray-50"
                  >
                    Edit Stack
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Create New Stack
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <Input
                id="name"
                value={newStackName}
                onChange={(e) => setNewStackName(e.target.value)}
                placeholder="Enter stack name"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={newStackDescription}
                onChange={(e) => setNewStackDescription(e.target.value)}
                placeholder="Enter stack description"
                className="w-full min-h-[100px] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStack}
              disabled={!newStackName.trim()}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg"
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
