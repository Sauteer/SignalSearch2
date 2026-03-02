"use client"

import * as React from "react"
import { SearchQuery, TimeRange, TimeRangeValue } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { Checkbox } from "./ui/checkbox"
import * as Slider from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface AdvancedFiltersProps {
    timeRange: TimeRangeValue;
    onTimeRangeChange: (value: TimeRangeValue) => void;
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

    // Convert TimeRange tuple to index tuple for Slider
    const currentIndices = [
        TIME_RANGE_MAP.findIndex(t => t.value === timeRange[0]),
        TIME_RANGE_MAP.findIndex(t => t.value === timeRange[1])
    ] as [number, number]

    const handleSliderChange = (newValues: number[]) => {
        if (newValues.length === 2) {
            onTimeRangeChange([
                TIME_RANGE_MAP[newValues[0]].value,
                TIME_RANGE_MAP[newValues[1]].value
            ])
        }
    }

    const activeYoutubeNames = SEARCH_SOURCES.youtubeChannels
        .filter(c => specificSources.youtubeChannels?.includes(c.id))
        .map(c => c.name)

    return (
        <Accordion type="single" collapsible className="w-full bg-muted/10 border border-border/50 rounded-2xl mt-4 px-6 shadow-md overflow-hidden">
            <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="py-5 text-base font-bold text-muted-foreground/80 hover:no-underline hover:text-foreground transition-all group-focus:ring-2 ring-primary/20">
                    Advanced Search Controls
                </AccordionTrigger>
                <AccordionContent className="pb-8 space-y-10">

                    {/* AI Settings Section */}
                    <div className="space-y-6 pt-4 border-t border-border/40">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-foreground">AI Synthesis Engine</h4>
                            <label className="flex items-center space-x-3 cursor-pointer bg-accent/20 px-4 py-2 rounded-full border border-border/30 hover:bg-accent/30 transition-colors">
                                <span className="text-sm font-semibold text-foreground">Stream Synthesis</span>
                                <Checkbox
                                    checked={synthesisConfig.enabled}
                                    onCheckedChange={(c) => onSynthesisConfigChange({ ...synthesisConfig, enabled: !!c })}
                                />
                            </label>
                        </div>

                        {synthesisConfig.enabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Knowledge Format</label>
                                    <select
                                        title="Synthesis Format"
                                        value={synthesisConfig.format}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, format: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-border bg-background/40 text-sm shadow-inner transition-all focus:ring-2 focus:ring-primary/20 outline-none hover:border-border/80"
                                    >
                                        <option value="detailed">Comprehensive Analysis</option>
                                        <option value="brief">TL;DR (Key Highlights Only)</option>
                                        <option value="actionable">Actionable Takeaways & Next Steps</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Persona</label>
                                    <select
                                        title="Synthesis Persona"
                                        value={synthesisConfig.persona}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, persona: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-border bg-background/40 text-sm shadow-inner transition-all focus:ring-2 focus:ring-primary/20 outline-none hover:border-border/80"
                                    >
                                        <option value="expert">Senior Technical Product Lead</option>
                                        <option value="eli5">Explain Like I'm 5 (ELI5)</option>
                                        <option value="academic">Academic Researcher (Peer-Review Focus)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 border-t border-border/40">
                        {/* Dual-Thumb Time Range Selector */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className="text-base font-bold text-foreground">Temporal Window</h4>
                                <div className="flex gap-2">
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md uppercase tracking-tighter">
                                        FROM {TIME_RANGE_MAP[currentIndices[0]].label}
                                    </span>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md uppercase tracking-tighter">
                                        TO {TIME_RANGE_MAP[currentIndices[1]].label}
                                    </span>
                                </div>
                            </div>
                            <div className="px-2 pt-4 pb-8">
                                <Slider.Root
                                    className="relative flex items-center select-none touch-none w-full h-5"
                                    value={currentIndices}
                                    max={TIME_RANGE_MAP.length - 1}
                                    step={1}
                                    minStepsBetweenThumbs={0}
                                    onValueChange={handleSliderChange}
                                >
                                    <Slider.Track className="bg-muted relative grow rounded-full h-1.5">
                                        <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                    </Slider.Track>
                                    <Slider.Thumb
                                        className="block w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all cursor-grab active:cursor-grabbing"
                                        aria-label="Lower bound"
                                    />
                                    <Slider.Thumb
                                        className="block w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all cursor-grab active:cursor-grabbing"
                                        aria-label="Upper bound"
                                    />
                                </Slider.Root>
                                <div className="flex justify-between mt-5 px-1">
                                    {TIME_RANGE_MAP.map((t, i) => (
                                        <button
                                            key={t.value}
                                            onClick={() => {
                                                // Jump closest thumb to this index
                                                const dist0 = Math.abs(currentIndices[0] - i);
                                                const dist1 = Math.abs(currentIndices[1] - i);
                                                if (dist0 < dist1) handleSliderChange([i, currentIndices[1]]);
                                                else handleSliderChange([currentIndices[0], i]);
                                            }}
                                            className={cn(
                                                "text-xs font-bold transition-all hover:text-foreground",
                                                currentIndices[0] <= i && i <= currentIndices[1] ? "text-primary scale-110" : "text-muted-foreground/40 scale-100"
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Keyword Enhancements */}
                        <div className="space-y-5">
                            <h4 className="text-base font-bold text-foreground">Discovery Engine</h4>
                            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 hover:border-primary/20 transition-colors">
                                <label className="flex items-start space-x-4 cursor-pointer">
                                    <Checkbox
                                        checked={useSynonyms}
                                        onCheckedChange={(c) => onUseSynonymsChange(!!c)}
                                        className="mt-1 h-5 w-5 rounded-md"
                                    />
                                    <div className="space-y-1.5">
                                        <span className="text-sm font-bold text-foreground">Deep Synonym Injection</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            Dynamically generates alternate terminology using Gemini Flash. Essential for bypassing strict lexical filters on Reddit and Hacker News.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pt-8 border-t border-border/40">
                        {/* Exa Domains Array */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Authority Blogs</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("exaDomains", (specificSources.exaDomains?.length ?? 0) !== SEARCH_SOURCES.exaDomains.length)}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-2 py-1 rounded transition-all"
                                >
                                    {(specificSources.exaDomains?.length ?? 0) === SEARCH_SOURCES.exaDomains.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar border border-border/20 rounded-xl p-4 bg-muted/5 shadow-inner">
                                {SEARCH_SOURCES.exaDomains.map(domain => (
                                    <label key={domain} className="flex items-center space-x-4 cursor-pointer group hover:translate-x-1 transition-transform">
                                        <Checkbox
                                            checked={specificSources.exaDomains?.includes(domain)}
                                            onCheckedChange={(checked) => handleToggle("exaDomains", domain, checked as boolean)}
                                            className="h-4 w-4 rounded"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors truncate" title={domain}>
                                            {domain}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subreddits Array */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Subreddits</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("subreddits", (specificSources.subreddits?.length ?? 0) !== SEARCH_SOURCES.subreddits.length)}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-2 py-1 rounded transition-all"
                                >
                                    {(specificSources.subreddits?.length ?? 0) === SEARCH_SOURCES.subreddits.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar border border-border/20 rounded-xl p-4 bg-muted/5 shadow-inner">
                                {SEARCH_SOURCES.subreddits.map(sub => (
                                    <label key={sub} className="flex items-center space-x-4 cursor-pointer group hover:translate-x-1 transition-transform">
                                        <Checkbox
                                            checked={specificSources.subreddits?.includes(sub)}
                                            onCheckedChange={(checked) => handleToggle("subreddits", sub, checked as boolean)}
                                            className="h-4 w-4 rounded"
                                        />
                                        <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                            r/{sub.toLowerCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* YouTube Section */}
                        <div className="space-y-5 md:col-span-2 lg:col-span-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">Video Channels</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("youtubeChannels", (specificSources.youtubeChannels?.length ?? 0) !== SEARCH_SOURCES.youtubeChannels.length)}
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-2 py-1 rounded transition-all"
                                >
                                    {(specificSources.youtubeChannels?.length ?? 0) === SEARCH_SOURCES.youtubeChannels.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            {/* Listening Status Box */}
                            <div className="mb-2 bg-primary/10 rounded-xl p-4 border border-primary/20 shadow-sm">
                                <span className="text-[10px] font-black uppercase text-primary block mb-2 px-1 tracking-tighter">Monitoring Active Feed</span>
                                <div className="flex flex-wrap gap-2">
                                    {activeYoutubeNames.length > 0 ? (
                                        activeYoutubeNames.map(name => (
                                            <span key={name} className="text-[10px] px-2.5 py-1 bg-background border border-border rounded-lg text-foreground font-bold shadow-sm">
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-muted-foreground/60 italic font-medium">Capture disabled - no channels selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar border border-border/20 rounded-xl p-4 bg-muted/5 shadow-inner">
                                {SEARCH_SOURCES.youtubeChannels.map(channel => (
                                    <label key={channel.id} className="flex items-center space-x-4 cursor-pointer group hover:translate-x-1 transition-transform">
                                        <Checkbox
                                            checked={specificSources.youtubeChannels?.includes(channel.id)}
                                            onCheckedChange={(checked) => handleToggle("youtubeChannels", channel.id, checked as boolean)}
                                            className="h-4 w-4 rounded"
                                        />
                                        <span className="text-xs font-semibold text-muted-foreground group-hover:text-[#FF0000] transition-colors truncate" title={channel.name}>
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
