import { NextRequest, NextResponse } from "next/server";

// Backend API configuration
const BACKEND_API_URL = "http://localhost:8001/upload_images";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

// Validate image file
function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  return { valid: true };
}

type BackendSuccessPayload =
  | {
      measurements?: Record<string, number>;
      debug_info?: Record<string, unknown>;
      [key: string]: unknown;
    }
  | Record<string, unknown>;

function normalizeBackendSuccessPayload(
  data: BackendSuccessPayload,
  heightCm: string | null
): { measurements: Record<string, unknown>; debug_info?: Record<string, unknown> } {
  const maybeObj = (data ?? {}) as Record<string, unknown>;

  const rawMeasurements =
    (maybeObj.measurements as Record<string, unknown> | undefined) ?? maybeObj;
  const debugInfo = maybeObj.debug_info as Record<string, unknown> | undefined;

  // Create a normalized object that includes both:
  // - raw keys from backend (e.g. chest_circumference)
  // - UI-friendly keys used by the site (e.g. chest_cm)
  const measurements: Record<string, unknown> = { ...rawMeasurements };

  // Map backend naming → UI naming (used by `MeasurementResults`).
  // Backend sample: shoulder_width, chest_circumference, waist, hip
  if (measurements.shoulder_width_cm == null && measurements.shoulder_width != null) {
    measurements.shoulder_width_cm = measurements.shoulder_width;
  }
  if (measurements.chest_cm == null && measurements.chest_circumference != null) {
    measurements.chest_cm = measurements.chest_circumference;
  }
  if (measurements.waist_cm == null && measurements.waist != null) {
    measurements.waist_cm = measurements.waist;
  }
  if (measurements.hip_cm == null && measurements.hip != null) {
    measurements.hip_cm = measurements.hip;
  }

  // Height: prefer debug_info.user_height_cm, else request field, else existing height values.
  const debugHeight = debugInfo?.user_height_cm;
  if (
    measurements.height_cm == null &&
    (debugHeight != null || heightCm != null || measurements.height != null)
  ) {
    measurements.height_cm =
      (typeof debugHeight === "number" ? debugHeight : null) ??
      (heightCm != null ? Number(heightCm) : null) ??
      (typeof measurements.height === "number" ? measurements.height : null);
  }

  return { measurements, debug_info: debugInfo };
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data from client
    const formData = await request.formData();
    const frontFile = formData.get("front") as File | null;
    const sideFile = formData.get("left_side") as File | null;
    const heightCm = formData.get("height_cm") as string | null;

    // Validate required front image
    if (!frontFile) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            type: "MISSING_FRONT",
            message: "Front image is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate front image file
    const frontValidation = validateImageFile(frontFile);
    if (!frontValidation.valid) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            type: "INVALID_FILE",
            message: frontValidation.error,
          },
        },
        { status: 400 }
      );
    }

    // Validate side image file if provided
    if (sideFile) {
      const sideValidation = validateImageFile(sideFile);
      if (!sideValidation.valid) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              type: "INVALID_FILE",
              message: sideValidation.error,
            },
          },
          { status: 400 }
        );
      }
    }

    // Construct FormData for backend
    const backendFormData = new FormData();
    backendFormData.append("front", frontFile);
    if (sideFile) {
      backendFormData.append("left_side", sideFile);
    }
    if (heightCm) {
      backendFormData.append("height_cm", heightCm);
    }

    // Forward to backend
    const backendResponse = await fetch(BACKEND_API_URL, {
      method: "POST",
      body: backendFormData,
    });

    // Handle backend response
    if (backendResponse.ok) {
      const data = (await backendResponse.json()) as BackendSuccessPayload;
      const normalized = normalizeBackendSuccessPayload(data, heightCm);
      return NextResponse.json({
        ok: true,
        measurements: normalized.measurements,
        debug_info: normalized.debug_info,
      });
    }

    // Handle backend errors (400, etc.)
    if (backendResponse.status === 400) {
      const errorData = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          ok: false,
          error: {
            type: errorData.error || "VALIDATION_ERROR",
            pose: errorData.pose,
            code: errorData.code,
            message: errorData.message,
          },
        },
        { status: 400 }
      );
    }

    // Handle other backend errors
    throw new Error(
      `Backend responded with status ${backendResponse.status}`
    );
  } catch (error: any) {
    console.error("Measurement API error:", error);

    // Network or connection errors
    if (
      error?.code === "ECONNREFUSED" ||
      error?.code === "ENOTFOUND" ||
      error?.message?.includes("fetch failed")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            type: "NETWORK",
            message: "Cannot connect to measurement service",
          },
        },
        { status: 502 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        ok: false,
        error: {
          type: "INTERNAL_ERROR",
          message: "Failed to process measurement request",
          details: error?.message || "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
