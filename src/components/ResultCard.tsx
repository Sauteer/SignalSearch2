"use client"

import * as React from "react"
import { ExternalLink, TrendingUp, Heart, Globe, Newspaper, MessageSquare, Youtube, Twitter, Bookmark, Expand, X } from "lucide-react"
import { SearchResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/AuthProvider"
import { createClient } from "@/lib/supabase-client"

interface ResultCardProps {
  result: SearchResult
  index: number
  className?: string
}

const sourceTypeColors = {
  exa: "source-blogs",
  hackernews: "source-hackernews",
  reddit: "source-reddit",
  youtube: "source-youtube",
  social: "source-twitter",
}

const SourceIcons = {
  exa: Globe,
  hackernews: Newspaper,
  reddit: MessageSquare,
  youtube: Youtube,
  social: Twitter,
}

export function ResultCard({ result, index, className }: ResultCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const { user } = useAuth()
  // Wait to initialize supabase so it does not crash on render during dev
  const supabase = React.useMemo(() => createClient(), [])

  const Icon = SourceIcons[result.sourceType] || Globe
  const colorClass = sourceTypeColors[result.sourceType]

  const highlightSnippet = (text: string, highlight?: string) => {
    if (!highlight) return text
    const idx = text.toLowerCase().indexOf(highlight.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded px-0.5">
          {text.slice(idx, idx + highlight.length)}
        </mark>
        {text.slice(idx + highlight.length)}
      </>
    )
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    setIsSaving(true)
    const { error } = await supabase
      .from('saved_sources')
      .insert({
        user_id: user.id,
        title: result.title,
        url: result.url,
        content: result.rawContent || result.snippet,
        metadata: {
          sourceType: result.sourceType,
          sourceName: result.source,
          score: result.finalScore
        }
      })

    setIsSaving(false)
    if (!error) setIsSaved(true)
  }

  return (
    <>
      <div
        className={cn(
          "group bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 animate-slide-up relative",
          className
        )}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Icon
                className="w-4 h-4 flex-shrink-0"
                style={{ color: `hsl(var(--${colorClass}))` }}
              />
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                {result.source}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">
                {result.publishedAt ? new Date(result.publishedAt).toLocaleDateString() : "Recent"}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono text-primary">
                  {(result.finalScore * 100).toFixed(0)}%
                </span>
                {user && (
                  <button
                    className={cn(
                      "ml-2 -mt-1 -mr-2 p-1 rounded-md transition-colors",
                      isSaved ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-primary"
                    )}
                    onClick={handleSave}
                    disabled={isSaving || isSaved}
                  >
                    <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors pr-8">
              {result.title}
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {highlightSnippet(result.snippet, result.title)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary border border-border/50"
          >
            {expanded ? <X className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            {expanded ? "Close Preview" : "Preview Content"}
          </button>

          {result.sourceType === "youtube" && (
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#FF0000] bg-[#FF0000]/10 px-2.5 py-1.5 rounded-lg border border-[#FF0000]/20 ml-2">
              <Youtube className="w-3.5 h-3.5" />
              Inside Transcript
            </span>
          )}

          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary ml-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit
          </a>

          {(result.engagement > 0 || result.points) && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-lg border border-border/50">
              {result.sourceType === "social" ? (
                <Heart className="w-3 h-3 text-red-400" />
              ) : (
                <TrendingUp className="w-3 h-3 text-primary" />
              )}
              {result.points ?? result.engagement}
              {result.comments ? ` · ${result.comments} c` : ''}
            </div>
          )}
        </div>

        {/* Expanded inline preview */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in bg-muted/10 -mx-5 -mb-5 p-5 rounded-b-xl overflow-hidden">
            <h4 className="text-sm font-bold text-foreground mb-2">Extended Context</h4>
            <div className="text-sm text-secondary-foreground leading-relaxed font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto custom-scrollbar pr-3">
              {result.rawContent ? highlightSnippet(result.rawContent, result.title) : highlightSnippet(result.snippet, result.title)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
