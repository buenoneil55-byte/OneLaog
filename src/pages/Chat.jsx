import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, ArrowLeft, Camera } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import { useOnlineUsers } from '@/lib/usePresence'
import BottomNav from '@/components/BottomNav'

export default function Chat() {
  const { user, profile } = useAuth()
  const online = useOnlineUsers(user?.id, profile?.role)
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [subject, setSubject] = useState('')
  const [settings, setSettings] = useState({ start: '', end: '', autoReply: '' })
  const endRef = useRef(null)
  const autoSentRef = useRef(false)

  const adminOnline = online.some((u) => u.role === 'admin')

  useEffect(() => { loadChats(); loadSettings() }, [])

  const loadChats = async () => {
    const { data } = await supabase.from('chats').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
    setChats(data || [])
  }

  const loadSettings = async () => {
    const { data } = await supabase.from('app_settings').select('*').in('key', ['help_start_time', 'help_end_time', 'auto_reply_message'])
    const s = {}
    ;(data || []).forEach((x) => (s[x.key] = x.value))
    setSettings({ start: s.help_start_time || '', end: s.help_end_time || '', autoReply: s.auto_reply_message || '' })
  }

  const loadMessages = async (chatId) => {
    const { data } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  useEffect(() => { if (activeChat) loadMessages(activeChat.id) }, [activeChat])
  useEffect(() => { autoSentRef.current = false }, [activeChat])

  const isWithinHours = () => {
    if (!settings.start || !settings.end) return true
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = settings.start.split(':').map(Number)
    const [eh, em] = settings.end.split(':').map(Number)
    const s = (sh || 0) * 60 + (sm || 0)
    const e = (eh || 0) * 60 + (em || 0)
    if (s === e) return true
    if (s < e) return cur >= s && cur <= e
    return cur >= s || cur <= e // overnight window, e.g. 8PM - 6AM
  }

  const maybeSendAutoReply = async (chatId) => {
    if (autoSentRef.current || isWithinHours() || !settings.autoReply) return
    autoSentRef.current = true
    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: user.id,
      sender_role: 'admin',
      message: settings.autoReply,
      image_url: '',
    })
  }

  const startChat = async () => {
    if (!subject.trim()) return
    const { data } = await supabase.from('chats').insert({ buyer_id: user.id, buyer_name: profile?.full_name, subject, status: 'open' }).select().single()
    setShowNew(false); setSubject('')
    loadChats()
    setActiveChat(data)
    await maybeSendAutoReply(data.id)
    loadMessages(data.id)
  }

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
    await supabase.from('chat_messages').insert({ chat_id: activeChat.id, sender_id: user.id, sender_role: 'buyer', message: text.trim() || '(photo)', image_url })
    setText('')
    await maybeSendAutoReply(activeChat.id)
    loadMessages(activeChat.id)
  }

  return (
    <div className="page pb-nav">
      <header className="sticky-header">
        <div className="header-row">
          {activeChat ? <button className="icon-btn" onClick={() => setActiveChat(null)}><ArrowLeft size={20} /></button> : <MessageSquare size={20} className="green-icon" />}
          <div style={{ flex: 1 }}>
            <h1 className="header-title">{activeChat ? (activeChat.subject || 'Concern') : 'Support'}</h1>
            {activeChat && (
              <p className="tiny muted" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className={`presence-dot ${adminOnline ? 'on' : 'off'}`} />
                {adminOnline ? 'Support is online' : 'Support is offline'}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="section">
        {!activeChat ? (
          <>
            <button className="btn-primary" onClick={() => setShowNew(!showNew)}>New Complaint / Concern</button>
            {showNew && (
              <div className="card">
                <input className="input" placeholder="Subject (e.g. Damaged product)" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <button className="btn-primary" style={{ marginTop: 8 }} onClick={startChat}>Start Chat</button>
              </div>
            )}
            {chats.map((c) => (
              <button key={c.id} className="card" style={{ textAlign: 'left', width: '100%' }} onClick={() => setActiveChat(c)}>
                <p className="medium bold">{c.subject || 'Concern'}</p>
                <p className="tiny muted">{c.status}</p>
              </button>
            ))}
            {chats.length === 0 && !showNew && <p className="muted center-text">No conversations yet</p>}
          </>
        ) : (
          <>
            {settings.autoReply && !isWithinHours() && (
              <p className="tiny muted center-text">Support hours: {settings.start} to {settings.end}. Leave a message and we'll reply when we're back.</p>
            )}
            <div className="chat-thread">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble-row ${m.sender_role === 'buyer' ? 'me' : 'them'}`}>
                  <div className="chat-bubble">
                    {m.image_url && <img src={m.image_url} alt="attachment" className="chat-bubble-img" onClick={() => window.open(m.image_url, '_blank')} />}
                    {m.message && <span>{m.message}</span>}
                    <span className="chat-bubble-meta">
                      {m.sender_role === 'buyer' ? 'You' : 'Support'} · {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
              <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === 'Enter' && send()} />
              <button className="btn-primary web-send-btn" onClick={send}><Send size={16} /></button>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}