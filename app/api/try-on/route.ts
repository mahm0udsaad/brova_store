import { NextRequest, NextResponse } from "next/server";
import {
  validateImageFile,
  uploadImageToSupabase,
  generateWithRetry,
  resolveProductUrl,
} from "@/lib/nanobanana";

// Generate virtual try-on with retry logic
async function generateTryOnWithRetry(
  userImageFile: File,
  productImageUrl: string
): Promise<string> {
  // Upload user image to Supabase Storage first (only once)
  let userImageUrl: string;
  try {
    userImageUrl = await uploadImageToSupabase(userImageFile, "try-on");
    console.log("User image uploaded to Supabase:", userImageUrl);
  } catch (error) {
    console.error("Failed to upload user image:", error);
    throw new Error("Failed to process user image. Please try again.");
  }

  // Construct the prompt for virtual try-on
  const prompt = `Professional photorealistic virtual try-on: Realistically place the clothing item from the second image onto the person in the first image. Preserve the person's identity, face, body shape, pose, and skin tone exactly. Apply the clothing naturally with proper fabric physics, lighting, and shadows. Maintain the texture, color, logos, and patterns of the clothing. High quality, natural lighting, 3:4 portrait aspect ratio.`;

  // Generate with retry logic
  return await generateWithRetry(prompt, [userImageUrl, productImageUrl], "3:4");
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const userImageFile = formData.get("userImage") as File | null;
    const productImageUrl = formData.get("productImageUrl") as string | null;
    const productImageFile = formData.get("productImageFile") as File | null;

    // Validate inputs
    if (!userImageFile) {
      return NextResponse.json(
        { error: "User image is required" },
        { status: 400 }
      );
    }

    if (!productImageUrl && !productImageFile) {
      return NextResponse.json(
        { error: "Product image is required" },
        { status: 400 }
      );
    }

    // Validate user image file
    const fileValidation = validateImageFile(userImageFile);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    let finalProductImageUrl: string;

    if (productImageFile) {
      // Validate product image file if provided
      const productFileValidation = validateImageFile(productImageFile);
      if (!productFileValidation.valid) {
        return NextResponse.json(
          { error: `Product image error: ${productFileValidation.error}` },
          { status: 400 }
        );
      }
      // Upload product image to Supabase
      try {
        finalProductImageUrl = await uploadImageToSupabase(productImageFile, "designs");
        console.log("Product design uploaded to Supabase:", finalProductImageUrl);
      } catch (error) {
        console.error("Failed to upload product image:", error);
        return NextResponse.json(
          { error: "Failed to upload product design" },
          { status: 500 }
        );
      }
    } else {
      // Resolve product image URL
      finalProductImageUrl = resolveProductUrl(productImageUrl!);
    }

    // Generate try-on result with retry logic
    const resultImageUrl = await generateTryOnWithRetry(
      userImageFile,
      finalProductImageUrl
    );

    // Return the result image URL
    return NextResponse.json({
      success: true,
      message: "Try-on generated successfully",
      resultImage: resultImageUrl,
    });
  } catch (error: any) {
    console.error("Try-on API error:", error);

    // Handle specific error types
    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (error?.status === 503) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate try-on result",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
