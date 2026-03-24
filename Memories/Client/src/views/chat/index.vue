<template>
    <div class="flex h-screen w-full overflow-hidden bg-white">
      <ContactList />
      <ChatWindow />
    </div>
  </template>
  
  <script setup>
  import { onMounted, onUnmounted, watch } from 'vue'
  import { useChatStore } from  '@/store/modules/chat'
  import { useUserStore } from  '@/store/modules/user'
  import { connectSocket, disconnectSocket, login } from '@/utils/socketio'
  import ContactList from './modules/ContactList.vue'
  import ChatWindow from './modules/ChatWindow.vue'
  
  const store = useChatStore()
  const userStore = useUserStore()
  
  onMounted(() => {
    // 初始化历史消息
    store.initMessages()

    // 连接 socket
    connectSocket(
      // 收到私聊消息
      (msg) => {
        // 后端传的是 userName，需要找到对应的 userId
        const fromUser = store.allUsers.find(u => u.userName === msg.from)
        if (!fromUser) return
  
        const newMsg = {
          from: fromUser.userId,
          to: store.currentUser?.userId,
          content: msg.content,
          type: msg.type || 'text',
          timestamp: msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now()
        }
  
        store.appendMessage(newMsg)
        store.addUnread(fromUser.userId)
      },
      // 收到在线用户列表
      (names) => {
        store.onlineNames = names
      },
      // 连接成功后登录
      () => {
        if (userStore.info?.userName) {
         login(userStore.info.userName)
        }
      }
    )
  })
  
  onUnmounted(() => {
    disconnectSocket()
  })
  </script>
  