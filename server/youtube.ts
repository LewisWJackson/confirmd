/**
 * YouTube Transcript Ingestion Module for Confirmd
 *
 * Fetches recent videos from XRP-focused YouTube channels and retrieves
 * transcripts via the Apify YouTube Transcripts actor. Returns structured
 * data for the pipeline to process (claim extraction happens in pipeline.ts).
 */

import { storage } from "./storage.js";
import type { Source, InsertSource } from "../shared/schema.js";

// ============================================
// TYPES
// ============================================

export interface YouTubeChannel {
  name: string;
  handle: string;
  channelUrl: string;
}

export interface YouTubeVideo {
  videoId: string;
  videoUrl: string;
  title: string;
  publishedAt: Date;
  thumbnailUrl?: string;
}

export interface YouTubeTranscriptResult {
  sourceId: string;
  videoUrl: string;
  title: string;
  publishedAt: Date;
  transcript: string;
  thumbnailUrl?: string;
}

// ============================================
// CHANNEL CONFIGURATION
// ============================================

export const YOUTUBE_CHANNELS: YouTubeChannel[] = [
  {
    name: "Bearable Bull",
    handle: "youtube.com/@TheBearableBull",
    channelUrl: "https://www.youtube.com/@TheBearableBull",
  },
  {
    name: "Digital Asset Investor",
    handle: "youtube.com/@DigitalAssetInvestor",
    channelUrl: "https://www.youtube.com/@DigitalAssetInvestor",
  },
  {
    name: "Blockchain Backer",
    handle: "youtube.com/@BlockchainBacker",
    channelUrl: "https://www.youtube.com/@BlockchainBacker",
  },
  {
    name: "Crypto Eri",
    handle: "youtube.com/@CryptoEri",
    channelUrl: "https://www.youtube.com/@CryptoEri",
  },
  {
    name: "Digital Perspectives",
    handle: "youtube.com/@DigitalPerspectives",
    channelUrl: "https://www.youtube.com/@DigitalPerspectives",
  },
  {
    name: "Alex Cobb",
    handle: "youtube.com/@AlexCobb",
    channelUrl: "https://www.youtube.com/@AlexCobb",
  },
];

// ============================================
// CONSTANTS
// ============================================

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TRANSCRIPT_ACTOR = "bernardo~youtube-transcripts";
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_VIDEOS = 10;

// ============================================
// HELPERS
// ============================================

/**
 * Get the Apify API token from the environment.
 * Throws if not configured.
 */
function getApifyToken(): string {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error(
      "[YouTube] APIFY_TOKEN environment variable is not set. " +
        "YouTube transcript ingestion requires a valid Apify API token.",
    );
  }
  return token;
}

/**
 * Resolve a YouTube channel handle URL to its channel ID.
 *
 * Fetches the channel page HTML and extracts the channel ID from the
 * `"channelId":"UCXXXXXX"` pattern or the
 * `<meta itemprop="channelId" content="UCXXXXXX">` meta tag.
 */
async function resolveChannelId(channelUrl: string): Promise<string> {
  const response = await fetch(channelUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Confirmd/1.0; +https://confirmd.io)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch channel page ${channelUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Try JSON pattern first: "channelId":"UCXXXXXX"
  const jsonMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/);
  if (jsonMatch) {
    return jsonMatch[1];
  }

  // Fallback: <meta itemprop="channelId" content="UCXXXXXX">
  const metaMatch = html.match(
    /<meta\s+itemprop="channelId"\s+content="(UC[a-zA-Z0-9_-]+)"/,
  );
  if (metaMatch) {
    return metaMatch[1];
  }

  // Fallback: look for /channel/UCXXXXXX pattern in HTML
  const channelPathMatch = html.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  if (channelPathMatch) {
    return channelPathMatch[1];
  }

  throw new Error(
    `Could not resolve channel ID from ${channelUrl}. The page HTML did not contain a recognizable channel ID.`,
  );
}

/**
 * Parse a YouTube RSS feed XML string into an array of video entries.
 * Uses basic string parsing to avoid needing an XML library.
 */
function parseYouTubeRssFeed(xml: string, maxVideos: number): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];

  // Split by <entry> tags
  const entries = xml.split("<entry>");

  // First element is the feed header, skip it
  for (let i = 1; i < entries.length && videos.length < maxVideos; i++) {
    const entry = entries[i];

    // Extract video ID
    const videoIdMatch = entry.match(
      /<yt:videoId>([a-zA-Z0-9_-]+)<\/yt:videoId>/,
    );
    if (!videoIdMatch) continue;
    const videoId = videoIdMatch[1];

    // Extract title
    const titleMatch = entry.match(/<title>([^<]*)<\/title>/);
    const title = titleMatch
      ? decodeXmlEntities(titleMatch[1])
      : `Video ${videoId}`;

    // Extract published date
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch
      ? new Date(publishedMatch[1])
      : new Date();

    // Extract thumbnail
    const thumbMatch = entry.match(
      /<media:thumbnail\s+url="([^"]+)"/,
    );
    const thumbnailUrl = thumbMatch ? thumbMatch[1] : undefined;

    videos.push({
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      publishedAt,
      thumbnailUrl,
    });
  }

  return videos;
}

/**
 * Decode common XML entities in text content.
 */
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// CHANNEL VIDEO FETCHING
// ============================================

/**
 * Fetch the latest N videos from a YouTube channel using its public RSS feed.
 *
 * Steps:
 * 1. Resolve the channel handle to a channel ID by scraping the page HTML.
 * 2. Fetch the channel's RSS feed at
 *    `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`.
 * 3. Parse the XML and return structured video metadata.
 *
 * @param channelUrl - The full YouTube channel URL (e.g. https://www.youtube.com/@Handle)
 * @param maxVideos  - Maximum number of videos to return (default 10)
 * @returns Array of video metadata objects, newest first
 */
export async function fetchChannelVideos(
  channelUrl: string,
  maxVideos: number = DEFAULT_MAX_VIDEOS,
): Promise<YouTubeVideo[]> {
  // Step 1: Resolve channel ID from handle URL
  console.log(`[YouTube] Resolving channel ID for ${channelUrl}`);
  const channelId = await resolveChannelId(channelUrl);
  console.log(`[YouTube] Resolved channel ID: ${channelId}`);

  // Step 2: Fetch the RSS feed
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Confirmd/1.0; +https://confirmd.io)",
      Accept: "application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch RSS feed for channel ${channelId}: ${response.status} ${response.statusText}`,
    );
  }

  const xml = await response.text();

  // Step 3: Parse the feed
  const videos = parseYouTubeRssFeed(xml, maxVideos);
  console.log(
    `[YouTube] Found ${videos.length} videos for channel ${channelId}`,
  );

  return videos;
}

// ============================================
// TRANSCRIPT FETCHING VIA APIFY
// ============================================

/**
 * Fetch the transcript for a single YouTube video using the Apify
 * YouTube Transcripts actor.
 *
 * Steps:
 * 1. Start an actor run with the video URL.
 * 2. Poll for run completion (up to 60s timeout).
 * 3. Fetch and return the transcript text from the run's dataset.
 *
 * @param videoUrl - Full YouTube video URL (e.g. https://www.youtube.com/watch?v=XXXXX)
 * @returns The transcript text as a plain string, or null if unavailable
 */
export async function fetchTranscript(
  videoUrl: string,
): Promise<string | null> {
  const token = getApifyToken();

  // Step 1: Start the actor run
  console.log(`[YouTube] Starting Apify transcript run for ${videoUrl}`);

  const startResponse = await fetch(
    `${APIFY_BASE_URL}/acts/${APIFY_TRANSCRIPT_ACTOR}/runs?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: [videoUrl],
        outputFormat: "singleStringPerVideo",
      }),
    },
  );

  if (!startResponse.ok) {
    const errorBody = await startResponse.text().catch(() => "");
    console.error(
      `[YouTube] Apify actor start failed (${startResponse.status}): ${errorBody}`,
    );
    return null;
  }

  const startData = (await startResponse.json()) as {
    data: { id: string; status: string };
  };
  const runId = startData.data.id;
  console.log(`[YouTube] Apify run started: ${runId}`);

  // Step 2: Poll for completion with timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), POLL_TIMEOUT_MS);

  try {
    let status = startData.data.status;

    while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "ABORTED" && status !== "TIMED-OUT") {
      if (abortController.signal.aborted) {
        console.warn(
          `[YouTube] Apify run ${runId} timed out after ${POLL_TIMEOUT_MS / 1000}s`,
        );
        return null;
      }

      await sleep(POLL_INTERVAL_MS);

      const pollResponse = await fetch(
        `${APIFY_BASE_URL}/actor-runs/${runId}?token=${token}`,
        { signal: abortController.signal },
      );

      if (!pollResponse.ok) {
        console.error(
          `[YouTube] Apify poll failed (${pollResponse.status}) for run ${runId}`,
        );
        return null;
      }

      const pollData = (await pollResponse.json()) as {
        data: { status: string };
      };
      status = pollData.data.status;
    }

    if (status !== "SUCCEEDED") {
      console.warn(
        `[YouTube] Apify run ${runId} ended with status: ${status}`,
      );
      return null;
    }

    // Step 3: Fetch the dataset items
    const datasetResponse = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}/dataset/items?token=${token}`,
      { signal: abortController.signal },
    );

    if (!datasetResponse.ok) {
      console.error(
        `[YouTube] Failed to fetch dataset for run ${runId}: ${datasetResponse.status}`,
      );
      return null;
    }

    const items = (await datasetResponse.json()) as Array<{
      transcript?: string;
      text?: string;
      captions?: string;
      content?: string;
    }>;

    if (!items || items.length === 0) {
      console.warn(`[YouTube] No transcript data returned for ${videoUrl}`);
      return null;
    }

    // The actor may return the transcript in different fields depending on version
    const item = items[0];
    const transcript =
      item.transcript || item.text || item.captions || item.content || null;

    if (!transcript) {
      console.warn(
        `[YouTube] Transcript item returned but no text content for ${videoUrl}`,
      );
      return null;
    }

    const trimmed = transcript.trim();
    if (trimmed.length === 0) {
      console.warn(`[YouTube] Empty transcript for ${videoUrl}`);
      return null;
    }

    console.log(
      `[YouTube] Transcript fetched for ${videoUrl} (${trimmed.length} chars)`,
    );
    return trimmed;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn(
        `[YouTube] Apify run ${runId} aborted due to timeout`,
      );
      return null;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// SOURCE MANAGEMENT
// ============================================

/**
 * Ensure a YouTube channel exists as a source in the database.
 * If it already exists (matched by handle), return its ID.
 * Otherwise, create a new source record with type "youtube".
 */
async function ensureYouTubeSource(
  channel: YouTubeChannel,
): Promise<string> {
  // Try to find existing source by handle
  const existingSources = await storage.getSources();
  const existing = existingSources.find(
    (s) =>
      s.handleOrDomain === channel.handle ||
      s.displayName === channel.name,
  );

  if (existing) {
    return existing.id;
  }

  // Create new source
  const source = await storage.createSource({
    type: "youtube",
    handleOrDomain: channel.handle,
    displayName: channel.name,
    metadata: {
      channelUrl: channel.channelUrl,
      youtubeSource: true,
    },
  });

  console.log(
    `[YouTube] Created source for "${channel.name}" (${source.id})`,
  );
  return source.id;
}

// ============================================
// MAIN ORCHESTRATOR
// ============================================

/**
 * Ingest YouTube transcripts from all configured channels.
 *
 * For each channel:
 * 1. Ensure the channel exists as a source in the database.
 * 2. Fetch the latest videos via the channel's RSS feed.
 * 3. Filter out already-ingested videos (dedup by URL).
 * 4. Fetch transcripts for new videos via Apify.
 * 5. Return structured results for the pipeline to process.
 *
 * This function does NOT call extractClaimsWithLLM. It returns raw transcript
 * data so that pipeline.ts can handle claim extraction uniformly.
 *
 * @param _pipeline - Pipeline instance (unused; reserved for future integration)
 * @returns Array of transcript results for new videos
 */
export async function ingestYouTubeTranscripts(
  _pipeline: any,
): Promise<YouTubeTranscriptResult[]> {
  console.log("[YouTube] === Starting YouTube transcript ingestion ===");
  console.log(
    `[YouTube] Processing ${YOUTUBE_CHANNELS.length} channels`,
  );

  // Check for Apify token early — warn but don't throw so the rest of
  // the pipeline can continue.
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    console.warn(
      "[YouTube] APIFY_TOKEN not set — skipping YouTube transcript ingestion",
    );
    return [];
  }

  const allResults: YouTubeTranscriptResult[] = [];

  // Process each channel independently so one failure doesn't block others
  const channelResults = await Promise.allSettled(
    YOUTUBE_CHANNELS.map((channel) =>
      processChannel(channel),
    ),
  );

  for (let i = 0; i < channelResults.length; i++) {
    const result = channelResults[i];
    const channel = YOUTUBE_CHANNELS[i];

    if (result.status === "fulfilled") {
      allResults.push(...result.value);
      console.log(
        `[YouTube] ${channel.name}: ${result.value.length} new transcripts`,
      );
    } else {
      console.error(
        `[YouTube] ${channel.name}: Failed — ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
      );
    }
  }

  console.log(
    `[YouTube] === Ingestion complete: ${allResults.length} new transcripts from ${YOUTUBE_CHANNELS.length} channels ===`,
  );

  return allResults;
}

/**
 * Process a single YouTube channel: ensure source, fetch videos,
 * dedup, and fetch transcripts for new ones.
 */
async function processChannel(
  channel: YouTubeChannel,
): Promise<YouTubeTranscriptResult[]> {
  console.log(`[YouTube] Processing channel: ${channel.name}`);

  // Step 1: Ensure source exists in DB
  const sourceId = await ensureYouTubeSource(channel);

  // Step 2: Fetch latest videos
  let videos: YouTubeVideo[];
  try {
    videos = await fetchChannelVideos(
      channel.channelUrl,
      DEFAULT_MAX_VIDEOS,
    );
  } catch (error) {
    console.error(
      `[YouTube] Failed to fetch videos for ${channel.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return [];
  }

  if (videos.length === 0) {
    console.log(`[YouTube] No videos found for ${channel.name}`);
    return [];
  }

  // Step 3: Filter out already-ingested videos
  const newVideos: YouTubeVideo[] = [];
  for (const video of videos) {
    try {
      const existing = await storage.getItemByUrl(video.videoUrl);
      if (!existing) {
        newVideos.push(video);
      }
    } catch {
      // If getItemByUrl fails (e.g. not implemented), treat as new
      newVideos.push(video);
    }
  }

  console.log(
    `[YouTube] ${channel.name}: ${newVideos.length} new videos (${videos.length - newVideos.length} already ingested)`,
  );

  if (newVideos.length === 0) {
    return [];
  }

  // Step 4: Fetch transcripts for new videos (sequentially to be
  // conservative with Apify free-tier compute units)
  const results: YouTubeTranscriptResult[] = [];

  for (const video of newVideos) {
    try {
      console.log(
        `[YouTube] Fetching transcript: "${video.title}" (${video.videoId})`,
      );
      const transcript = await fetchTranscript(video.videoUrl);

      if (transcript) {
        results.push({
          sourceId,
          videoUrl: video.videoUrl,
          title: video.title,
          publishedAt: video.publishedAt,
          transcript,
          thumbnailUrl: video.thumbnailUrl,
        });
        console.log(
          `[YouTube] Transcript obtained for "${video.title}" (${transcript.length} chars)`,
        );
      } else {
        console.log(
          `[YouTube] No transcript available for "${video.title}"`,
        );
      }
    } catch (error) {
      console.error(
        `[YouTube] Failed to fetch transcript for "${video.title}": ${error instanceof Error ? error.message : String(error)}`,
      );
      // Continue with remaining videos
    }
  }

  return results;
}
