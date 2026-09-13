import React, { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, DollarSign, Package, Printer } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import AdminLayout from '@/components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts'

const PIE_COLORS = ['#4CAF50', '#F44336', '#FF9800', '#FFC107']
const ranges = [{ label: 'Daily', value: 'daily' }, { label: 'Weekly', value: 'weekly' }, { label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' }, { label: 'All Time', value: 'all' }]

export default function AdminSalesReport() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('daily')

  useEffect(() => { load() }, [])
  const load = async () => {
    const [o, p] = await Promise.all([supabase.from('orders').select('*').order('created_at', { ascending: false }), supabase.from('products').select('*')])
    setOrders(o.data || []); setProducts(p.data || []); setLoading(false)
  }

  const filteredOrders = (() => {
    if (range === 'all') return orders
    const c = new Date()
    if (range === 'daily') { c.setHours(0, 0, 0, 0); return orders.filter((o) => new Date(o.created_at) >= c) }
    if (range === 'weekly') c.setDate(c.getDate() - 7)
    else if (range === 'monthly') c.setMonth(c.getMonth() - 1)
    else if (range === 'yearly') c.setFullYear(c.getFullYear() - 1)
    return orders.filter((o) => new Date(o.created_at) >= c)
  })()

  const completed = filteredOrders.filter((o) => o.status === 'Done')
  const totalSales = completed.reduce((s, o) => s + (o.total || 0), 0)
  const totalOrders = filteredOrders.length
  const avg = completed.length > 0 ? totalSales / completed.length : 0
  const itemsSold = completed.reduce((s, o) => s + (o.items?.reduce((q, i) => q + i.quantity, 0) || 0), 0)
  const feeTotal = completed.reduce((s, o) => s + (o.delivery_fee || 0), 0)

  const trendData = (() => {
    const now = new Date(); const data = []
    if (range === 'daily') {
      for (let h = 0; h < 24; h += 2) {
        const bucket = filteredOrders.filter((o) => { const d = new Date(o.created_at); return d.getHours() >= h && d.getHours() < h + 2 })
        data.push({ name: `${String(h).padStart(2, '0')}:00`, sales: bucket.filter((o) => o.status === 'Done').reduce((s, o) => s + (o.total || 0), 0), orders: bucket.length })
      }
    } else if (range === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const ds = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        const dayOrders = filteredOrders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString())
        data.push({ name: ds, sales: dayOrders.filter((o) => o.status === 'Done').reduce((s, o) => s + (o.total || 0), 0), orders: dayOrders.length })
      }
    } else if (range === 'monthly') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        const ds = d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
        const dayOrders = filteredOrders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString())
        data.push({ name: ds, sales: dayOrders.filter((o) => o.status === 'Done').reduce((s, o) => s + (o.total || 0), 0), orders: dayOrders.length })
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const ms = d.toLocaleDateString('en', { month: 'short' })
        const monthOrders = filteredOrders.filter((o) => { const od = new Date(o.created_at); return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear() })
        data.push({ name: ms, sales: monthOrders.filter((o) => o.status === 'Done').reduce((s, o) => s + (o.total || 0), 0), orders: monthOrders.length })
      }
    }
    return data
  })()

  const catMap = {}
  completed.forEach((o) => o.items?.forEach((item) => { const p = products.find((x) => x.id === item.product_id); const c = p?.category || 'Other'; catMap[c] = (catMap[c] || 0) + item.price * item.quantity }))
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

  const pMap = {}
  completed.forEach((o) => o.items?.forEach((item) => { if (!pMap[item.product_name]) pMap[item.product_name] = { name: item.product_name, revenue: 0, qty: 0 }; pMap[item.product_name].revenue += item.price * item.quantity; pMap[item.product_name].qty += item.quantity }))
  const topProducts = Object.values(pMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <AdminLayout title="Sales Report">
      <div className="print-only" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>OneLaog — Sales Report ({range})</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#555' }}>Generated {new Date().toLocaleString()}</p>
      </div>

      <div className="row between no-print">
        <div className="range-tabs">{ranges.map((r) => <button key={r.value} className={`range-tab ${range === r.value ? 'active' : ''}`} onClick={() => setRange(r.value)}>{r.label}</button>)}</div>
        <button className="btn-outline" onClick={() => window.print()}><Printer size={16} /> Print Report</button>
      </div>

      <div className="web-stats-grid" style={{ marginTop: 12 }}>
        <div className="web-stat-card"><DollarSign size={14} className="green-icon" /><p className="stat-label">Total Sales</p><p className="web-stat-value">₱{totalSales.toLocaleString('en', { minimumFractionDigits: 2 })}</p></div>
        <div className="web-stat-card"><ShoppingBag size={14} className="blue-icon" /><p className="stat-label">Total Orders</p><p className="web-stat-value">{totalOrders}</p></div>
        <div className="web-stat-card"><TrendingUp size={14} className="orange-icon" /><p className="stat-label">Avg Order Value</p><p className="web-stat-value">₱{avg.toLocaleString('en', { minimumFractionDigits: 2 })}</p></div>
        <div className="web-stat-card"><Package size={14} className="purple-icon" /><p className="stat-label">Items Sold</p><p className="web-stat-value">{itemsSold}</p></div>
        <div className="web-stat-card"><DollarSign size={14} className="green-icon" /><p className="stat-label">Delivery Fees</p><p className="web-stat-value">₱{feeTotal.toFixed(2)}</p></div>
      </div>

      <div className="card"><h2 className="card-title">Sales Trend</h2>
        <ResponsiveContainer width="100%" height={220}><LineChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10, fill: '#999' }} /><Tooltip formatter={(v) => `₱${v.toFixed(2)}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} /><Line type="monotone" dataKey="sales" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
      </div>
      {categoryData.length > 0 && <div className="card"><h2 className="card-title">Sales by Category</h2>
        <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11 }}>{categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v) => `₱${v.toFixed(2)}`} /></PieChart></ResponsiveContainer>
      </div>}
      <div className="card"><h2 className="card-title">Orders Overview</h2>
        <ResponsiveContainer width="100%" height={180}><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="name" tick={{ fontSize: 10, fill: '#999' }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10, fill: '#999' }} allowDecimals={false} /><Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} /><Bar dataKey="orders" fill="#4CAF50" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      {topProducts.length > 0 && <div className="card"><h2 className="card-title">Top Products</h2>
        {topProducts.map((p, i) => <div key={i} className="top-product-row"><span className="rank">{i + 1}</span><span className="medium">{p.name}</span><span><strong>₱{p.revenue.toFixed(2)}</strong> <span className="tiny muted">{p.qty} sold</span></span></div>)}
      </div>}
    </AdminLayout>
  )
}