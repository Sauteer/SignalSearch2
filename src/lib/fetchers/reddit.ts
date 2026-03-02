import { SearchResult, RedditSearchResult, TimeRange, TimeRangeValue } from "../types";
import { SEARCH_SOURCES } from "@/config/sources.config";
import { getDateRange } from "../utils";

const REDDIT_API = "https://www.reddit.com";

export async function searchReddit(
  query: string,
  maxResults: number = 10,
  timeRange?: TimeRange | TimeRangeValue,
  specificSubreddits?: string[],
  customDateRange?: import("@/lib/types").CustomDateRange
): Promise<SearchResult[]> {
  try {
    const subreddits = specificSubreddits?.length ? specificSubreddits : SEARCH_SOURCES.subreddits;
    const allResults: SearchResult[] = [];

    // Parse the range
    const { start, end } = getDateRange(timeRange, customDateRange);

    // Determine the 't' parameter for Reddit based on the 'end' (the older bound)
    // We want to fetch enough to cover the window, then filter inside.
    let tParam = "month";
    if (Array.isArray(timeRange)) {
      const outer = timeRange[1];
      if (outer === "24h") tParam = "day";
      else if (outer === "week") tParam = "week";
      else if (outer === "month") tParam = "month";
      else if (outer === "year") tParam = "year";
      else if (outer === "all") tParam = "all";
    } else if (timeRange) {
      if (timeRange === "24h") tParam = "day";
      else if (timeRange === "week") tParam = "week";
      else if (timeRange === "month") tParam = "month";
      else if (timeRange === "year") tParam = "year";
      else if (timeRange === "all") tParam = "all";
    }

    // Search across configured subreddits
    for (const subreddit of subreddits.slice(0, 3)) { // Limit to 3 subreddits to avoid rate limiting
      try {
        const searchUrl = new URL(`${REDDIT_API}/r/${subreddit}/search.json`);
        searchUrl.searchParams.set("q", query);
        searchUrl.searchParams.set("restrict_sr", "1");
        searchUrl.searchParams.set("sort", "relevance");
        searchUrl.searchParams.set("limit", String(Math.ceil(maxResults / 1))); // Fetch more to allow for filtering
        searchUrl.searchParams.set("t", tParam);

        const response = await fetch(searchUrl.toString(), {
          headers: {
            "User-Agent": "SignalSearch/1.0",
          },
        });

        if (!response.ok) {
          console.warn(`Reddit API error for r/${subreddit}: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data.data?.children && Array.isArray(data.data.children)) {
          const results = data.data.children
            .map((child: { data: RedditSearchResult }) => child.data)
            .filter((post: RedditSearchResult) => {
              if (!post.title) return false;
              if (!start && !end) return true;

              const postDate = post.created_utc * 1000;
              // Must be OLDER than 'start' (the newer bound) and NEWER than 'end' (the older bound)
              if (start && postDate > start.getTime()) return false;
              if (end && postDate < end.getTime()) return false;

              return true;
            })
            .map((post: RedditSearchResult) => ({
              id: `reddit-${post.id}`,
              title: post.title,
              url: post.url.startsWith("/r/")
                ? `https://reddit.com${post.permalink}`
                : post.url,
              snippet: post.selftext?.slice(0, 300) || "",
              source: `r/${post.subreddit}`,
              sourceType: "reddit" as const,
              publishedAt: new Date(post.created_utc * 1000),
              engagement: post.score + post.num_comments * 3,
              relevanceScore: Math.min(post.score / 1000, 1),
              finalScore: 0,
              author: post.author,
              points: post.score,
              comments: post.num_comments,
            }));

          allResults.push(...results);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (subredditError) {
        console.warn(`Error searching r/${subreddit}:`, subredditError);
      }
    }

    // Sort by engagement and return top results
    return allResults
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, maxResults);
  } catch (error) {
    console.error("Reddit search error:", error);
    return [];
  }
}

export async function getRedditPostComments(
  subreddit: string,
  postId: string,
  maxComments: number = 5
): Promise<string[]> {
  try {
    const url = `${REDDIT_API}/r/${subreddit}/comments/${postId}.json?limit=${maxComments}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SignalSearch/1.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (Array.isArray(data) && data[1]?.data?.children) {
      return data[1].data.children
        .filter((child: { kind: string }) => child.kind === "t1")
        .map((child: { data: { body: string } }) => child.data.body)
        .filter((body: string) => body && body.length > 10)
        .slice(0, maxComments);
    }

    return [];
  } catch (error) {
    console.error("Error fetching Reddit comments:", error);
    return [];
  }
}