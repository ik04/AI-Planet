export const fetchStacks = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/stacks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stacks");
  }

  return response.json();
};

export const createStack = async (name: string, description: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/stacks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    throw new Error("Failed to create stack");
  }

  return response.json();
};

export const saveWorkflowBackend = async (
  stackId: string,
  data: {
    nodes: any[];
    edges: any[];
    data: Record<string, any>;
  }
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/workflows/${stackId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save workflow");
  }

  return response.json();
};

export const getWorkflow = async (stackId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/workflows/${stackId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Failed to fetch workflow");
  }

  return response.json();
};
