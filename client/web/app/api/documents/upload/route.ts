import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const stackId = formData.get("stackId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!stackId) {
      return NextResponse.json(
        { error: "No stack ID provided" },
        { status: 400 }
      );
    }

    // Create a new FormData to send to the backend
    const backendFormData = new FormData();
    backendFormData.append("file", file);

    // Upload to the backend
    const backendResponse = await fetch(
      `http://localhost:8000/workflows/${stackId}/upload`,
      {
        method: "POST",
        body: backendFormData,
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.detail || "Upload failed" },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
