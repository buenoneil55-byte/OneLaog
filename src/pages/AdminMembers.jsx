import React, { useState, useEffect } from 'react'
import { Ban, CheckCircle2, User as UserIcon, Search } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import AdminLayout from '@/components/AdminLayout'

export default function AdminMembers() {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [toggling, setToggling] = useState(null)

  useEffect(() => { load() }, [])
  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const toggleBan = async (u) => {
    setToggling(u.id)
    const count = u.fake_booking_count || 0
    if (!u.banned && count < 3) {
      const newCount = count + 1
      await supabase.from('profiles').update({ fake_booking_count: newCount, warned_at: new Date().toISOString() }).eq('id', u.id)
      await supabase.from('booking_warnings').insert({ user_id: u.id, reason: 'Fake booking detected' })
      if (newCount >= 3) {
        await supabase.from('profiles').update({ banned: true }).eq('id', u.id)
        setUsers((p) => p.map((x) => x.id === u.id ? { ...x, fake_booking_count: newCount, banned: true } : x))
        toast({ title: '3 warnings reached — user banned' })
      } else {
        setUsers((p) => p.map((x) => x.id === u.id ? { ...x, fake_booking_count: newCount } : x))
        toast({ title: `Warning ${newCount}/3 issued` })
      }
      setToggling(null)
      return
    }
    await supabase.from('profiles').update({ banned: !u.banned, fake_booking_count: 0 }).eq('id', u.id)
    setUsers((p) => p.map((x) => x.id === u.id ? { ...x, banned: !x.banned, fake_booking_count: 0 } : x))
    setToggling(null)
    toast({ title: u.banned ? 'User unbanned' : 'User banned' })
  }

  const byTab = users.filter((u) => tab === 'active' ? !u.banned : tab === 'banned' ? u.banned : true)
  const filtered = byTab.filter((u) => (u.full_name?.toLowerCase().includes(search.toLowerCase())) || (u.email?.toLowerCase().includes(search.toLowerCase())))
  const bannedCount = users.filter((u) => u.banned).length

  return (
    <AdminLayout title="Members">
      <div className="web-stats-grid">
        <div className="web-stat-card"><p className="stat-label">Total Members</p><p className="web-stat-value">{users.length}</p></div>
        <div className="web-stat-card"><p className="stat-label">Active</p><p className="web-stat-value">{users.length - bannedCount}</p></div>
        <div className="web-stat-card yellow"><p className="stat-label">Banned</p><p className="web-stat-value">{bannedCount}</p></div>
      </div>

      <div className="tabs">{['all', 'active', 'banned'].map((r) => <button key={r} className={`tab ${tab === r ? 'active' : ''}`} onClick={() => setTab(r)}>{r[0].toUpperCase() + r.slice(1)}</button>)}</div>
      <div className="input-wrap"><Search className="input-icon" /><input className="input" style={{ paddingLeft: 36 }} placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>

      {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
        filtered.map((u) => (
          <div key={u.id} className="card member-row">
            <div className="user-icon"><UserIcon size={18} /></div>
            <div className="flex-1">
              <div className="row">
                <p className="medium bold">{u.full_name || 'Unknown'}</p>
                {u.role === 'admin' && <span className="role-badge admin">Admin</span>}
                {u.role === 'rider' && <span className="role-badge admin" style={{ background: '#dbeafe', color: '#1e40af' }}>Rider</span>}
                {u.banned && <span className="role-badge banned">Banned</span>}
              </div>
              <p className="tiny muted">{u.email}</p>
              {u.phone && <p className="tiny muted">{u.phone}</p>}
              <p className="tiny muted">Warnings: {u.fake_booking_count || 0}/3</p>
            </div>
            {u.role !== 'admin' && (
              <button className={`ban-btn ${u.banned ? 'unban' : ''}`} disabled={toggling === u.id} onClick={() => toggleBan(u)}>
                {u.banned ? <><CheckCircle2 size={14} /> Unban</> : <><Ban size={14} /> Warn/Ban</>}
              </button>
            )}
          </div>
        ))}
    </AdminLayout>
  )
}