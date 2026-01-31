import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { usersApi } from '../services/api'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

// Tam yetkili kullanıcılar: veritabanında kayıt olmasa bile bu rollerle işlem yapabilsin (onay, satın alma, tedarikçi)
const SUPER_ADMIN_EMAILS = ['suatkilinc0102@gmail.com', 'ozbakanfatih@gmail.com']

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [user, setUser] = useState(null)
    const [userProfile, setUserProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchUserProfile = async (userId, email) => {
        // Prefer lookup by email: user_profiles.id is our own Guid, not Supabase auth id, so getById(authId) often 404s
        if (email) {
            try {
                const byEmail = await usersApi.getByEmail(email)
                if (byEmail.data) {
                    setUserProfile(byEmail.data)
                    return
                }
            } catch (_) {
                // Profil yok veya API hatası
            }
            if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
                setUserProfile({
                    fullName: 'Tam Yetkili Kullanıcı',
                    roleName: 'Patron',
                    email,
                })
            } else {
                // Profili olmayan normal kullanıcı: varsayılan profil oluştur, rol atanmamış
                setUserProfile({
                    fullName: email.split('@')[0] || 'Kullanıcı',
                    roleName: null, // Rol atanmadı - navbar'da "Kullanıcı" gösterilecek
                    email,
                })
            }
            return
        }
        try {
            const res = await usersApi.getById(userId)
            if (res.data) {
                setUserProfile(res.data)
            } else {
                setUserProfile(null)
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching user profile:', error)
            }
            setUserProfile(null)
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
                    await fetchUserProfile(session.user.id, session.user.email)
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
                await fetchUserProfile(session.user.id, session.user.email)
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

    const loginWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard'
            }
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
        try {
            // scope: 'local' ile sadece bu cihazdan çıkış yap (403 hatasını önler)
            await supabase.auth.signOut({ scope: 'local' })
        } catch (error) {
            // Session zaten yoksa veya başka hata olursa yine de çıkış yap
            console.log('Logout warning (ignored):', error.message)
        }
        // Her durumda local state'i temizle
        setSession(null)
        setUser(null)
        setUserProfile(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, userProfile, login, loginWithGoogle, signUp, logout, loading }}>
            {!loading ? children : <div className="loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>}
        </AuthContext.Provider>
    )
}
