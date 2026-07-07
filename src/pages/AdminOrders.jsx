import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, User } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import LanguageToggle from '@/components/LanguageToggle'

const statuses = ['Pending', 'Confirmed', 'Delivering', 'Done', 'Cancelled']

export default function AdminOrders() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50)
    setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((p) => p.map((o) => o.id === id ? { ...o, status } : o))
    toast({ title: `Order updated to ${status}` })
  }

  return (
    <div className="page pb-nav">
      <header className="sticky-header">
        <div className="header-row">
          <button className="icon-btn" onClick={() => navigate('/admin')}><ArrowLeft size={20} /></button>
          <h1 className="header-title">All Orders</h1>
          <LanguageToggle className="circle-btn" />
        </div>
      </header>
      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
         orders.length === 0 ? <p className="muted center-text">No orders yet</p> :
         orders.map((o) => (
          <div key={o.id} className="card">
            <div className="row between" onClick={() => setExpanded(expanded === o.id ? null : o.id)} style={{ cursor: 'pointer' }}>
              <div>
                <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                <p className="tiny muted">{o.buyer_name} · {new Date(o.created_at).toLocaleString()}</p>
              </div>
              <select className={`status-select ${o.status}`} value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} onClick={(e) => e.stopPropagation()}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Buyer details */}
            {(expanded === o.id) && (
              <div className="buyer-details">
                <div className="detail-row"><User size={14} className="gray-icon" /><span className="tiny muted">Buyer:</span><span className="medium">{o.buyer_name}</span></div>
                {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium">{o.buyer_phone}</span></div>}
                {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
                <div className="detail-row"><span className="tiny muted">Payment:</span><span className="medium">{o.payment_method}</span></div>
              </div>
            )}

            {/* Order items */}
            <div className="order-items" style={{ marginTop: 8 }}>
              {o.items?.map((item, i) => (
                <div key={i} className="info-row">
                  <span>{item.product_name} x{item.quantity}</span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="total-bar">
              <span className="muted">Total</span>
              <strong className="green">₱{Number(o.total).toFixed(2)}</strong>
            </div>

            {/* Tap to expand hint */}
            <p className="tiny muted center-text" style={{ marginTop: 6 }}>
              {expanded === o.id ? 'Tap to hide details ▲' : 'Tap to see buyer details ▼'}
            </p>
          </div>
        ))}
      </div>
      <BottomNav isAdmin />
    </div>
  )
}