import React, { useState, useEffect } from 'react'
import { User, CreditCard, MapPin, Phone, HelpCircle, LogOut, ChevronRight, Trash2 } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/useToast'
import BottomNav from '@/components/BottomNav'
import ProfileDialogs from '@/components/ProfileDialogs'

const menuItems = [
  { icon: User, label: 'Edit Profile', color: 'blue', dialog: 'editProfile' },
  { icon: CreditCard, label: 'Payment Method', color: 'green', dialog: 'paymentMethod' },
  { icon: MapPin, label: 'Delivery Address', color: 'purple', dialog: 'deliveryAddress' },
  { icon: Phone, label: 'Edit Phone Number', color: 'orange', dialog: 'phoneNumber' },
  { icon: HelpCircle, label: 'Help & Support', color: 'gray', dialog: 'helpSupport' },
]

export default function Profile() {
  const { profile, logout } = useAuth()
  const { toast } = useToast()
  const [activeDialog, setActiveDialog] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('cart_items').delete().eq('buyer_id', user.id)
    toast({ title: 'Account deleted' })
    logout('/login')
  }

  return (
    <div className="page pb-nav">
      <div className="profile-header">
        <div className="profile-avatar"><User size={40} className="gray-icon" /></div>
        <h2 className="profile-name">{profile?.full_name || 'User'}</h2>
        <p className="profile-email">{profile?.email}</p>
        {profile?.phone && <p className="profile-sub">📱 {profile.phone}</p>}
        {profile?.delivery_address && <p className="profile-sub">📍 {profile.delivery_address}</p>}
      </div>
      <div className="section">
        <div className="card menu-list">
          {menuItems.map((item, i) => (
            <button key={i} className="menu-row" onClick={() => setActiveDialog(item.dialog)}>
              <item.icon size={18} className={`icon-${item.color}`} />
              <span>{item.label}</span>
              <ChevronRight size={16} className="chevron" />
            </button>
          ))}
        </div>
        <button className="card btn-row logout" onClick={() => logout('/login')}><LogOut size={16} /> Log Out</button>
        <button className="card btn-row delete" disabled={deleting} onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete Account'}</button>
      </div>
      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Account?</h3>
            <p>This will permanently remove your account and data. This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-outline" onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <ProfileDialogs activeDialog={activeDialog} onClose={() => setActiveDialog(null)} user={profile} />
      <BottomNav isAdmin={profile?.role === 'admin'} />
    </div>
  )
}