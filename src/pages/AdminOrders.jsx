import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, User, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import AdminLayout from '@/components/AdminLayout'

const statuses = ['Pending', 'Preparing', 'Delivering', 'Done', 'Cancelled']
const statusFlow = ['Pending', 'Preparing', 'Delivering', 'Done']

export default function AdminOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [riders, setRiders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
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
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o))
    toast({ title: `Order updated to ${status}` })
  }

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return
    const rider = riders.find((r) => r.id === riderId)
    await supabase.from('orders').update({ rider_id: riderId, rider_name: rider?.full_name, status: 'Delivering' }).eq('id', orderId)
    await supabase.from('notifications').insert({ title: 'New Delivery Assigned', message: `Order #${orderId.slice(-6)} assigned to you`, type: 'rider', read: false })
    setOrders((p) => p.map((o) => o.id === orderId ? { ...o, rider_id: riderId, rider_name: rider?.full_name, status: 'Delivering' } : o))
    toast({ title: 'Rider assigned & marked Delivering' })
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    const matchSearch = !search || (o.order_number || '').toLowerCase().includes(search.toLowerCase()) || (o.buyer_name || '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <AdminLayout title="All Orders">
      <div className="web-filter-bar">
        <div className="input-wrap" style={{ flex: 1 }}>
          <Search className="input-icon" />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search by order # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="web-status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
        filtered.length === 0 ? <p className="muted center-text">No orders found</p> :
          <div className="web-orders-list">
            {filtered.map((o) => {
              const open = expanded === o.id
              const currentIdx = statusFlow.indexOf(o.status)
              return (
                <div key={o.id} className="web-order-card">
                  <button className="web-order-header" onClick={() => setExpanded(open ? null : o.id)}>
                    <div className="web-order-info">
                      <span className="web-order-num">#{o.order_number || o.id?.slice(-6)}</span>
                      <span className={`web-status-pill ${o.status}`}>{o.status}</span>
                      <span className="web-order-customer">{o.buyer_name}</span>
                      {o.rider_name && <span className="web-order-rider">Rider: {o.rider_name}</span>}
                    </div>
                    <div className="web-order-right">
                      <span className="web-order-total">₱{Number(o.total).toFixed(2)}</span>
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>

                  {open && (
                    <div className="web-order-detail">
                      <div className="web-detail-grid">
                        <div className="detail-row"><User size={14} className="gray-icon" /><span className="tiny muted">Buyer:</span><span className="medium">{o.buyer_name}</span></div>
                        {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium">{o.buyer_phone}</span></div>}
                        {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
                        <div className="detail-row"><span className="tiny muted">Payment:</span><span className="medium">{o.payment_method}</span></div>
                      </div>

                      <div className="web-items-box">
                        {o.items?.map((item, i) => (
                          <div key={i} className="info-row"><span>{item.product_name} ×{item.quantity}</span><span>₱{(item.price * item.quantity).toFixed(2)}</span></div>
                        ))}
                        <div className="total-bar"><span className="muted">Total</span><strong className="green">₱{Number(o.total).toFixed(2)}</strong></div>
                      </div>

                      {o.status !== 'Done' && o.status !== 'Cancelled' && (
                        <div className="web-status-actions">
                          {currentIdx >= 0 && currentIdx < statusFlow.length - 1 && (
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
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      }
    </AdminLayout>
  )
}