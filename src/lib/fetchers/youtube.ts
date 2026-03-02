import { RawSignal, SourceType, TimeRange, TimeRangeValue } from "../types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { getDateRange } from "../utils"
import { YoutubeTranscript } from "youtube-transcript"

interface RSSEntry {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  publishedAt: Date
  url: string
}

/**
 * Fetch recent video IDs from a YouTube channel using the public RSS feed.
 * No API key required. Returns up to 15 most recent videos per channel.
 */
async function fetchChannelVideoIds(channelId: string): Promise<RSSEntry[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const response = await fetch(rssUrl, {
      headers: { "Accept": "application/rss+xml, application/xml, text/xml" },
      // RSS feeds are lightweight; 10 second timeout
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) return []

    const xml = await response.text()

    // Parse entries from Atom XML (YouTube uses Atom, not RSS)
    const entries: RSSEntry[] = []
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
    let match

    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1]
      const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/)
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
      const publishedMatch = entry.match(/<published>([\s\S]*?)<\/published>/)
      const channelTitleMatch = xml.match(/<author>\s*<name>([\s\S]*?)<\/name>/)

      if (videoIdMatch && titleMatch && publishedMatch) {
        const videoId = videoIdMatch[1].trim()
        const title = titleMatch[1].trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
        const publishedAt = new Date(publishedMatch[1].trim())
        const channelTitle = channelTitleMatch
          ? channelTitleMatch[1].trim().replace(/&amp;/g, '&')
          : channelId

        entries.push({
          videoId,
          title,
          channelTitle,
          channelId,
          publishedAt,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        })
      }
    }

    return entries
  } catch {
    return []
  }
}

/**
 * Fetch transcript for a video and find keyword matches.
 * Returns a highlighted excerpt where keywords are found, or null if no match.
 */
async function searchTranscript(
  videoId: string,
  queryWords: string[]
): Promise<{ snippet: string; fullTranscript: string } | null> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "en",
    })

    if (!transcript || transcript.length === 0) return null

    // Join all transcript segments into full text
    const fullText = transcript.map(seg => seg.text).join(" ")
      .replace(/\s+/g, " ")
      .trim()

    // Check if any query words appear in the transcript
    const lowerText = fullText.toLowerCase()
    const hasMatch = queryWords.some(word => lowerText.includes(word.toLowerCase()))
    if (!hasMatch) return null

    // Find the best excerpt: longest contiguous segment containing most query words
    const words = fullText.split(" ")
    const WINDOW = 80 // words in the excerpt window
    let bestStart = 0
    let bestScore = 0

    for (let i = 0; i < words.length - WINDOW; i += 10) {
      const window = words.slice(i, i + WINDOW).join(" ").toLowerCase()
      const score = queryWords.filter(w => window.includes(w.toLowerCase())).length
      if (score > bestScore) {
        bestScore = score
        bestStart = i
      }
    }

    if (bestScore === 0) return null

    // Build the excerpt with some context
    const excerptWords = words.slice(Math.max(0, bestStart - 5), bestStart + WINDOW + 5)
    const snippet = (bestStart > 0 ? "…" : "") + excerptWords.join(" ") + (bestStart + WINDOW < words.length ? "…" : "")

    return {
      snippet: snippet.slice(0, 500),
      fullTranscript: fullText.slice(0, 8000),
    }
  } catch {
    // Transcripts not available for all videos (disabled, private, etc.)
    return null
  }
}

export async function fetchYouTube(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  specificChannels?: string[],
  customDateRange?: import("@/lib/types").CustomDateRange
): Promise<RawSignal[]> {
  const queryWords = query
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(w => w.length >= 2)

  if (queryWords.length === 0) return []

  const { end: oldestDate } = getDateRange(timeRange, customDateRange)

  // Get list of channels to search
  const activeChannelIds = specificChannels?.length
    ? specificChannels
    : SEARCH_SOURCES.youtubeChannels.map(c => c.id)

  // Fetch recent videos from all channels in parallel (RSS, no API key)
  const channelResults = await Promise.allSettled(
    activeChannelIds.map(id => fetchChannelVideoIds(id))
  )

  // Flatten and filter by date range
  let allVideos: RSSEntry[] = []
  for (const result of channelResults) {
    if (result.status === "fulfilled") {
      allVideos.push(...result.value)
    }
  }

  // Apply date filter
  if (oldestDate) {
    allVideos = allVideos.filter(v => v.publishedAt >= oldestDate)
  }

  // Sort by newest first
  allVideos.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())

  // First pass: score videos by title keyword match to prioritise which to transcribe
  const scoredVideos = allVideos.map(video => {
    const titleLower = video.title.toLowerCase()
    const titleScore = queryWords.filter(w => titleLower.includes(w.toLowerCase())).length
    return { ...video, titleScore }
  })

  // Sort: title matches first so we get best candidates early
  scoredVideos.sort((a, b) => b.titleScore - a.titleScore || b.publishedAt.getTime() - a.publishedAt.getTime())

  // Fetch transcripts concurrently (cap at 20 videos to avoid timeout)
  const candidateVideos = scoredVideos.slice(0, 20)

  const transcriptResults = await Promise.allSettled(
    candidateVideos.map(async (video) => {
      const transcriptMatch = await searchTranscript(video.videoId, queryWords)
      return { video, transcriptMatch }
    })
  )

  const signals: RawSignal[] = []

  for (const result of transcriptResults) {
    if (result.status !== "fulfilled") continue
    const { video, transcriptMatch } = result.value

    // Include videos where either title matches or transcript matches
    const titleMatch = queryWords.some(w =>
      video.title.toLowerCase().includes(w.toLowerCase())
    )

    if (!transcriptMatch && !titleMatch) continue

    signals.push({
      id: `youtube-${video.videoId}`,
      sourceType: "youtube" as SourceType,
      source: video.channelTitle,
      title: video.title,
      snippet: transcriptMatch?.snippet || `No transcript available. Matched by title.`,
      rawContent: transcriptMatch?.fullTranscript,
      url: video.url,
      publishedAt: video.publishedAt,
      engagement: 0,
      points: 0,
      comments: 0,
      author: video.channelTitle,
      transcript: transcriptMatch?.fullTranscript,
    })

    if (signals.length >= maxResults) break
  }

  return signals
}