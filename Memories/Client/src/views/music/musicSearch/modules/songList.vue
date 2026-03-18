<script setup lang="ts">
interface Item {
  id: number
  name: string
  coverImgUrl: string
  creator: {
    userId: number
    nickname: string
  }
  playCount: number
  trackCount: number
  description: string
}

let modelValue = defineModel<Item[]>()

const formatPlayCount = (count: number) => {
  if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿'
  if (count >= 10000) return (count / 10000).toFixed(1) + '万'
  return count.toString()
}
</script>

<template>
  <section class="flex-1 p-4 md:p-6 grid gap-6 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
    <router-link
      v-for="item in modelValue"
      :key="item.id"
      :to="`/songlist?id=${item.id}`"
      class="group flex flex-col cursor-pointer no-underline"
    >
      <!-- Cover -->
      <div class="relative aspect-square rounded overflow-hidden
                  ring-2 ring-blue-300
            group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(96,128,200,0.3)]
            transition-shadow duration-300">
        <el-image
          :src="item.coverImgUrl"
          lazy
          class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        >
          <template #placeholder>
            <div class="w-full h-full bg-blue-300 animate-pulse" />
          </template>
          <template #error>
            <div class="w-full h-full bg-blue-300 flex items-center justify-center">
              <svg class="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
              </svg>
            </div>
          </template>
        </el-image>

        <!-- Play overlay -->
        <div class="absolute inset-0 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                    flex items-end p-3">
          <div class="w-9 h-9 rounded-full border border-blue-300/70
                      flex items-center justify-center">
            <svg width="11" height="13" viewBox="0 0 12 14" fill="#bfdbfe">
              <path d="M1 1l10 6L1 13V1z" />
            </svg>
          </div>
        </div>

        <!-- Play count badge -->
        <span class="absolute top-2 right-2 bg-blue-950/75 backdrop-blur-sm
                     px-1.5 py-0.5 rounded-sm text-[10px] text-blue-300 font-mono tracking-wide">
          {{ formatPlayCount(item.playCount) }}
        </span>
      </div>

      <!-- Info -->
      <div class="mt-3 group-hover:-translate-y-0.5 transition-transform duration-300">
        <h3
          class="text-sm font-medium text-blue-300 line-clamp-2 leading-snug whitespace-nowrap overflow-hidden text-ellipsis mb-1"
          :title="item.name"
        >
          {{ item.name }}
        </h3>
        <p
          class="text-xs text-blue-300 font-mono whitespace-nowrap overflow-hidden text-ellipsis tracking-wide mb-1"
          :title="item.creator.nickname"
        >
          {{ item.creator.nickname }}
        </p>
        <div class="flex items-center gap-2 text-[10px] whitespace-nowrap overflow-hidden text-ellipsis text-blue-300 font-mono">
          <span>{{ item.trackCount }} 首</span>
        </div>
      </div>
    </router-link>
  </section>
</template>