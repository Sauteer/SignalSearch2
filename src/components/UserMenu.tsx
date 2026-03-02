"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { User as UserIcon, LogOut, Settings, Bookmark } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export function UserMenu() {
    const supabase = createClient()
    const [user, setUser] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [openSettings, setOpenSettings] = React.useState(false)
    const [openAuth, setOpenAuth] = React.useState(false)
    const [openSaved, setOpenSaved] = React.useState(false)

    // Auth state
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [authLoading, setAuthLoading] = React.useState(false)
    const [authError, setAuthError] = React.useState<string | null>(null)
    const [authSuccess, setAuthSuccess] = React.useState<string | null>(null)

    // Profile data
    const [profile, setProfile] = React.useState<any>({})
    const [savingProfile, setSavingProfile] = React.useState(false)

    // Saved sources
    const [savedSources, setSavedSources] = React.useState<any[]>([])

    React.useEffect(() => {
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                fetchProfile(user.id)
                fetchSavedSources(user.id)
            }
            setLoading(false)
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
                fetchSavedSources(session.user.id)
            } else {
                setProfile({})
                setSavedSources([])
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (data) setProfile(data)
    }

    const fetchSavedSources = async (userId: string) => {
        const { data } = await supabase
            .from('saved_sources')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (data) setSavedSources(data)
    }

    const handleSignUp = async () => {
        setAuthLoading(true)
        setAuthError(null)
        setAuthSuccess(null)
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
            setAuthError(error.message)
        } else if (data.user && !data.session) {
            setAuthSuccess("Account created successfully. Please check your email to confirm your account.")
        } else {
            setOpenAuth(false)
        }
        setAuthLoading(false)
    }

    const handleLogin = async () => {
        setAuthLoading(true)
        setAuthError(null)
        setAuthSuccess(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setAuthError(error.message)
        else setOpenAuth(false)
        setAuthLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile({})
        setSavedSources([])
    }

    const saveProfile = async () => {
        setSavingProfile(true)
        const { error } = await supabase
            .from('profiles')
            .update({
                openrouter_key: profile.openrouter_key,
                selected_model: profile.selected_model
            })
            .eq('id', user.id)

        setSavingProfile(false)
        if (!error) setOpenSettings(false)
    }

    if (loading) return null

    if (!user) {
        return (
            <Dialog open={openAuth} onOpenChange={setOpenAuth}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-background/50 border-white/10 hover:bg-white/5 transition-all">
                        <UserIcon className="w-4 h-4 mr-2" /> Sign In
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sign In or Create Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {authError && <p className="text-red-500 text-xs">{authError}</p>}
                        {authSuccess && <p className="text-primary text-xs font-medium">{authSuccess}</p>}
                        <div className="flex gap-2">
                            <Button className="flex-1" onClick={handleLogin} disabled={authLoading}>
                                {authLoading ? "Logging in..." : "Login"}
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={handleSignUp} disabled={authLoading}>
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Dialog open={openSettings} onOpenChange={setOpenSettings}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Settings className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>AI Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="openrouter-key">OpenRouter API Key (Overrides .env)</Label>
                            <Input
                                id="openrouter-key"
                                type="password"
                                placeholder="sk-or-..."
                                value={profile.openrouter_key || ""}
                                onChange={(e) => setProfile({ ...profile, openrouter_key: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Preferred AI Model</Label>
                            <Input
                                id="model"
                                placeholder="openai/gpt-4o"
                                value={profile.selected_model || ""}
                                onChange={(e) => setProfile({ ...profile, selected_model: e.target.value })}
                            />
                        </div>
                        <Button className="w-full mt-4" onClick={saveProfile} disabled={savingProfile}>
                            {savingProfile ? "Saving..." : "Save Config"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={openSaved} onOpenChange={(open) => {
                setOpenSaved(open)
                if (open && user) fetchSavedSources(user.id)
            }}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Bookmark className="w-4 h-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Saved Evidence</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {savedSources.length === 0 ? (
                            <p className="text-center text-muted-foreground py-10">No saved sources yet.</p>
                        ) : (
                            savedSources.map((source) => (
                                <div key={source.id} className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
                                    <div className="flex justify-between items-start gap-4">
                                        <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-sm hover:text-primary transition-colors">
                                            {source.title}
                                        </a>
                                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                            {source.metadata?.sourceName || "Web"}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                        {source.content}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-4 mx-1" />

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
        </div>
    )
}
