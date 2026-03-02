"use client"

import * as React from "react"
import { ExternalLink, Clock, TrendingUp, ChevronDown, ChevronUp, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchResult } from "@/lib/types"
import { getRecencyLabel } from "@/lib/scoring"
import { cn } from "@/lib/utils"

interface ResultCardProps {
  result: SearchResult
  index: number
  className?: string
}

const sourceTypeColors = {
  exa: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  hackernews: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  reddit: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  youtube: "bg-red-500/10 text-red-400 border-red-500/20",
  social: "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

const sourceTypeLabels = {
  exa: "Blog",
  hackernews: "HN",
  reddit: "Reddit",
  youtube: "YouTube",
  social: "X",
}

export function ResultCard({ result, index, className }: ResultCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const recencyLabel = getRecencyLabel(result.publishedAt)

  return (
    <Card className={cn("group hover:border-primary/50 transition-colors", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Index number */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
            {index + 1}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title and source badge */}
            <div className="flex items-start gap-2 mb-1">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex-1"
              >
                {result.title}
              </a>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </div>

            {/* Snippet / Expanded Content */}
            {result.snippet && (
              <div className="mb-3">
                <p className={cn(
                  "text-xs text-muted-foreground",
                  !isExpanded && "line-clamp-2"
                )}>
                  {isExpanded && result.rawContent ? result.rawContent : result.snippet}
                </p>

                {(result.rawContent || result.snippet.length > 150) && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {/* Source badge */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded border text-[10px] font-medium",
                  sourceTypeColors[result.sourceType]
                )}
              >
                {sourceTypeLabels[result.sourceType]}
              </span>

              {/* Source domain */}
              <span className="truncate max-w-[120px]">{result.source}</span>

              {/* Recency */}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{recencyLabel}</span>
              </div>

              {/* Engagement */}
              {result.engagement > 0 && (
                <div className="flex items-center gap-1">
                  {result.sourceType === "social" ? (
                    <Heart className="h-3 w-3" />
                  ) : (
                    <TrendingUp className="h-3 w-3" />
                  )}
                  <span>
                    {result.points ?? result.engagement}
                    {result.comments && ` · ${result.comments} comments`}
                  </span>
                </div>
              )}

              {/* Score */}
              <div className="ml-auto flex items-center gap-1">
                <span className="text-primary font-medium">
                  {(result.finalScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}