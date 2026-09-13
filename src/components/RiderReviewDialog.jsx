import React, { useState, useEffect } from 'react'
import { Star, Bike, X } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'

export default function RiderReviewDialog({ open, onClose, order, user }) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [existing, setExisting] = useState(null)

  useEffect(() => {
    if (open && order && user) {
      setRating(0); setHover(0); setComment(''); setExisting(null)
      supabase.from('rider_reviews').select('*').eq('order_id', order.id).eq('buyer_id', user.id).maybeSingle()
        .then(({ data }) => { if (data) { setExisting(data); setRating(data.rating); setComment(data.comment || '') } })
    }
  }, [open, order, user])

  if (!open || !order) return null

  const submit = async () => {
    if (rating === 0) { toast({ title: 'Please select a rating', variant: 'destructive' }); return }
    setSaving(true)
    if (existing) {
      await supabase.from('rider_reviews').update({ rating, comment }).eq('id', existing.id)
    } else {
      await supabase.from('rider_reviews').insert({ order_id: order.id, rider_id: order.rider_id, buyer_id: user.id, rating, comment })
    }
    setSaving(false)
    toast({ title: 'Rider rated!' })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="row between">
          <h3><Bike size={18} className="green-icon" /> Rate your rider</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="medium" style={{ marginTop: 8 }}>{order.rider_name || 'Rider'}</p>
        <div className="row" style={{ gap: 4, margin: '12px 0' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={32} className={`star ${(hover || rating) >= s ? 'active' : ''}`} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setRating(s)} style={{ cursor: 'pointer' }} />
          ))}
        </div>
        <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Leave a comment (optional)..." />
        <button className="btn-primary" disabled={saving} onClick={submit} style={{ marginTop: 12 }}>{saving ? 'Saving...' : 'Submit Rating'}</button>
      </div>
    </div>
  )
}