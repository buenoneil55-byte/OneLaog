import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import LanguageToggle from '@/components/LanguageToggle'

export default function AdminSettings() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [hours, setHours] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('app_settings').select('*').in('key', ['help_phone','help_email','help_hours'])
    ;(data || []).forEach((s) => { if (s.key === 'help_phone') setPhone(s.value); if (s.key === 'help_email') setEmail(s.value); if (s.key === 'help_hours') setHours(s.value) })
    setLoading(false)
  }

  const save = async () => {
    setSaving(true)
    for (const u of [{ key: 'help_phone', value: phone }, { key: 'help_email', value: email }, { key: 'help_hours', value: hours }]) {
      const { data } = await supabase.from('app_settings').select('*').eq('key', u.key)
      if (data?.length) await supabase.from('app_settings').update({ value: u.value }).eq('id', data[0].id)
      else await supabase.from('app_settings').insert(u)
    }
    setSaving(false)
    toast({ title: 'Help content updated' })
  }

  if (loading) return <div className="spinner-screen"><div className="spinner" /></div>

  return (
    <div className="page pb-nav">
      <header className="sticky-header"><div className="header-row"><button className="icon-btn" onClick={() => navigate('/admin')}><ArrowLeft size={20} /></button><h1 className="header-title">Help & Support Settings</h1><LanguageToggle className="circle-btn" /></div></header>
      <div className="section">
        <div className="card form-card">
          <p className="tiny muted">This content appears in the buyer's Help & Support section.</p>
          <label className="form-label">Support Phone Number<input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917-123-4567" /></label>
          <label className="form-label">Support Email<input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@onelaog.com" /></label>
          <label className="form-label">Available Hours<textarea className="input" rows={2} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Monday to Saturday, 8AM - 6PM" /></label>
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
      <BottomNav isAdmin />
    </div>
  )
}