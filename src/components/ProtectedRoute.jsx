import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function ProtectedRoute({ unauthenticatedElement }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>
  if (!user) return unauthenticatedElement || <Navigate to="/login" replace />
  return <Outlet />
}