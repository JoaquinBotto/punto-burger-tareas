import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, UserRole } from '../types'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  isAdmin: boolean
  isResponsable: boolean
  isColaborador: boolean
  isActive: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = () => setError(null)

  const fetchProfile = async (userId: string) => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileErr) {
        console.error('[AuthContext] Error fetching profile:', profileErr)
        setProfile(null)
      } else if (data) {
        const prof = data as unknown as Profile
        setProfile(prof)
        if (!prof.is_active) {
          setError('Tu cuenta ha sido desactivada por un administrador. Contacta con soporte.')
        }
      }
    } catch (err: any) {
      console.error('[AuthContext] Exception fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Listen to Auth State Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // 3. Realtime subscription to the current user's profile row to immediately react if deactivated
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured) return

    const channel = supabase
      .channel(`profile_changes_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as Profile
          setProfile(updated)
          if (!updated.is_active) {
            setError('Tu cuenta ha sido desactivada por un administrador.')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const login = async (email: string, password: string) => {
    setError(null)
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    try {
      const { data, error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginErr) {
        let userMessage = 'Error al iniciar sesión. Verifica tus credenciales.'
        if (loginErr.message.includes('Invalid login credentials')) {
          userMessage = 'Correo o contraseña incorrectos.'
        } else if (loginErr.message.includes('Email not confirmed')) {
          userMessage = 'Por favor, confirma tu correo electrónico antes de ingresar.'
        }
        setError(userMessage)
        return { success: false, error: userMessage }
      }

      if (data.user) {
        // Check profile active status immediately
        const { data: profData } = await supabase
          .from('profiles')
          .select('is_active, role')
          .eq('id', data.user.id)
          .single()

        if (profData) {
          const prof = profData as unknown as { is_active: boolean; role: UserRole }
          if (!prof.is_active) {
            await supabase.auth.signOut()
            const deactivatedMsg = 'Tu cuenta se encuentra desactivada. Contacta al administrador de Punto Burger.'
            setError(deactivatedMsg)
            return { success: false, error: deactivatedMsg }
          }
        }
      }

      return { success: true }
    } catch (err: any) {
      const msg = err.message || 'Ocurrió un error inesperado al conectar.'
      setError(msg)
      return { success: false, error: msg }
    }
  }

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setSession(null)
    setUser(null)
    setProfile(null)
    setError(null)
  }

  const sendPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    try {
      const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://punto-burger-tareas.joaquinhbotto.workers.dev'
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appOrigin}/#type=recovery`,
      })

      if (resetErr) {
        return { success: false, error: resetErr.message }
      }

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const updatePassword = async (password: string) => {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase no está configurado.' }
    }

    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password })
      if (updateErr) {
        return { success: false, error: updateErr.message }
      }
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  const role = profile?.role ?? null
  const isActive = profile?.is_active ?? false
  const isAdmin = role === 'admin' && isActive
  const isResponsable = (role === 'responsable' || role === 'admin') && isActive
  const isColaborador = isActive

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role,
        isAdmin,
        isResponsable,
        isColaborador,
        isActive,
        loading,
        error,
        login,
        logout,
        sendPasswordReset,
        updatePassword,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
