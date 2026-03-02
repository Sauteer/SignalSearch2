"use client"

import * as React from "react"
import { SearchQuery, TimeRange } from "@/lib/types"
import { SEARCH_SOURCES } from "@/config/sources.config"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion"
import { Checkbox } from "./ui/checkbox"

interface AdvancedFiltersProps {
    timeRange: TimeRange;
    onTimeRangeChange: (value: TimeRange) => void;
    specificSources: NonNullable<SearchQuery["specificSources"]>;
    onSpecificSourcesChange: (sources: NonNullable<SearchQuery["specificSources"]>) => void;
}

export function AdvancedFilters({
    timeRange,
    onTimeRangeChange,
    specificSources,
    onSpecificSourcesChange,
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
        if (category === "youtubeChannels") allItems = [...SEARCH_SOURCES.youtubeChannels]

        onSpecificSourcesChange({
            ...specificSources,
            [category]: selectAll ? allItems : []
        })
    }

    return (
        <Accordion type="single" collapsible className="w-full bg-muted/20 border border-border rounded-lg mt-3 px-4">
            <AccordionItem value="advanced" className="border-0">
                <AccordionTrigger className="py-3 text-sm text-muted-foreground hover:no-underline hover:text-foreground">
                    Advanced Filters
                </AccordionTrigger>
                <AccordionContent className="pb-4 space-y-6">

                    {/* Time Range Selector */}
                    <div className="space-y-2 pt-2 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground">Timeframe</h4>
                        <select
                            title="Time Range"
                            value={timeRange}
                            onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
                            className="w-full sm:w-64 h-9 px-3 rounded-md border border-input bg-background text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="24h">Past 24 Hours</option>
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                            <option value="year">Past Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                        {/* Exa Domains Array */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-foreground">Blogs & Websites</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("exaDomains", specificSources.exaDomains?.length !== SEARCH_SOURCES.exaDomains.length)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {specificSources.exaDomains?.length === SEARCH_SOURCES.exaDomains.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {SEARCH_SOURCES.exaDomains.map(domain => (
                                    <label key={domain} className="flex items-center space-x-2 cursor-pointer group">
                                        <Checkbox
                                            checked={specificSources.exaDomains?.includes(domain)}
                                            onCheckedChange={(checked) => handleToggle("exaDomains", domain, checked as boolean)}
                                        />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground truncate" title={domain}>
                                            {domain}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subreddits Array */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-foreground">Subreddits</h4>
                                <button
                                    type="button"
                                    onClick={() => handleSelectAll("subreddits", specificSources.subreddits?.length !== SEARCH_SOURCES.subreddits.length)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {specificSources.subreddits?.length === SEARCH_SOURCES.subreddits.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {SEARCH_SOURCES.subreddits.map(sub => (
                                    <label key={sub} className="flex items-center space-x-2 cursor-pointer group">
                                        <Checkbox
                                            checked={specificSources.subreddits?.includes(sub)}
                                            onCheckedChange={(checked) => handleToggle("subreddits", sub, checked as boolean)}
                                        />
                                        <span className="text-xs text-muted-foreground group-hover:text-foreground">
                                            /r/{sub}
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
