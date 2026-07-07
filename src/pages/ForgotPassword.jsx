import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/AuthContext'

export default function ForgotPassword() {
  const { resetPasswordRequest } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await resetPasswordRequest(email)
    setLoading(false)
    setSent(true)
  }

  return (
    <AuthLayout icon={Mail} title="Reset password" subtitle="We'll send you a link to reset it"
      footer={<Link to="/login" className="link"><ArrowLeft size={12} className="inline mr-1" />Back to log in</Link>}>
      {sent ? <p className="center-text">If an account exists with that email, you'll receive a reset link shortly.</p> : (
        <form onSubmit={submit} className="form-stack">
          <label className="form-label">Email address
            <div className="input-wrap">
              <Mail className="input-icon" />
              <input className="input auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
          </label>
          <button className="btn-primary" type="submit" disabled={loading}>Send reset link</button>
        </form>
      )}
    </AuthLayout>
  )
}