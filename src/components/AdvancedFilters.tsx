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
        <Accordion type="single" collapsible className="w-full bg-card border border-border/60 rounded-3xl mt-8 px-6 sm:px-10 py-4 shadow-lg focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="py-6 text-xl sm:text-2xl font-black text-muted-foreground hover:no-underline hover:text-foreground transition-colors">
                    <div className="flex items-center gap-4">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        Advanced Search Controls
                    </div>
                </AccordionTrigger>
                <AccordionContent className="pb-12 space-y-16">

                    {/* AI Settings Section */}
                    <div className="space-y-8 pt-8 border-t-2 border-border/40">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h4 className="text-xl font-bold text-foreground">AI Synthesis Engine</h4>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">Configure how the AI processes and condenses search results.</p>
                            </div>
                            <label className="flex items-center space-x-4 cursor-pointer bg-primary/5 hover:bg-primary/10 px-6 py-4 rounded-2xl border-2 border-primary/20 transition-all font-semibold">
                                <span className="text-base sm:text-lg text-foreground">Enable Synthesis</span>
                                <Checkbox
                                    checked={synthesisConfig.enabled}
                                    onCheckedChange={(c) => onSynthesisConfigChange({ ...synthesisConfig, enabled: !!c })}
                                    className="h-6 w-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                            </label>
                        </div>

                        {synthesisConfig.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/20 p-8 rounded-3xl border border-border/50">
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-2">Knowledge Format</label>
                                    <select
                                        title="Synthesis Format"
                                        value={synthesisConfig.format}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, format: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-border/50 bg-background text-base shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none hover:border-border"
                                    >
                                        <option value="detailed">Comprehensive Analysis</option>
                                        <option value="brief">TL;DR (Key Highlights Only)</option>
                                        <option value="actionable">Actionable Takeaways & Next Steps</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest pl-2">Target Persona</label>
                                    <select
                                        title="Synthesis Persona"
                                        value={synthesisConfig.persona}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, persona: e.target.value })}
                                        className="w-full h-14 px-5 rounded-2xl border-2 border-border/50 bg-background text-base shadow-sm transition-all focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none hover:border-border"
                                    >
                                        <option value="expert">Senior Technical Product Lead</option>
                                        <option value="eli5">Explain Like I'm 5 (ELI5)</option>
                                        <option value="academic">Academic Researcher (Peer-Review Focus)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-10 border-t-2 border-border/40">
                        {/* Dual-Thumb Time Range Selector */}
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xl font-bold text-foreground">Temporal Window</h4>
                                <p className="text-base text-muted-foreground">Isolate your search within a specific timeframe.</p>
                            </div>

                            <div className="bg-muted/20 p-8 rounded-3xl border border-border/50">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-sm sm:text-base font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl uppercase tracking-wider">
                                        From: {TIME_RANGE_MAP[currentIndices[0]].label}
                                    </span>
                                    <span className="text-sm sm:text-base font-bold text-primary bg-primary/10 px-4 py-2 rounded-xl uppercase tracking-wider">
                                        To: {TIME_RANGE_MAP[currentIndices[1]].label}
                                    </span>
                                </div>

                                <div className="px-4 pb-4">
                                    <Slider.Root
                                        className="relative flex items-center select-none touch-none w-full h-8"
                                        value={currentIndices}
                                        max={TIME_RANGE_MAP.length - 1}
                                        step={1}
                                        minStepsBetweenThumbs={0}
                                        onValueChange={handleSliderChange}
                                    >
                                        <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full h-2.5">
                                            <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                        </Slider.Track>
                                        <Slider.Thumb
                                            className="block w-7 h-7 bg-background border-4 border-primary rounded-full shadow-xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-transform cursor-grab active:cursor-grabbing"
                                            aria-label="Lower bound"
                                        />
                                        <Slider.Thumb
                                            className="block w-7 h-7 bg-background border-4 border-primary rounded-full shadow-xl hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-transform cursor-grab active:cursor-grabbing"
                                            aria-label="Upper bound"
                                        />
                                    </Slider.Root>
                                    <div className="flex justify-between mt-8 px-1">
                                        {TIME_RANGE_MAP.map((t, i) => (
                                            <button
                                                key={t.value}
                                                onClick={() => {
                                                    const dist0 = Math.abs(currentIndices[0] - i);
                                                    const dist1 = Math.abs(currentIndices[1] - i);
                                                    if (dist0 < dist1) handleSliderChange([i, currentIndices[1]]);
                                                    else handleSliderChange([currentIndices[0], i]);
                                                }}
                                                className={cn(
                                                    "text-sm sm:text-base font-bold transition-all hover:text-foreground px-3 py-1.5 rounded-lg",
                                                    currentIndices[0] <= i && i <= currentIndices[1]
                                                        ? "text-primary bg-primary/10 scale-110 shadow-sm"
                                                        : "text-muted-foreground/60 hover:bg-muted/50"
                                                )}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keyword Enhancements */}
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-xl font-bold text-foreground">Discovery Engine</h4>
                                <p className="text-base text-muted-foreground">Expand your search reach beyond exact keyword matches.</p>
                            </div>

                            <div className="bg-muted/20 p-8 rounded-3xl border border-border/50 h-full">
                                <label className="flex items-start space-x-6 cursor-pointer group h-full">
                                    <div className="mt-1">
                                        <Checkbox
                                            checked={useSynonyms}
                                            onCheckedChange={(c) => onUseSynonymsChange(!!c)}
                                            className="h-7 w-7 rounded-lg data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <span className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors block">
                                            Deep Synonym Injection
                                        </span>
                                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                            Dynamically generates alternate terminology using Gemini Flash. Essential for bypassing strict lexical filters on Reddit and Hacker News.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-12 pt-10 border-t-2 border-border/40">
                        {/* Exa Domains Array */}
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-foreground uppercase tracking-wider">Authority Blogs</h4>
                                    <p className="text-base text-muted-foreground">Select high-quality domains for focused searches.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("exaDomains", (specificSources.exaDomains?.length ?? 0) !== SEARCH_SOURCES.exaDomains.length)}
                                    className="text-sm font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-5 py-2.5 rounded-xl transition-all border-2 border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.exaDomains?.length ?? 0) === SEARCH_SOURCES.exaDomains.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar border-2 border-border/30 rounded-3xl p-8 bg-muted/10 shadow-inner">
                                {SEARCH_SOURCES.exaDomains.map(domain => (
                                    <label key={domain} className="flex items-center space-x-4 cursor-pointer group hover:bg-background p-4 rounded-xl transition-all border border-transparent hover:border-border/50 hover:shadow-sm">
                                        <Checkbox
                                            checked={specificSources.exaDomains?.includes(domain)}
                                            onCheckedChange={(checked) => handleToggle("exaDomains", domain, checked as boolean)}
                                            className="h-6 w-6 rounded-md"
                                        />
                                        <span className="text-base sm:text-lg font-medium text-muted-foreground group-hover:text-foreground transition-colors break-all" title={domain}>
                                            {domain}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subreddits Array */}
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-foreground uppercase tracking-wider">Subreddits</h4>
                                    <p className="text-base text-muted-foreground">Target specific communities for authentic discussions.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("subreddits", (specificSources.subreddits?.length ?? 0) !== SEARCH_SOURCES.subreddits.length)}
                                    className="text-sm font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-5 py-2.5 rounded-xl transition-all border-2 border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.subreddits?.length ?? 0) === SEARCH_SOURCES.subreddits.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar border-2 border-border/30 rounded-3xl p-8 bg-muted/10 shadow-inner">
                                {SEARCH_SOURCES.subreddits.map(sub => (
                                    <label key={sub} className="flex items-center space-x-4 cursor-pointer group hover:bg-background p-4 rounded-xl transition-all border border-transparent hover:border-border/50 hover:shadow-sm">
                                        <Checkbox
                                            checked={specificSources.subreddits?.includes(sub)}
                                            onCheckedChange={(checked) => handleToggle("subreddits", sub, checked as boolean)}
                                            className="h-6 w-6 rounded-md"
                                        />
                                        <span className="text-base sm:text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                            r/{sub.toLowerCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* YouTube Section */}
                        <div className="space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-foreground uppercase tracking-wider">Video Channels</h4>
                                    <p className="text-base text-muted-foreground">Filter searches by leading tech and educational creators.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("youtubeChannels", (specificSources.youtubeChannels?.length ?? 0) !== SEARCH_SOURCES.youtubeChannels.length)}
                                    className="text-sm font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-5 py-2.5 rounded-xl transition-all border-2 border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.youtubeChannels?.length ?? 0) === SEARCH_SOURCES.youtubeChannels.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            {/* Listening Status Box */}
                            <div className="bg-primary/5 rounded-2xl p-6 md:p-8 border-2 border-primary/20 shadow-inner">
                                <span className="text-sm sm:text-base font-bold uppercase text-primary block mb-6 tracking-widest flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                                    Monitoring Active Feed
                                </span>
                                <div className="flex flex-wrap gap-3">
                                    {activeYoutubeNames.length > 0 ? (
                                        activeYoutubeNames.map(name => (
                                            <span key={name} className="text-base px-5 py-2.5 bg-background border-2 border-border/50 rounded-xl text-foreground font-semibold shadow-sm hover:border-primary/50 transition-colors">
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-base text-muted-foreground/60 italic font-medium bg-background/50 px-5 py-2.5 rounded-xl border-2 border-dashed border-border/50 inline-block">Capture disabled - no channels selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar border-2 border-border/30 rounded-3xl p-8 bg-muted/10 shadow-inner">
                                {SEARCH_SOURCES.youtubeChannels.map(channel => (
                                    <label key={channel.id} className="flex items-center space-x-4 cursor-pointer group hover:bg-background p-4 rounded-xl transition-all border border-transparent hover:border-[#FF0000]/30 hover:shadow-sm">
                                        <Checkbox
                                            checked={specificSources.youtubeChannels?.includes(channel.id)}
                                            onCheckedChange={(checked) => handleToggle("youtubeChannels", channel.id, checked as boolean)}
                                            className="h-6 w-6 rounded-md data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]"
                                        />
                                        <span className="text-base sm:text-lg font-semibold text-muted-foreground group-hover:text-[#FF0000] transition-colors break-words">
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
