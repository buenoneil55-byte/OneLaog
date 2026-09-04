import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import AdminLayout from '@/components/AdminLayout'

export default function AdminSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashNumber, setGcashNumber] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [autoReply, setAutoReply] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('app_settings').select('*').in('key', ['help_phone', 'help_email', 'help_hours', 'gcash_name', 'gcash_number', 'delivery_fee', 'help_start_time', 'help_end_time', 'auto_reply_message'])
    ;(data || []).forEach((s) => {
      if (s.key === 'help_phone') setPhone(s.value)
      if (s.key === 'help_email') setEmail(s.value)
      if (s.key === 'help_hours') setHours(s.value)
      if (s.key === 'gcash_name') setGcashName(s.value)
      if (s.key === 'gcash_number') setGcashNumber(s.value)
      if (s.key === 'delivery_fee') setDeliveryFee(String(s.value))
      if (s.key === 'help_start_time') setStartTime(s.value || '08:00')
      if (s.key === 'help_end_time') setEndTime(s.value || '18:00')
      if (s.key === 'auto_reply_message') setAutoReply(s.value || '')
    })
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    for (const u of [
      { key: 'help_phone', value: phone },
      { key: 'help_email', value: email },
      { key: 'help_hours', value: hours },
      { key: 'gcash_name', value: gcashName },
      { key: 'gcash_number', value: gcashNumber },
      { key: 'delivery_fee', value: deliveryFee },
      { key: 'help_start_time', value: startTime },
      { key: 'help_end_time', value: endTime },
      { key: 'auto_reply_message', value: autoReply },
    ]) {
      const { data } = await supabase.from('app_settings').select('*').eq('key', u.key)
      if (data?.length) await supabase.from('app_settings').update({ value: u.value }).eq('id', data[0].id)
      else await supabase.from('app_settings').insert(u)
    }
    setSaving(false)
    toast({ title: 'Settings updated' })
  }

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <AdminLayout title="Help & Support Settings">
      <div className="card form-card">
        <p className="tiny muted">This content appears in the buyer's Help & Support section.</p>
        <label className="form-label">Support Phone Number<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917-123-4567" /></label>
        <label className="form-label">Support Email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@onelog.com" /></label>
        <label className="form-label">Available Hours<textarea className="input" rows={2} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Monday to Saturday, 8AM - 6PM" /></label>
        <label className="form-label">GCash Account Name<input className="input" value={gcashName} onChange={(e) => setGcashName(e.target.value)} placeholder="Juan Dela Cruz" /></label>
        <label className="form-label">GCash Number<input className="input" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="0917-123-4567" /></label>
      </div>
      <div className="card form-card">
        <h2 className="card-title">Delivery Fee</h2>
        <p className="tiny muted">Charged to the buyer at checkout. Leave blank to keep the default ₱5.00.</p>
        <label className="form-label">Delivery Fee (₱)<input className="input" type="number" step="0.01" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="5.00" /></label>
      </div>
      <div className="card form-card">
        <h2 className="card-title">Chat Availability & Auto-Reply</h2>
        <p className="tiny muted">You appear online to buyers while you have the Support Chats page open. Outside the hours below, buyers who message you automatically receive your auto-reply.</p>
        <div className="form-grid2">
          <label className="form-label">Active From<input className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></label>
          <label className="form-label">Active Until<input className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></label>
        </div>
        <label className="form-label">Auto-Reply Message<textarea className="input" rows={3} value={autoReply} onChange={(e) => setAutoReply(e.target.value)} placeholder="Hi! Our support team is available from 8AM to 6PM. We'll reply as soon as we're back. Thank you!" /></label>
      </div>
      <button className="btn-primary" disabled={saving} onClick={save}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
    </AdminLayout>
  )
}