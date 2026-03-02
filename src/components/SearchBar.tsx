"use client"

import * as React from "react"
import { Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  onSearch: (intention: string, keywords: string) => void
  isLoading?: boolean
  className?: string
}

export function SearchBar({ onSearch, isLoading, className }: SearchBarProps) {
  const [intention, setIntention] = React.useState("")
  const [keywords, setKeywords] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((intention.trim() || keywords.trim()) && !isLoading) {
      onSearch(intention.trim(), keywords.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-3xl mx-auto space-y-3", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="Intention (e.g. 'Learn how to use RAG with live data feeds')"
          className="w-full h-14 pl-12 pr-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground outline-none transition-all"
          disabled={isLoading}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords (e.g. 'RAG PUBSUB')"
          className="w-full h-10 px-4 rounded-lg bg-muted/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || (!intention.trim() && !keywords.trim())}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>
    </form>
  )
}