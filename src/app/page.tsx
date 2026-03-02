"use client"

import * as React from "react"
import { SearchBar } from "@/components/SearchBar"
import { SourceFilter, type SourceFilters } from "@/components/SourceFilter"
import { ResultCard } from "@/components/ResultCard"
import { SynthesisPanel } from "@/components/SynthesisPanel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdvancedFilters } from "@/components/AdvancedFilters"
import { SearchResult, TimeRangeValue, SearchQuery } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { UserMenu } from "@/components/UserMenu"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export default function HomePage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [synthesis, setSynthesis] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [currentIntention, setCurrentIntention] = React.useState("")
  const [currentKeywords, setCurrentKeywords] = React.useState("")
  const [hasSearched, setHasSearched] = React.useState(false)

  const [filters, setFilters] = React.useState<SourceFilters>({
    exa: true,
    hackerNews: true,
    reddit: true,
    youtube: false,
    social: false,
  })

  const [timeRange, setTimeRange] = React.useState<TimeRangeValue>(["24h", "all"])

  const [specificSources, setSpecificSources] = React.useState<NonNullable<SearchQuery["specificSources"]>>({
    exaDomains: [...SEARCH_SOURCES.exaDomains],
    subreddits: [...SEARCH_SOURCES.subreddits],
    youtubeChannels: SEARCH_SOURCES.youtubeChannels.map((c) => c.id),
  })

  const [useSynonyms, setUseSynonyms] = React.useState(false)
  const [synthesisConfig, setSynthesisConfig] = React.useState<NonNullable<SearchQuery["synthesisConfig"]>>({
    enabled: true,
    format: "detailed",
    persona: "expert",
  })

  const handleSearch = async (intention: string, keywords: string) => {
    setIsLoading(true)
    setError(null)
    setResults([])
    setSynthesis("")
    setCurrentIntention(intention)
    setCurrentKeywords(keywords)
    setHasSearched(true)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intention,
          keywords,
          sources: filters,
          timeRange,
          specificSources,
          useSynonyms,
          synthesisConfig,
          maxResults: 10,
        }),
      })

      if (!response.ok) {
        let errorMsg = `Search failed (${response.status})`
        try {
          const errData = await response.json()
          errorMsg = errData.error || errorMsg
        } catch {
          if (response.statusText) errorMsg = `Search failed: ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      const contentType = response.headers.get("content-type")
      if (contentType?.includes("text/event-stream")) {
        const reader = response.body?.getReader()
        if (!reader) throw new Error("No reader available")

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmedLine.slice(6))

                switch (data.type) {
                  case "results":
                    setResults(data.data)
                    break
                  case "synthesis":
                    setSynthesis((prev) => prev + data.data)
                    break
                  case "complete":
                    setIsLoading(false)
                    break
                  case "error":
                    setError(data.data)
                    setIsLoading(false)
                    break
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        const data = await response.json()
        setResults(data.results || [])
        setSynthesis(data.synthesis || "")
        setIsLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("min-h-screen w-full flex flex-col bg-background bg-grid relative text-foreground", hasSearched ? "overflow-hidden" : "overflow-x-hidden overflow-y-auto custom-scrollbar")}>
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

        <div className="absolute top-6 right-6 z-50">
          <UserMenu />
        </div>

        <div className={cn("relative z-10 flex flex-col", hasSearched ? "h-screen" : "min-h-[100vh]")}>
          {/* Header */}
          <header className={cn("pt-6 pb-4 px-6 transition-opacity duration-500", hasSearched ? "opacity-100" : "opacity-0 invisible h-0 overflow-hidden")}>
            <div className="flex items-center gap-2 justify-center">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm tracking-wider text-gradient-primary">
                NEXUS
              </span>
            </div>
          </header>

          {/* Search Area */}
          <div
            className={cn(
              "transition-all duration-700 ease-out w-full mx-auto px-4 flex flex-col z-40",
              hasSearched ? "pt-4 pb-6 max-w-4xl" : "pt-[18vh] pb-12 max-w-6xl"
            )}
          >
            <div className={cn("text-center mb-8 transition-all duration-500", hasSearched && "hidden md:opacity-0 md:h-0 overflow-hidden mb-0")}>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gradient-accent">
                Intelligence Search
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Search across YouTube, Reddit, Blogs, X, and Hacker News — powered by AI
              </p>
            </div>

            <div className="w-full relative group">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              <div className="mt-5 flex justify-center w-full">
                <SourceFilter filters={filters} onFilterChange={setFilters} />
              </div>
              <div className={cn("mt-4 text-xs text-muted-foreground transition-all duration-500 w-full mx-auto",
                hasSearched ? "hidden" : "opacity-60 hover:opacity-100"
              )}>
                <AdvancedFilters
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  specificSources={specificSources}
                  onSpecificSourcesChange={setSpecificSources}
                  synthesisConfig={synthesisConfig}
                  onSynthesisConfigChange={setSynthesisConfig}
                  useSynonyms={useSynonyms}
                  onUseSynonymsChange={setUseSynonyms}
                />
              </div>
            </div>
          </div>

          {/* Results Area */}
          <main className={cn(
            "flex-1 flex overflow-hidden w-full max-w-[1600px] mx-auto transition-all duration-500",
            hasSearched ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
          )}>
            <div className="flex-1 flex w-full h-full overflow-hidden px-4 sm:px-6 pb-6 gap-6">

              {/* Left Pane: Synthesis */}
              <div className="w-full lg:w-[60%] flex flex-col overflow-hidden h-full">
                <SynthesisPanel synthesis={synthesis} isLoading={isLoading} />
              </div>

              {/* Right Pane: Timeline & Evidence Feed */}
              <div className="hidden lg:flex flex-col w-[40%] overflow-hidden h-full">
                <div className="bg-card/50 border border-border backdrop-blur-sm rounded-3xl p-6 h-full flex flex-col relative">
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-4 sticky top-0 flex items-center justify-between pb-2 z-10 border-b border-border/50">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Evidence Feed
                    </span>
                    {results.length > 0 && <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-mono">{results.length}</span>}
                  </h2>
                  <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2 pt-2 pb-12">
                    {results.length === 0 && isLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-32 rounded-xl bg-muted/30 animate-pulse border border-border/50"
                          />
                        ))}
                      </div>
                    ) : (
                      results.map((result, index) => (
                        <ResultCard key={result.id} result={result} index={index} />
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}