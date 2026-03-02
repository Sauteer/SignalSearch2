"use client"

import * as React from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

type Theme = "dark" | "light"

const STORAGE_KEY = "signal-search-theme"

function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "dark"
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
    return "dark"
}

function applyTheme(theme: Theme) {
    const root = document.documentElement
    root.classList.remove("dark", "light")
    root.classList.add(theme)
}

export function ThemeToggle({ className }: { className?: string }) {
    const [theme, setTheme] = React.useState<Theme>("dark")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        const initial = getInitialTheme()
        setTheme(initial)
        applyTheme(initial)
        setMounted(true)
    }, [])

    const toggle = () => {
        const next: Theme = theme === "dark" ? "light" : "dark"
        setTheme(next)
        applyTheme(next)
        localStorage.setItem(STORAGE_KEY, next)
    }

    if (!mounted) return null

    return (
        <button
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className={cn(
                "p-2 rounded-xl border border-border text-muted-foreground",
                "hover:text-foreground hover:border-primary/40 hover:bg-secondary",
                "transition-all duration-200",
                className
            )}
        >
            {theme === "dark" ? (
                <Sun className="w-4 h-4" />
            ) : (
                <Moon className="w-4 h-4" />
            )}
        </button>
    )
}
