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
  const [focused, setFocused] = React.useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), "")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
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
    <div
      className={cn(
        "relative w-full max-w-3xl mx-auto transition-all duration-500 rounded-2xl",
        focused ? "glow-primary-strong" : "glow-primary",
        className
      )}
    >
      <div className="relative flex items-center bg-card border border-border rounded-2xl overflow-hidden">
        <Search className="absolute left-5 w-5 h-5 text-primary" />
        <input
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search across intelligence sources... (⌘K)"
          className="w-full bg-transparent py-4 pl-14 pr-28 text-foreground placeholder:text-muted-foreground font-mono text-sm focus:outline-none"
          disabled={isLoading}
          autoComplete="off"
          autoFocus
        />

        {isLoading ? (
          <div className="absolute right-5 px-5 py-2 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <button
            onClick={() => handleSubmit()}
            className="absolute right-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Search
          </button>
        )}
      </div>
    </div>
  )
}