import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usersApi } from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchUserProfile = async (userId) => {
        try {
            const res = await usersApi.getById(userId)
            if (res.data) {
                setUserProfile(res.data)
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            // Fallback: belki henüz oluşmadı, register akışında oluşacak
        }
    }

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                if (error) throw error

                setSession(session)
                setUser(session?.user ?? null)
                if (session?.user) {
                    await fetchUserProfile(session.user.id)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                setLoading(false)
            }
        }

        initAuth()

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                await fetchUserProfile(session.user.id)
            } else {
                setUserProfile(null)
            }
            setLoading(false)
        })

        return () => {
            if (subscription && subscription.unsubscribe) {
                subscription.unsubscribe()
            } else if (subscription && subscription.subscription) {
                // Supabase v2 compatibility
                subscription.subscription.unsubscribe()
            }
        }
    }, [])

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        if (error) throw error
        return data
    }

    const signUp = async (email, password, metadata) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })
        if (error) throw error
        return data
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUserProfile(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, userProfile, login, signUp, logout, loading }}>
            {!loading ? children : <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>}
        </AuthContext.Provider>
    )
}
