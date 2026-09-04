import React, { useState, useEffect, useCallback } from 'react'
import { Bike, Camera, CheckCircle, MapPin, User, Phone, Package } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import DeliveryMap from '@/components/DeliveryMap'

export default function RiderDashboard() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [available, setAvailable] = useState([])
  const [loading, setLoading] = useState(true)
  const [proofTarget, setProofTarget] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [tab, setTab] = useState('active')

  const load = useCallback(async () => {
    if (!profile?.id) return
    const [mine, open] = await Promise.all([
      supabase.from('orders').select('*').eq('rider_id', profile.id).order('created_at', { ascending: false }),
         supabase.from('orders').select('*').in('status', ['Preparing', 'Delivering']).is('rider_id', null).order('created_at', { ascending: false }),
    ])
    setOrders(mine.data || [])
    setAvailable(open.data || [])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel('rider-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, load])

       const acceptOrder = async (o) => {
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ rider_id: profile.id, rider_name: profile?.full_name, status: 'Delivering' })
      .eq('id', o.id)
      .is('rider_id', null)
      .select()
    if (error) {
      toast({ title: 'Could not accept order: ' + error.message, variant: 'destructive' })
      load()
      return
    }
    if (!updated || updated.length === 0) {
      toast({ title: 'Order was already taken or RLS blocked the update. Check your Supabase UPDATE policy.', variant: 'destructive' })
      load()
      return
    }
    await supabase.from('notifications').insert({ title: 'Rider Assigned', message: `${profile?.full_name} is delivering order #${o.order_number || o.id?.slice(-6)}`, type: 'rider', order_number: o.order_number, buyer_name: o.buyer_name, read: false })
    toast({ title: 'Order accepted — marked as Delivering' })
    load()
  }
  const uploadProof = async (e, orderId) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `proofs/${orderId}_${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('delivery-proofs').upload(path, file)
    if (uploadError) {
      setUploading(false); setProofTarget(null)
      toast({ title: 'Upload failed: ' + uploadError.message, variant: 'destructive' })
      return
    }
    const { data } = supabase.storage.from('delivery-proofs').getPublicUrl(path)
    const { error: updateError } = await supabase.from('orders').update({
      delivery_proof_url: data.publicUrl, status: 'Done', delivered_at: new Date().toISOString()
    }).eq('id', orderId)
    setUploading(false); setProofTarget(null)
    if (updateError) { toast({ title: 'Failed to update order: ' + updateError.message, variant: 'destructive' }); return }
    toast({ title: 'Order delivered!' })
    load()
  }

  const paymentLabel = (o) => {
    if (o.payment_method === 'GCash') return o.payment_verified ? 'GCash — already paid ✓' : 'GCash — verifying payment'
    return `Cash on Delivery — collect ₱${Number(o.total).toFixed(2)}`
  }

  const myActive = orders.filter((o) => o.status === 'Delivering')
  const myDone = orders.filter((o) => o.status === 'Done')

  const TABS = [
    { id: 'active', label: 'Active', icon: Bike, count: myActive.length },
    { id: 'available', label: 'Available', icon: Package, count: available.length },
    { id: 'done', label: 'Done', icon: CheckCircle, count: myDone.length },
  ]

  return (
    <div className="page pb-nav">
      <header className="admin-header">
        <div className="header-row"><Bike size={20} /><h1 className="header-title light">Rider Dashboard</h1></div>
        <p className="sub-greeting light">Hi {profile?.full_name?.split(' ')[0] || 'Rider'}! Deliver with care.</p>
      </header>

      <div className="rider-tab-grid">
        {TABS.map((t) => (
          <button key={t.id} className={`rider-tab-icon ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <t.icon size={26} />
            <span>{t.label}</span>
            <span className="rider-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> : <>
          {tab === 'active' && (
            myActive.length === 0 ? <p className="muted center-text">No active deliveries</p> :
            myActive.map((o) => (
              <div key={o.id} className="card">
                <div className="row between">
      <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                  <span className={`status-pill ${o.status}`}>{o.status}</span>
                </div>
                <div className="detail-row"><User size={14} className="gray-icon" /><span className="tiny muted">Buyer:</span><span className="medium">{o.buyer_name}</span></div>
                {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium"><a href__={`tel:${o.buyer_phone}`}>{o.buyer_phone}</a></span></div>}
                {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
        {o.landmark && <p className="tiny muted">Landmark: {o.landmark}</p>}
                <div className="detail-row"><span className="tiny muted">Payment:</span><span className="medium">{paymentLabel(o)}</span></div>
                <DeliveryMap lat={o.delivery_lat} lng={o.delivery_lng} />
                <div className="order-items">
                  {o.items?.map((item, i) => (
                    <div key={i} className="info-row"><span>{item.product_name} ×{item.quantity}</span><span>₱{(item.price * item.quantity).toFixed(2)}</span></div>
                  ))}
                </div>
                {proofTarget === o.id ? (
                  <label className="upload-area" style={{ marginTop: 8 }}>
                    <div className="upload-placeholder"><Camera size={24} /><p>{uploading ? 'Uploading...' : 'Take/Upload Proof Photo'}</p></div>
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => uploadProof(e, o.id)} hidden />
                  </label>
                ) : (
                  <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setProofTarget(o.id)}>
                    <CheckCircle size={16} /> Mark as Delivered
                  </button>
                )}
              </div>
            ))
          )}

          {tab === 'available' && (
            available.length === 0 ? <p className="muted center-text">No available orders</p> :
            available.map((o) => (
              <div key={o.id} className="card">
                <div className="row between">
                  <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                  <span className="status-pill Delivering">Delivering</span>
                </div>
                <p className="tiny muted"><User size={12} className="gray-icon" /> {o.buyer_name}</p>
                {o.delivery_address && <p className="tiny muted"><MapPin size={12} className="purple-icon" /> {o.delivery_address}</p>}
       {o.landmark && <p className="tiny muted">Landmark: {o.landmark}</p>}
                <p className="tiny muted">Payment: <strong>{paymentLabel(o)}</strong></p>
                <DeliveryMap lat={o.delivery_lat} lng={o.delivery_lng} />
                <p className="medium">₱{Number(o.total).toFixed(2)}</p>
                <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => acceptOrder(o)}><Package size={16} /> Accept Delivery</button>
              </div>
            ))
          )}

{tab === 'done' && (
  myDone.length === 0 ? <p className="muted center-text">No completed deliveries yet</p> :
  myDone.map((o) => (
    <div key={o.id} className="card">
      <div className="row between">
        <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
        <span className="status-pill Done">Done</span>
      </div>
      <div className="detail-row"><User size={14} className="gray-icon" /><span className="tiny muted">Buyer:</span><span className="medium">{o.buyer_name}</span></div>
      {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium"><a href__={`tel:${o.buyer_phone}`}>{o.buyer_phone}</a></span></div>}
      {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
     {o.landmark && <p className="tiny muted">Landmark: {o.landmark}</p>}
      <div className="detail-row"><span className="tiny muted">Payment:</span><span className="medium">{paymentLabel(o)}</span></div>
      <div className="order-items">
        {o.items?.map((item, i) => (
          <div key={i} className="info-row"><span>{item.product_name} ×{item.quantity}</span><span>₱{(item.price * item.quantity).toFixed(2)}</span></div>
        ))}
      </div>
      <div className="total-bar"><span className="muted">Total</span><strong className="green">₱{Number(o.total).toFixed(2)}</strong></div>
      <p className="tiny muted" style={{ marginTop: 6 }}>✅ Delivered: {o.delivered_at ? new Date(o.delivered_at).toLocaleString() : 'n/a'}</p>
      {o.delivery_proof_url && (
        <a href={o.delivery_proof_url} target="_blank" rel="noopener noreferrer">
          <img src={o.delivery_proof_url} alt="Proof" style={{ width: '100%', borderRadius: 8, marginTop: 8, cursor: 'pointer' }} />
        </a>
      )}
    </div>
  ))
)}
        </>}
      </div>
      <BottomNav />
    </div>
  )
}