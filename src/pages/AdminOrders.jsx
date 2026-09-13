import React, { useState, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import AdminLayout from '@/components/AdminLayout'
import DeliveryMap from '@/components/DeliveryMap'
import { MapPin, Phone, User, Search, CheckCircle } from 'lucide-react'

const statuses = ['Verifying Payment', 'Pending', 'Preparing', 'Delivering', 'Done', 'Cancelled']
const statusFlow = ['Verifying Payment', 'Pending', 'Preparing', 'Delivering', 'Done']
const statusLabel = (s) => s === 'Done' ? 'Delivered' : s

export default function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    const [o, r] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('id, full_name').eq('role', 'rider').eq('banned', false),
    ])
    setOrders(o.data || [])
    setRiders(r.data || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    const updates = { status }
    if (status === 'Preparing') updates.payment_verified = true
    await supabase.from('orders').update(updates).eq('id', id)
    setOrders((p) => p.map((o) => o.id === id ? { ...o, ...updates } : o))
    toast({ title: `Order updated to ${status}` })
  }

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return
    const rider = riders.find((r) => r.id === riderId)
    await supabase.from('orders').update({ rider_id: riderId, rider_name: rider?.full_name, status: 'Delivering' }).eq('id', orderId)
    await supabase.from('notifications').insert({ title: 'New Delivery Assigned', message: `Order #${orderId.slice(-6)} assigned to you`, type: 'rider', for_user_id: riderId, read: false })
    setOrders((p) => p.map((o) => o.id === orderId ? { ...o, rider_id: riderId, rider_name: rider?.full_name, status: 'Delivering' } : o))
    toast({ title: 'Rider assigned & marked Delivering' })
  }

  const tabbed = orders.filter((o) => tab === 'all' || o.status === tab)
  const filtered = tabbed.filter((o) => {
    const matchSearch = !search || (o.order_number || '').toLowerCase().includes(search.toLowerCase()) || (o.buyer_name || '').toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })
  const selected = orders.find((o) => o.id === selectedId)

  return (
    <AdminLayout title="All Orders">
      <div className="web-filter-bar">
        <div className="input-wrap" style={{ flex: 1 }}>
          <Search className="input-icon" />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by order # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="web-status-filter" value={tab} onChange={(e) => setTab(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="tabs">
        {[{ id: 'all', label: 'All' }, ...statuses.map((s) => ({ id: s, label: statusLabel(s) }))].map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
        <div className="admin-orders-split">
          <div className="card">
            <table className="orders-table">
              <thead>
                <tr><th>Order #</th><th>Buyer</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className={`orders-table-row ${selectedId === o.id ? 'selected' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(o.id)}>
                    <td>#{o.order_number || o.id?.slice(-6)}</td>
                    <td>{o.buyer_name}</td>
                    <td><span className={`web-status-pill ${o.status}`}>{statusLabel(o.status)}</span></td>
                    <td style={{ textAlign: 'right' }}>₱{Number(o.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="muted center-text">No orders in this tab</p>}
          </div>

          <div className="card">
            {selected ? (() => {
              const o = selected
              const currentIdx = statusFlow.indexOf(o.status)
              return (
                <>
                  <div className="row between">
                    <h2 className="card-title" style={{ marginBottom: 0 }}>Order #{o.order_number || o.id?.slice(-6)}</h2>
                    <span className={`web-status-pill ${o.status}`}>{statusLabel(o.status)}</span>
                  </div>

                  <div className="web-detail-grid" style={{ marginTop: 10 }}>
                    <div className="detail-row">
                      <span className="tiny muted">Payment:</span>
                      <span className="medium">
                        {o.payment_method}
                        {o.payment_method === 'GCash' && (o.payment_verified
                          ? <span className="green" style={{ marginLeft: 6 }}>✓ Paid via GCash</span>
                          : <span style={{ marginLeft: 6, color: '#f59e0b' }}>— awaiting GCash verification</span>)}
                      </span>
                    </div>
                    {o.status === 'Done' && o.delivered_at && (
                      <div className="detail-row">
                        <CheckCircle size={14} className="green-icon" />
                        <span className="tiny muted">Delivered at:</span>
                        <span className="medium">{new Date(o.delivered_at).toLocaleString()}</span>
                      </div>
                    )}
                    {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium">{o.buyer_phone}</span></div>}
                    {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
                    {o.landmark && <p className="tiny muted">Landmark: {o.landmark}</p>}
                    <DeliveryMap lat={o.delivery_lat} lng={o.delivery_lng} />
                  </div>

                  <div className="web-items-box">
                    {o.items?.map((item, i) => (
                      <div key={i} className="info-row"><span>{item.product_name} ×{item.quantity}</span><span>₱{(item.price * item.quantity).toFixed(2)}</span></div>
                    ))}
                    <div className="total-bar"><span className="muted">Total</span><strong className="green">₱{Number(o.total).toFixed(2)}</strong></div>
                  </div>

                  {o.payment_method === 'GCash' && o.payment_proof_url && (
                    <div className="web-proof-box">
                      <p className="tiny muted">GCash Payment Receipt (uploaded by buyer):</p>
                      <a href={o.payment_proof_url} target="_blank" rel="noopener noreferrer">
                        <img src={o.payment_proof_url} alt="GCash proof" className="web-proof-img" style={{ cursor: 'pointer' }} />
                      </a>
                      {o.status === 'Verifying Payment' && (
                        <div className="row" style={{ marginTop: 8 }}>
                          <button className="btn-primary" onClick={() => updateStatus(o.id, 'Preparing')}>✓ Confirm Payment</button>
                          <button className="btn-danger" onClick={() => updateStatus(o.id, 'Cancelled')}>Reject</button>
                        </div>
                      )}
                    </div>
                  )}

                  {o.status !== 'Done' && o.status !== 'Cancelled' && o.status !== 'Verifying Payment' && (
                    <div className="web-status-actions">
                      {currentIdx >= 1 && currentIdx < statusFlow.length - 1 && (
                        <button className="web-advance-btn" onClick={() => updateStatus(o.id, statusFlow[currentIdx + 1])}>
                          Mark as {statusFlow[currentIdx + 1]}
                        </button>
                      )}
                      {o.status === 'Preparing' && (
                        <select className="web-rider-select" defaultValue="" onChange={(e) => assignRider(o.id, e.target.value)}>
                          <option value="" disabled>Assign Rider…</option>
                          {riders.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                        </select>
                      )}
                      <button className="web-cancel-btn" onClick={() => updateStatus(o.id, 'Cancelled')}>Cancel Order</button>
                    </div>
                  )}

                  {o.status === 'Done' && o.delivery_proof_url && (
                    <div className="web-proof-box">
                      <p className="tiny muted">Delivery Proof (click to enlarge):</p>
                      <a href={o.delivery_proof_url} target="_blank" rel="noopener noreferrer">
                        <img src={o.delivery_proof_url} alt="Proof" className="web-proof-img" style={{ cursor: 'pointer' }} />
                      </a>
                    </div>
                  )}
                </>
              )
            })() : <p className="muted center-text">Select an order on the left to see its details</p>}
          </div>
        </div>
      }
    </AdminLayout>
  )
}