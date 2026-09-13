import React, { useState, useEffect } from 'react'
import { Save, Upload } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import AdminLayout from '@/components/AdminLayout'
import { BRGYS } from '@/lib/brgys'

export default function AdminSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('')
  const [fees, setFees] = useState({})
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [autoReply, setAutoReply] = useState('')
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashQrUrl, setGcashQrUrl] = useState('')
  const [uploadingQr, setUploadingQr] = useState(false)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('app_settings').select('*').in('key', ['help_phone', 'help_email', 'help_hours', 'delivery_fees', 'help_start_time', 'help_end_time', 'auto_reply_message', 'gcash_number', 'gcash_name', 'gcash_qr_url'])
    ;(data || []).forEach((s) => {
      if (s.key === 'help_phone') setPhone(s.value)
      if (s.key === 'help_email') setEmail(s.value)
      if (s.key === 'help_hours') setHours(s.value)
      if (s.key === 'delivery_fees') { try { setFees(JSON.parse(s.value)) } catch (e) { } }
      if (s.key === 'help_start_time') setStartTime(s.value || '08:00')
      if (s.key === 'help_end_time') setEndTime(s.value || '18:00')
      if (s.key === 'auto_reply_message') setAutoReply(s.value || '')
      if (s.key === 'gcash_number') setGcashNumber(s.value || '')
      if (s.key === 'gcash_name') setGcashName(s.value || '')
      if (s.key === 'gcash_qr_url') setGcashQrUrl(s.value || '')
    })
    setLoading(false)
  }

  const uploadQr = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingQr(true)
    const ext = file.name.split('.').pop()
    const path = `gcash-qr/qr_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file)
    if (error) {
      toast({ title: 'QR upload failed: ' + error.message, variant: 'destructive' })
      setUploadingQr(false)
      return
    }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setGcashQrUrl(data.publicUrl)
    setUploadingQr(false)
  }

  const save = async () => {
    setSaving(true)
    for (const u of [
      { key: 'help_phone', value: phone },
      { key: 'help_email', value: email },
      { key: 'help_hours', value: hours },
      { key: 'delivery_fees', value: JSON.stringify(fees) },
      { key: 'help_start_time', value: startTime },
      { key: 'help_end_time', value: endTime },
      { key: 'auto_reply_message', value: autoReply },
      { key: 'gcash_number', value: gcashNumber },
      { key: 'gcash_name', value: gcashName },
      { key: 'gcash_qr_url', value: gcashQrUrl },
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
        <h2 className="card-title">GCash Payment Details</h2>
        <p className="tiny muted">Upload your GCash QR code. Buyers will scan this to pay, then upload their payment receipt. Orders will be "Verifying Payment" until you confirm.</p>
        <label className="form-label">GCash Number<input className="input" value={gcashNumber} onChange={(e) => setGcashNumber(e.target.value)} placeholder="0917-123-4567" /></label>
        <label className="form-label">GCash Account Name<input className="input" value={gcashName} onChange={(e) => setGcashName(e.target.value)} placeholder="OneLaog Store" /></label>
        <label className="form-label">GCash QR Code Image
          <div className="row" style={{ alignItems: 'flex-start', gap: 12, marginTop: 8 }}>
            <label className="upload-area" style={{ width: 160, height: 160, cursor: 'pointer' }}>
              {gcashQrUrl ? <img src={gcashQrUrl} className="upload-preview" /> : <div className="upload-placeholder"><Upload size={24} /><p>{uploadingQr ? 'Uploading...' : 'Upload QR'}</p></div>}
              <input type="file" accept="image/*" onChange={uploadQr} hidden />
            </label>
            {gcashQrUrl && <button className="btn-outline" onClick={() => setGcashQrUrl('')}>Remove QR</button>}
          </div>
        </label>
      </div>
      <div className="card form-card">
        <p className="tiny muted">This content appears in the buyer's Help & Support section.</p>
        <label className="form-label">Support Phone Number<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917-123-4567" /></label>
        <label className="form-label">Support Email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@onelaog.com" /></label>
        <label className="form-label">Available Hours<textarea className="input" rows={2} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Monday to Saturday, 8AM - 6PM" /></label>
      </div>
      <div className="card form-card">
        <h2 className="card-title">Delivery Fees per Barangay (Angat, Bulacan)</h2>
        <p className="tiny muted">Charged to the buyer at checkout based on their selected barangay. Leave blank for free delivery.</p>
        <div className="form-grid2" style={{ marginTop: 8 }}>
          {BRGYS.map((b) => (
            <label key={b} className="form-label">{b}
              <input className="input" type="number" step="0.01" min="0" placeholder="0.00 (free)"
                value={fees[b] ?? ''}
                onChange={(e) => setFees((p) => ({ ...p, [b]: e.target.value }))} />
            </label>
          ))}
        </div>
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