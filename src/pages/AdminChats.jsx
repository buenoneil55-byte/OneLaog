import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Camera } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useOnlineUsers } from '@/lib/usePresence'
import AdminLayout from '@/components/AdminLayout'

export default function AdminChats() {
    const { user, profile } = useAuth()
  const online = useOnlineUsers(user?.id, profile?.role)
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [search, setSearch] = useState('')
  const endRef = useRef(null)

  useEffect(() => { loadChats() }, [])
  const filteredChats = chats.filter((c) =>
    (c.buyer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.subject || '').toLowerCase().includes(search.toLowerCase())
  )
  const loadChats = async () => {
    const { data } = await supabase.from('chats').select('*').order('created_at', { ascending: false })
    setChats(data || [])
  }

  const loadMessages = async (chatId) => {
    const { data } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  useEffect(() => { if (activeChat) loadMessages(activeChat.id) }, [activeChat])

  const send = async () => {
    if ((!text.trim() && !imgFile) || !activeChat) return
    let image_url = ''
   if (imgFile) {
      const path = `chats/${activeChat.id}/${Date.now()}_${imgFile.name}`
      const { error } = await supabase.storage.from('delivery-proofs').upload(path, imgFile)
      if (error) {
        alert('Photo failed to send: ' + error.message)
        setImgFile(null)
        return
      }
      image_url = supabase.storage.from('delivery-proofs').getPublicUrl(path).data.publicUrl
      setImgFile(null)
    }
    await supabase.from('chat_messages').insert({ chat_id: activeChat.id, sender_id: user.id, sender_role: 'admin', message: text.trim() || '(photo)', image_url })
    await supabase.from('chats').update({ status: 'open' }).eq('id', activeChat.id)
    setText('')
    loadMessages(activeChat.id)
  }

  return (
    <AdminLayout title="Support Chats">
      <div className="web-chat-layout">
        <div className="web-chat-list">
          <input className="input" style={{ marginBottom: 8 }} placeholder="Search by name or subject..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {filteredChats.length === 0 && <p className="muted center-text">{chats.length === 0 ? 'No chats yet' : 'No match found'}</p>}
          {filteredChats.map((c) => (
            <button key={c.id} className={`web-chat-item ${activeChat?.id === c.id ? 'active' : ''}`} onClick={() => setActiveChat(c)}>
              <p className="medium bold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`presence-dot ${online.includes(c.buyer_id) ? 'on' : 'off'}`} />
                {c.buyer_name || 'Buyer'}
              </p>
              <p className="tiny muted truncate">{c.subject || 'Concern'}</p>
              <span className={`status-pill ${c.status === 'open' ? 'Pending' : 'Done'}`}>{c.status}</span>
            </button>
          ))}
        </div>
        <div className="web-chat-thread">
          {activeChat ? (
            <>
              <div className="web-chat-header">
                {activeChat.subject || 'Concern'} — {activeChat.buyer_name}
                <span className={`presence-dot ${online.some((u) => u.id === activeChat.buyer_id) ? 'on' : 'off'}`} style={{ marginLeft: 8 }} />
                <span className="tiny muted">{online.some((u) => u.id === activeChat.buyer_id) ? 'online' : 'offline'}</span>
              </div>
              <div className="chat-thread">
                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble-row ${m.sender_role === 'admin' ? 'me' : 'them'}`}>
                    <div className="chat-bubble">
                      {m.image_url && <img src={m.image_url} alt="attachment" className="chat-bubble-img" onClick={() => window.open(m.image_url, '_blank')} />}
                      {m.message && <span>{m.message}</span>}
                      <span className="chat-bubble-meta">
                        {m.sender_role === 'admin' ? 'Admin' : (activeChat?.buyer_name || 'User')} · {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="web-chat-input">
                <label className="icon-btn" style={{ cursor: 'pointer' }}>
                  <Camera size={18} />
                  <input type="file" accept="image/*" hidden onChange={(e) => setImgFile(e.target.files?.[0])} />
                </label>
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Reply..." onKeyDown={(e) => e.key === 'Enter' && send()} />
                <button className="btn-primary web-send-btn" onClick={send}><Send size={16} /></button>
              </div>
            </>
          ) : <div className="web-chat-empty"><MessageSquare size={32} className="gray-icon" /><p className="muted">Select a chat to reply</p></div>}
        </div>
      </div>
    </AdminLayout>
  )
}