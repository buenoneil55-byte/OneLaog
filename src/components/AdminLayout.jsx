import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, LayoutDashboard, Package, ClipboardList, Users, BarChart3, MessageSquare, Settings, LogOut, Bike, Star } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'

const nav = [
    { to: '/admin', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
    { to: '/admin/members', label: 'Members', icon: Users },
    { to: '/admin/sales-report', label: 'Sales Report', icon: BarChart3 },
    { to: '/admin/chats', label: 'Support Chats', icon: MessageSquare },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
       { to: '/admin/riders', label: 'Rider Report', icon: Bike },
    { to: '/admin/feedback', label: 'Feedback', icon: Star },

]

export default function AdminLayout({ title, children }) {
    const { pathname } = useLocation()
    const { profile, logout } = useAuth()

    return (
        <div className="admin-web-layout">
            <aside className="admin-web-sidebar">
                <div className="web-brand"><ShoppingBag size={18} /> OneLaog</div>
                <nav className="web-nav">
                    {nav.map((n) => {
                        const active = n.exact ? pathname === n.to : pathname.startsWith(n.to)
                        return (
                            <Link key={n.to} to={n.to} className={`web-nav-link ${active ? 'active' : ''}`}>
                                <n.icon size={16} /> {n.label}
                            </Link>
                        )
                    })}
                </nav>
                <button className="web-nav-link web-logout" onClick={() => logout('/login')}>
                    <LogOut size={16} /> Log Out
                </button>
            </aside>
            <main className="admin-web-main">
                <header className="admin-web-topbar">
                    <h1 className="web-title">{title}</h1>
                    <div className="web-admin-user">Hi, {profile?.full_name?.split(' ')[0] || 'Admin'}</div>
                </header>
                <div className="admin-web-body">{children}</div>
            </main>
        </div>
    )
}