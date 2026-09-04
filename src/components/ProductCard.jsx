import React from 'react'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product, onOrder }) {
  const outOfStock = !product.available || product.stock <= 0
  return (
    <div className="product-card">
      <div className="product-img-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="product-img-placeholder" />
        )}
        {outOfStock && <span className="stock-badge-overlay">Out of Stock</span>}
      </div>
      <p className="product-name">{product.name}</p>
      <p className="product-price">₱{Number(product.price).toFixed(2)} <span>{product.unit}</span></p>
      <p className="tiny muted">{outOfStock ? 'Out of stock' : `${product.stock} in stock`}</p>
      <div className="product-actions">
        <button className="btn-order" disabled={outOfStock} onClick={() => onOrder(product)} style={{ width: '100%' }}>
          <ShoppingCart size={14} /> Order Now
        </button>
      </div>
    </div>
  )
}