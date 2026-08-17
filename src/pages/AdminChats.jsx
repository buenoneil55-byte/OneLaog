import React, { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import AdminLayout from '@/components/AdminLayout'

export default function AdminChats() {
    const { user } = useAuth()
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
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
        if (!text.trim() || !activeChat) return
        await supabase.from('chat_messages').insert({ chat_id: activeChat.id, sender_id: user.id, sender_role: 'admin', message: text })
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
                            <p className="medium bold">{c.buyer_name || 'Buyer'}</p>
                            <p className="tiny muted truncate">{c.subject || 'Concern'}</p>
                            <span className={`status-pill ${c.status === 'open' ? 'Pending' : 'Done'}`}>{c.status}</span>
                        </button>
                    ))}
                </div>
                <div className="web-chat-thread">
                    {activeChat ? (
                        <>
                            <div className="web-chat-header">{activeChat.subject || 'Concern'} — {activeChat.buyer_name}</div>
                            <div className="web-chat-msgs">
                                {messages.map((m) => (
                                    <div key={m.id} className={`web-msg ${m.sender_role}`}>
                                        <span className="web-msg-sender">{m.sender_role === 'admin' ? 'Admin' : (activeChat?.buyer_name || 'User')}</span>
                                        <span className="web-msg-text">{m.message}</span>
                                    </div>
                                ))}
                                <div ref__={endRef} />
                            </div>
                            <div className="web-chat-input">
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