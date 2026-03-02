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
  searchQuery?: string
}

const SourceIcons = {
  exa: Globe,
  hackernews: Newspaper,
  reddit: MessageSquare,
  youtube: Youtube,
  social: Twitter,
}

export function ResultCard({ result, index, className, searchQuery }: ResultCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const { user } = useAuth()
  // Wait to initialize supabase so it does not crash on render during dev
  const supabase = React.useMemo(() => createClient(), [])

  const Icon = SourceIcons[result.sourceType] || Globe

  const highlightSnippet = (text: string, highlight?: string): React.ReactNode => {
    if (!text) return <span className="text-muted-foreground italic text-xs">No preview available.</span>
    const targetWords = highlight?.trim()
    // Only highlight when we actually have a search query — don't fall back to title
    if (!targetWords) return <>{text}</>

    // Escape regex special chars and extract words >= 2 chars
    const words = targetWords
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(w => w.length >= 2)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

    if (words.length === 0) return <>{text}</>

    const regex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi')
    const parts = text.split(regex)

    return (
      <>
        {parts
          .filter(part => part !== undefined && part !== null)
          .map((part, i) => {
            if (!part) return null
            if (i % 2 !== 0) {
              return (
                <mark key={i} className="kw-highlight">
                  {part}
                </mark>
              )
            }
            return part.length > 0 ? <React.Fragment key={i}>{part}</React.Fragment> : null
          })}
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
                className="w-4 h-4 flex-shrink-0 text-primary"
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
              {highlightSnippet(result.snippet, searchQuery)}
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
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20 ml-2">
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
                <Heart className="w-3 h-3 text-primary" />
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
              {result.rawContent
                ? highlightSnippet(result.rawContent, searchQuery)
                : highlightSnippet(result.snippet, searchQuery)}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
