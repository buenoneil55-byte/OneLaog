import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/useToast'

function Dialog({ title, open, onClose, children }) {
  if (!open) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={onClose}><X size={18} /></button>
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export default function ProfileDialogs({ activeDialog, onClose, user, onUserUpdate }) {
  const { updateMe } = useAuth()
  const { toast } = useToast()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('COD')
  const [help, setHelp] = useState({ phone: '', email: '', hours: '' })

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setPhone(user.phone || '')
      setAddress(user.delivery_address || '')
      setPayment(user.preferred_payment || 'COD')
    }
  }, [user])

  useEffect(() => {
    if (activeDialog === 'helpSupport') {
      supabase.from('app_settings').select('*').in('key', ['help_phone','help_email','help_hours']).then(({ data }) => {
        const m = {}
        data?.forEach((s) => (m[s.key] = s.value))
        setHelp({ phone: m.help_phone || '', email: m.help_email || '', hours: m.help_hours || '' })
      })
    }
  }, [activeDialog])

  const save = async (fields) => {
    await updateMe(fields)
    toast({ title: 'Profile updated' })
    onUserUpdate()
    onClose()
  }

  return (
    <>
      <Dialog title="Edit Profile" open={activeDialog === 'editProfile'} onClose={onClose}>
        <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
        <button className="btn-primary sheet-submit" onClick={() => save({ full_name: fullName })}>Save</button>
      </Dialog>
      <Dialog title="Payment Method" open={activeDialog === 'paymentMethod'} onClose={onClose}>
        {['COD','GCash','Card'].map((p) => (
          <button key={p} className={`radio-row ${payment === p ? 'active' : ''}`} onClick={() => setPayment(p)}>
            {p === 'COD' ? 'Cash on Delivery' : p === 'Card' ? 'Credit/Debit Card' : p}
            <span className={`radio ${payment === p ? 'active' : ''}`} />
          </button>
        ))}
        <button className="btn-primary sheet-submit" onClick={() => save({ preferred_payment: payment })}>Save</button>
      </Dialog>
      <Dialog title="Delivery Address" open={activeDialog === 'deliveryAddress'} onClose={onClose}>
        <textarea className="input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no, Street, Barangay, City" />
        <button className="btn-primary sheet-submit" onClick={() => save({ delivery_address: address })}>Save</button>
      </Dialog>
      <Dialog title="Edit Phone Number" open={activeDialog === 'phoneNumber'} onClose={onClose}>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917-123-4567" />
        <button className="btn-primary sheet-submit" onClick={() => save({ phone })}>Save</button>
      </Dialog>
      <Dialog title="Help & Support" open={activeDialog === 'helpSupport'} onClose={onClose}>
        <p className="help-label">Support Phone: <strong>{help.phone || 'N/A'}</strong></p>
        <p className="help-label">Support Email: <strong>{help.email || 'N/A'}</strong></p>
        <p className="help-label">Available Hours: <strong>{help.hours || 'N/A'}</strong></p>
      </Dialog>
    </>
  )
}