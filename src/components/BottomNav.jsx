import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Clock, User } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function BottomNav({ isAdmin }) {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const admin = isAdmin ?? profile?.role === 'admin'

  const items = admin
    ? [
        { to: '/admin', label: 'Dashboard', icon: Home, match: '/admin' },
        { to: '/admin/products', label: 'Products', icon: ShoppingBag, match: '/admin/products' },
        { to: '/admin/orders', label: 'Orders', icon: Clock, match: '/admin/orders' },
        { to: '/profile', label: 'Profile', icon: User, match: '/profile' },
      ]
    : [
        { to: '/', label: 'Home', icon: Home, match: '/' },
        { to: '/orders', label: 'Orders', icon: Clock, match: '/orders' },
        { to: '/history', label: 'History', icon: Clock, match: '/history' },
        { to: '/profile', label: 'Profile', icon: User, match: '/profile' },
      ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = pathname === item.match || (item.match !== '/' && pathname.startsWith(item.match))
        return (
          <Link key={item.to} to={item.to} className={`nav-item ${active ? 'active' : ''}`}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}