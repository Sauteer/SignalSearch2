"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

interface SynthesisPanelProps {
  synthesis: string
  isLoading: boolean
  className?: string
  onCitationHover?: (citationId: string | null) => void
}

export function SynthesisPanel({ synthesis, isLoading, className, onCitationHover }: SynthesisPanelProps) {
  return (
    <div className={cn("h-full flex flex-col relative w-full", className)}>
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 flex flex-col h-full glow-primary animate-slide-up relative overflow-hidden">

        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-3 text-gradient-primary uppercase">
            <Zap className="w-5 h-5 text-primary" />
            AI Synthesis
            {isLoading && (
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-12 text-sm sm:text-base leading-relaxed relative z-10">
          {isLoading && !synthesis ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted/60 rounded animate-pulse w-full" />
              <div className="h-4 bg-muted/60 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-muted/60 rounded animate-pulse w-4/6" />
              <div className="h-4 bg-muted/60 rounded animate-pulse w-full" />
              <div className="h-4 bg-muted/60 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <div className="prose prose-sm sm:prose-base prose-p:leading-relaxed prose-li:leading-relaxed text-foreground/90 max-w-none">
              {synthesis.split("\n").map((line, i) => {
                if (line.startsWith("### ")) {
                  return <h3 key={i} className="text-lg font-semibold mt-6 mb-3 text-foreground">{line.replace("### ", "")}</h3>
                }
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-gradient-accent">{line.replace("## ", "")}</h2>
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={i} className="ml-4 mb-2 pl-2">
                      <RenderMarkdown text={line.substring(2)} onHover={onCitationHover} />
                    </li>
                  )
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <li key={i} className="ml-4 mb-2 pl-2 list-decimal">
                      <RenderMarkdown text={line.replace(/^\d+\.\s/, "")} onHover={onCitationHover} />
                    </li>
                  )
                }
                if (!line.trim()) {
                  return <div key={i} className="h-4" />
                }
                return (
                  <p key={i} className="mb-4">
                    <RenderMarkdown text={line} onHover={onCitationHover} />
                  </p>
                )
              })}

              {/* The Typewriter Cursor */}
              {isLoading && synthesis.length > 0 && (
                <span className="inline-block w-2.5 h-5 ml-1 bg-primary align-middle animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RenderMarkdown({ text, onHover }: { text: string, onHover?: (id: string | null) => void }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[\d+\])/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-semibold text-foreground/100">{part.slice(2, -2)}</strong>
        }
        if (/^\[\d+\]$/.test(part)) {
          const id = part.replace(/[\[\]]/g, "")
          return (
            <sup
              key={i}
              className="text-primary font-bold cursor-pointer hover:underline px-0.5 glow-text"
              onMouseEnter={() => onHover?.(id)}
              onMouseLeave={() => onHover?.(null)}
            >
              {part}
            </sup>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}