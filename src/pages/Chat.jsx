import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'
import { supabase } from '@/api/supabaseClient'
import { useAuth } from '@/lib/AuthContext'
import BottomNav from '@/components/BottomNav'

export default function Chat() {
    const { user, profile } = useAuth()
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [text, setText] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [subject, setSubject] = useState('')
    const endRef = useRef(null)

    useEffect(() => { loadChats() }, [])
    const loadChats = async () => {
        const { data } = await supabase.from('chats').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false })
        setChats(data || [])
    }

    const loadMessages = async (chatId) => {
        const { data } = await supabase.from('chat_messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true })
        setMessages(data || [])
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }

    useEffect(() => { if (activeChat) loadMessages(activeChat.id) }, [activeChat])

    const startChat = async () => {
        if (!subject.trim()) return
        const { data } = await supabase.from('chats').insert({ buyer_id: user.id, buyer_name: profile?.full_name, subject, status: 'open' }).select().single()
        setShowNew(false); setSubject('')
        loadChats(); setActiveChat(data); loadMessages(data.id)
    }

    const send = async () => {
        if (!text.trim() || !activeChat) return
        await supabase.from('chat_messages').insert({ chat_id: activeChat.id, sender_id: user.id, sender_role: 'buyer', message: text })
        setText('')
        loadMessages(activeChat.id)
    }

    return (
        <div className="page pb-nav">
            <header className="sticky-header">
                <div className="header-row">
                    {activeChat ? <button className="icon-btn" onClick={() => setActiveChat(null)}><ArrowLeft size={20} /></button> : <MessageSquare size={20} className="green-icon" />}
                    <h1 className="header-title">{activeChat ? (activeChat.subject || 'Concern') : 'Support'}</h1>
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
                        <div className="mobile-chat-msgs">
                            {messages.map((m) => (
                                <div key={m.id} className={`web-msg ${m.sender_role}`}>
                                    <span className="web-msg-sender">{m.sender_role === 'buyer' ? 'You' : 'Support'}</span>
                                    <span className="web-msg-text">{m.message}</span>
                                </div>
                            ))}
                            <div ref__={endRef} />
                        </div>
                        <div className="web-chat-input">
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