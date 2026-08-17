import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, MapPin, Trash2, CreditCard, Wallet, Banknote, Phone } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useLang } from '@/lib/LanguageContext'
import { useToast } from '@/components/useToast'

export default function Cart() {
  const { t } = useLang()
  const { updateMe, profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState('COD')

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('cart_items').select('*').eq('buyer_id', user.id)
    setItems(data || [])
    setAddress(profile?.delivery_address || '')
    setPhone(profile?.phone || '')
    setPayment(profile?.preferred_payment === 'Credit/Debit Card' ? 'Card' : (profile?.preferred_payment || 'COD'))
    setLoading(false)
  }

  const updateQty = async (item, delta) => {
    const nq = Math.round((item.quantity + delta) * 100) / 100
    if (nq <= 0) {
      await supabase.from('cart_items').delete().eq('id', item.id)
      setItems((p) => p.filter((i) => i.id !== item.id))
    } else {
      await supabase.from('cart_items').update({ quantity: nq }).eq('id', item.id)
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, quantity: nq } : i))
    }
  }

  const removeItem = async (item) => {
    await supabase.from('cart_items').delete().eq('id', item.id)
    setItems((p) => p.filter((i) => i.id !== item.id))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const deliveryFee = items.length > 0 ? 5.0 : 0
  const total = subtotal + deliveryFee
  const hasAddress = address.trim().length > 0
  const hasPhone = phone.trim().length >= 10
  const canCheckout = items.length > 0 && hasAddress && hasPhone && !placing

  const placeOrder = async () => {
    if (!canCheckout) return
    // Stock check
    for (const item of items) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      if (!prod || (prod.stock || 0) < item.quantity) {
        toast({ title: `Only ${prod?.stock || 0} kg of ${item.product_name} left`, variant: 'destructive' })
        return
      }
    }
    setPlacing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (profile?.delivery_address !== address) await updateMe({ delivery_address: address })
      if (profile?.phone !== phone) await updateMe({ phone })

      const orderNum = 'ORD' + Date.now().toString().slice(-6)
      const tax = 0  // ← ADD THIS LINE (was missing, caused ReferenceError)

      const { error: orderError } = await supabase.from('orders').insert({
        order_number: orderNum, buyer_id: user.id, buyer_name: profile?.full_name || 'Buyer',
        buyer_phone: phone,
        items: items.map((i) => ({ product_id: i.product_id, product_name: i.product_name, image_url: i.image_url, price: i.price, quantity: i.quantity, unit: i.unit })),
        delivery_address: address, subtotal, delivery_fee: deliveryFee, tax, total, status: 'Pending', payment_method: payment,
      })

      if (orderError) {
        toast({ title: 'Failed to place order', description: orderError.message, variant: 'destructive' })
        return
      }

      for (const item of items) {
        const { data: prod } = await supabase.from('products').select('id, stock, available').eq('id', item.product_id).single()
        if (!prod) continue
        const newStock = Math.max(0, (prod.stock || 0) - item.quantity)
        const updates = { stock: newStock }
        if (newStock <= 0) updates.available = false
        await supabase.from('products').update(updates).eq('id', item.product_id)
      }

      await supabase.from('cart_items').delete().eq('buyer_id', user.id)
      await supabase.from('notifications').insert({ title: 'New Order Received', message: `Order #${orderNum} from ${profile?.full_name || 'Buyer'} — ₱${total.toFixed(2)}`, type: 'new_order', order_number: orderNum, buyer_name: profile?.full_name || 'Buyer', read: false })

      toast({ title: 'Order placed!', description: `Order #${orderNum}` })
      navigate('/orders')
    } catch (err) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' })
    } finally {
      setPlacing(false)
    }
  }
  const paymentOptions = [
    { value: 'COD', label: t('cart.cod'), icon: Banknote },
    { value: 'GCash', label: t('cart.gcash'), icon: Wallet },
  ]

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <header className="sticky-header">
        <div className="header-row">
          <button className="icon-btn" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
          <h1 className="header-title">{t('cart.title')}</h1>
        </div>
      </header>
      <div className="section">
        <div className="card">
          <h2 className="card-title">{t('cart.myCart')}</h2>
          {items.length === 0 ? <p className="muted center-text">{t('cart.empty')}</p> : (
            <div className="cart-list">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-thumb">{item.image_url ? <img src={item.image_url} /> : <div className="product-img-placeholder" />}</div>
                  <div className="cart-info"><h3>{item.product_name}</h3><p>₱{Number(item.price).toFixed(2)} {item.unit}</p></div>
                  <div className="qty-inline">
                    <button className="qty-btn" onClick={() => updateQty(item, -0.25)}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button className="qty-btn green" onClick={() => updateQty(item, 0.25)}><Plus size={14} /></button>
                    <button className="trash-btn" onClick={() => removeItem(item)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivery Address */}
        <div className="card">
          <div className="row">
            <MapPin size={16} className="green-icon" />
            <h2 className="card-title" style={{ marginBottom: 0 }}>{t('cart.deliveryAddress')}</h2>
            {!hasAddress && <span className="badge-red">{t('cart.required')}</span>}
          </div>
          <textarea className="input" rows={2} style={{ marginTop: 8 }} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, Street, Barangay, City" />
        </div>

        {/* Phone Number */}
        <div className="card">
          <div className="row">
            <Phone size={16} className="green-icon" />
            <h2 className="card-title" style={{ marginBottom: 0 }}>Contact Number</h2>
            {!hasPhone && <span className="badge-red">{t('cart.required')}</span>}
          </div>
          <div className="input-wrap" style={{ marginTop: 8 }}>
            <Phone className="input-icon" />
            <input className="input search-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917-123-4567" />
          </div>
        </div>

        {/* Payment */}
        <div className="card">
          <h2 className="card-title">{t('cart.paymentMethod')}</h2>
          {paymentOptions.map((opt) => (
            <button key={opt.value} className={`radio-row ${payment === opt.value ? 'active' : ''}`} onClick={() => setPayment(opt.value)}>
              <opt.icon size={18} className={payment === opt.value ? 'green-icon' : 'gray-icon'} />
              <span>{opt.label}</span>
              <span className={`radio ${payment === opt.value ? 'active' : ''}`} />
            </button>
          ))}
        </div>

        {/* Order Info */}
        <div className="card">
          <h2 className="card-title">{t('cart.orderInfo')}</h2>
          <div className="info-row"><span>{t('cart.subtotal')}</span><span>₱{subtotal.toFixed(2)}</span></div>
          <div className="info-row"><span>{t('cart.delivery')}</span><span>₱{deliveryFee.toFixed(2)}</span></div>
          <div className="info-row total-row"><span>{t('cart.total')}</span><strong>₱{total.toFixed(2)}</strong></div>
        </div>

        <button className="btn-primary checkout-btn" disabled={!canCheckout} onClick={placeOrder}>
          {placing ? t('cart.placing') : !hasAddress ? t('cart.enterAddress') : !hasPhone ? 'Enter contact number to continue' : `${t('cart.checkout')} (₱${total.toFixed(2)})`}
        </button>
      </div>
    </div>
  )
}