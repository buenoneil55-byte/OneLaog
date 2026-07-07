import React from 'react'
import { Carrot, Beef, Apple, Wheat } from 'lucide-react'

const config = {
  Vegetables: { icon: Carrot, bg: '#E8F5E9', color: '#2E7D32' },
  Meat: { icon: Beef, bg: '#FFEBEE', color: '#C62828' },
  Fruits: { icon: Apple, bg: '#FFF3E0', color: '#EF6C00' },
  Rice: { icon: Wheat, bg: '#FFFDE7', color: '#F9A825' },
}

export default function CategoryBadge({ category }) {
  const c = config[category] || { icon: Carrot, bg: '#f3f4f6', color: '#374151' }
  const Icon = c.icon
  return (
    <div className="category-badge" style={{ background: c.bg }}>
      <div className="category-icon" style={{ color: c.color }}>
        <Icon size={28} />
      </div>
      <span style={{ color: c.color }}>{category}</span>
    </div>
  )
}