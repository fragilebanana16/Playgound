import io from 'socket.io-client'
import type { SocketMessage } from '@/types/component'

type SocketIOClient = ReturnType<typeof io>

let socket: SocketIOClient | null = null

export function getSocket(): SocketIOClient | null {
  return socket
}

export function connectSocket(
  onMessage: (msg: SocketMessage) => void,
  onUserList: (users: string[]) => void,
  onConnect?: () => void,
  onDisconnect?: () => void
): SocketIOClient {
  if (socket) socket.disconnect()
  socket = io(import.meta.env.VITE_SOCKET_PROXY_URL, { transports: ['websocket'] })

  socket.on('connect', () => {
    console.log('socket 已连接：', socket?.id)
    onConnect?.()
  })

  socket.on('connect_error', (e: Error) => {
    console.error('socket 连接失败：', e)
  })

  socket.on('privateMsg', (msg: SocketMessage) => {
    onMessage(msg)
  })

  socket.on('userList', (data: string) => {
    const users = data ? data.split(',').filter(Boolean) : []
    onUserList(users)
  })

  socket.on('disconnect', () => {
    console.log('socket 断开')
    onDisconnect?.()
  })

  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function sendMessage(msg: { to: string; content: string; type: string }): void {
  if (socket?.connected) {
    socket.emit('privateMsg', msg)
  } else {
    console.warn('socket 未连接，消息发送失败')
  }
}

export function login(username: string): void {
  if (socket?.connected) {
    socket.emit('login', username)
  }
}
