"use client"

import * as React from "react"
import { Globe, MessageSquare, Newspaper, Youtube, Twitter } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  { id: "exa" as const, label: "Blogs", icon: Globe },
  { id: "hackerNews" as const, label: "HN", icon: Newspaper },
  { id: "reddit" as const, label: "Reddit", icon: MessageSquare },
  { id: "youtube" as const, label: "YouTube", icon: Youtube },
  { id: "social" as const, label: "X/Twitter", icon: Twitter },
] as const

export function SourceFilter({ filters, onFilterChange }: SourceFilterProps) {
  const activeSources = sources
    .filter(({ id }) => filters[id])
    .map(({ id }) => id)

  const handleValueChange = (value: string[]) => {
    const newFilters: SourceFilters = {
      exa: false,
      hackerNews: false,
      reddit: false,
      youtube: false,
      social: false,
    }

    value.forEach((id) => {
      if (id in newFilters) {
        newFilters[id as keyof SourceFilters] = true
      }
    })

    onFilterChange(newFilters)
  }

  return (
    <div className="p-1 rounded-full bg-muted/20 border border-border/30 backdrop-blur-sm shadow-sm inline-flex">
      <ToggleGroup
        type="multiple"
        value={activeSources}
        onValueChange={handleValueChange}
        className="flex flex-wrap gap-1"
      >
        {sources.map(({ id, label, icon: Icon }) => {
          const content = (
            <ToggleGroupItem
              key={id}
              value={id}
              variant="outline"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-border",
                filters[id]
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground hover:bg-muted/30 border-transparent"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </ToggleGroupItem>
          );

          if (id === "youtube") {
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  {content}
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs text-xs p-3">
                  <p className="font-semibold mb-1">Included Channels:</p>
                  <ul className="list-disc list-inside opacity-80">
                    {SEARCH_SOURCES.youtubeChannels.map(c => (
                      <li key={c.id}>{c.name}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </ToggleGroup>
    </div>
  )
}