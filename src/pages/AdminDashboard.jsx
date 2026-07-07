import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Users, FileBarChart, Settings, User, Bell, ChevronRight } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'
import LanguageToggle from '@/components/LanguageToggle'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('weekly')

  useEffect(() => { load() }, [])
  const load = async () => {
    const [o, p, u, n] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('read', false).order('created_at', { ascending: false }).limit(10),
    ])
    setOrders(o.data || []); setProducts(p.data || []); setUsers(u.data || []); setNotifications(n.data || [])
    setLoading(false)
  }

  const totalSales = orders.filter((o) => o.status === 'Done').reduce((s, o) => s + (o.total || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'Pending').length

const chartData = (() => {
  const now = new Date()
  const data = []

  if (range === 'weekly') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)

      const ds = d.toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      })

      const dayOrders = orders.filter(
        (order) =>
          new Date(order.created_at).toDateString() === d.toDateString()
      )

      data.push({
        name: ds,
        sales: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      })
    }
  } else if (range === 'monthly') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)

      const ds = d.toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
      })

      const dayOrders = orders.filter(
        (order) =>
          new Date(order.created_at).toDateString() === d.toDateString()
      )

      data.push({
        name: ds,
        sales: dayOrders.reduce((sum, order) => sum + (order.total || 0), 0),
      })
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)

      const monthName = d.toLocaleDateString('en', {
        month: 'short',
      })

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.created_at)

        return (
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getFullYear() === d.getFullYear()
        )
      })

      data.push({
        name: monthName,
        sales: monthOrders.reduce(
          (sum, order) => sum + (order.total || 0),
          0
        ),
      })
    }
  }

  return data
})()

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <div className="page pb-nav">
      <div className="admin-header">
        <div className="header-row">
          <div className="brand-row"><div className="circle-btn"><ShoppingBag size={14} /></div><span className="brand-text">OneLaog Dashboard</span></div>
          <div className="header-actions">
            <Link to="/admin/members" className="circle-btn"><Users size={18} /></Link>
            <Link to="/admin/sales-report" className="circle-btn"><FileBarChart size={18} /></Link>
            <Link to="/admin/settings" className="circle-btn"><Settings size={18} /></Link>
            <LanguageToggle className="circle-btn" />
            <Link to="/profile" className="circle-btn"><User size={18} /></Link>
          </div>
        </div>
        <h1 className="greeting">Hello, {profile?.full_name?.split(' ')[0] || 'Admin'}!</h1>
        <p className="sub-greeting light">Here's an overview of your farm management.</p>
      </div>
      <div className="section stats-grid">
        <div className="card stat-card"><p className="stat-label">Total Sales</p><p className="stat-value">₱{totalSales.toLocaleString('en', { minimumFractionDigits: 2 })}</p></div>
        <div className="card stat-card yellow"><p className="stat-label">Pending Orders</p><p className="stat-value">{pendingCount} Pending</p></div>
      </div>
      {notifications.length > 0 && (
        <div className="section">
          <div className="card">
            <div className="row"><Bell size={14} className="green-icon" /><h2 className="card-title">New Notifications</h2><span className="notif-count">{notifications.length}</span></div>
            <div className="notif-list">
              {notifications.map((n) => (
                <div key={n.id} className="notif-item"><div className="notif-dot" /><div><p className="medium">{n.title}</p><p className="tiny muted truncate">{n.message}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="section">
        <div className="card">
          <div className="row between"><h2 className="card-title">Sales & Orders</h2>
            <div className="range-tabs">{['weekly','monthly','yearly'].map((r) => (
              <button key={r} className={`range-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r[0].toUpperCase()+r.slice(1)}</button>
            ))}</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#999' }} />
              <Bar dataKey="sales" fill="#4CAF50" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="section">
        <div className="row between"><h2 className="card-title">Manage Products</h2><Link to="/admin/products" className="link green">See All <ChevronRight size={12} /></Link></div>
        <div className="card list-card">
          {products.slice(0, 4).map((p) => (
            <div key={p.id} className="list-row">
              <div className="list-thumb">{p.image_url ? <img src={p.image_url} /> : <div className="product-img-placeholder" />}</div>
              <div className="flex-1"><p className="medium truncate">{p.name}</p><p className="tiny muted">{p.category}</p></div>
              <p className="medium">₱{Number(p.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="row between"><h2 className="card-title">Manage Members</h2><Link to="/admin/members" className="link green">See All <ChevronRight size={12} /></Link></div>
        <div className="card list-card">
          {users.slice(0, 4).map((u) => (
            <div key={u.id} className="list-row">
              <div className="user-icon"><User size={14} /></div>
              <div className="flex-1"><p className="medium truncate">{u.full_name || u.email}</p><p className="tiny muted capitalize">{u.role}{u.banned ? ' · Banned' : ''}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="section">
        <h2 className="card-title">Recent Orders</h2>
        <div className="order-list">
          {orders.slice(0, 3).map((o) => (
            <div key={o.id} className="card order-mini">
              <div><p className="medium">#{o.order_number || o.id?.slice(-6)}</p><p className="tiny muted">{o.buyer_name}</p></div>
              <div className="right"><p className="medium">₱{Number(o.total).toFixed(2)}</p><span className={`status-pill ${o.status}`}>{o.status}</span></div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav isAdmin />
    </div>
  )
}