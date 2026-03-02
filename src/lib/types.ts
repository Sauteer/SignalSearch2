export type SourceType = "exa" | "hackernews" | "reddit" | "youtube" | "social";

export interface RawSignal {
  id: string;
  sourceType: SourceType;
  source: string;
  title: string;
  snippet: string;
  rawContent?: string;
  url: string;
  publishedAt: Date | null;
  engagement: number;
  points?: number;
  comments?: number;
  author?: string;
  thumbnail?: string;
  transcript?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  sourceType: SourceType;
  publishedAt: Date | null;
  engagement: number;
  relevanceScore: number;
  finalScore: number;
  rawContent?: string;
  transcript?: string;
  author?: string;
  points?: number;
  comments?: number;
}

export type TimeRange = "24h" | "week" | "month" | "year" | "all";
export type TimeRangeValue = [TimeRange, TimeRange];

export interface CustomDateRange {
  unit: "days" | "weeks" | "months";
  value: [number, number];
}


export interface SearchQuery {
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
  maxResults?: number;
  timeRange?: TimeRange | TimeRangeValue;
  specificSources?: {
    exaDomains?: string[];
    subreddits?: string[];
    youtubeChannels?: string[];
  };
  dateRange?: {
    from: Date;
    to: Date;
  };
  customDateRange?: CustomDateRange;
}

export interface SearchResponse {
  results: SearchResult[];
  synthesis: string;
  query: string;
  timestamp: Date;
  totalResults: number;
}

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  text?: string;
}

export interface HNSearchResult {
  objectID: string;
  title: string;
  url: string;
  author: string;
  points: number;
  created_at: string;
  num_comments: number;
  story_text?: string;
}

export interface RedditSearchResult {
  id: string;
  title: string;
  url: string;
  selftext: string;
  author: string;
  score: number;
  created_utc: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
}