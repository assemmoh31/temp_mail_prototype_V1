import React, { useState, useEffect } from 'react'

export default function App() {
  const API_BASE = 'http://localhost:3001'
  const [inbox, setInbox] = useState(null)
  const [messages, setMessages] = useState([])

  async function generate() {
    const res = await fetch(`${API_BASE}/api/generate`, { method: 'POST' })
    const data = await res.json()
    setInbox(data.id)
  }

  async function loadMessages(id) {
    const res = await fetch(`${API_BASE}/api/inbox/${id}/messages`)
    const data = await res.json()
    setMessages(data.messages || [])
  }

  useEffect(() => {
    if (inbox) loadMessages(inbox)
  }, [inbox])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: 20 }}>
      <h1>Temp Mail Prototype</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={generate}>Generate Inbox</button>
        {inbox && <span style={{ marginLeft: 12 }}>Inbox: {inbox}@tempmail.local</span>}
      </div>

      <div>
        <h2>Messages</h2>
        {messages.length === 0 && <div>No messages yet.</div>}
        <ul>
          {messages.map((m) => (
            <li key={m.id} style={{ marginBottom: 12, borderBottom: '1px solid #eee' }}>
              <strong>{m.subject || '(no subject)'}</strong>
              <div>From: {m.sender}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{new Date(m.received_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
