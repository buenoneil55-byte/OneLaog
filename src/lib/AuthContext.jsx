import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/api/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    return data
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const p = await loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const refreshProfile = async () => { if (user) return loadProfile(user.id) }

  const updateMe = async (updates) => {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };

    const { data: profile } = await supabase
      .from('profiles')
      .select('banned, role')
      .eq('id', data.user.id)
      .single();

    if (profile?.banned) {
      try { await supabase.auth.signOut(); } catch (e) { }
      return { success: false, message: 'Your account has been banned. Please contact the administrator.' };
    }

    return { success: true, role: profile?.role || 'user' };
  };
  const register = (email, password, fullName, phone) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } }
    })

  const verifyOtp = (email, token) => supabase.auth.verifyOtp({ email, token, type: 'signup' })
  const resendOtp = (email) => supabase.auth.resend({ email, type: 'signup' })

  const resetPasswordRequest = (email) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })

  const resetPassword = (newPassword) => supabase.auth.updateUser({ password: newPassword })

  const loginWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })

  const logout = async (redirect = '/login') => {
    await supabase.auth.signOut()
    window.location.href = redirect
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, refreshProfile, updateMe,
      login, register, verifyOtp, resendOtp, resetPasswordRequest, resetPassword, loginWithGoogle, logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)