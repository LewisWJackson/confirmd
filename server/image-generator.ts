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

const GEMINI_MODEL = "gemini-3-pro-image-preview";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const STYLE_PROMPT = `Editorial collage artwork. Classical ancient Greek marble sculpture rendered with halftone newspaper print dot texture, grayscale. Cream off-white paper background. Bold geometric color block shapes in muted slate blue and terracotta burnt orange. Torn newspaper clippings and fragments scattered in the composition. Mixed media collage aesthetic with layered paper elements. Moody, editorial, intellectual atmosphere. No text, no words, no letters, no writing, no watermarks.`;

// Category-specific visual cues
const CATEGORY_VISUALS: Record<string, string> = {
  bitcoin: "A marble bust surrounded by golden coins and financial newspaper fragments, warm amber geometric accents",
  ethereum: "A classical Greek figure examining a glowing crystalline structure, purple and blue geometric accents",
  defi: "A marble statue of Prometheus bringing fire, green organic shapes intertwined with newspaper columns",
  regulation: "A marble figure of Lady Justice holding scales, bold navy blue geometric blocks, legal document fragments",
  security: "A classical warrior statue with a cracked shield, dark red and black geometric shapes, scattered broken fragments",
  markets: "A marble trader figure surrounded by rising columns like a bar chart, gold and warm geometric accents",
  nfts: "A marble sculptor creating art on a canvas, vibrant pink and purple geometric shapes",
  stablecoins: "A marble figure holding a perfectly balanced sphere, calm teal and grey geometric elements",
  technology: "A marble figure of Daedalus building wings, indigo and electric blue geometric shapes, blueprint fragments",
  crypto: "A marble philosopher bust emerging from scattered newspaper clippings about finance, bold geometric color blocks",
};

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

function buildPrompt(title: string, category?: string | null): string {
  const catKey = (category || "crypto").toLowerCase().replace(/[^a-z]/g, "");
  const categoryVisual = CATEGORY_VISUALS[catKey] || CATEGORY_VISUALS.crypto;

  // Extract the core subject from the title
  const cleanTitle = title.replace(/[^a-zA-Z0-9 ,'-]/g, "").slice(0, 100);

  return `${STYLE_PROMPT} Subject theme: "${cleanTitle}". ${categoryVisual}.`;
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
): Promise<string | null> {
  // Skip if already generated
  if (imageExists(storyId)) {
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
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K",
          },
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

    const imagePart = parts.find((p: any) => p.inline_data?.data);
    if (!imagePart) {
      console.error("[ImageGen] No image data in Gemini response");
      return null;
    }

    const b64 = imagePart.inline_data.data;

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
