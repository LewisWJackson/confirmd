/**
 * AI-powered story image generator.
 *
 * Generates unique editorial collage artwork for each story using Google's
 * Gemini Nano Banana Pro (gemini-3-pro-image-preview) image generation API.
 * Style: classical Greek sculpture + newspaper print collage with halftone
 * textures, muted slate blue / terracotta accents, cream paper backgrounds.
 *
 * Falls back to the programmatic SVG generator when AI is unavailable.
 */

import fs from "fs";
import path from "path";
import { generateStoryImage, type StoryImageParams } from "./story-image.js";

// ── Config ───────────────────────────────────────────────────────────

const IMAGES_DIR = path.resolve("dist", "public", "story-images");
const VIDEO_THUMBNAILS_DIR = path.resolve("dist", "public", "video-thumbnails");

const GEMINI_MODEL = "gemini-2.5-flash-image";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const STYLE_SUFFIX = `Style: mixed-media collage on cream paper, torn newspaper clippings layered behind the subject, muted slate blue and terracotta geometric accent shapes, halftone dot texture overlay, grainy editorial print aesthetic. No text, no words, no letters, no watermarks.`;

// ── Helpers ──────────────────────────────────────────────────────────

function ensureImagesDir(): void {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
}

function getImagePath(storyId: string): string {
  return path.join(IMAGES_DIR, `${storyId}.png`);
}

function imageExists(storyId: string): boolean {
  return fs.existsSync(getImagePath(storyId));
}

function buildPrompt(title: string, _category?: string | null): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9 ,'-]/g, "").slice(0, 120);

  return `Create an editorial illustration about: ${cleanTitle}. Show a scene that visually captures the specific subject matter — depict the key objects, actions, and setting described in the headline. ${STYLE_SUFFIX}`;
}

// ── Main generator ───────────────────────────────────────────────────

/**
 * Generate an AI image for a story using Google Gemini Nano Banana Pro.
 * Returns the public URL path (e.g. "/story-images/{id}.png") on success,
 * or null if generation fails.
 */
export async function generateStoryImageAI(
  storyId: string,
  title: string,
  category?: string | null,
  force?: boolean,
): Promise<string | null> {
  // Skip if already generated (unless force)
  if (!force && imageExists(storyId)) {
    return `/story-images/${storyId}.png`;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[ImageGen] No GEMINI_API_KEY — skipping AI image generation");
    return null;
  }

  try {
    ensureImagesDir();

    const prompt = buildPrompt(title, category);

    console.log(`[ImageGen] Generating image for story "${title.slice(0, 50)}..."`);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate an image: ${prompt}` }],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ImageGen] Gemini API error ${response.status}:`, errText.slice(0, 200));
      return null;
    }

    const data = await response.json() as any;

    // Find the image part in the response
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      console.error("[ImageGen] No parts in Gemini response");
      return null;
    }

    const imagePart = parts.find((p: any) => p.inlineData?.data);
    if (!imagePart) {
      console.error("[ImageGen] No image data in Gemini response");
      return null;
    }

    const b64 = imagePart.inlineData.data;

    // Save to file
    const buffer = Buffer.from(b64, "base64");
    const filePath = getImagePath(storyId);
    fs.writeFileSync(filePath, buffer);

    console.log(`[ImageGen] Saved ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return `/story-images/${storyId}.png`;
  } catch (err: any) {
    console.error(`[ImageGen] Failed for "${title.slice(0, 50)}":`, err.message || err);
    return null;
  }
}

/**
 * Get the image URL for a story — AI-generated if available, otherwise
 * the SVG fallback endpoint.
 */
export function getStoryImageFallbackUrl(storyId: string): string {
  if (imageExists(storyId)) {
    return `/story-images/${storyId}.png`;
  }
  return `/api/stories/${storyId}/image`;
}

/**
 * Generate SVG fallback for a story (served from the route handler).
 */
export function generateSvgFallback(params: StoryImageParams): string {
  return generateStoryImage(params);
}

// ── Video Thumbnail Generator ────────────────────────────────────────

function ensureVideoThumbnailsDir(): void {
  if (!fs.existsSync(VIDEO_THUMBNAILS_DIR)) {
    fs.mkdirSync(VIDEO_THUMBNAILS_DIR, { recursive: true });
  }
}

function getVideoThumbnailPath(videoId: string): string {
  return path.join(VIDEO_THUMBNAILS_DIR, `${videoId}.png`);
}

export function videoThumbnailExists(videoId: string): boolean {
  return fs.existsSync(getVideoThumbnailPath(videoId));
}

/**
 * Get the video thumbnail URL if an AI-generated one exists on disk.
 */
export function getVideoThumbnailUrl(videoId: string): string | null {
  if (videoThumbnailExists(videoId)) {
    return `/video-thumbnails/${videoId}.png`;
  }
  return null;
}

/**
 * Generate an AI thumbnail for a video using Google Gemini.
 * Returns the public URL path (e.g. "/video-thumbnails/{videoId}.png") on success,
 * or null if generation fails.
 */
export async function generateVideoThumbnail(
  videoId: string,
  title: string,
  channelName: string,
  force?: boolean,
): Promise<string | null> {
  // Skip if already generated (unless force)
  if (!force && videoThumbnailExists(videoId)) {
    return `/video-thumbnails/${videoId}.png`;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[VideoThumb] No GEMINI_API_KEY — skipping AI thumbnail generation");
    return null;
  }

  try {
    ensureVideoThumbnailsDir();

    const cleanTitle = title.replace(/[^a-zA-Z0-9 ,'-]/g, "").slice(0, 120);
    const prompt = `Create an editorial illustration about: ${cleanTitle}. Show a scene that visually captures the specific subject matter — depict the key objects, actions, and setting described in the title. ${STYLE_SUFFIX}`;

    console.log(`[VideoThumb] Generating thumbnail for "${title.slice(0, 50)}..."`);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Generate an image: ${prompt}` }],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[VideoThumb] Gemini API error ${response.status}:`, errText.slice(0, 200));
      return null;
    }

    const data = await response.json() as any;

    // Find the image part in the response
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || !Array.isArray(parts)) {
      console.error("[VideoThumb] No parts in Gemini response");
      return null;
    }

    const imagePart = parts.find((p: any) => p.inlineData?.data);
    if (!imagePart) {
      console.error("[VideoThumb] No image data in Gemini response");
      return null;
    }

    const b64 = imagePart.inlineData.data;

    // Save to file
    const buffer = Buffer.from(b64, "base64");
    const filePath = getVideoThumbnailPath(videoId);
    fs.writeFileSync(filePath, buffer);

    console.log(`[VideoThumb] Saved ${filePath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return `/video-thumbnails/${videoId}.png`;
  } catch (err: any) {
    console.error(`[VideoThumb] Failed for "${title.slice(0, 50)}":`, err.message || err);
    return null;
  }
}
