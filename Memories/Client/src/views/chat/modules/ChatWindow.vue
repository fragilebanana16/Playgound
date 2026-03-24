<template>
  <!-- 移动端：没选联系人时隐藏右侧 -->
  <div
    class="flex flex-col bg-gray-50 relative"
    :class="[
      'flex-1 min-w-0',
      !store.activeContact ? 'hidden md:flex' : 'flex w-full'
    ]"
  >
    <!-- 没选联系人（桌面端占位） -->
    <div
      v-if="!store.activeContact"
      class="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300"
    >
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
        <span class="text-4xl">💬</span>
      </div>
      <p class="text-sm text-gray-400">选择一个好友开始聊天</p>
    </div>

    <template v-else>
      <!-- 顶部栏 -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 shadow-sm">
        <!-- 移动端返回按钮 -->
        <button
          class="md:hidden flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors mr-1"
          @click="store.setActiveContact(null)"
        >
        <el-icon style="color: #6b7280;"><ArrowLeft /></el-icon>
        </button>

        <div
          class="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
          :style="{ background: getAvatarColor(store.activeContact.userName) }"
        >
          {{ getAvatarText(store.activeContact.userName) }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-gray-800 font-semibold text-sm truncate">
            {{ store.activeContact.userName }}
          </div>
          <div class="text-xs" :class="isOnline ? 'text-green-500' : 'text-gray-400'">
            {{ isOnline ? '在线' : '离线' }}
          </div>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        ref="msgListRef"
        class="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <div
          v-if="messages.length === 0"
          class="text-center text-gray-400 text-sm py-10"
        >
          还没有消息，打个招呼吧 👋
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id ?? msg.timestamp"
          class="flex gap-2.5"
          :class="isSelf(msg) ? 'flex-row-reverse' : 'flex-row'"
        >
          <!-- 头像 -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm"
            :style="{ background: getAvatarColor(getSenderName(msg)) }"
          >
            {{ getAvatarText(getSenderName(msg)) }}
          </div>

          <!-- 气泡 -->
          <div
            class="flex flex-col max-w-[70%] md:max-w-[60%]"
            :class="isSelf(msg) ? 'items-end' : 'items-start'"
          >
            <span class="text-xs text-gray-400 mb-1 px-1">
              {{ formatTime(msg.timestamp) }}
            </span>
            <div
              class="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm"
              :class="isSelf(msg)
                ? 'bg-blue-500 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm'"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>
      </div>

      <!-- 新消息提示 -->
      <div
        v-if="showNewMsgTip"
        @click="scrollToBottom"
        class="absolute bottom-24 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-4 py-1.5 rounded-full cursor-pointer shadow-lg flex items-center gap-1.5 hover:bg-blue-400 transition-colors z-10"
      >
        <el-icon><ArrowDown /></el-icon>
        有新消息
      </div>

      <!-- 输入区 -->
      <div class="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 shadow-sm">
        <div class="flex items-end gap-2">
          <textarea
            ref="inputRef"
            v-model="inputText"
            @keydown.enter.exact.prevent="sendMsg"
            placeholder="输入消息..."
            rows="1"
            class="flex-1 bg-gray-100 text-gray-800 text-sm placeholder-gray-400 rounded-2xl px-4 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 resize-none transition-all leading-relaxed"
            style="max-height: 120px;"
            @input="autoResize"
          />
          <button
            @click="sendMsg"
            :disabled="!inputText.trim()"
            class="flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <el-icon class="text-white" :class="!inputText.trim() ? 'text-gray-400' : ''">
              <Promotion />
            </el-icon>
          </button>
        </div>
        <p class="text-xs text-gray-300 mt-1.5 px-1">Enter 发送 · Shift+Enter 换行</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore }from '@/store/modules/chat'
import { getAvatarColor, getAvatarText, formatTime, formatTimeShort } from '@/utils/ui'
import { sendMessage } from '@/utils/socketio'
import {
  Location, Search, Guide, Star, StarFilled,
  ArrowLeft, ArrowDown,Promotion, Grid, Plus, Minus,
  Close, MapLocation, Share
} from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types/component'


const store = useChatStore()
const inputText = ref<string>('')
const msgListRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const showNewMsgTip = ref<boolean>(false)

const messages = computed<ChatMessage[]>(() => {
  if (!store.currentUser || !store.activeContact) return []
  return store.getMessages(store.currentUser.userId, store.activeContact.userId)
})

const isOnline = computed<boolean>(() => {
  return store.onlineNames.includes(store.activeContact?.userName ?? '')
})

function isSelf(msg: ChatMessage): boolean {
  return msg.from === store.currentUser?.userId
}

function getSenderName(msg: ChatMessage): string {
  return store.getUserById(msg.from)?.userName ?? '未知'
}

function sendMsg(): void {
  const content = inputText.value.trim()
  if (!content || !store.activeContact || !store.currentUser) return

  const msg: ChatMessage = {
    from: store.currentUser.userId,
    to: store.activeContact.userId,
    content,
    type: 'text',
    timestamp: Date.now()
  }

  sendMessage({
    to: store.activeContact.userName,
    content,
    type: 'text'
  })

  store.appendMessage(msg)
  inputText.value = ''

  nextTick(() => {
    scrollToBottom()
    resetInputHeight()
  })
}

function scrollToBottom(): void {
  nextTick(() => {
    if (msgListRef.value) {
      msgListRef.value.scrollTop = msgListRef.value.scrollHeight
    }
    showNewMsgTip.value = false
  })
}

function autoResize(e: Event): void {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function resetInputHeight(): void {
  if (inputRef.value) inputRef.value.style.height = 'auto'
}

watch(() => store.activeContact, () => {
  nextTick(scrollToBottom)
})

watch(messages, () => {
  if (!messages.value.length) return
  const lastMsg = messages.value[messages.value.length - 1]
  const isSelfMsg = lastMsg.from === store.currentUser?.userId

  if (isSelfMsg) {
    scrollToBottom()
    return
  }

  const el = msgListRef.value
  if (!el) return
  const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  if (isAtBottom) {
    scrollToBottom()
  } else {
    showNewMsgTip.value = true
  }
}, { deep: true })
</script>
