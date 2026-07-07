import React from 'react'
import { ShoppingCart } from 'lucide-react'

export default function ProductCard({ product, onAddToCart, onOrder }) {
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
      <div className="product-actions">
        <button className="btn-add-cart" disabled={outOfStock} onClick={() => onAddToCart(product)}>
          <ShoppingCart size={14} /> Add
        </button>
        <button className="btn-order" disabled={outOfStock} onClick={() => onOrder(product)}>
          Order Now
        </button>
      </div>
    </div>
  )
}