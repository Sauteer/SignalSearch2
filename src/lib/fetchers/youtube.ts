import { RawSignal, SourceType, TimeRange, TimeRangeValue } from "../types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { getDateRange } from "../utils"

/**
 * Search YouTube videos via Exa's neural search.
 *
 * Exa indexes YouTube video pages (including captions/transcripts), so
 * this gives us real transcript-level search without any YouTube API key
 * or browser-cookie dependencies.
 *
 * We restrict the search to `site:youtube.com/watch` and optionally
 * scope it to specific channel URLs when channels are provided.
 */
export async function fetchYouTube(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  specificChannels?: string[],
  customDateRange?: import("@/lib/types").CustomDateRange
): Promise<RawSignal[]> {
  const apiKey = process.env.EXA_API_KEY

  if (!apiKey) {
    console.warn("EXA_API_KEY not set — skipping YouTube search")
    return []
  }

  const { start, end } = getDateRange(timeRange, customDateRange)

  // Build channel-scoped domains for Exa.
  // Map channel IDs to their YouTube channel URLs using our config.
  const channelConfig = SEARCH_SOURCES.youtubeChannels
  const activeChannelIds = specificChannels?.length
    ? specificChannels
    : channelConfig.map(c => c.id)

  // Exa lets us restrict to specific domains. We use youtube.com/watch
  // as the base, and when we have specific channels we add their handles.
  // Since we store IDs (not handles), we search youtube.com broadly and
  // rely on the query + Exa's neural matching to surface channel-relevant videos.
  const includeDomains = activeChannelIds.length > 0 && activeChannelIds.length < channelConfig.length
    ? ["youtube.com"]   // channel ID filtering below via query
    : ["youtube.com"]

  // Build an enriched query that references the channel names so Exa's
  // neural search surfaces videos from those channels.
  const channelNames = channelConfig
    .filter(c => activeChannelIds.includes(c.id))
    .map(c => c.name)

  const enrichedQuery = channelNames.length > 0
    ? `${query} site:youtube.com channel:(${channelNames.slice(0, 4).join(" OR ")})`
    : `${query} site:youtube.com`

  const startPublishedDate = end?.toISOString()
  const endPublishedDate = start?.toISOString()

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: enrichedQuery,
        numResults: maxResults,
        useAutoprompt: true,
        type: "auto",
        includeDomains,
        contents: {
          text: { maxCharacters: 3000 },
        },
        ...(startPublishedDate ? { startPublishedDate } : {}),
        ...(endPublishedDate ? { endPublishedDate } : {}),
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Exa/YouTube search failed: ${response.status} — ${errText}`)
      return []
    }

    const data = await response.json()
    if (!data.results?.length) return []

    return data.results
      .filter((r: { url: string }) => r.url.includes("youtube.com/watch"))
      .map((result: {
        url: string
        title: string
        text: string
        publishedDate: string
        author: string
        score: number
      }, index: number) => {
        // Extract video ID from URL for thumbnail
        const videoIdMatch = result.url.match(/[?&]v=([^&]+)/)
        const videoId = videoIdMatch?.[1] ?? ""

        // Try to identify the channel from the title/author
        const channelName = result.author
          || channelConfig.find(c =>
            result.title?.toLowerCase().includes(c.name.toLowerCase()) ||
            result.text?.toLowerCase().includes(c.name.toLowerCase())
          )?.name
          || "YouTube"

        return {
          id: `youtube-${videoId || index}-${Date.now()}`,
          sourceType: "youtube" as SourceType,
          source: channelName,
          title: result.title || "Untitled video",
          snippet: result.text?.slice(0, 500) || "",
          rawContent: result.text,
          url: result.url,
          publishedAt: result.publishedDate ? new Date(result.publishedDate) : null,
          engagement: 0,
          points: 0,
          comments: 0,
          author: channelName,
          thumbnail: videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : undefined,
          relevanceScore: result.score || 0.5,
          finalScore: 0,
        }
      })
  } catch (error) {
    console.error("YouTube/Exa fetch error:", error)
    return []
  }
}