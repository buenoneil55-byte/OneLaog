import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react'
import AuthLayout from '@/components/AuthLayout'
import GoogleIcon from '@/components/GoogleIcon'
import PasswordInput from '@/components/PasswordInput'
import { useAuth } from '@/lib/AuthContext'

export default function Login() {
  const { login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  setError("");

  const res = await login(email, password)

console.log("RES:", res)
console.log("success:", res?.success)
console.log("message:", res?.message)
console.log("typeof message:", typeof res?.message)

  setLoading(false);

  if (!res.success) {
    setError(res.message);
    return;
  }

  window.location.href = "/";
};

  return (
    <AuthLayout icon={LogIn} title="Welcome back" subtitle="Log in to your account"
      footer={<>Don't have an account? <Link to="/register" className="link">Create one</Link></>}>
      <button className="btn-outline auth-google" onClick={loginWithGoogle}>
        <GoogleIcon size={18} /> Continue with Google
      </button>
      <div className="divider"><span>or</span></div>
      {error && <div className="error-box">{error}</div>}
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">Email
          <div className="input-wrap">
            <Mail className="input-icon" />
            <input className="input auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
        </label>
        <label className="form-label">Password
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={Lock} required placeholder="••••••••" />
        </label>
        <Link to="/forgot-password" className="link small">Forgot password?</Link>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? <><Loader2 className="spin" size={16} /> Logging in...</> : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}