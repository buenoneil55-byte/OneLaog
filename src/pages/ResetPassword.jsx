import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import AuthLayout from '@/components/AuthLayout'
import PasswordInput from '@/components/PasswordInput'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const type = params.get('type')

  const [ready, setReady] = useState(false)
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // When Supabase redirects after clicking the email link, it includes access_token and refresh_token
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(() => setReady(true))
        .catch(() => setError('Invalid or expired reset link'))
    } else if (type === 'recovery') {
      setReady(true)
    }
  }, [accessToken, refreshToken, type])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (pw !== confirm) { setError('Passwords do not match'); return }
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) setError(error.message)
    else window.location.href = '/login'
  }

  if (!accessToken && !type) {
    return (
      <AuthLayout icon={AlertTriangle} title="Invalid reset link" subtitle="This reset link is missing"
        footer={<Link to="/forgot-password" className="link">Request a new link</Link>}>
        <p className="center-text">The link is incomplete. Please request a new reset email.</p>
      </AuthLayout>
    )
  }

  if (!ready && accessToken) {
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