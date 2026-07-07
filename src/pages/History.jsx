import React, { useState, useEffect } from 'react'
import { Clock, Star } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useLang } from '@/lib/LanguageContext'
import BottomNav from '@/components/BottomNav'
import ReviewDialog from '@/components/ReviewDialog'

export default function History() {
  const { t } = useLang()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [reviewProduct, setReviewProduct] = useState(null)
  const [reviewOrder, setReviewOrder] = useState(null)
  const [reviewed, setReviewed] = useState({})

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    const { data: allOrders } = await supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
    setOrders((allOrders || []).filter((o) => o.status === 'Done' || o.status === 'Cancelled'))
    const { data: reviews } = await supabase.from('reviews').select('*').eq('buyer_id', user.id)
    const m = {}
    ;(reviews || []).forEach((r) => (m[`${r.order_id}_${r.product_id}`] = r))
    setReviewed(m)
    setLoading(false)
  }

  return (
    <div className="page pb-nav">
      <header className="sticky-header"><div className="header-row"><Clock size={20} className="green-icon" /><h1 className="header-title">{t('history.title')}</h1></div></header>
      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
         orders.length === 0 ? <p className="muted center-text">{t('history.empty')}</p> :
         orders.map((order) => (
          <div key={order.id} className="card">
            <div className="row between">
              <h3 className="order-num">Order #{order.order_number || order.id?.slice(-6)}</h3>
              <span className={`status-pill ${order.status}`}>{order.status}</span>
            </div>
            <p className="tiny muted">{new Date(order.created_at).toLocaleString()}</p>
            <div className="order-items">
              {order.items?.map((item, i) => {
                const r = reviewed[`${order.id}_${item.product_id}`]
                return (
                  <div key={i} className="order-item-row">
                    <div className="cart-thumb sm">{item.image_url ? <img src={item.image_url} /> : <div className="product-img-placeholder" />}</div>
                    <p className="tiny flex-1 truncate">{item.product_name} ×{item.quantity}</p>
                    <p className="tiny">₱{(item.price * item.quantity).toFixed(2)}</p>
                    {order.status === 'Done' && (r ? <span className="rated"><Star size={12} className="star active" />{r.rating}</span> : <button className="rate-btn" onClick={() => { setReviewProduct(item); setReviewOrder(order) }}>{t('history.rate')}</button>)}
                  </div>
                )
              })}
            </div>
            <div className="total-bar"><span className="muted">{t('cart.total')}</span><strong>₱{Number(order.total).toFixed(2)}</strong></div>
          </div>
        ))}
      </div>
      <ReviewDialog open={!!reviewProduct} onClose={load} product={reviewProduct} order={reviewOrder} user={user} />
      <BottomNav />
    </div>
  )
}