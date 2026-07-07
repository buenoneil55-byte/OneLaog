import React, { useState } from 'react'
import { Star, X } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'

export default function ReviewDialog({ open, onClose, product, order, user }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  if (!open || !product) return null

  const submit = async () => {
    setSaving(true)
    await supabase.from('reviews').insert({
      buyer_id: user.id,
      order_id: order.id,
      product_id: product.product_id,
      rating,
      comment,
    })
    setSaving(false)
    toast({ title: 'Review submitted' })
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose}><X size={18} /></button>
        <h2 className="sheet-title">Rate {product.product_name}</h2>
        <div className="stars">
          {[1,2,3,4,5].map((n) => (
            <Star key={n} size={28} className={n <= rating ? 'star active' : 'star'} onClick={() => setRating(n)} />
          ))}
        </div>
        <textarea className="input" rows={3} placeholder="Leave a comment..." value={comment} onChange={(e) => setComment(e.target.value)} />
        <button className="btn-primary sheet-submit" disabled={saving} onClick={submit}>
          {saving ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}