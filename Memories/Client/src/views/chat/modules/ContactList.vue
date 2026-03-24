<template>
  <!-- 移动端：activeContact 时隐藏左侧 -->
  <div
    class="flex flex-col bg-white border-r border-gray-100 transition-all duration-300"
    :class="[
      // 桌面端固定宽度，移动端全屏或隐藏
      'md:w-72 md:flex-shrink-0',
      store.activeContact ? 'hidden md:flex' : 'flex w-full'
    ]"
  >
    <!-- 顶部：当前用户信息 -->
    <div class="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-blue-50">
      <div
        class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
        :style="{ background: getAvatarColor(store.currentUser?.userName ?? '') }"
      >
        {{ getAvatarText(store.currentUser?.userName ?? '') }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-gray-800 font-semibold text-sm truncate">
          {{ store.currentUser?.userName }}
        </div>
        <div class="flex items-center gap-1 mt-0.5">
          <div class="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <span class="text-xs text-gray-400">在线</span>
        </div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="px-3 py-3 border-b border-gray-100">
      <div
        class="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-200 transition-all"
      >
        <el-icon class="text-gray-400 flex-shrink-0"><Search /></el-icon>
        <input
          v-model="searchQuery"
          placeholder="搜索好友..."
          class="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none min-w-0"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          <el-icon size="12"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="flex-1 overflow-y-auto">

      <!-- 无结果 -->
      <div
        v-if="filteredFriends.length === 0"
        class="flex flex-col items-center justify-center py-16 text-gray-300"
      >
        <el-icon size="40" class="mb-3"><UserFilled /></el-icon>
        <span class="text-sm text-gray-400">没有找到好友</span>
      </div>

      <div
        v-for="friend in filteredFriends"
        :key="friend.userId"
        @click="selectContact(friend)"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-50"
        :class="store.activeContact?.userId === friend.userId
          ? 'bg-blue-50 border-l-4 border-l-blue-500'
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'"
      >
        <!-- 头像 -->
        <div class="relative flex-shrink-0">
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
            :style="{ background: getAvatarColor(friend.userName) }"
          >
            {{ getAvatarText(friend.userName) }}
          </div>
          <!-- 在线绿点 -->
          <div
            v-if="isOnline(friend.userName)"
            class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
          />
        </div>

        <!-- 名字 + 最后消息 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-1">
            <span
              class="text-sm font-semibold truncate"
              :class="store.activeContact?.userId === friend.userId ? 'text-blue-600' : 'text-gray-800'"
            >
              {{ friend.userName }}
            </span>
            <span class="text-xs text-gray-400 flex-shrink-0">
              {{ lastMsgTime(friend.userId) }}
            </span>
          </div>
          <div class="flex items-center justify-between gap-1 mt-0.5">
            <span class="text-xs text-gray-400 truncate">
              {{ lastMsgContent(friend.userId) }}
            </span>
            <!-- 未读红点 -->
            <div
              v-if="store.unreadMap[friend.userId]"
              class="flex-shrink-0 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center"
            >
              <span class="text-xs text-white font-medium px-1 leading-none">
                {{ store.unreadMap[friend.userId] > 99 ? '99+' : store.unreadMap[friend.userId] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore }from '@/store/modules/chat'

import { getAvatarColor, getAvatarText, formatTime, formatTimeShort } from '@/utils/ui'

import { ChatUser, ChatMessage } from '@/types/component'
import { Search, Close, UserFilled } from '@element-plus/icons-vue'

const store = useChatStore()
const searchQuery = ref<string>('')

const filteredFriends = computed<ChatUser[]>(() => {
  const q = searchQuery.value.trim()
  if (!q) return store.sortedFriends
  return store.sortedFriends.filter(f => f.userName.includes(q))
})

function selectContact(friend: ChatUser): void {
  store.setActiveContact(friend)
}

function isOnline(userName: string): boolean {
  return store.onlineNames.includes(userName)
}

function lastMsgTime(friendId: number): string {
  const msg = store.getLastMessage(friendId)
  return msg ? formatTimeShort(msg.timestamp) : ''
}

function lastMsgContent(friendId: number): string {
  const msg = store.getLastMessage(friendId)
  if (!msg) return '暂无消息'
  return msg.content.length > 14 ? msg.content.slice(0, 14) + '...' : msg.content
}
</script>
