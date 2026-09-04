import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import AuthLayout from '@/components/AuthLayout'
import PasswordInput from '@/components/PasswordInput'

export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Supabase automatically detects the recovery token in the URL hash
    // (#access_token=...&type=recovery) and establishes the session.
    // We just check if a session exists — no need to parse URL params.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      } else {
        setError('Invalid or expired reset link')
      }
    })
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (pw !== confirm) { setError('Passwords do not match'); return }
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }
    // Sign out so the user can log in fresh with their new password
    await supabase.auth.signOut()
    setLoading(false)
    window.location.href = '/login'
  }

  if (error) {
    return (
      <AuthLayout icon={AlertTriangle} title="Invalid reset link" subtitle={error}
        footer={<Link to="/forgot-password" className="link">Request a new link</Link>}>
        <p className="center-text">The link is incomplete or expired. Please request a new reset email.</p>
      </AuthLayout>
    )
  }

  if (!ready) {
    return <div className="spinner-screen"><div className="spinner" /></div>
  }

  return (
    <AuthLayout icon={Lock} title="New password" subtitle="Enter your new password">
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={submit} className="form-stack">
        <label className="form-label">New Password
          <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} leftIcon={Lock} required placeholder="••••••••" />
        </label>
        <label className="form-label">Confirm Password
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} leftIcon={Lock} required placeholder="••••••••" />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <><Loader2 className="spin" size={16} /> Resetting...</> : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  )
}