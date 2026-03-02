"use client"

import * as React from "react"
import { Globe, MessageSquare, Newspaper, Youtube, Twitter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { cn } from "@/lib/utils"

export interface SourceFilters {
  exa: boolean
  hackerNews: boolean
  reddit: boolean
  youtube: boolean
  social: boolean
}

interface SourceFilterProps {
  filters: SourceFilters
  onFilterChange: (filters: SourceFilters) => void
}

const sources = [
  { id: "youtube" as const, label: "YouTube", icon: Youtube, colorClass: "source-youtube" },
  { id: "exa" as const, label: "Blogs", icon: Globe, colorClass: "source-blogs" },
  { id: "reddit" as const, label: "Reddit", icon: MessageSquare, colorClass: "source-reddit" },
  { id: "social" as const, label: "X/Twitter", icon: Twitter, colorClass: "source-twitter" },
  { id: "hackerNews" as const, label: "HN", icon: Newspaper, colorClass: "source-hackernews" },
] as const

export function SourceFilter({ filters, onFilterChange }: SourceFilterProps) {
  const onToggle = (id: keyof SourceFilters) => {
    onFilterChange({
      ...filters,
      [id]: !filters[id]
    })
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <TooltipProvider>
        {sources.map((source) => {
          const Icon = source.icon
          const active = filters[source.id]
          const colorName = source.colorClass.replace("source-", "")

          const buttonContent = (
            <button
              key={source.id}
              onClick={() => onToggle(source.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                active
                  ? "bg-primary/15 text-foreground border-primary/50 shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                  : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {source.label}
            </button>
          )

          if (source.id === "youtube") {
            return (
              <Tooltip key={source.id}>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs p-3">
                  <p className="font-semibold mb-1">Included Channels:</p>
                  <ul className="list-disc list-inside opacity-80">
                    {SEARCH_SOURCES.youtubeChannels.map((c) => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )
          }

          return <React.Fragment key={source.id}>{buttonContent}</React.Fragment>
        })}
      </TooltipProvider>
    </div>
  )
}