import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, X } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'

const categories = ['Vegetables', 'Meat', 'Fruits', 'Rice']

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', nickname: '', price: '', category: 'Vegetables', unit: 'per Kilo', available: true, image_url: '', stock: '', variants: [] })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data: p }) => {
        if (p) setForm({ name: p.name, nickname: p.nickname || '', price: String(p.price), category: p.category, unit: p.unit, available: p.available, image_url: p.image_url || '', stock: String(p.stock ?? 0), variants: p.variants || [] })
        setLoading(false)
      })
    }
  }, [id])

  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`
    await supabase.storage.from('products').upload(path, file)
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setForm((p) => ({ ...p, image_url: data.publicUrl }))
    setUploading(false)
  }

  const addVariant = () => setForm((p) => ({ ...p, variants: [...p.variants, { name: '', price: '' }] }))
  const updateVariant = (i, f, v) => setForm((p) => ({ ...p, variants: p.variants.map((x, idx) => idx === i ? { ...x, [f]: v } : x) }))
  const removeVariant = (i) => setForm((p) => ({ ...p, variants: p.variants.filter((_, idx) => idx !== i) }))

  const save = async () => {
    if (!form.name || !form.price) { toast({ title: 'Please fill in name and price', variant: 'destructive' }); return }
    setSaving(true)
    const variants = form.variants.filter((v) => v.name && v.price).map((v) => ({ name: v.name, price: parseFloat(v.price) }))
    const data = { name: form.name, nickname: form.nickname, price: parseFloat(form.price), category: form.category, unit: form.unit, available: form.available, image_url: form.image_url, stock: parseInt(form.stock) || 0, variants }
    if (isEdit) { await supabase.from('products').update(data).eq('id', id); toast({ title: 'Product updated' }) }
    else { await supabase.from('products').insert(data); toast({ title: 'Product added' }) }
    setSaving(false)
    navigate('/admin/products')
  }

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <header className="sticky-header"><div className="header-row"><button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button><h1 className="header-title">Manage Product</h1></div></header>
      <div className="section">
        <div className="card">
          <label className="upload-area">
            {form.image_url ? <img src={form.image_url} className="upload-preview" /> : <div className="upload-placeholder"><Upload size={24} /><p>{uploading ? 'Uploading...' : 'Upload Image'}</p></div>}
            <input type="file" accept="image/*" onChange={uploadImage} hidden />
          </label>
        </div>
        <div className="card form-card">
          <label className="form-label">Product Name<input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
          <label className="form-label">Product Nick Name<input className="input" value={form.nickname} onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))} /></label>
          <div className="form-grid2">
            <label className="form-label">Price per kg<input type="number" className="input" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} /></label>
            <label className="form-label">Category
              <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="form-label">Stock (kg)<input type="number" className="input" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} /><p className="tiny muted">Set to 0 to mark as "Out of Stock"</p></label>
          <div className="row between"><label className="form-label">Variants</label><button className="link-btn green" onClick={addVariant}><Plus size={12} /> Add Variant</button></div>
          {form.variants.length === 0 ? <p className="tiny muted">No variants. Add different cuts or sizes.</p> :
            form.variants.map((v, i) => (
              <div key={i} className="variant-row">
                <input className="input" placeholder="Variant name" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
                <input className="input small" type="number" placeholder="Price" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} />
                <button className="trash-btn" onClick={() => removeVariant(i)}><X size={16} /></button>
              </div>
            ))}
          <div className="row between switch-row">
            <div><p className="medium">Available for ordering</p><p className="tiny muted">Toggle off to hide from menu</p></div>
            <label className="switch"><input type="checkbox" checked={form.available} onChange={(e) => setForm((p) => ({ ...p, available: e.target.checked }))} /><span className="slider" /></label>
          </div>
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : isEdit ? 'Update' : 'Add Product'}</button>
        <button className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
      </div>
    </div>
  )
}