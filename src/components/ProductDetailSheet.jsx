import React, { useState } from 'react'
import { X, ShoppingCart } from 'lucide-react'

export default function ProductDetailSheet({ product, open, onOpenChange, onAddToCart }) {
  const [qty, setQty] = useState(1)
  if (!open || !product) return null
  const outOfStock = !product.available || product.stock <= 0
  const maxStock = product.stock || 0
  const overStock = qty > maxStock
  const presets = [0.5, 1, 1.5, 2, 3]

  const submit = () => {
    onAddToCart(product, qty)
    setQty(1)
    onOpenChange(false)
  }

  return (
    <div className="overlay" onClick={() => onOpenChange(false)}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={() => onOpenChange(false)}><X size={18} /></button>
        <h2 className="sheet-title">{product.name}</h2>
        <div className="sheet-img">
          {product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="product-img-placeholder" />}
        </div>
        <p className="sheet-price">₱{Number(product.price).toFixed(2)} <span>per Kilo</span></p>
        {!outOfStock && <span className="in-stock-badge">{product.stock} in stock</span>}
        <div className="qty-section">
          <label>Kilos</label>
          <div className="qty-controls">
            <button className="qty-btn" onClick={() => setQty(Math.max(0.25, Math.round((qty - 0.25) * 100) / 100))}>-</button>
            <span className="qty-value">{qty} kg</span>
            <button className="qty-btn green" onClick={() => setQty(Math.min(maxStock, Math.round((qty + 0.25) * 100) / 100))}>+</button>
          </div>
          <div className="qty-presets">
            {presets.map((p) => (
              <button key={p} className={`preset ${qty === p ? 'active' : ''}`} disabled={p > maxStock} onClick={() => setQty(p)}>{p} kg</button>
            ))}
          </div>
        </div>
        <div className="sheet-total">
          <span>Total</span>
          <strong>₱{(product.price * qty).toFixed(2)}</strong>
        </div>
        {overStock && <p className="tiny" style={{ color: '#ef4444' }}>Only {maxStock} kg left in stock</p>}
        <button className="btn-primary sheet-submit" disabled={outOfStock || overStock} onClick={submit}>
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>
    </div>
  )
}