import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <img src="/logo.png" alt="One Laog Logo" className="auth-logo" />
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        <div className="auth-body">{children}</div>
        <div className="auth-footer">{footer}</div>
      </div>
      <Link to="/" className="auth-home-link">← Back to home</Link>
    </div>
  )
}