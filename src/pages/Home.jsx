import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LanguageContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import ProductCard from '@/components/ProductCard'
import CategoryBadge from '@/components/CategoryBadge'
import ProductDetailSheet from '@/components/ProductDetailSheet'
import LanguageToggle from '@/components/LanguageToggle'

const categories = ['Vegetables', 'Meat', 'Fruits', 'Rice']

export default function Home() {
  const { profile } = useAuth()
  const { t } = useLang()
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [orderProduct, setOrderProduct] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data: prods } = await supabase.from('products').select('*').eq('available', true).order('created_at', { ascending: false })
    setProducts(prods || [])
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: cart } = await supabase.from('cart_items').select('*').eq('buyer_id', user.id)
      setCartCount((cart || []).reduce((s, i) => s + i.quantity, 0))
    }
    setLoading(false)
  }

  const addToCart = async (product, qty = 1, variant = null) => {
    const { data: { user } } = await supabase.auth.getUser()
    const price = variant ? variant.price : product.price
    const productName = variant ? `${product.name} (${variant.name})` : product.name
    const { data: existing } = await supabase.from('cart_items').select('*').eq('buyer_id', user.id).eq('product_id', product.id).eq('product_name', productName)
    if (existing && existing.length > 0) {
      await supabase.from('cart_items').update({ quantity: Math.round((existing[0].quantity + qty) * 100) / 100 }).eq('id', existing[0].id)
    } else {
      await supabase.from('cart_items').insert({ buyer_id: user.id, product_id: product.id, product_name: productName, image_url: product.image_url || '', price, quantity: qty, unit: product.unit || 'per Kilo' })
    }
    setCartCount((p) => Math.round((p + qty) * 100) / 100)
    toast({ title: t('home.addedToCart'), description: `${productName} ×${qty}kg` })
  }

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  if (profile?.role === 'admin') {
    return <div className="center-screen"><p className="muted">You're logged in as admin.</p><Link to="/admin" className="btn-primary">Go to Admin Dashboard</Link></div>
  }

  return (
    <div className="page pb-nav">
      <header className="home-header">
        <div className="home-top-row">
          <div>
            <p className="brand">{t('home.brand')}</p>
            <h1 className="greeting">{t('home.greeting')} {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="sub-greeting">{t('home.subtitle')}</p>
          </div>
          <div className="home-actions">
            <LanguageToggle className="circle-btn" />
            <Link to="/cart" className="circle-btn relative"><ShoppingCart size={20} />
              {cartCount > 0 && <span className="cart-badge">{cartCount % 1 === 0 ? cartCount : cartCount.toFixed(1)}</span>}
            </Link>
          </div>
        </div>
        <div className="input-wrap">
          <Search className="input-icon" />
          <input className="input search-input" placeholder={t('home.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>

      <div className="categories-row">
        {categories.map((cat) => <Link key={cat} to={`/category/${cat}`}><CategoryBadge category={cat} /></Link>)}
      </div>

      <section className="section">
        <div className="section-head">
          <h2>{t('home.popular')}</h2>
          <Link to="/category/all" className="link green">{t('home.seeAll')}</Link>
        </div>
        {filtered.length === 0 ? <p className="muted center-text">{t('home.noProducts')}</p> : (
          <div className="product-grid">
            {filtered.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} onOrder={setOrderProduct} />
            ))}
          </div>
        )}
      </section>

      <ProductDetailSheet product={orderProduct} open={!!orderProduct} onOpenChange={(o) => !o && setOrderProduct(null)} onAddToCart={addToCart} />
      <BottomNav />
    </div>
  )
}