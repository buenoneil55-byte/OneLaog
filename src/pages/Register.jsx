import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus, Mail, Lock, Phone, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import GoogleIcon from '@/components/GoogleIcon'
import PasswordInput from '@/components/PasswordInput'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/useToast'

export default function Register() {
  const { register, verifyOtp, resendOtp, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!fullName.trim()) { setError('Please enter your full name'); return }
    if (!phone.trim()) { setError('Please enter your mobile number'); return }
    setLoading(true)
    const { error } = await register(email, password, fullName, phone)
    setLoading(false)
    if (error) setError(error.message)
    else setShowOtp(true)
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)
    const { error } = await verifyOtp(email, otp)
    setLoading(false)
    if (error) setError(error.message)
    else window.location.href = '/'
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Sign up to get started"
      footer={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}>
      {showOtp ? (
        <>
          {error && <div className="error-box">{error}</div>}
          <p className="center-text">We sent a code to {email}</p>
          <input className="input auth-input otp-input" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
          <button className="btn-primary" onClick={handleVerify} disabled={loading || otp.length < 6}>
            {loading ? <><Loader2 className="spin" size={16} /> Verifying...</> : 'Verify'}
          </button>
          <p className="center-text small">Didn't receive the code? <button className="link-btn" onClick={() => resendOtp(email)}>Resend</button></p>
        </>
      ) : (
        <>
          <button className="btn-outline auth-google" onClick={loginWithGoogle}>
            <GoogleIcon size={18} /> Continue with Google
          </button>
          <div className="divider"><span>or</span></div>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit} className="form-stack">
            <label className="form-label">Full Name
              <input className="input auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Juan Dela Cruz" />
            </label>
            <label className="form-label">Mobile Number
              <div className="input-wrap">
                <Phone className="input-icon" />
                <input className="input auth-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="0917-123-4567" />
              </div>
            </label>
            <label className="form-label">Email
              <div className="input-wrap">
                <Mail className="input-icon" />
                <input className="input auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
              </div>
            </label>
            <label className="form-label">Password
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={Lock} required placeholder="••••••••" />
            </label>
            <label className="form-label">Confirm Password
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} leftIcon={Lock} required placeholder="••••••••" />
            </label>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <><Loader2 className="spin" size={16} /> Creating...</> : 'Create account'}
            </button>
          </form>
        </>
      )}
    </AuthLayout>
  )
}