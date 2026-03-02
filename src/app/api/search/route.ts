import { NextRequest, NextResponse } from "next/server";
import { searchExa } from "@/lib/fetchers/exa";
import { searchHackerNews, searchHackerNewsByDate } from "@/lib/fetchers/hackernews";
import { searchReddit } from "@/lib/fetchers/reddit";
import { fetchYouTube } from "@/lib/fetchers/youtube";
import { fetchSocial } from "@/lib/fetchers/social";
import { synthesizeWithOpenRouterStream, generateSynonyms } from "@/lib/openrouter";
import { sortByScore } from "@/lib/scoring";
import { SearchResult, RawSignal, TimeRange, TimeRangeValue } from "@/lib/types";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchBody {
  intention: string;
  keywords: string;
  useSynonyms?: boolean;
  synthesisConfig?: {
    enabled: boolean;
    format: string;
    persona: string;
  };
  sources?: {
    exa?: boolean;
    hackerNews?: boolean;
    reddit?: boolean;
    youtube?: boolean;
    social?: boolean;
  };
  timeRange?: TimeRange | TimeRangeValue;
  specificSources?: {
    exaDomains?: string[];
    subreddits?: string[];
    youtubeChannels?: string[];
  };
  maxResults?: number;
  customDateRange?: import("@/lib/types").CustomDateRange;
}

export async function POST(request: NextRequest) {
  try {
    const body: SearchBody = await request.json();
    const { intention, keywords, sources, timeRange, specificSources, useSynonyms, synthesisConfig, maxResults = 10, customDateRange } = body;

    // We now require either an intention or keywords (or both)
    if (!intention?.trim() && !keywords?.trim()) {
      return NextResponse.json({ error: "Intention or Keywords required" }, { status: 400 });
    }

    // For APIs that need a single generic query string
    const fallbackQuery = intention?.trim() || keywords?.trim() || "";

    // Get user and profile from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let profile = null;

    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      profile = data;
    }

    // Default API keys from environment
    const exaApiKey = process.env.EXA_API_KEY;

    // User key overrides environment key if available
    const openRouterApiKey = profile?.openrouter_key || process.env.OPENROUTER_API_KEY;

    // Merge synthesis config with profile defaults
    const finalSynthesisConfig = {
      ...synthesisConfig,
      enabled: synthesisConfig?.enabled !== false,
      format: synthesisConfig?.format || "detailed",
      persona: synthesisConfig?.persona || "expert",
      model: profile?.selected_model || "openai/gpt-4o"
    };

    // Default all sources to true if not specified
    const enabledSources = {
      exa: sources?.exa !== false,
      hackerNews: sources?.hackerNews !== false,
      reddit: sources?.reddit !== false,
      youtube: sources?.youtube === true, // YouTube requires extra setup
      social: sources?.social === true, // Social requires extra setup
    };

    // Concurrent fan-out to all sources
    const searchPromises: Promise<SearchResult[] | RawSignal[]>[] = [];

    // Exa supports semantic search, so it shines with Intention. If no intention, use keywords.
    if (enabledSources.exa && exaApiKey) {
      searchPromises.push(searchExa(fallbackQuery, exaApiKey, maxResults, timeRange, specificSources?.exaDomains, customDateRange));
    }

    // Lexical (strict keyword) APIs. They perform poorly with full semantic sentences.
    let lexicalQuery = keywords?.trim() || intention?.trim() || "";

    // Conditionally generate synonyms for the Lexical APIs
    if (useSynonyms && openRouterApiKey && keywords?.trim()) {
      lexicalQuery = await generateSynonyms(keywords.trim(), intention?.trim() || "", openRouterApiKey);
    }

    if (enabledSources.hackerNews) {
      searchPromises.push(searchHackerNews(lexicalQuery, maxResults, timeRange, customDateRange));
      searchPromises.push(searchHackerNewsByDate(lexicalQuery, Math.ceil(maxResults / 2), timeRange, customDateRange));
    }

    if (enabledSources.reddit) {
      searchPromises.push(searchReddit(lexicalQuery, maxResults, timeRange, specificSources?.subreddits, customDateRange));
    }

    if (enabledSources.youtube) {
      searchPromises.push(fetchYouTube(lexicalQuery, maxResults, timeRange, specificSources?.youtubeChannels, customDateRange));
    }

    // Social works best with keywords too
    if (enabledSources.social) {
      searchPromises.push(fetchSocial(lexicalQuery, maxResults, timeRange, customDateRange));
    }

    // Wait for all searches with Promise.allSettled
    const results = await Promise.allSettled(searchPromises);

    // Helper to convert RawSignal to SearchResult
    const toSearchResult = (signal: RawSignal): SearchResult => ({
      ...signal,
      relevanceScore: 0.5, // Default, will be updated by sortByScore
      finalScore: 0, // Will be calculated by sortByScore
    });

    // Collect successful results
    const allResults: SearchResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        const items = result.value.map((item) =>
          'relevanceScore' in item ? item : toSearchResult(item)
        );
        allResults.push(...items);
      }
    }

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueResults = allResults.filter((result) => {
      if (seenUrls.has(result.url)) {
        return false;
      }
      seenUrls.add(result.url);
      return true;
    });

    // Sort by custom scoring algorithm
    const scoredResults = sortByScore(uniqueResults);
    // Take more results upfront (2x) to allow for relevance sorting, then cut down
    const topResults = scoredResults.slice(0, maxResults * 2).slice(0, maxResults);

    // Always use SSE streaming for consistent frontend handling
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial results so UI can render them immediately
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "results", data: topResults })}\n\n`)
        );

        // If no API key or synthesis disabled, just complete without synthesis
        if (!openRouterApiKey || finalSynthesisConfig.enabled === false) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
          );
          controller.close();
          return;
        }

        try {
          console.log(`Starting synthesis with model: ${finalSynthesisConfig.model}, query: ${fallbackQuery}`);
          for await (const chunk of synthesizeWithOpenRouterStream(
            topResults,
            fallbackQuery,
            openRouterApiKey,
            finalSynthesisConfig,
            finalSynthesisConfig.model
          )) {
            // JSON.stringify handles newline escaping automatically for SSE
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "synthesis", data: chunk })}\n\n`)
            );
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
          );
        } catch (synthesisError) {
          console.error("Synthesis error:", synthesisError);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "synthesis",
                data: `\n\n⚠️ Synthesis failed: ${synthesisError instanceof Error ? synthesisError.message : "Unknown error"}`
              })}\n\n`
            )
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`)
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// Non-streaming endpoint for simple queries
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const maxResults = parseInt(searchParams.get("maxResults") || "10", 10);

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Get API keys from environment
  const exaApiKey = process.env.EXA_API_KEY;

  // Concurrent fan-out to all sources
  const searchPromises: Promise<SearchResult[]>[] = [];

  if (exaApiKey) {
    searchPromises.push(searchExa(query, exaApiKey, maxResults));
  }

  searchPromises.push(searchHackerNews(query, maxResults));
  searchPromises.push(searchReddit(query, maxResults));

  const results = await Promise.allSettled(searchPromises);

  const allResults: SearchResult[] = [];
  for (const result of results) {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      allResults.push(...result.value);
    }
  }

  const seenUrls = new Set<string>();
  const uniqueResults = allResults.filter((result) => {
    if (seenUrls.has(result.url)) {
      return false;
    }
    seenUrls.add(result.url);
    return true;
  });

  const scoredResults = sortByScore(uniqueResults);
  const topResults = scoredResults.slice(0, maxResults);

  return NextResponse.json({
    results: topResults,
    query,
    timestamp: new Date(),
    totalResults: uniqueResults.length,
  });
}