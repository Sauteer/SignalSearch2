import { RawSignal, SourceType, TimeRange, TimeRangeValue } from "../types"
import { getDateRange } from "../utils"

interface ExaTweetResult {
  title: string
  url: string
  publishedDate?: string
  author?: string
  score?: number
  text?: string
}

export async function fetchSocial(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue
): Promise<RawSignal[]> {
  const exaApiKey = process.env.EXA_API_KEY

  if (!exaApiKey) {
    console.warn("Exa API key not configured, skipping social fetch")
    return []
  }

  const { start, end } = getDateRange(timeRange);
  const startPublishedDate = end?.toISOString();
  const endPublishedDate = start?.toISOString();

  try {
    // Use Exa to search X/Twitter with site filter
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": exaApiKey,
      },
      body: JSON.stringify({
        query: `${query} site:x.com OR site:twitter.com`,
        numResults: maxResults,
        useAutoprompt: true,
        contents: {
          text: {
            maxCharacters: 1000,
          },
        },
        ...(startPublishedDate ? { startPublishedDate } : {}),
        ...(endPublishedDate ? { endPublishedDate } : {}),
      }),
    })

    if (!response.ok) {
      console.error(
        `Social search failed: ${response.status} ${response.statusText}`
      )
      return []
    }

    const data = await response.json()
    const results: ExaTweetResult[] = data.results || []

    // Convert to RawSignals
    const signals: RawSignal[] = results.map((tweet, index) => {
      // Extract username from URL or author field
      let username = "unknown"
      const urlMatch = tweet.url.match(/(?:x|twitter)\.com\/([^\/]+)/)
      if (urlMatch) {
        username = urlMatch[1]
      } else if (tweet.author) {
        username = tweet.author
      }

      return {
        id: `social-${index}-${Date.now()}`,
        sourceType: "social" as SourceType,
        source: `@${username}`,
        title: tweet.title || tweet.text?.slice(0, 100) || "Social post",
        snippet: tweet.text?.slice(0, 280) || tweet.title || "",
        rawContent: tweet.text,
        url: tweet.url,
        publishedAt: tweet.publishedDate ? new Date(tweet.publishedDate) : null,
        engagement: tweet.score ? Math.round(tweet.score * 1000) : 0,
        author: username,
      }
    })

    return signals
  } catch (error) {
    console.error("Social fetch error:", error)
    return []
  }
}