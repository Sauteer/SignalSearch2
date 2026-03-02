import { SearchResult, ExaSearchResult, TimeRange } from "../types";
import { SEARCH_SOURCES } from "@/config/sources.config";

const EXA_API_URL = "https://api.exa.ai/search";

export async function searchExa(
  query: string,
  apiKey: string,
  maxResults: number = 10,
  timeRange?: TimeRange,
  specificDomains?: string[]
): Promise<SearchResult[]> {
  if (!apiKey) {
    console.warn("Exa API key not configured, skipping Exa search");
    return [];
  }

  let startPublishedDate: string | undefined;
  if (timeRange && timeRange !== "all") {
    const now = new Date();
    switch (timeRange) {
      case "24h":
        now.setHours(now.getHours() - 24);
        break;
      case "week":
        now.setDate(now.getDate() - 7);
        break;
      case "month":
        now.setMonth(now.getMonth() - 1);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    startPublishedDate = now.toISOString();
  }

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