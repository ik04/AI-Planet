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
