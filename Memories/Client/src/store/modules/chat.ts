import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { ChatUser, ChatMessage } from '@/types/component'

import usersData from '@/views/chat/data/users.json'
import messagesData from '@/views/chat/data/messages.json'

export const useChatStore = defineStore('chat', () => {

  const userStore = useUserStore()
  const allUsers = ref<ChatUser[]>(usersData as ChatUser[])
  const chatMap = ref<Record<string, ChatMessage[]>>({})
  const activeContact = ref<ChatUser | null>(null)
  const unreadMap = ref<Record<number, number>>({})
  const onlineNames = ref<string[]>([])

  // 从 useUserStore 拿 userId，匹配 json 里的用户
  const currentUser = computed<ChatUser | null>(() => {
    return allUsers.value.find(u => u.userId === userStore.info?.userId) ?? null
  })

  // ─── 工具 ───
  function getChatKey(a: number, b: number): string {
    return Math.min(a, b) + '-' + Math.max(a, b)
  }

  // ─── Actions ───
  function initMessages(): void {
    chatMap.value = {}
    ;(messagesData as ChatMessage[]).forEach(msg => {
      const key = getChatKey(msg.from, msg.to)
      if (!chatMap.value[key]) chatMap.value[key] = []
      chatMap.value[key].push(msg)
    })
    Object.keys(chatMap.value).forEach(key => {
      chatMap.value[key].sort((a, b) => a.timestamp - b.timestamp)
    })
  }

  function appendMessage(msg: ChatMessage): void {
    const key = getChatKey(msg.from, msg.to)
    if (!chatMap.value[key]) chatMap.value[key] = []
    chatMap.value[key].push(msg)
  }

  function addUnread(fromId: number): void {
    if (activeContact.value?.userId === fromId) return
    unreadMap.value[fromId] = (unreadMap.value[fromId] || 0) + 1
  }

  function clearUnread(userId: number): void {
    unreadMap.value[userId] = 0
  }

  function setActiveContact(user: ChatUser | null): void {
    activeContact.value = user
    if (user) clearUnread(user.userId)
  }

  // ─── Computed ───
  const friends = computed<ChatUser[]>(() => {
    if (!currentUser.value) return []
    return currentUser.value.friends
      .map(id => allUsers.value.find(u => u.userId === id))
      .filter((u): u is ChatUser => Boolean(u))
  })

  const sortedFriends = computed<ChatUser[]>(() => {
    if (!currentUser.value) return []
    return [...friends.value].sort((a, b) => {
      const msgsA = getMessages(currentUser.value!.userId, a.userId)
      const msgsB = getMessages(currentUser.value!.userId, b.userId)
      const lastA = msgsA.length ? msgsA[msgsA.length - 1].timestamp : 0
      const lastB = msgsB.length ? msgsB[msgsB.length - 1].timestamp : 0
      return lastB - lastA
    })
  })

  function getMessages(userId1: number, userId2: number): ChatMessage[] {
    const key = getChatKey(userId1, userId2)
    return chatMap.value[key] || []
  }

  function getLastMessage(friendId: number): ChatMessage | null {
    if (!currentUser.value) return null
    const msgs = getMessages(currentUser.value.userId, friendId)
    return msgs.length ? msgs[msgs.length - 1] : null
  }

  function getUserById(userId: number): ChatUser | undefined {
    return allUsers.value.find(u => u.userId === userId)
  }

  return {
    allUsers,
    chatMap,
    activeContact,
    unreadMap,
    onlineNames,
    currentUser,
    friends,
    sortedFriends,
    getChatKey,
    initMessages,
    appendMessage,
    addUnread,
    clearUnread,
    setActiveContact,
    getMessages,
    getLastMessage,
    getUserById,
  }
})
