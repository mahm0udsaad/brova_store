import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001";

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

interface RequestBody {
  landmarks: Landmark[];
  frame_width: number;
  frame_height: number;
  user_height_cm?: number;
  gender?: "male" | "female";
  calibration?: { mode: string };
  action?: "validate" | "measure";
}

// Validate landmarks payload
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      landmarks,
      frame_width,
      frame_height,
      user_height_cm = 175,
      gender = "male",
      calibration = { mode: "height" },
      action = "measure",
    } = body;

    if (!landmarks || !Array.isArray(landmarks) || landmarks.length !== 33) {
      return NextResponse.json(
        { error: "Invalid landmarks: expected 33 pose landmarks" },
        { status: 400 }
      );
    }

    if (!frame_width || !frame_height) {
      return NextResponse.json(
        { error: "frame_width and frame_height are required" },
        { status: 400 }
      );
    }

    // Normalize landmarks - ensure visibility is present
    const normalizedLandmarks = landmarks.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility ?? 1.0,
    }));

    // Prepare request payload
    const payload = {
      landmarks: normalizedLandmarks,
      frame_width,
      frame_height,
      user_height_cm,
      gender,
      calibration,
      timestamp: Date.now() / 1000,
    };

    // Choose endpoint based on action
    const endpoint =
      action === "validate" ? "/api/validate" : "/api/measurements";

    try {
      // Call Flask backend
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.message || "Backend processing failed",
            details: errorData,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Return the backend response
      return NextResponse.json(data);
    } catch (fetchError: any) {
      // Handle connection errors
      if (
        fetchError?.code === "ECONNREFUSED" ||
        fetchError?.message?.includes("fetch failed")
      ) {
        return NextResponse.json(
          {
            error: "API_OFFLINE",
            message:
              "Cannot connect to measurement service. Please ensure the Flask backend is running.",
          },
          { status: 503 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Realtime measurement error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to process measurement request",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
