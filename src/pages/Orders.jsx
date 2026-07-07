import React, { useState, useEffect } from 'react'
import { Clock, XCircle } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useLang } from '@/lib/LanguageContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import OrderStatusTracker from '@/components/OrderStatusTracker'

export default function Orders() {
  const { t } = useLang()
  const { toast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
    setOrders((data || []).filter((o) => o.status !== 'Done' && o.status !== 'Cancelled'))
    setLoading(false)
  }

  const cancel = async (id) => {
    setCancelling(id)
    await supabase.from('orders').update({ status: 'Cancelled' }).eq('id', id)
    setOrders((p) => p.filter((o) => o.id !== id))
    setCancelling(null)
    toast({ title: t('orders.cancelled') })
  }

  return (
    <div className="page pb-nav">
      <header className="sticky-header"><div className="header-row"><Clock size={20} className="green-icon" /><h1 className="header-title">{t('orders.title')}</h1></div></header>
      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
         orders.length === 0 ? <p className="muted center-text">{t('orders.noActive')}</p> :
         orders.map((order) => (
          <div key={order.id} className="card">
            <div className="row between">
              <h3 className="order-num">Order #{order.order_number || order.id?.slice(-6)}</h3>
              <span className={`status-pill ${order.status}`}>{order.status}</span>
            </div>
            <div className="tracker-wrap"><OrderStatusTracker status={order.status} /></div>
            <div className="order-items">
              {order.items?.slice(0, 3).map((item, i) => (
                <div key={i} className="order-item-row">
                  <div className="cart-thumb sm">{item.image_url ? <img src={item.image_url} /> : <div className="product-img-placeholder" />}</div>
                  <div className="flex-1"><p className="medium">{item.product_name}</p><p className="tiny muted">×{item.quantity}{item.unit?.includes('Kilo') ? 'kg' : ''}</p></div>
                  <p className="medium">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              {order.items?.length > 3 && <p className="tiny muted">+{order.items.length - 3} {t('orders.moreItems')}</p>}
            </div>
            <div className="total-bar"><span className="muted">{t('cart.total')}</span><strong className="green">₱{Number(order.total).toFixed(2)}</strong></div>
            {order.status === 'Pending' && (
              <button className="btn-cancel" disabled={cancelling === order.id} onClick={() => cancel(order.id)}>
                <XCircle size={14} /> {cancelling === order.id ? t('orders.cancelling') : t('orders.cancel')}
              </button>
            )}
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}