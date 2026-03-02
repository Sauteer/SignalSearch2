import { SearchResult, HNSearchResult, TimeRange, TimeRangeValue } from "../types";
import { SEARCH_SOURCES } from "@/config/sources.config";
import { getDateRange } from "../utils";

const HN_ALGOLIA_API = "https://hn.algolia.com/api/v1";

export async function searchHackerNews(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  customDateRange?: import("@/lib/types").CustomDateRange
): Promise<SearchResult[]> {
  try {
    const { minPoints } = SEARCH_SOURCES.hackerNews;
    const { start, end } = getDateRange(timeRange, customDateRange);

    let numericFilters = `points>=${minPoints}`;
    if (end) {
      numericFilters += `,created_at_i>=${Math.floor(end.getTime() / 1000)}`;
    }
    if (start) {
      numericFilters += `,created_at_i<=${Math.floor(start.getTime() / 1000)}`;
    }

    const searchUrl = new URL(`${HN_ALGOLIA_API}/search`);
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("tags", "story");
    searchUrl.searchParams.set("hitsPerPage", String(maxResults));
    searchUrl.searchParams.set("numericFilters", numericFilters);

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      console.error(`HN API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.hits || !Array.isArray(data.hits)) {
      return [];
    }

    return data.hits
      .filter((hit: HNSearchResult) => hit.title && (hit.url || hit.objectID))
      .map((hit: HNSearchResult) => {
        const snippetText = hit.story_text
          ? hit.story_text.replace(/<[^>]+>/g, '').slice(0, 400)
          : `Hacker News discussion with ${hit.points ?? 0} points and ${hit.num_comments ?? 0} comments. Posted by ${hit.author}.`;
        return {
          id: `hn-${hit.objectID}`,
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          snippet: snippetText,
          source: "Hacker News",
          sourceType: "hackernews" as const,
          publishedAt: hit.created_at ? new Date(hit.created_at) : null,
          engagement: (hit.points ?? 0) + (hit.num_comments ?? 0) * 2,
          relevanceScore: Math.min((hit.points ?? 0) / 300, 1),
          finalScore: 0,
          author: hit.author,
          points: hit.points,
          comments: hit.num_comments,
        };
      });
  } catch (error) {
    console.error("Hacker News search error:", error);
    return [];
  }
}

export async function searchHackerNewsByDate(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  customDateRange?: import("@/lib/types").CustomDateRange
): Promise<SearchResult[]> {
  try {
    const { minPoints } = SEARCH_SOURCES.hackerNews;
    const { start, end } = getDateRange(timeRange, customDateRange);

    let numericFilters = `points>=${minPoints}`;
    if (end) {
      numericFilters += `,created_at_i>=${Math.floor(end.getTime() / 1000)}`;
    }
    if (start) {
      numericFilters += `,created_at_i<=${Math.floor(start.getTime() / 1000)}`;
    }

    const searchUrl = new URL(`${HN_ALGOLIA_API}/search_by_date`);
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set("tags", "story");
    searchUrl.searchParams.set("hitsPerPage", String(maxResults));
    searchUrl.searchParams.set("numericFilters", numericFilters);

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      console.error(`HN API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.hits || !Array.isArray(data.hits)) {
      return [];
    }

    return data.hits
      .filter((hit: HNSearchResult) => hit.title && (hit.url || hit.objectID))
      .map((hit: HNSearchResult) => {
        const snippetText = hit.story_text
          ? hit.story_text.replace(/<[^>]+>/g, '').slice(0, 400)
          : `Hacker News discussion with ${hit.points ?? 0} points and ${hit.num_comments ?? 0} comments. Posted by ${hit.author}.`;
        return {
          id: `hn-${hit.objectID}`,
          title: hit.title,
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          snippet: snippetText,
          source: "Hacker News",
          sourceType: "hackernews" as const,
          publishedAt: hit.created_at ? new Date(hit.created_at) : null,
          engagement: (hit.points ?? 0) + (hit.num_comments ?? 0) * 2,
          relevanceScore: Math.min((hit.points ?? 0) / 300, 1),
          finalScore: 0,
          author: hit.author,
          points: hit.points,
          comments: hit.num_comments,
        };
      });
  } catch (error) {
    console.error("Hacker News search error:", error);
    return [];
  }
}