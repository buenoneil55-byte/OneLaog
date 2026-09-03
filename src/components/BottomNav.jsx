import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Clock, User, Bike, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

export default function BottomNav() {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  const rider = profile?.role === 'rider'

  const items = rider
    ? [
      { to: '/rider', label: 'Deliveries', icon: Bike, match: '/rider' },
      { to: '/profile', label: 'Profile', icon: User, match: '/profile' },
    ]
    : [
      { to: '/', label: 'Home', icon: Home, match: '/' },
      { to: '/orders', label: 'Orders', icon: Clock, match: '/orders' },
      { to: '/chat', label: 'Support', icon: MessageSquare, match: '/chat' },
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