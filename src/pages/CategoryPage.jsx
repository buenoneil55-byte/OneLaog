import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useLang } from '@/lib/LanguageContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import ProductCard from '@/components/ProductCard'
import ProductDetailSheet from '@/components/ProductDetailSheet'
import LanguageToggle from '@/components/LanguageToggle'

export default function CategoryPage() {
  const { t } = useLang()
  const { category } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [orderProduct, setOrderProduct] = useState(null)

  useEffect(() => { load() }, [category])
  const load = async () => {
    setLoading(true)
    let q = supabase.from('products').select('*').eq('available', true)
    if (category !== 'all') q = q.eq('category', category)
    const { data } = await q
    setProducts(data || [])
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: cart } = await supabase.from('cart_items').select('*').eq('buyer_id', user.id)
      setCartCount((cart || []).reduce((s, i) => s + i.quantity, 0))
    }
    setLoading(false)
  }

  const addToCart = async (product, qty = 1) => {
    const { data: { user } } = await supabase.auth.getUser()
    const productName = product.name  // ← ADD THIS
    const { data: existing } = await supabase.from('cart_items').select('*').eq('buyer_id', user.id).eq('product_id', product.id).eq('product_name', productName)
    const inCart = existing?.length ? existing[0].quantity : 0
    if ((product.stock || 0) < inCart + qty) {
      toast({ title: `Only ${product.stock || 0} kg of ${product.name} in stock`, variant: 'destructive' })
      return
    }
    if (existing?.length) await supabase.from('cart_items').update({ quantity: Math.round((existing[0].quantity + qty) * 100) / 100 }).eq('id', existing[0].id)
    else await supabase.from('cart_items').insert({ buyer_id: user.id, product_id: product.id, product_name: productName, image_url: product.image_url || '', price: product.price, quantity: qty, unit: product.unit || 'per Kilo' })
    setCartCount((p) => Math.round((p + qty) * 100) / 100)
    await supabase.from('notifications').insert({ title: 'Added to Cart', message: `${productName} ×${qty}`, type: 'cart', read: false })
    toast({ title: t('home.addedToCart') })
  }

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
  const title = category === 'all' ? t('category.all') : category

  return (
    <div className="page pb-nav">
      <header className="sticky-header">
        <div className="header-row">
          <button className="icon-btn" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
          <h1 className="header-title">{title}</h1>
          <LanguageToggle className="circle-btn" />
          <Link to="/cart" className="circle-btn relative"><ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount % 1 === 0 ? cartCount : cartCount.toFixed(1)}</span>}
          </Link>
        </div>
        <div className="input-wrap">
          <Search className="input-icon" />
          <input className="input search-input" placeholder={t('home.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </header>
      <div className="section">
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
          filtered.length === 0 ? <p className="muted center-text">{t('home.noProducts')}</p> : (
            <div className="product-grid">
              {filtered.map((p) => <ProductCard key={p.id} product={p} onAddToCart={addToCart} onOrder={setOrderProduct} />)}
            </div>
          )}
      </div>
      <ProductDetailSheet product={orderProduct} open={!!orderProduct} onOpenChange={(o) => !o && setOrderProduct(null)} onAddToCart={addToCart} />
      <BottomNav />
    </div>
  )
}