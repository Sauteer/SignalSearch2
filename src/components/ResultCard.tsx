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

            <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors pr-8">
              {result.title}
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {highlightSnippet(result.snippet, result.title)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          >
            <Expand className="w-3 h-3" />
            Preview
          </button>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-secondary"
          >
            <ExternalLink className="w-3 h-3" />
            Visit
          </a>

          {(result.engagement > 0 || result.points) && (
            <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              {result.sourceType === "social" ? (
                <Heart className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {result.points ?? result.engagement}
              {result.comments && ` · ${result.comments} c`}
            </div>
          )}
        </div>
      </div>

      {/* Expanded preview overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-auto glow-primary relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon
                  className="w-5 h-5"
                  style={{ color: `hsl(var(--${colorClass}))` }}
                />
                <span className="text-sm font-mono text-muted-foreground">
                  {result.source}
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-semibold text-foreground mb-3 pr-8">
              {result.title}
            </h2>

            <div className="text-sm text-secondary-foreground leading-relaxed mb-4 font-mono">
              {result.rawContent ? highlightSnippet(result.rawContent, result.title) : highlightSnippet(result.snippet, result.title)}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {result.publishedAt ? new Date(result.publishedAt).toLocaleString() : "Recent"}
              </span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs font-mono text-primary">
                  {(result.finalScore * 100).toFixed(0)}% relevance
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Source
              </a>
              {user && (
                <button
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border",
                    isSaved ? "bg-primary/10 text-primary border-primary/20" : "bg-card text-foreground hover:bg-secondary border-border"
                  )}
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                >
                  <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                  {isSaved ? "Saved" : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}