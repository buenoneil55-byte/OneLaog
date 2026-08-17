import React, { useState, useEffect, useCallback } from 'react'
import { Bike, Camera, CheckCircle, MapPin, User, Phone, Package } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'

export default function RiderDashboard() {
    const { user, profile } = useAuth()
    const { toast } = useToast()
    const [orders, setOrders] = useState([])
    const [available, setAvailable] = useState([])
    const [loading, setLoading] = useState(true)
    const [proofTarget, setProofTarget] = useState(null)
    const [uploading, setUploading] = useState(false)

    // Guard: don't query until we actually have a user id
    const load = useCallback(async () => {
        if (!profile?.id) {
            console.log('NO PROFILE ID yet')
            return
        }
        console.log('Rider profile.id =', profile.id)
        const [mine, open] = await Promise.all([
            supabase.from('orders').select('*').eq('rider_id', profile.id).order('created_at', { ascending: false }),
            supabase.from('orders').select('*').eq('status', 'Delivering').is('rider_id', null).order('created_at', { ascending: false }),
        ])
        console.log('MINE → error:', mine.error, '| count:', mine.data?.length)
        console.log('OPEN → error:', open.error, '| count:', open.data?.length)
        setOrders(mine.data || [])
        setAvailable(open.data || [])
        setLoading(false)
    }, [profile?.id])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        if (!user?.id) return
        const channel = supabase
            .channel('rider-orders-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => load())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user?.id, load])

    const acceptOrder = async (o) => {
        await supabase.from('orders').update({ rider_id: profile.id, rider_name: profile?.full_name }).eq('id', o.id)
        toast({ title: 'Order accepted' })
        load()
    }

    const uploadProof = async (e, orderId) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const ext = file.name.split('.').pop()
        const path = `proofs/${orderId}_${Date.now()}.${ext}`
        await supabase.storage.from('delivery-proofs').upload(path, file)
        const { data } = supabase.storage.from('delivery-proofs').getPublicUrl(path)
        await supabase.from('orders').update({ delivery_proof_url: data.publicUrl, status: 'Done', delivered_at: new Date().toISOString() }).eq('id', orderId)
        setUploading(false); setProofTarget(null)
        toast({ title: 'Order delivered!' })
        load()
    }

    const myActive = orders.filter((o) => o.status === 'Delivering')
    const myDone = orders.filter((o) => o.status === 'Done')

    return (
        <div className="page pb-nav">
            <header className="admin-header">
                <div className="header-row"><Bike size={20} /><h1 className="header-title light">Rider Dashboard</h1></div>
                <p className="sub-greeting light">Hi {profile?.full_name?.split(' ')[0] || 'Rider'}! Deliver with care.</p>
            </header>
            <div className="section">
                <h2 className="card-title">My Active Deliveries ({myActive.length})</h2>
                {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
                    myActive.length === 0 ? <p className="muted center-text">No active deliveries</p> :
                        myActive.map((o) => (
                            <div key={o.id} className="card">
                                <div className="row between">
                                    <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                                    <span className="status-pill Delivering">Delivering</span>
                                </div>
                                <div className="detail-row"><User size={14} className="gray-icon" /><span className="tiny muted">Buyer:</span><span className="medium">{o.buyer_name}</span></div>
                                {o.buyer_phone && <div className="detail-row"><Phone size={14} className="green-icon" /><span className="tiny muted">Phone:</span><span className="medium">{o.buyer_phone}</span></div>}
                                {o.delivery_address && <div className="detail-row"><MapPin size={14} className="purple-icon" /><span className="tiny muted">Address:</span><span className="medium">{o.delivery_address}</span></div>}
                                <div className="order-items">
                                    {o.items?.map((item, i) => (
                                        <div key={i} className="info-row"><span>{item.product_name} ×{item.quantity}</span><span>₱{(item.price * item.quantity).toFixed(2)}</span></div>
                                    ))}
                                </div>
                                {proofTarget === o.id ? (
                                    <label className="upload-area" style={{ marginTop: 8 }}>
                                        <div className="upload-placeholder"><Camera size={24} /><p>{uploading ? 'Uploading...' : 'Take/Upload Proof Photo'}</p></div>
                                        <input type="file" accept="image/*" capture="environment" onChange={(e) => uploadProof(e, o.id)} hidden />
                                    </label>
                                ) : (
                                    <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => setProofTarget(o.id)}>
                                        <CheckCircle size={16} /> Mark as Delivered
                                    </button>
                                )}
                            </div>
                        ))}

                <h2 className="card-title" style={{ marginTop: 16 }}>Available Orders ({available.length})</h2>
                {available.length === 0 ? <p className="muted center-text">No available orders</p> :
                    available.map((o) => (
                        <div key={o.id} className="card">
                            <div className="row between">
                                <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                                <span className="status-pill Delivering">Delivering</span>
                            </div>
                            <p className="tiny muted"><User size={12} className="gray-icon" /> {o.buyer_name}</p>
                            {o.delivery_address && <p className="tiny muted"><MapPin size={12} className="purple-icon" /> {o.delivery_address}</p>}
                            <p className="medium">₱{Number(o.total).toFixed(2)}</p>
                            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => acceptOrder(o)}><Package size={16} /> Accept Delivery</button>
                        </div>
                    ))}

                <h2 className="card-title" style={{ marginTop: 16 }}>Completed ({myDone.length})</h2>
                {myDone.map((o) => (
                    <div key={o.id} className="card">
                        <div className="row between">
                            <h3 className="order-num">#{o.order_number || o.id?.slice(-6)}</h3>
                            <span className="status-pill Done">Done</span>
                        </div>
                        {o.delivery_proof_url && (
                            <a href__={o.delivery_proof_url} target="_blank" rel="noopener noreferrer">
                                <img src={o.delivery_proof_url} alt="Proof" style={{ width: '100%', borderRadius: 8, marginTop: 8, cursor: 'pointer' }} />
                            </a>
                        )}
                    </div>
                ))}
            </div>
            <BottomNav />
        </div>
    )
}