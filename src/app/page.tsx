"use client"

import * as React from "react"
import { SearchBar } from "@/components/SearchBar"
import { SourceFilter, type SourceFilters } from "@/components/SourceFilter"
import { ResultCard } from "@/components/ResultCard"
import { SynthesisPanel } from "@/components/SynthesisPanel"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AdvancedFilters } from "@/components/AdvancedFilters"
import { SearchResult, TimeRange, TimeRangeValue, SearchQuery } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { UserMenu } from "@/components/UserMenu"

export default function HomePage() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [synthesis, setSynthesis] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [currentIntention, setCurrentIntention] = React.useState("")
  const [currentKeywords, setCurrentKeywords] = React.useState("")

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
          // If we can't parse the error as JSON, use the status text
          if (response.statusText) errorMsg = `Search failed: ${response.statusText}`
        }
        throw new Error(errorMsg)
      }

      // Check if response is a stream
      const contentType = response.headers.get("content-type")
      if (contentType?.includes("text/event-stream")) {
        // Handle streaming response
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
        // Handle JSON response (non-streaming fallback)
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
      <div className="h-screen w-full flex flex-col bg-background text-foreground overflow-hidden relative">
        <div className="absolute top-6 right-6 z-50">
          <UserMenu />
        </div>

        {/* Floating Global Command Bar Area */}
        <div className="absolute top-0 left-0 right-0 z-40 flex flex-col items-center pt-8 pointer-events-auto">
          <div className="w-full max-w-4xl px-4 flex flex-col items-center">
            {/* The Search interface is now absolute/floating at top center */}
            <div className="w-full relative group">
              {/* Optional backdrop blur behind search area */}
              <div className="absolute -inset-4 bg-background/50 backdrop-blur-md z-[-1] rounded-3xl group-focus-within:bg-background/80 transition-colors pointer-events-none" />
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              <div className="mt-4 flex justify-center w-full">
                <SourceFilter filters={filters} onFilterChange={setFilters} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground hidden group-focus-within:flex justify-center flex-wrap max-w-xl mx-auto opacity-50 hover:opacity-100 transition-opacity">
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
        </div>

        {/* Dual-Pane Workspace (Body) */}
        {/* We add top margin to account for the floating header. If there's no result, we center it. */}
        <main className="flex-1 flex overflow-hidden mt-40">
          {(!results.length && !synthesis && !isLoading) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground pb-20">
              <p className="text-xl">Press ⌘K to start discovery</p>
              <p className="text-sm mt-2">Try "RAG improvements" or "LLM benchmarks"</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden">
              {/* Left Pane: The Synthesis (The "Brain") 60% */}
              <div className="w-full lg:w-[60%] flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-border p-6 h-1/2 lg:h-full">
                <SynthesisPanel synthesis={synthesis} isLoading={isLoading} />
              </div>

              {/* Right Pane: The Source Feed (The "Evidence") 40% */}
              <div className="w-full lg:w-[40%] flex flex-col overflow-hidden bg-muted/5 h-1/2 lg:h-full relative">
                <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
                  <h2 className="text-sm font-medium text-muted-foreground mb-4 sticky top-0 bg-background/80 backdrop-blur pb-2 z-10 flex items-center justify-between">
                    <span>Evidence Feed</span>
                    {results.length > 0 && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{results.length}</span>}
                  </h2>
                  <div className="space-y-4">
                    {results.length === 0 && isLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-32 rounded-xl bg-muted animate-pulse"
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
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}