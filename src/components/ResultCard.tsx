"use client"

import * as React from "react"
import { ExternalLink, Clock, TrendingUp, ChevronDown, ChevronUp, Heart, Globe, Newspaper, MessageSquare, Youtube, Twitter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  exa: "text-blue-400 bg-blue-500/10",
  hackernews: "text-orange-400 bg-orange-500/10",
  reddit: "text-purple-400 bg-purple-500/10",
  youtube: "text-red-400 bg-red-500/10",
  social: "text-sky-400 bg-sky-500/10",
}

const SourceIcons = {
  exa: Globe,
  hackernews: Newspaper,
  reddit: MessageSquare,
  youtube: Youtube,
  social: Twitter,
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
  const Icon = SourceIcons[result.sourceType]

  return (
    <Card className={cn("group transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/60 border-border bg-card shadow-none hover:shadow-lg hover:shadow-primary/5", className)}>
      <CardContent className="p-5 flex flex-col gap-3">
        {/* Top Header: Source Icon & Title */}
        <div className="flex items-start gap-4">
          <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border border-border/50", sourceTypeColors[result.sourceType])}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.95rem] leading-tight font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 pr-4 relative"
            >
              {result.title}
              <ExternalLink className="absolute -right-2 top-0.5 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[80%]">
              {result.source}
            </div>
          </div>
        </div>

        {/* Snippet / Expanded Content */}
        {result.snippet && (
          <div className="mt-1">
            <p className={cn(
              "text-sm text-foreground/80 leading-relaxed font-mono tracking-tight",
              !isExpanded && "line-clamp-2"
            )}>
              {isExpanded && result.rawContent ? result.rawContent : result.snippet}
            </p>

            {(result.rawContent || result.snippet.length > 150) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Hide Transcript
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show Transcript
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Bottom Metadata Badges */}
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/50 overflow-x-auto custom-scrollbar pb-1">
          <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] text-muted-foreground bg-muted/50 border-transparent">
            <Clock className="w-3 h-3" />
            {recencyLabel}
          </Badge>

          {result.engagement > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] text-muted-foreground bg-muted/50 border-transparent">
              {result.sourceType === "social" ? (
                <Heart className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {result.points ?? result.engagement}
              {result.comments && ` · ${result.comments} c`}
            </Badge>
          )}

          <Badge variant="outline" className="ml-auto whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-[10px] font-bold text-primary border-primary/30 bg-primary/5">
            {(result.finalScore * 100).toFixed(0)}/100
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}