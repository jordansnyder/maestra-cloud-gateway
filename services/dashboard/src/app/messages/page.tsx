'use client'

import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { MessageSquare, Wifi, WifiOff, Trash2, Pause, Play, Filter } from 'lucide-react'
import clsx from 'clsx'

const WS_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8090'

interface GatewayMessage {
  id: string
  timestamp: string
  site_slug: string
  subject: string
  direction: 'inbound' | 'outbound'
  payload: unknown
  size_bytes: number
}

const DIRECTION_COLORS = {
  inbound: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  outbound: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<GatewayMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const [filter, setFilter] = useState('')
  const [selectedMsg, setSelectedMsg] = useState<GatewayMessage | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const pausedRef = useRef(false)
  const listEndRef = useRef<HTMLDivElement>(null)
  const MAX_MESSAGES = 200

  useEffect(() => {
    const socket = io(WS_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('gateway:message', (msg: GatewayMessage) => {
      if (pausedRef.current) return
      setMessages((prev) => {
        const next = [...prev, { ...msg, id: msg.id ?? `${Date.now()}-${Math.random()}` }]
        return next.slice(-MAX_MESSAGES)
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!paused) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, paused])

  const togglePause = () => setPaused((p) => !p)
  const clearMessages = () => {
    setMessages([])
    setSelectedMsg(null)
  }

  const filtered = filter
    ? messages.filter(
        (m) =>
          m.subject.toLowerCase().includes(filter.toLowerCase()) ||
          m.site_slug.toLowerCase().includes(filter.toLowerCase())
      )
    : messages

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Message Explorer</h1>
          <p className="text-sm text-slate-400 mt-0.5">Real-time messages flowing through the gateway</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border',
              connected
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-slate-400 bg-slate-700/50 border-slate-600'
            )}
          >
            {connected ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            onClick={togglePause}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              paused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            )}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={clearMessages}
            className="btn-secondary flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Filter + stats bar */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter by subject or site..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-base pl-8 w-72"
          />
        </div>
        <span className="text-xs text-slate-500">
          {filtered.length} message{filtered.length !== 1 ? 's' : ''}
          {filter ? ` (filtered from ${messages.length})` : ''}
        </span>
        {paused && (
          <span className="text-xs text-yellow-400 flex items-center gap-1">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">
        {/* Message list */}
        <div className="xl:col-span-2 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Messages</span>
            <span className="text-xs text-slate-600">max {MAX_MESSAGES}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-600">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">
                  {connected ? 'Waiting for messages...' : 'Not connected to gateway'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {filtered.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMsg(msg)}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 hover:bg-slate-800/60 transition-colors',
                      selectedMsg?.id === msg.id && 'bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={clsx(
                          'text-xs px-1.5 py-0.5 rounded border font-medium flex-shrink-0',
                          DIRECTION_COLORS[msg.direction] ?? 'text-slate-400'
                        )}
                      >
                        {msg.direction === 'inbound' ? 'IN' : 'OUT'}
                      </span>
                      <span className="font-mono text-xs text-slate-200 truncate">{msg.subject}</span>
                      <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
                        {msg.site_slug}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs text-slate-600">{msg.size_bytes}B</span>
                    </div>
                  </button>
                ))}
                <div ref={listEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Payload inspector */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700">
            <span className="text-xs font-medium text-slate-400">Payload Inspector</span>
          </div>
          {selectedMsg ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Subject</p>
                <code className="text-xs font-mono text-slate-200 break-all">{selectedMsg.subject}</code>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Site</p>
                  <code className="text-xs text-slate-300">{selectedMsg.site_slug}</code>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Direction</p>
                  <span
                    className={clsx(
                      'text-xs px-1.5 py-0.5 rounded border font-medium',
                      DIRECTION_COLORS[selectedMsg.direction]
                    )}
                  >
                    {selectedMsg.direction}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Size</p>
                  <span className="text-xs text-slate-300">{selectedMsg.size_bytes} bytes</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Time</p>
                  <span className="text-xs text-slate-300">
                    {new Date(selectedMsg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Payload</p>
                <pre className="text-xs font-mono text-slate-200 bg-slate-800/60 rounded p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedMsg.payload, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
              Select a message to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
