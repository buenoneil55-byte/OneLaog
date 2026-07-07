import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, User as UserIcon, Search } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import LanguageToggle from '@/components/LanguageToggle'

export default function AdminMembers() {
  const navigate = useNavigate()
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
    await supabase.from('profiles').update({ banned: !u.banned }).eq('id', u.id)
    setUsers((p) => p.map((x) => x.id === u.id ? { ...x, banned: !x.banned } : x))
    setToggling(null)
    toast({ title: u.banned ? 'User unbanned' : 'User banned' })
  }

  const byTab = users.filter((u) => tab === 'active' ? !u.banned : tab === 'banned' ? u.banned : true)
  const filtered = byTab.filter((u) => (u.full_name?.toLowerCase().includes(search.toLowerCase())) || (u.email?.toLowerCase().includes(search.toLowerCase())))
  const bannedCount = users.filter((u) => u.banned).length

  return (
    <div className="page pb-nav">
      <div className="admin-header">
        <div className="header-row"><button className="icon-btn" onClick={() => navigate('/admin')}><ArrowLeft size={20} /></button><h1 className="header-title light">Members</h1><LanguageToggle className="circle-btn" /></div>
        <div className="stats-grid">
          <div className="stat-block"><p className="stat-label light">Total Members</p><p className="stat-value">{users.length}</p></div>
          <div className="stat-block"><p className="stat-label light">Active</p><p className="stat-value">{users.length - bannedCount}</p></div>
          <div className="stat-block"><p className="stat-label light">Banned</p><p className="stat-value">{bannedCount}</p></div>
        </div>
      </div>
      <div className="section">
        <div className="tabs">{['all','active','banned'].map((r) => <button key={r} className={`tab ${tab === r ? 'active' : ''}`} onClick={() => setTab(r)}>{r[0].toUpperCase()+r.slice(1)}</button>)}</div>
        <div className="input-wrap"><Search className="input-icon" /><input className="input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        {loading ? <div className="spinner-screen"><div className="spinner" /></div> :
         filtered.map((u) => (
          <div key={u.id} className="card member-row">
            <div className="user-icon"><UserIcon size={18} /></div>
            <div className="flex-1">
              <div className="row"><p className="medium bold">{u.full_name || 'Unknown'}</p>
                {u.role === 'admin' && <span className="role-badge admin">Admin</span>}
                {u.banned && <span className="role-badge banned">Banned</span>}
              </div>
              <p className="tiny muted">{u.email}</p>
              {u.phone && <p className="tiny muted">{u.phone}</p>}
            </div>
            {u.role !== 'admin' && (
              <button className={`ban-btn ${u.banned ? 'unban' : ''}`} disabled={toggling === u.id} onClick={() => toggleBan(u)}>
                {u.banned ? <><CheckCircle2 size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
              </button>
            )}
          </div>
        ))}
      </div>
      <BottomNav isAdmin />
    </div>
  )
}