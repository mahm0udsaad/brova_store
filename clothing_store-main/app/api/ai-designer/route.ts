import { NextRequest, NextResponse } from "next/server";
import {
  validateImageFile,
  uploadImageToSupabase,
  generateWithRetry,
} from "@/lib/nanobanana";

// System prompt for AI designer
const SYSTEM_PROMPT = `You are a professional apparel designer specializing in streetwear hoodies. Your task is to edit or enhance the hoodie design in the provided image based on the user's creative instructions.

CRITICAL REQUIREMENTS:
- Output MUST be a photorealistic hoodie on a transparent background (alpha channel preserved)
- Preserve the exact hoodie silhouette, shape, and fabric texture
- Apply modifications ONLY to the visible side (front or back) shown in the input image
- Do NOT hallucinate or imagine the opposite side of the hoodie
- Maintain proper fabric physics, realistic lighting, shadows, and material properties
- Keep the hoodie centered in the frame with the same perspective and dimensions as the input
- Ensure all graphics, text, patterns, or embellishments look professionally printed/embroidered on the fabric
- Colors should be vibrant and streetwear-appropriate
- Output resolution and aspect ratio should match the input image

If a reference/inspiration image is provided as the second image, use it ONLY for style inspiration (colors, patterns, graphics style) but do NOT replace the hoodie structure.`;

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const hoodieImageFile = formData.get("hoodieImage") as File | null;
    const prompt = formData.get("prompt") as string | null;
    const side = formData.get("side") as string | null;
    const referenceImageFile = formData.get("referenceImage") as File | null;

    // Validate inputs
    if (!hoodieImageFile) {
      return NextResponse.json(
        { error: "Hoodie image is required" },
        { status: 400 }
      );
    }

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!side || !["front", "back"].includes(side)) {
      return NextResponse.json(
        { error: "Side must be 'front' or 'back'" },
        { status: 400 }
      );
    }

    // Validate hoodie image file
    const hoodieValidation = validateImageFile(hoodieImageFile);
    if (!hoodieValidation.valid) {
      return NextResponse.json(
        { error: `Hoodie image: ${hoodieValidation.error}` },
        { status: 400 }
      );
    }

    // Validate reference image if provided
    if (referenceImageFile) {
      const referenceValidation = validateImageFile(referenceImageFile);
      if (!referenceValidation.valid) {
        return NextResponse.json(
          { error: `Reference image: ${referenceValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Upload hoodie image to Supabase
    let hoodieImageUrl: string;
    try {
      hoodieImageUrl = await uploadImageToSupabase(hoodieImageFile, "ai-designer");
      console.log("Hoodie image uploaded:", hoodieImageUrl);
    } catch (error) {
      console.error("Failed to upload hoodie image:", error);
      throw new Error("Failed to process hoodie image. Please try again.");
    }

    // Upload reference image if provided
    let referenceImageUrl: string | null = null;
    if (referenceImageFile) {
      try {
        referenceImageUrl = await uploadImageToSupabase(referenceImageFile, "ai-designer/reference");
        console.log("Reference image uploaded:", referenceImageUrl);
      } catch (error) {
        console.error("Failed to upload reference image:", error);
        // Continue without reference image
      }
    }

    // Build the image URLs array
    const imageUrls = referenceImageUrl 
      ? [hoodieImageUrl, referenceImageUrl]
      : [hoodieImageUrl];

    // Build complete prompt
    let fullPrompt = `${SYSTEM_PROMPT}\n\nEDITING SIDE: ${side.toUpperCase()}\n\n`;
    
    if (referenceImageUrl) {
      fullPrompt += `REFERENCE IMAGE PROVIDED: Use the second image as style inspiration only. Do not copy it directly, but draw inspiration from its colors, patterns, or graphic style.\n\n`;
    }
    
    fullPrompt += `USER REQUEST: ${prompt.trim()}`;

    console.log("AI Designer request:", { side, prompt: prompt.trim(), hasReference: !!referenceImageUrl });

    // Generate with retry logic
    const resultImageUrl = await generateWithRetry(fullPrompt, imageUrls, "1:1");

    // Return the result
    return NextResponse.json({
      success: true,
      message: "Design generated successfully",
      resultImage: resultImageUrl,
      side,
    });
  } catch (error: any) {
    console.error("AI Designer API error:", error);

    // Handle specific error types
    if (error?.message?.includes("429")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error?.message?.includes("503")) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate design",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
