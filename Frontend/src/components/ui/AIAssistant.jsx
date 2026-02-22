import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAssistant } from '../../contexts/AssistantContext'
import { useAuth } from '../../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE_URL

/* ── helpers ─────────────────────────────────────────────── */
const levelEmoji = { beginner: '🌱', intermediate: '⚡', advanced: '🔥' }

const buildGreeting = (userName, topicContext) => {
  const name = userName ? userName.split(' ')[0] : 'buddy'
  const { topicName, topicLevel, subjectName } = topicContext

  if (topicName) {
    const emoji = levelEmoji[topicLevel] || '📚'
    return `Hey ${name}! 👋 I see you're diving into **${topicName}**${subjectName ? ` (${subjectName})` : ''} ${emoji}\n\nI'm your MetaGuide AI — basically your smartest, chillest study buddy. Ask me anything about this topic, or literally anything else. I got you! 🤙`
  }

  return `Hey ${name}! 👋 What's up?\n\nI'm your MetaGuide AI — think of me as that friend who actually paid attention in every class ever 😄\n\nOpen up any topic and I'll know exactly what you're studying. Or just hit me with a question right now!`
}

/* ── Streaming cursor blink ──────────────────────────────── */
const StreamingCursor = () => (
  <span
    style={{
      display: 'inline-block',
      width: '2px',
      height: '1em',
      background: 'currentColor',
      marginLeft: '2px',
      verticalAlign: 'text-bottom',
      animation: 'cursorBlink 0.7s steps(1) infinite',
    }}
  />
)

/* ── Message bubble ──────────────────────────────────────── */
const MessageBubble = ({ msg, streaming = false }) => {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-3`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
        isUser
          ? 'bg-sky-500 text-white'
          : 'bg-gradient-to-br from-violet-500 to-sky-500 text-white'
      }`}>
        {isUser ? 'U' : 'Yo'}
      </div>

      {/* Bubble */}
      <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-sky-500 text-white rounded-tr-sm'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-600'
      }`}>
        {isUser ? (
          <span>{msg.content}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            {streaming && <StreamingCursor />}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main AIAssistant component ──────────────────────────── */
const AIAssistant = () => {
  const { topicContext } = useAssistant()
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // [{role, content}]
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)   // true while waiting for first token
  const [streaming, setStreaming] = useState(false) // true while tokens are arriving
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const prevTopicRef = useRef(null)
  const readerRef = useRef(null)   // holds active SSE reader so we can cancel

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(scrollToBottom, [messages, loading, streaming])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Initialize / re-greet when topic changes or chat first opens
  useEffect(() => {
    const topicKey = topicContext.topicName || '__none__'
    if (open && (!initialized || prevTopicRef.current !== topicKey)) {
      prevTopicRef.current = topicKey
      setInitialized(true)
      const greeting = buildGreeting(user?.name, topicContext)
      setMessages([{ role: 'assistant', content: greeting }])
      setError(null)
    }
  }, [open, topicContext.topicName]) // eslint-disable-line

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading || streaming) return

    // Cancel any in-flight stream
    if (readerRef.current) {
      readerRef.current.cancel()
      readerRef.current = null
    }

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setStreaming(false)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          topicName: topicContext.topicName,
          topicLevel: topicContext.topicLevel,
          subjectName: topicContext.subjectName,
        })
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder('utf-8')

      // Add an empty assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setLoading(false)
      setStreaming(true)

      let buffer = ''
      let done = false

      while (!done) {
        const { value, done: streamDone } = await reader.read()
        done = streamDone
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // keep incomplete last line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw || raw === '[DONE]') continue
            try {
              const parsed = JSON.parse(raw)
              if (parsed.text) {
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: updated[updated.length - 1].content + parsed.text
                  }
                  return updated
                })
              }
            } catch { /* ignore partial JSON */ }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Oops, something went wrong. Try again?')
        console.error('Assistant error:', err)
      }
    } finally {
      readerRef.current = null
      setLoading(false)
      setStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    if (readerRef.current) {
      readerRef.current.cancel()
      readerRef.current = null
    }
    const greeting = buildGreeting(user?.name, topicContext)
    setMessages([{ role: 'assistant', content: greeting }])
    setError(null)
    setLoading(false)
    setStreaming(false)
  }

  const isBusy = loading || streaming

  return (
    <>
      <style>{`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-[998] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-gray-700 dark:bg-gray-600 rotate-45 scale-95'
            : 'bg-gradient-to-br from-sky-500 to-violet-600 hover:scale-110'
        }`}
        title="MetaGuide AI Assistant"
        aria-label="Toggle AI Assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl select-none text-yellow-400">Yo</span>
        )}
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-sky-400 opacity-30 animate-ping" />
        )}
      </button>

      {/* Chat panel */}
      <div className={`fixed bottom-[5.5rem] right-6 z-[997] w-[360px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${
        open ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'
      }`}
        style={{ maxHeight: 'calc(100vh - 6rem)' }}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          style={{ height: 'min(520px, calc(100vh - 6rem))' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">Yo</div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">MetaGuide AI</div>
                <div className="text-sky-100 text-xs">
                  {topicContext.topicName
                    ? `📖 ${topicContext.topicName}`
                    : 'Your study buddy'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Level badge */}
              {topicContext.topicLevel && (
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full capitalize">
                  {levelEmoji[topicContext.topicLevel]} {topicContext.topicLevel}
                </span>
              )}
              {/* Clear chat */}
              <button
                onClick={clearChat}
                title="New chat"
                className="ml-1 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0 bg-gray-50 dark:bg-gray-800"
            style={{ scrollbarWidth: 'thin' }}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                streaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Waiting for first token: show pulsing dots */}
            {loading && (
              <div className="flex gap-2 mb-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-xs">Yo</div>
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-500 dark:text-red-400 py-1">{error}</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... 💬"
                rows={1}
                disabled={isBusy}
                className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition disabled:opacity-50"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isBusy}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all"
                title="Send"
              >
                {streaming ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default AIAssistant
