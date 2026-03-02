import { SearchResult, ExaSearchResult, TimeRange, TimeRangeValue } from "../types";
import { SEARCH_SOURCES } from "@/config/sources.config";
import { getDateRange } from "../utils";

const EXA_API_URL = "https://api.exa.ai/search";

export async function searchExa(
  query: string,
  apiKey: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  specificDomains?: string[]
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn("Exa API key not configured, skipping Exa search");
    return [];
  }

  const { start, end } = getDateRange(timeRange);
  const startPublishedDate = end?.toISOString();
  const endPublishedDate = start?.toISOString();

  const includeDomains = specificDomains?.length ? specificDomains : SEARCH_SOURCES.exaDomains;

  try {
    const response = await fetch(EXA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        numResults: maxResults,
        useAutoprompt: true,
        type: "auto",
        contents: {
          text: {
            maxCharacters: 2000,
          },
        },
        includeDomains,
        ...(startPublishedDate ? { startPublishedDate } : {}),
        ...(endPublishedDate ? { endPublishedDate } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Exa API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((result: ExaSearchResult, index: number) => ({
      id: `exa-${index}-${Date.now()}`,
      title: result.title || "Untitled",
      url: result.url,
      snippet: result.text?.slice(0, 300) || "",
      source: new URL(result.url).hostname,
      sourceType: "exa" as const,
      publishedAt: result.publishedDate ? new Date(result.publishedDate) : null,
      engagement: 0, // Exa doesn't provide engagement metrics
      relevanceScore: result.score || 0.5,
      finalScore: 0,
      rawContent: result.text,
      author: result.author,
    }));
  } catch (error) {
    console.error("Exa search error:", error);
    return [];
  }
}