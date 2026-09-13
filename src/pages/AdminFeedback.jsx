import React, { useState, useEffect } from 'react'
import { Star, Bike, ShoppingBag } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import AdminLayout from '@/components/AdminLayout'

export default function AdminFeedback() {
  const [productReviews, setProductReviews] = useState([])
  const [riderReviews, setRiderReviews] = useState([])
  const [products, setProducts] = useState([])
  const [riders, setRiders] = useState([])
  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('products')

  useEffect(() => { load() }, [])
  const load = async () => {
    const [pr, rr, p, r, b] = await Promise.all([
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('rider_reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, image_url'),
      supabase.from('profiles').select('id, full_name').eq('role', 'rider'),
      supabase.from('profiles').select('id, full_name, email'),
    ])
    setProductReviews(pr.data || [])
    setRiderReviews(rr.data || [])
    setProducts(p.data || [])
    setRiders(r.data || [])
    setBuyers(b.data || [])
    setLoading(false)
  }

  const buyerName = (id) => { const b = buyers.find((x) => x.id === id); return b?.full_name || b?.email || 'Unknown' }
  const productName = (id) => products.find((p) => p.id === id)?.name || 'Unknown Product'
  const productImg = (id) => products.find((p) => p.id === id)?.image_url
  const riderName = (id) => riders.find((r) => r.id === id)?.full_name || 'Unknown Rider'

  const avgProductRating = productReviews.length > 0 ? (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1) : '—'
  const avgRiderRating = riderReviews.length > 0 ? (riderReviews.reduce((s, r) => s + r.rating, 0) / riderReviews.length).toFixed(1) : '—'

  const Stars = ({ rating, size = 14 }) => (
    <div className="row" style={{ gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={size} className={`star ${rating >= s ? 'active' : ''}`} />)}
    </div>
  )

  return (
    <AdminLayout title="Customer Feedback">
      <div className="web-stats-grid">
        <div className="web-stat-card"><ShoppingBag size={14} className="green-icon" /><p className="stat-label">Product Reviews</p><p className="web-stat-value">{productReviews.length}</p></div>
        <div className="web-stat-card"><Bike size={14} className="blue-icon" /><p className="stat-label">Rider Reviews</p><p className="web-stat-value">{riderReviews.length}</p></div>
        <div className="web-stat-card"><Star size={14} className="orange-icon" /><p className="stat-label">Avg Product Rating</p><p className="web-stat-value">{avgProductRating} ⭐</p></div>
        <div className="web-stat-card"><Star size={14} className="purple-icon" /><p className="stat-label">Avg Rider Rating</p><p className="web-stat-value">{avgRiderRating} ⭐</p></div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>Product Reviews ({productReviews.length})</button>
        <button className={`tab ${tab === 'riders' ? 'active' : ''}`} onClick={() => setTab('riders')}>Rider Reviews ({riderReviews.length})</button>
      </div>

      {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
        tab === 'products' ? (
          productReviews.length === 0 ? <p className="muted center-text">No product reviews yet</p> :
          productReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="row" style={{ gap: 10 }}>
                <div className="list-thumb sm">{productImg(r.product_id) ? <img src={productImg(r.product_id)} /> : <div className="product-img-placeholder" />}</div>
                <div className="flex-1">
                  <p className="medium bold">{productName(r.product_id)}</p>
                  <p className="tiny muted">by {buyerName(r.buyer_id)} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="tiny" style={{ marginTop: 8, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>"{r.comment}"</p>}
            </div>
          ))
        ) : (
          riderReviews.length === 0 ? <p className="muted center-text">No rider reviews yet</p> :
          riderReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="row" style={{ gap: 10 }}>
                <div className="user-icon"><Bike size={16} /></div>
                <div className="flex-1">
                  <p className="medium bold">{riderName(r.rider_id)}</p>
                  <p className="tiny muted">by {buyerName(r.buyer_id)} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="tiny" style={{ marginTop: 8, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>"{r.comment}"</p>}
            </div>
          ))
        )
      }
    </AdminLayout>
  )
}