import React, { useState, useEffect } from 'react'
import { X, Minus, Plus } from 'lucide-react'

export default function ProductDetailSheet({ product, open, onOpenChange, onAddToCart }) {
  const [qty, setQty] = useState(1)
  const [variant, setVariant] = useState(null)

  useEffect(() => { setQty(1); setVariant(null) }, [product])

  if (!open || !product) return null

  const price = variant ? variant.price : product.price
  const variants = product.variants || []

  return (
    <div className="overlay" onClick={() => onOpenChange(false)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn sheet-close" onClick={() => onOpenChange(false)}><X size={18} /></button>
        <div className="sheet-img">
          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="product-img-placeholder" />}
        </div>
        <h3 className="medium bold">{product.name}</h3>
        <p className="tiny muted">{product.category} · ₱{Number(price).toFixed(2)} {product.unit || 'per Kilo'}</p>
        <p className="tiny muted">{(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>

        {variants.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            <button className={`radio-row ${!variant ? 'active' : ''}`} style={{ padding: '6px 12px' }} onClick={() => setVariant(null)}>Regular</button>
            {variants.map((v) => (
              <button key={v.name} className={`radio-row ${variant?.name === v.name ? 'active' : ''}`} style={{ padding: '6px 12px' }} onClick={() => setVariant(v)}>
                {v.name} ₱{Number(v.price).toFixed(2)}
              </button>
            ))}
          </div>
        )}

        <div className="row between" style={{ margin: '12px 0' }}>
          <span className="medium">Quantity (kg)</span>
          <div className="qty-inline">
            <button className="qty-btn" onClick={() => setQty((q) => Math.max(0.25, Math.round((q - 0.25) * 100) / 100))}><Minus size={14} /></button>
            <input className="input" type="number" step="0.25" min="0.25" value={qty}
              onChange={(e) => setQty(Math.max(0.25, parseFloat(e.target.value) || 0.25))}
              style={{ width: 70, textAlign: 'center' }} />
            <button className="qty-btn green" onClick={() => setQty((q) => Math.round((q + 0.25) * 100) / 100)}><Plus size={14} /></button>
          </div>
        </div>

        <button className="btn-primary" disabled={(product.stock || 0) < qty}
          onClick={() => { onAddToCart(product, qty, variant); onOpenChange(false) }}>
          Add to Cart — ₱{(price * qty).toFixed(2)}
        </button>
      </div>
    </div>
  )
}