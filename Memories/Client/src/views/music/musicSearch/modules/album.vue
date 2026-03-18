<script setup lang="ts">
import { ref, computed } from 'vue'

interface Artist {
  id: number
  name: string
}

interface Item {
  id: number
  name: string
  picUrl: string
  artist: Artist
  publishTime: number
  size: number
  company: string
}

const props = defineProps<{ modelValue?: Item[] }>()

const query = ref('')
const hoveredId = ref<number | null>(null)

const formatYear = (ts: number) => new Date(ts).getFullYear()

const filtered = computed(() =>
  (props.modelValue ?? []).filter(
    (a) =>
      a.name.toLowerCase().includes(query.value.toLowerCase()) ||
      a.artist.name.toLowerCase().includes(query.value.toLowerCase())
  )
)
</script>

<template>
    <!-- Grid -->
    <section class="flex-1 p-4 md:p-6 grid gap-6 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
    <div v-for="item in filtered" :key="item.id" class="group cursor-pointer" @mouseenter="hoveredId = item.id"
        @mouseleave="hoveredId = null">
        <!-- Cover -->
        <div class="relative aspect-square rounded overflow-hidden bg-blue-950/40
            shadow-[0_8px_24px_rgba(0,0,0,0.5)]
            group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(96,128,200,0.3)]
            transition-shadow duration-300">
          <el-image :src="item.picUrl" lazy
            class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            <!-- 自定义占位，避免白色背景 -->
            <template #placeholder>
              <div class="w-full h-full bg-blue-950/40 animate-pulse" />
            </template>
            <template #error>
              <div class="w-full h-full bg-blue-950/40 flex items-center justify-center">
                <svg class="w-8 h-8 text-blue-800" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
            </template>
          </el-image>

          <!-- Play overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-[rgba(5,10,30,0.05)] to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
              flex items-end p-3">
            <div class="w-9 h-9 rounded-full border border-blue-300/70
                flex items-center justify-center">
              <svg width="11" height="13" viewBox="0 0 12 14" fill="#bfdbfe">
                <path d="M1 1l10 6L1 13V1z" />
              </svg>
            </div>
          </div>

          <!-- Year badge -->
          <span class="absolute top-2 right-2 bg-blue-950/75 backdrop-blur-sm 
               px-1.5 py-0.5 rounded-sm text-[10px] text-blue-300 font-mono tracking-wide">
            {{ formatYear(item.publishTime) }}
          </span>
        </div>

        <!-- Info -->
        <div class="mt-3 group-hover:-translate-y-0.5 transition-transform duration-300">
          <h3 class="text-sm font-normal italic text-blue-300 leading-snug line-clamp-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {{ item.name }}
          </h3>
          <p class="text-xs text-blue-300 font-mono tracking-wide truncate whitespace-nowrap overflow-hidden text-ellipsis">
            {{ item.artist.name }}
          </p>
          <div class="flex items-center text-[10px] text-blue-300 font-mono whitespace-nowrap overflow-hidden text-ellipsis">
            <span>{{ item.size }} 首</span>
            <span class="text-blue-900">·</span>
            <span class="truncate">{{ item.company }}</span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filtered.length === 0"
        class="col-span-full text-center py-16 text-[#3a3a5a] font-mono text-xs tracking-[0.2em]">
        NO RESULTS FOUND
      </div>

    </section>
</template>