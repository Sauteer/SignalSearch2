"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase-client"
import { User } from "@supabase/supabase-js"

interface AuthContextType {
    user: User | null
    profile: any
    loading: boolean
}

const AuthContext = React.createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = React.useState<User | null>(null)
    const [profile, setProfile] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const supabase = createClient()

    React.useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
            setLoading(false)
        }

        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
                setProfile(data)
            } else {
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => React.useContext(AuthContext)
