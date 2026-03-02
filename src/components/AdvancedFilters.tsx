"use client"

import * as React from "react"
import { SearchQuery, TimeRange, TimeRangeValue } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { Checkbox } from "./ui/checkbox"
import * as Slider from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"
import { Clock, ChevronDown, ChevronUp } from "lucide-react"

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
    const [expanded, setExpanded] = React.useState(false)

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
        <div className="w-full relative z-30">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto px-4 py-2"
                type="button"
            >
                <Clock className="w-4 h-4" />
                Advanced Filters
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {expanded && (
                <div className="mt-4 p-6 sm:p-10 bg-card border border-border rounded-3xl animate-slide-up space-y-12 shadow-2xl text-left glow-primary">

                    {/* AI Settings Section */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div>
                                <h4 className="text-xl font-bold text-foreground">AI Synthesis Engine</h4>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1">Configure how the AI processes and condenses search results.</p>
                            </div>
                            <label className="flex items-center space-x-4 cursor-pointer bg-primary/5 hover:bg-primary/10 px-5 py-3 rounded-xl border border-primary/20 transition-all font-semibold">
                                <span className="text-sm text-foreground">Enable Synthesis</span>
                                <Checkbox
                                    checked={synthesisConfig.enabled}
                                    onCheckedChange={(c) => onSynthesisConfigChange({ ...synthesisConfig, enabled: !!c })}
                                    className="h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                            </label>
                        </div>

                        {synthesisConfig.enabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-border/50">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Knowledge Format</label>
                                    <select
                                        title="Synthesis Format"
                                        value={synthesisConfig.format}
                                        onChange={(e) => onSynthesisConfigChange({ ...synthesisConfig, format: e.target.value })}
                                        className="w-full h-12 px-4 rounded-xl border border-border/50 bg-background text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none hover:border-border"
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
                                        className="w-full h-12 px-4 rounded-xl border border-border/50 bg-background text-sm shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none hover:border-border"
                                    >
                                        <option value="expert">Senior Technical Product Lead</option>
                                        <option value="eli5">Explain Like I'm 5 (ELI5)</option>
                                        <option value="academic">Academic Researcher (Peer-Review Focus)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-border/50">
                        {/* Dual-Thumb Time Range Selector */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                                <h4 className="text-lg font-bold text-foreground">Temporal Window</h4>
                                <p className="text-sm text-muted-foreground">Isolate your search within a specific timeframe.</p>
                            </div>

                            <div className="bg-muted/20 p-6 rounded-2xl border border-border/50">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        From: {TIME_RANGE_MAP[currentIndices[0]].label}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                                        To: {TIME_RANGE_MAP[currentIndices[1]].label}
                                    </span>
                                </div>

                                <div className="px-4 pb-2">
                                    <Slider.Root
                                        className="relative flex items-center select-none touch-none w-full h-6"
                                        value={currentIndices}
                                        max={TIME_RANGE_MAP.length - 1}
                                        step={1}
                                        minStepsBetweenThumbs={0}
                                        onValueChange={handleSliderChange}
                                    >
                                        <Slider.Track className="bg-muted-foreground/20 relative grow rounded-full h-2">
                                            <Slider.Range className="absolute bg-primary rounded-full h-full" />
                                        </Slider.Track>
                                        <Slider.Thumb
                                            className="block w-6 h-6 bg-card border-[3px] border-primary rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform cursor-grab active:cursor-grabbing"
                                            aria-label="Lower bound"
                                        />
                                        <Slider.Thumb
                                            className="block w-6 h-6 bg-card border-[3px] border-primary rounded-full shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-transform cursor-grab active:cursor-grabbing"
                                            aria-label="Upper bound"
                                        />
                                    </Slider.Root>
                                    <div className="flex justify-between mt-6 px-1">
                                        {TIME_RANGE_MAP.map((t, i) => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => {
                                                    const dist0 = Math.abs(currentIndices[0] - i);
                                                    const dist1 = Math.abs(currentIndices[1] - i);
                                                    if (dist0 < dist1) handleSliderChange([i, currentIndices[1]]);
                                                    else handleSliderChange([currentIndices[0], i]);
                                                }}
                                                className={cn(
                                                    "text-xs sm:text-sm font-bold transition-all hover:text-foreground px-2 py-1 rounded-md",
                                                    currentIndices[0] <= i && i <= currentIndices[1]
                                                        ? "text-primary bg-primary/10"
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
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1">
                                <h4 className="text-lg font-bold text-foreground">Discovery Engine</h4>
                                <p className="text-sm text-muted-foreground">Expand your search reach beyond exact keyword matches.</p>
                            </div>

                            <div className="bg-muted/20 p-6 rounded-2xl border border-border/50 h-full flex items-center">
                                <label className="flex items-start space-x-4 cursor-pointer group">
                                    <div className="mt-0.5">
                                        <Checkbox
                                            checked={useSynonyms}
                                            onCheckedChange={(c) => onUseSynonymsChange(!!c)}
                                            className="h-6 w-6 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors block">
                                            Deep Synonym Injection
                                        </span>
                                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                            Dynamically generates alternate terminology using Gemini Flash. Essential for bypassing strict lexical filters on Reddit and Hacker News.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-10 pt-10 border-t border-border/50">
                        {/* Exa Domains Array */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground uppercase tracking-wider text-gradient-primary">Authority Blogs</h4>
                                    <p className="text-sm text-muted-foreground">Select high-quality domains for focused searches.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("exaDomains", (specificSources.exaDomains?.length ?? 0) !== SEARCH_SOURCES.exaDomains.length)}
                                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-4 py-2 rounded-lg transition-all border border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.exaDomains?.length ?? 0) === SEARCH_SOURCES.exaDomains.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-2xl p-5 bg-muted/10">
                                {SEARCH_SOURCES.exaDomains.map(domain => (
                                    <label key={domain} className="flex items-center space-x-3 cursor-pointer group hover:bg-background p-3 rounded-lg transition-all border border-transparent hover:border-border/50">
                                        <Checkbox
                                            checked={specificSources.exaDomains?.includes(domain)}
                                            onCheckedChange={(checked) => handleToggle("exaDomains", domain, checked as boolean)}
                                            className="h-5 w-5 rounded-md"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors break-all" title={domain}>
                                            {domain}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subreddits Array */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-foreground uppercase tracking-wider text-gradient-accent">Subreddits</h4>
                                    <p className="text-sm text-muted-foreground">Target specific communities for authentic discussions.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("subreddits", (specificSources.subreddits?.length ?? 0) !== SEARCH_SOURCES.subreddits.length)}
                                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-4 py-2 rounded-lg transition-all border border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.subreddits?.length ?? 0) === SEARCH_SOURCES.subreddits.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-2xl p-5 bg-muted/10">
                                {SEARCH_SOURCES.subreddits.map(sub => (
                                    <label key={sub} className="flex items-center space-x-3 cursor-pointer group hover:bg-background p-3 rounded-lg transition-all border border-transparent hover:border-border/50">
                                        <Checkbox
                                            checked={specificSources.subreddits?.includes(sub)}
                                            onCheckedChange={(checked) => handleToggle("subreddits", sub, checked as boolean)}
                                            className="h-5 w-5 rounded-md"
                                        />
                                        <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                                            r/{sub.toLowerCase()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* YouTube Section */}
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-lg font-bold text-[#FF0000] uppercase tracking-wider">Video Channels</h4>
                                    <p className="text-sm text-muted-foreground">Filter searches by leading tech and educational creators.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("youtubeChannels", (specificSources.youtubeChannels?.length ?? 0) !== SEARCH_SOURCES.youtubeChannels.length)}
                                    className="text-xs font-bold uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-4 py-2 rounded-lg transition-all border border-primary/20 hover:border-primary shadow-sm"
                                >
                                    {(specificSources.youtubeChannels?.length ?? 0) === SEARCH_SOURCES.youtubeChannels.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            {/* Listening Status Box */}
                            <div className="bg-primary/5 rounded-2xl p-5 md:p-6 border border-primary/20 shadow-sm">
                                <span className="text-xs sm:text-sm font-bold uppercase text-primary block mb-4 tracking-widest flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Monitoring Active Feed
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {activeYoutubeNames.length > 0 ? (
                                        activeYoutubeNames.map(name => (
                                            <span key={name} className="text-sm px-3 py-1.5 bg-background border border-border/50 rounded-lg text-foreground font-medium shadow-sm">
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground/60 italic font-medium bg-background/50 px-4 py-2 rounded-lg border border-dashed border-border/50">Capture disabled - no channels selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-border/30 rounded-2xl p-5 bg-muted/10">
                                {SEARCH_SOURCES.youtubeChannels.map(channel => (
                                    <label key={channel.id} className="flex items-center space-x-3 cursor-pointer group hover:bg-background p-3 rounded-lg transition-all border border-transparent hover:border-[#FF0000]/30">
                                        <Checkbox
                                            checked={specificSources.youtubeChannels?.includes(channel.id)}
                                            onCheckedChange={(checked) => handleToggle("youtubeChannels", channel.id, checked as boolean)}
                                            className="h-5 w-5 rounded-md data-[state=checked]:bg-[#FF0000] data-[state=checked]:border-[#FF0000]"
                                        />
                                        <span className="text-sm font-semibold text-muted-foreground group-hover:text-[#FF0000] transition-colors break-words">
                                            {channel.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
