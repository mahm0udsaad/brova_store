// Error mapping from backend to user-friendly messages
export interface MeasurementError {
  type: string;
  pose?: string;
  code?: string;
  message?: string;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
  retryPose?: "front" | "side"; // Which pose to retry if applicable
}

export function mapErrorToUserFriendly(
  error: MeasurementError
): UserFriendlyError {
  // Handle INVALID_POSE errors
  if (error.type === "INVALID_POSE") {
    const suggestions: string[] = [];

    if (error.code === "BAD_KEYPOINTS") {
      suggestions.push("Move back a bit so your whole body is visible");
      suggestions.push("Make sure your feet are in the frame");
    }

    if (error.pose === "front") {
      return {
        title: "Front photo issue",
        message: "We couldn't see your whole body in the front view.",
        suggestions: [
          ...suggestions,
          "Stand straight facing the camera",
          "Keep arms relaxed at your sides",
          "Ensure good lighting",
        ],
        canRetry: true,
        retryPose: "front",
      };
    }

    if (error.pose === "left_side") {
      return {
        title: "Side photo issue",
        message: "Side view didn't capture your body fully.",
        suggestions: [
          ...suggestions,
          "Turn to your left side",
          "Stand straight with arms down",
          "Step back from the camera",
        ],
        canRetry: true,
        retryPose: "side",
      };
    }

    // Generic INVALID_POSE
    return {
      title: "Body not detected",
      message: "We couldn't detect your full body in the photo.",
      suggestions: [
        "Make sure your entire body is visible",
        "Stand in a well-lit area",
        "Keep phone upright (portrait mode)",
        "Step back from the camera",
      ],
      canRetry: true,
    };
  }

  // Handle network errors
  if (error.type === "NETWORK") {
    return {
      title: "Connection issue",
      message: "Can't connect to the measurement service.",
      suggestions: [
        "Check your internet connection",
        "Make sure the backend is running",
        "Try again in a moment",
      ],
      canRetry: true,
    };
  }

  // Handle missing front image
  if (error.type === "MISSING_FRONT") {
    return {
      title: "Missing photo",
      message: "Front photo is required to get measurements.",
      suggestions: ["Take a front photo to continue"],
      canRetry: true,
      retryPose: "front",
    };
  }

  // Handle invalid file errors
  if (error.type === "INVALID_FILE") {
    return {
      title: "Invalid image",
      message: error.message || "The image file is invalid.",
      suggestions: [
        "Use JPEG, PNG, or WebP format",
        "Keep file size under 10MB",
        "Try taking a new photo",
      ],
      canRetry: true,
    };
  }

  // Generic fallback error
  return {
    title: "Something went wrong",
    message: error.message || "We couldn't process your measurement.",
    suggestions: [
      "Make sure photos are clear and well-lit",
      "Ensure your full body is visible",
      "Try again",
    ],
    canRetry: true,
  };
}

// Client-side image resize helper
export async function resizeImage(
  file: File,
  maxWidth: number = 1280,
  quality: number = 0.9
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            // Create new file from blob
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(resizedFile);
          },
          file.type,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

// Convert blob/data URL to File object
export async function dataURLToFile(
  dataURL: string,
  filename: string
): Promise<File> {
  const response = await fetch(dataURL);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

// Capture image from video stream
export function captureImageFromVideo(
  video: HTMLVideoElement,
  filename: string = "capture.jpg"
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          const file = new File([blob], filename, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(file);
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      reject(error);
    }
  });
}
