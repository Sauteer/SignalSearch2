"use client"

import * as React from "react"
import { SearchQuery, TimeRange } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { Checkbox } from "./ui/checkbox"
import { cn } from "@/lib/utils"

interface AdvancedFiltersProps {
    timeRange: TimeRange;
    onTimeRangeChange: (value: TimeRange) => void;
    specificSources: NonNullable<SearchQuery["specificSources"]>;
    onSpecificSourcesChange: (sources: NonNullable<SearchQuery["specificSources"]>) => void;
    synthesisConfig: NonNullable<SearchQuery["synthesisConfig"]>;
    onSynthesisConfigChange: (config: NonNullable<SearchQuery["synthesisConfig"]>) => void;
    useSynonyms: boolean;
    onUseSynonymsChange: (useSynonyms: boolean) => void;
}

const TIME_RANGE_MAP: { label: string; value: TimeRange }[] = [
    { label: "24h", value: "24h" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
    { label: "All", value: "all" },
]

export function AdvancedFilters({
    timeRange,
    onTimeRangeChange,
    specificSources,
    onSpecificSourcesChange,
    synthesisConfig,
    onSynthesisConfigChange,
    useSynonyms,
    onUseSynonymsChange,
}: AdvancedFiltersProps) {
    const handleToggle = (
        category: keyof typeof specificSources,
        item: string,
        checked: boolean
    ) => {
        const currentList = specificSources[category] || []
        let newList = currentList

        if (checked) {
            if (!currentList.includes(item)) newList = [...currentList, item]
        } else {
            newList = currentList.filter(i => i !== item)
        }

        onSpecificSourcesChange({
            ...specificSources,
            [category]: newList
        })
    }

    const handleSelectAll = (category: keyof typeof specificSources, selectAll: boolean) => {
        let allItems: string[] = []

        if (category === "exaDomains") allItems = [...SEARCH_SOURCES.exaDomains]
        if (category === "subreddits") allItems = [...SEARCH_SOURCES.subreddits]
        if (category === "youtubeChannels") allItems = SEARCH_SOURCES.youtubeChannels.map((c) => c.id)

        onSpecificSourcesChange({
            ...specificSources,
            [category]: selectAll ? allItems : []
        })
    }

    // Helper to get time range index for slider
    const timeIndex = TIME_RANGE_MAP.findIndex(t => t.value === timeRange)

    const activeYoutubeNames = SEARCH_SOURCES.youtubeChannels
        .filter(c => specificSources.youtubeChannels?.includes(c.id))
        .map(c => c.name)

    return (
        <Accordion type="single" collapsible className="w-full bg-muted/20 border border-border rounded-lg mt-3 px-4 shadow-sm">
            <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="py-3 text-sm font-medium text-muted-foreground hover:no-underline hover:text-foreground">
                    Advanced Search Controls
                </AccordionTrigger>
                <AccordionContent className="pb-6 space-y-8">

                    {/* AI Settings Section */}
                    <div className="space-y-4 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">AI Synthesis Engine</h4>
                            <label className="flex items-center space-x-2 cursor-pointer bg-accent/30 px-3 py-1.5 rounded-full border border-border/50">
                                <span className="text-xs font-medium text-foreground">Synthesis Mode</span>
                                <Checkbox
                                    checked={synthesisConfig.enabled}
                                    onCheckedChange={(c) => onSynthesisConfigChange({ ...synthesisConfig, enabled: !!c })}
                                />
                            </label>
                        </div>

                        {synthesisConfig.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground block uppercase tracking-wider">Output Format</label>
                                    <select
                                        title="Synthesis Format"
                                        value={synthesisConfig.format}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, format: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="detailed">Comprehensive Analysis</option>
                                        <option value="brief">TL;DR (Key Highlights Only)</option>
                                        <option value="actionable">Actionable Takeaways & Next Steps</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground block uppercase tracking-wider">Tone & Persona</label>
                                    <select
                                        title="Synthesis Persona"
                                        value={synthesisConfig.persona}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, persona: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm shadow-sm transition-all focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="expert">Senior Technical Product Lead</option>
                                        <option value="eli5">Explain Like I'm 5 (ELI5)</option>
                                        <option value="academic">Academic Researcher (Peer-Review Focus)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-border">
                        {/* Time Range Selector (Slider) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold text-foreground">Chronological Window</h4>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                                    {TIME_RANGE_MAP[timeIndex].label}
                                </span>
                            </div>
                            <div className="px-2 pt-2 pb-6">
                                <div className="relative w-full">
                                    <input
                                        type="range"
                                        min="0"
                                        max={TIME_RANGE_MAP.length - 1}
                                        step="1"
                                        value={timeIndex}
                                        onChange={(e) => onTimeRangeChange(TIME_RANGE_MAP[parseInt(e.target.value)].value)}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between mt-3 px-1">
                                        {TIME_RANGE_MAP.map((t, i) => (
                                            <span
                                                key={t.value}
                                                className={cn(
                                                    "text-[10px] sm:text-xs font-medium transition-colors",
                                                    timeIndex === i ? "text-primary font-bold" : "text-muted-foreground/60"
                                                )}
                                            >
                                                {t.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keyword Enhancements */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground">Keyword Intelligence</h4>
                            <div className="bg-accent/20 p-4 rounded-lg border border-border/50">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <Checkbox
                                        checked={useSynonyms}
                                        onCheckedChange={(c) => onUseSynonymsChange(!!c)}
                                        className="mt-0.5"
                                    />
                                    <div className="space-y-1">
                                        <span className="text-sm font-medium text-foreground">Semantic Synonym Expansion</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Uses Gemini Flash to automatically inject professional synonyms into strict keyword-only sources (Reddit/HN).
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 border-t border-border">
                        {/* Exa Domains Array */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground">Deep Text Sources</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("exaDomains", (specificSources.exaDomains?.length ?? 0) !== SEARCH_SOURCES.exaDomains.length)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80"
                                >
                                    {(specificSources.exaDomains?.length ?? 0) === SEARCH_SOURCES.exaDomains.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-md p-3 bg-accent/5">
                                {SEARCH_SOURCES.exaDomains.map(domain => (
                                    <label key={domain} className="flex items-center space-x-3 cursor-pointer group whitespace-nowrap overflow-hidden">
                                        <Checkbox
                                            checked={specificSources.exaDomains?.includes(domain)}
                                            onCheckedChange={(checked) => handleToggle("exaDomains", domain, checked as boolean)}
                                        />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate" title={domain}>
                                            {domain}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subreddits Array */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground">Subreddits</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("subreddits", (specificSources.subreddits?.length ?? 0) !== SEARCH_SOURCES.subreddits.length)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80"
                                >
                                    {(specificSources.subreddits?.length ?? 0) === SEARCH_SOURCES.subreddits.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-md p-3 bg-accent/5">
                                {SEARCH_SOURCES.subreddits.map(sub => (
                                    <label key={sub} className="flex items-center space-x-3 cursor-pointer group">
                                        <Checkbox
                                            checked={specificSources.subreddits?.includes(sub)}
                                            onCheckedChange={(checked) => handleToggle("subreddits", sub, checked as boolean)}
                                        />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                            /r/{sub}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* YouTube Section */}
                        <div className="space-y-4 md:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-foreground">Video Intelligence</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("youtubeChannels", (specificSources.youtubeChannels?.length ?? 0) !== SEARCH_SOURCES.youtubeChannels.length)}
                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80"
                                >
                                    {(specificSources.youtubeChannels?.length ?? 0) === SEARCH_SOURCES.youtubeChannels.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            {/* Listening Status Box */}
                            <div className="mb-4 bg-primary/5 rounded-lg p-3 border border-primary/10">
                                <span className="text-[10px] font-bold uppercase text-primary block mb-1.5 px-0.5">Currently Listening To</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {activeYoutubeNames.length > 0 ? (
                                        activeYoutubeNames.map(name => (
                                            <span key={name} className="text-[10px] px-2 py-0.5 bg-background border border-border rounded-full text-foreground/80">
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">No channels selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-md p-3 bg-accent/5">
                                {SEARCH_SOURCES.youtubeChannels.map(channel => (
                                    <label key={channel.id} className="flex items-center space-x-3 cursor-pointer group">
                                        <Checkbox
                                            checked={specificSources.youtubeChannels?.includes(channel.id)}
                                            onCheckedChange={(checked) => handleToggle("youtubeChannels", channel.id, checked as boolean)}
                                        />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate" title={channel.name}>
                                            {channel.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}
