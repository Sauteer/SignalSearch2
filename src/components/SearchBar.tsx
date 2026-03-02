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
  const [query, setQuery] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      // Pass the entire query as intention. Features like synonyms or exact match can still be applied server-side.
      onSearch(query.trim(), "")
    }
  }

  // Keyboard shortcut for ⌘K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        document.getElementById("main-search-input")?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <form onSubmit={handleSubmit} className={cn("w-full relative z-50", className)}>
      <div className="relative group/search flex items-center">
        <Search className="absolute left-6 h-6 w-6 text-muted-foreground/50 transition-colors group-focus-within/search:text-primary" />
        <input
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask SignalSearch... (⌘K)"
          className="w-full h-16 pl-16 pr-12 rounded-2xl bg-muted/10 backdrop-blur-md border border-border/50 text-foreground text-[1.1rem] tracking-tight shadow-sm focus:bg-background focus:border-primary/40 focus:ring-4 focus:ring-primary/10 focus:shadow-xl transition-all outline-none placeholder:text-muted-foreground/40"
          disabled={isLoading}
          autoComplete="off"
          autoFocus
        />
        {isLoading ? (
          <Loader2 className="absolute right-6 h-5 w-5 animate-spin text-primary" />
        ) : (
          <div className="absolute right-5 h-7 px-2.5 flex items-center justify-center rounded-lg border border-border/40 bg-muted/20 text-xs font-mono font-medium text-muted-foreground/60 pointer-events-none opacity-0 group-focus-within/search:opacity-100 transition-opacity">
            ↵
          </div>
        )}
      </div>
    </form>
  )
}