import React, { useState, useEffect } from 'react'
import { Clock, XCircle, Bike, Star } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useLang } from '@/lib/LanguageContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import OrderStatusTracker from '@/components/OrderStatusTracker'
import ReviewDialog from '@/components/ReviewDialog'
import RiderReviewDialog from '@/components/RiderReviewDialog'

export default function Orders() {
  const { t } = useLang()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [tab, setTab] = useState('active')
  const [user, setUser] = useState(null)
  const [reviewed, setReviewed] = useState({})
  const [riderReviewed, setRiderReviewed] = useState({})
  const [reviewProduct, setReviewProduct] = useState(null)
  const [reviewOrder, setReviewOrder] = useState(null)
  const [riderReviewOrder, setRiderReviewOrder] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data } = await supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
    setOrders(data || [])
    const { data: reviews } = await supabase.from('reviews').select('*').eq('buyer_id', user.id)
    const m = {}
    ;(reviews || []).forEach((r) => (m[`${r.order_id}_${r.product_id}`] = r))
    setReviewed(m)
    const { data: rReviews } = await supabase.from('rider_reviews').select('*').eq('buyer_id', user.id)
    const rm = {}
    ;(rReviews || []).forEach((r) => (rm[r.order_id] = r))
    setRiderReviewed(rm)
    setLoading(false)
  }

  const activeOrders = orders.filter((o) => o.status !== 'Done' && o.status !== 'Cancelled')
  const historyOrders = orders.filter((o) => o.status === 'Done' || o.status === 'Cancelled')
  const visible = tab === 'active' ? activeOrders : historyOrders

  const cancel = async (id) => {
    setCancelling(id)
    await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', id)
    setOrders((p) => p.filter((o) => o.id !== id))
    setCancelling(null)
    toast({ title: t('orders.cancelled') })
  }

  return (
    <div className="page pb-nav">
      <header className="sticky-header">
        <div className="header-row"><Clock size={20} className="green-icon" /><h1 className="header-title">{t('orders.title')}</h1></div>
        <div className="tabs" style={{ marginTop: 8 }}>
          <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
        </div>
      </header>
      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
          visible.length === 0 ? <p className="muted center-text">{tab === 'active' ? t('orders.noActive') : 'No completed orders yet'}</p> :
            visible.map((order) => (
              <div key={order.id} className="card">
                <div className="row between">
                  <h3 className="order-num">Order #{order.order_number || order.id?.slice(-6)}</h3>
                  <span className={`status-pill ${order.status}`}>{order.status}</span>
                </div>
                {tab === 'history' && <p className="tiny muted">{new Date(order.created_at).toLocaleString()}</p>}
                {order.rider_name && (
                  <div className="detail-row" style={{ marginTop: 6 }}>
                    <Bike size={14} className="green-icon" />
                    <span className="tiny muted">Rider:</span>
                    <span className="medium">{order.rider_name}</span>
                  </div>
                )}
                {order.status !== 'Done' && order.status !== 'Cancelled' && (
                  <div className="tracker-wrap"><OrderStatusTracker status={order.status} /></div>
                )}
                <div className="order-items">
                  {order.items?.slice(0, 3).map((item, i) => {
                    const r = reviewed[`${order.id}_${item.product_id}`]
                    return (
                      <div key={i} className="order-item-row">
                        <div className="cart-thumb sm">{item.image_url ? <img src={item.image_url} /> : <div className="product-img-placeholder" />}</div>
                        <div className="flex-1"><p className="medium">{item.product_name}</p><p className="tiny muted">×{item.quantity}{item.unit?.includes('Kilo') ? 'kg' : ''}</p></div>
                        <p className="medium">₱{(item.price * item.quantity).toFixed(2)}</p>
                        {order.status === 'Done' && (r
                          ? <span className="rated"><Star size={12} className="star active" />{r.rating}</span>
                          : <button className="rate-btn" onClick={() => { setReviewProduct(item); setReviewOrder(order) }}>Rate</button>)}
                      </div>
                    )
                  })}
                  {order.items?.length > 3 && <p className="tiny muted">+{order.items.length - 3} {t('orders.moreItems')}</p>}
                </div>
                <div className="total-bar"><span className="muted">{t('cart.total')}</span><strong className="green">₱{Number(order.total).toFixed(2)}</strong></div>

                {order.status === 'Done' && order.rider_name && (
                  <div className="row between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                    <span className="tiny muted"><Bike size={12} className="green-icon" /> Rate rider: {order.rider_name}</span>
                    {riderReviewed[order.id]
                      ? <span className="rated"><Star size={12} className="star active" />{riderReviewed[order.id].rating}</span>
                      : <button className="rate-btn" onClick={() => setRiderReviewOrder(order)}>Rate Rider</button>}
                  </div>
                )}

                {order.status === 'Done' && order.delivery_proof_url && (
                  <div style={{ marginTop: 8 }}>
                    <p className="tiny muted">Delivery Proof (click to enlarge):</p>
                    <a href__={order.delivery_proof_url} target="_blank" rel="noopener noreferrer">
                      <img src={order.delivery_proof_url} alt="Proof" style={{ width: '100%', borderRadius: 8, marginTop: 4, cursor: 'pointer' }} />
                    </a>
                  </div>
                )}
                {order.status === 'Pending' && (
                  <button className="btn-cancel" disabled={cancelling === order.id} onClick={() => cancel(order.id)}>
                    <XCircle size={14} /> {cancelling === order.id ? t('orders.cancelling') : t('orders.cancel')}
                  </button>
                )}
              </div>
            ))}
      </div>
         <ReviewDialog open={!!reviewProduct} onClose={() => { setReviewProduct(null); setReviewOrder(null); load() }} product={reviewProduct} order={reviewOrder} user={user} />
      <RiderReviewDialog open={!!riderReviewOrder} onClose={() => { setRiderReviewOrder(null); load() }} order={riderReviewOrder} user={user} />
      <BottomNav />
    </div>
  )
}