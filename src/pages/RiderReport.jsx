import React, { useState, useEffect } from 'react'
import { Bike, Printer } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import AdminLayout from '@/components/AdminLayout'

export default function RiderReport() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('COD')
  const [riderFilter, setRiderFilter] = useState('all')

  useEffect(() => { load() }, [date])
  const load = async () => {
    setLoading(true)
    const start = new Date(date + 'T00:00:00').toISOString()
    const end = new Date(date + 'T23:59:59').toISOString()
    const [o, r] = await Promise.all([
      supabase.from('orders').select('*').eq('status', 'Done').gte('delivered_at', start).lte('delivered_at', end).order('delivered_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'rider').eq('banned', false).order('full_name', { ascending: true }),
    ])
    setOrders(o.data || [])
    setRiders(r.data || [])
    setLoading(false)
  }

  const filtered = orders.filter((o) => o.payment_method === tab && (riderFilter === 'all' || o.rider_id === riderFilter))
  const byRider = {}
  filtered.forEach((o) => {
    const name = o.rider_name || 'Unassigned'
    if (!byRider[name]) byRider[name] = { name, count: 0, productTotal: 0, feeTotal: 0, grandTotal: 0, orders: [] }
    byRider[name].count++
    byRider[name].productTotal += o.subtotal || 0
    byRider[name].feeTotal += o.delivery_fee || 0
    byRider[name].grandTotal += o.total || 0
    byRider[name].orders.push(o)
  })
  const ridersList = riders.map((r) => byRider[r.full_name] || { name: r.full_name, count: 0, productTotal: 0, feeTotal: 0, grandTotal: 0, orders: [] })
  const displayRiders = riderFilter === 'all' ? ridersList : ridersList.filter((r) => r.name === riders.find((x) => x.id === riderFilter)?.full_name)
  const grandOrders = displayRiders.reduce((s, r) => s + r.count, 0)
  const grandProduct = displayRiders.reduce((s, r) => s + r.productTotal, 0)
  const grandFee = displayRiders.reduce((s, r) => s + r.feeTotal, 0)
  const grandTotal = displayRiders.reduce((s, r) => s + r.grandTotal, 0)
  const peso = (n) => `₱${Number(n).toFixed(2)}`

  return (
    <AdminLayout title="Rider Delivery Report">
      <div className="print-only" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>OneLaog — Rider {tab} Deliveries</h2>
        <p style={{ margin: 0, fontSize: 12, color: '#555' }}>{date} · Generated {new Date().toLocaleString()}</p>
      </div>

      <div className="web-filter-bar no-print">
        <input className="input" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 180 }} />
        <select className="input" value={riderFilter} onChange={(e) => setRiderFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="all">All Riders</option>
          {riders.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
        </select>
        <div className="tabs">
          {['COD', 'GCash'].map((p) => <button key={p} className={`tab ${tab === p ? 'active' : ''}`} onClick={() => setTab(p)}>{p === 'COD' ? 'COD (cash collected)' : 'GCash (prepaid)'}</button>)}
        </div>
        <button className="btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button>
      </div>

      {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
        displayRiders.length === 0 ? <p className="muted center-text">No riders found</p> : <>
          <div className="web-stats-grid" style={{ marginTop: 12 }}>
            <div className="web-stat-card"><p className="stat-label">Deliveries</p><p className="web-stat-value">{grandOrders}</p></div>
            <div className="web-stat-card"><p className="stat-label">Product Amount</p><p className="web-stat-value">{peso(grandProduct)}</p></div>
            <div className="web-stat-card"><p className="stat-label">Delivery Fees</p><p className="web-stat-value">{peso(grandFee)}</p></div>
            <div className="web-stat-card"><p className="stat-label">{tab === 'COD' ? 'Cash to Turn Over' : 'GCash Total'}</p><p className="web-stat-value">{peso(grandTotal)}</p></div>
          </div>

          {displayRiders.map((r) => (
            <div key={r.name} className="card" style={{ marginTop: 12 }}>
              <div className="row between">
                <h2 className="card-title" style={{ marginBottom: 0 }}><Bike size={16} className="green-icon" /> {r.name}</h2>
                <span className="role-badge admin">{r.count} delivered</span>
              </div>
              <div className="order-items" style={{ marginTop: 8 }}>
                <div className="info-row"><span>Product amount</span><span>{peso(r.productTotal)}</span></div>
                <div className="info-row"><span>Delivery fees</span><span>{peso(r.feeTotal)}</span></div>
                <div className="info-row total-row"><span>{tab === 'COD' ? 'Cash to turn over' : 'GCash total'}</span><strong className="green">{peso(r.grandTotal)}</strong></div>
              </div>
              {r.orders.length > 0 ? (
                <div className="order-list" style={{ marginTop: 8 }}>
                  {r.orders.map((o) => (
                    <div key={o.id} className="card order-mini">
                      <div><p className="medium">#{o.order_number || o.id?.slice(-6)}</p><p className="tiny muted">{o.buyer_name} · {o.barangay || o.delivery_address} · {o.delivered_at ? new Date(o.delivered_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</p></div>
                      <div className="right"><p className="tiny muted">products {peso(o.subtotal)} + fee {peso(o.delivery_fee)}</p><p className="medium">{peso(o.total)}</p></div>
                    </div>
                  ))}
                </div>
              ) : <p className="tiny muted" style={{ marginTop: 8 }}>No deliveries on this date</p>}
            </div>
          ))}
        </>}
    </AdminLayout>
  )
}