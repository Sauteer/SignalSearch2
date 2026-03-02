export const SEARCH_SOURCES = {
  exaDomains: [
    "simonwillison.net",
    "latent.space",
    "anthropic.com/news",
    "openai.com/blog",
    "deepmind.com/blog",
    "ai.googleblog.com",
    "huggingface.co/blog",
    "blog.cohere.com",
    "scale.com/blog",
    "mistral.ai/news",
    "stability.ai/news",
    "inflection.ai/news",
    "character.ai/blog",
    "smol.ai",
    "thezvi.wordpress.com",
    "bigtechnology.com",
    "stratechery.com",
    "bensmith.substack.com",
    "garymarcus.substack.com",
  ],
  subreddits: ["LocalLLM", "MachineLearning", "ArtificialInteligence", "OpenAI", "ChatGPT", "ClaudeAI"],
  youtubeChannels: [
    { id: "UCv83tO5ceSyJDSZL", name: "AI Explained" },
    { id: "UCSHZKyawb77iyD7pPg4xNVg", name: "Andrej Karpathy" },
    { id: "UC9HBaENPPw44Ym7L8P6eKAQ", name: "Redpoint Ventures" },
    { id: "UCsBK2objvKWOmRgdZK-bevg", name: "Cognitive Revolution" },
    { id: "UC0s7HV4GF-8ly1Nu3TOo4Vg", name: "Yannic Kilcher" },
    { id: "UCL5EUbZTHLoE1vlwUmcJf7g", name: "Two Minute Papers" },
  ],
  hackerNews: {
    minPoints: 10,
    maxAgeDays: 90,
  },
} as const;

export type SourceHandler = "transcriber" | "deep-text" | "social" | "community";

export interface SourceConfig {
  type: SourceHandler;
  sources: string[];
  tooling: string;
}

export const SOURCE_HANDLERS: Record<SourceHandler, SourceConfig> = {
  transcriber: {
    type: "transcriber",
    sources: ["YouTube Channels (Redpoint, AI Explained, etc.)"],
    tooling: "youtube-transcript-api",
  },
  "deep-text": {
    type: "deep-text",
    sources: ["Simon Willison", "The Zvi", "Smol.ai", "Big Technology"],
    tooling: "Exa API (Text Mode)",
  },
  social: {
    type: "social",
    sources: ["X.com / Following"],
    tooling: "SocialData.tools API",
  },
  community: {
    type: "community",
    sources: ["Hacker News", "Reddit"],
    tooling: "Algolia HN API / Reddit API",
  },
};

// Scoring weights for the 4-signal ranking algorithm
export const SCORING_WEIGHTS = {
  keywordDensity: 0.45, // How many query words appear in title+snippet (primary signal)
  relevance: 0.25,     // Source API relevance score, normalised per source type
  recency: 0.20,       // Exponential decay from publication date
  engagement: 0.10,    // Upvotes/points/likes, log-scaled and normalised
} as const;

// Recency decay lambda (lower = slower decay so old relevant content still surfaces)
export const RECENCY_DECAY_LAMBDA = 0.003; // per hour

// Social-specific scoring adjustments
export const SOCIAL_SCORING = {
  recencyDecayMultiplier: 1.5, // Social content decays faster
  engagementBoostMultiplier: 1.3, // But viral content gets more boost
} as const;