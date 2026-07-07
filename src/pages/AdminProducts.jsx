import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import LanguageToggle from '@/components/LanguageToggle'

export default function AdminProducts() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  const toggleAvailable = async (p) => {
    await supabase.from('products').update({ available: !p.available }).eq('id', p.id)
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, available: !x.available } : x))
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await supabase.from('products').delete().eq('id', deleteTarget.id)
    setProducts((prev) => prev.filter((x) => x.id !== deleteTarget.id))
    toast({ title: 'Product deleted' })
    setDeleteTarget(null)
  }

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="page pb-nav">
      <header className="sticky-header">
        <div className="header-row">
          <button className="icon-btn" onClick={() => navigate('/admin')}><ArrowLeft size={20} /></button>
          <h1 className="header-title">Manage Product</h1>
          <LanguageToggle className="circle-btn" />
        </div>
      </header>
      <div className="section">
        <button className="btn-primary add-product-btn" onClick={() => navigate('/admin/products/new')}><Plus size={18} /> Add Product</button>
        <div className="input-wrap search-wrap">
          <Search className="input-icon" />
          <input className="input" placeholder="Search Product" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
         filtered.map((p) => (
          <div key={p.id} className="card admin-product-row">
            <div className="list-thumb">{p.image_url ? <img src={p.image_url} /> : <div className="product-img-placeholder" />}</div>
            <div className="flex-1">
              <p className="medium bold">{p.name}</p>
              <p className="tiny muted">{p.category} - ₱{Number(p.price).toFixed(2)}</p>
              <span className={`stock-badge ${p.stock > 0 ? 'in' : 'out'}`}>{p.stock > 0 ? `${p.stock} kg in stock` : 'Out of Stock'}</span>
            </div>
            <div className="admin-actions">
              <label className="switch"><input type="checkbox" checked={p.available} onChange={() => toggleAvailable(p)} /><span className="slider" /></label>
              <button className="action-btn edit" onClick={() => navigate(`/admin/products/edit/${p.id}`)}><Edit size={16} /></button>
              <button className="action-btn delete" onClick={() => setDeleteTarget(p)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div className="overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this product?</h3>
            <p>Do you want to delete "{deleteTarget.name}"? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav isAdmin />
    </div>
  )
}