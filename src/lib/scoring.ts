import { SearchResult } from "./types";
import { SCORING_WEIGHTS, RECENCY_DECAY_LAMBDA, SOCIAL_SCORING } from "@/config/sources.config";

/**
 * Calculate hours since publication
 */
export function getHoursSincePublication(publishedAt: Date | string | null): number {
  if (!publishedAt) return 24 * 365; // Default to 1 year if no date
  const now = new Date();
  const pubDate = typeof publishedAt === 'string' ? new Date(publishedAt) : publishedAt;
  const diffMs = now.getTime() - pubDate.getTime();
  return Math.max(0, diffMs / (1000 * 60 * 60));
}

/**
 * Calculate recency score using exponential decay
 * Score = e^(-λ * Δt) capped at 0.95 so recency never fully dominates
 */
export function calculateRecencyScore(
  hoursSincePublication: number,
  isSocialSource: boolean = false
): number {
  const lambda = isSocialSource
    ? RECENCY_DECAY_LAMBDA * SOCIAL_SCORING.recencyDecayMultiplier
    : RECENCY_DECAY_LAMBDA;

  return Math.min(0.95, Math.exp(-lambda * hoursSincePublication));
}

/**
 * Calculate engagement score using logarithmic scaling
 */
export function calculateEngagementScore(
  engagement: number,
  isSocialSource: boolean = false
): number {
  const score = Math.log(engagement + 1);
  if (isSocialSource) {
    return score * SOCIAL_SCORING.engagementBoostMultiplier;
  }
  return score;
}

/**
 * Normalize a score to 0-1 range using min-max normalization
 */
export function normalizeScore(score: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (score - min) / (max - min)));
}

/**
 * Calculate keyword density score: how many query words appear in title + snippet.
 * Title matches are worth 2x snippet matches (more signal in title).
 * Returns a 0-1 score normalised against maxDensity across the result set.
 */
export function calculateKeywordDensity(
  result: SearchResult,
  queryWords: string[],
  maxDensity: number
): number {
  if (queryWords.length === 0 || maxDensity === 0) return 0;

  const titleLower = (result.title || "").toLowerCase();
  const snippetLower = (result.snippet || "").toLowerCase();

  let hits = 0;
  for (const word of queryWords) {
    const wordLower = word.toLowerCase();
    // Title hit = 2 points, snippet hit = 1 point
    if (titleLower.includes(wordLower)) hits += 2;
    if (snippetLower.includes(wordLower)) hits += 1;
  }

  // Normalise against max density seen across all results
  return Math.min(1, hits / maxDensity);
}

/**
 * Calculate final score using a 4-signal formula:
 *
 *   score = (keywordDensity × 0.45)
 *         + (normalisedRelevance × 0.25)
 *         + (recency × 0.20)
 *         + (normalisedEngagement × 0.10)
 *
 * Both relevance and engagement are normalised within their own source type
 * to prevent Exa's high cosine similarity from always outranking HN/Reddit.
 */
export function calculateFinalScore(
  result: SearchResult,
  allResults: SearchResult[],
  queryWords: string[],
  maxKeywordDensity: number,
  // Pre-computed per-source-type normalisation bounds
  relevanceBounds: Map<string, { min: number; max: number }>,
  engagementBounds: { min: number; max: number }
): number {
  const isSocialSource = result.sourceType === "social";

  // 1. Keyword density (primary signal)
  const kwDensity = calculateKeywordDensity(result, queryWords, maxKeywordDensity);

  // 2. Normalised relevance — within source type to equalise Exa vs HN vs Reddit
  const bounds = relevanceBounds.get(result.sourceType) ?? { min: 0, max: 1 };
  const normRelevance = normalizeScore(result.relevanceScore, bounds.min, bounds.max);

  // 3. Recency
  const hoursSincePub = getHoursSincePublication(result.publishedAt);
  const recencyScore = calculateRecencyScore(hoursSincePub, isSocialSource);

  // 4. Engagement (normalised across all sources)
  const engScore = calculateEngagementScore(result.engagement, isSocialSource);
  const normEngagement = normalizeScore(engScore, engagementBounds.min, engagementBounds.max);

  const finalScore =
    kwDensity * SCORING_WEIGHTS.keywordDensity +
    normRelevance * SCORING_WEIGHTS.relevance +
    recencyScore * SCORING_WEIGHTS.recency +
    normEngagement * SCORING_WEIGHTS.engagement;

  return Math.round(finalScore * 1000) / 1000;
}

/**
 * Sort results by final score in descending order.
 * Accepts an optional query string to compute keyword density.
 */
export function sortByScore(results: SearchResult[], query?: string): SearchResult[] {
  if (results.length === 0) return [];

  // Parse query words (>= 2 chars, alphanumeric only)
  const queryWords = (query || "")
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(w => w.length >= 2);

  // Pre-compute max keyword density across all results
  const densities = results.map(r => {
    let hits = 0;
    const titleLower = (r.title || "").toLowerCase();
    const snippetLower = (r.snippet || "").toLowerCase();
    for (const word of queryWords) {
      const wl = word.toLowerCase();
      if (titleLower.includes(wl)) hits += 2;
      if (snippetLower.includes(wl)) hits += 1;
    }
    return hits;
  });
  const maxDensity = Math.max(...densities, 1);

  // Pre-compute relevance bounds per source type
  const relevanceBounds = new Map<string, { min: number; max: number }>();
  const sourceTypes = [...new Set(results.map(r => r.sourceType))];
  for (const st of sourceTypes) {
    const scores = results.filter(r => r.sourceType === st).map(r => r.relevanceScore);
    relevanceBounds.set(st, {
      min: Math.min(...scores),
      max: Math.max(...scores),
    });
  }

  // Pre-compute global engagement bounds
  const engScores = results.map(r =>
    calculateEngagementScore(r.engagement, r.sourceType === "social")
  );
  const engagementBounds = {
    min: Math.min(...engScores),
    max: Math.max(...engScores),
  };

  const resultsWithScores = results.map(result => ({
    ...result,
    calculatedScore: calculateFinalScore(
      result,
      results,
      queryWords,
      maxDensity,
      relevanceBounds,
      engagementBounds
    ),
  }));

  resultsWithScores.sort((a, b) => b.calculatedScore - a.calculatedScore);

  return resultsWithScores.map(({ calculatedScore, ...rest }) => ({
    ...rest,
    finalScore: calculatedScore,
  }));
}

/**
 * Get a human-readable recency label
 */
export function getRecencyLabel(publishedAt: Date | string | null): string {
  if (!publishedAt) return "Unknown";

  const hours = getHoursSincePublication(publishedAt);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  if (hours < 48) return "Yesterday";
  if (hours < 168) return `${Math.floor(hours / 24)}d ago`;
  if (hours < 720) return `${Math.floor(hours / 168)}w ago`;
  return `${Math.floor(hours / 720)}mo ago`;
}

/**
 * Get engagement label based on type
 */
export function getEngagementLabel(result: SearchResult): string {
  switch (result.sourceType) {
    case "hackernews":
      return `${result.points ?? 0} pts`;
    case "reddit":
      return `${result.engagement} upvotes`;
    case "social":
      return `${result.engagement} likes`;
    default:
      return `${result.engagement} engagement`;
  }
}