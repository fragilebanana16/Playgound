<script setup lang="ts">
interface Artist {
  id: number
  name: string
  picUrl: string
  alias: string[]
  musicSize: number
  albumSize: number
  mvSize: number
}

let modelValue = defineModel<Artist[]>()
</script>

<template>
  <div class="text-[#e8e0d4] font-serif">
  <section class="flex-1 p-4 md:p-6 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
    <div
      v-for="item in modelValue"
      :key="item.id"
      class="group flex flex-col items-center cursor-pointer"
    >
      <!-- Avatar -->
      <div class="relative w-24 h-24 rounded-full overflow-hidden
                  ring-2 ring-blue-300
            group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(96,128,200,0.3)]
            transition-shadow duration-300">
        <el-image
          :src="item.picUrl"
          lazy
          class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
        >
          <template #placeholder>
            <div class="w-full h-full bg-blue-300 animate-pulse" />
          </template>
          <template #error>
            <div class="w-full h-full bg-blue-300 flex items-center justify-center">
              <svg class="w-8 h-8 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          </template>
        </el-image>

        <!-- Hover overlay -->
        <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
      </div>

      <!-- Info -->
      <div class="mt-3 text-center w-full">
        <h3 class="text-sm font-normal italic text-blue-300 leading-snug line-clamp-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ item.name }}
        </h3>
        <p v-if="item.alias.length" class="text-xs text-blue-300 mt-0.5 line-clamp-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {{ item.alias.join(' / ') }}
        </p>
        <div class="mt-2 text-[10px] font-mono text-blue-300 text-center whitespace-nowrap overflow-hidden text-ellipsis
            max-h-4 group-hover:max-h-12 transition-all duration-300">
          <span class="block">{{ item.musicSize }} 首歌曲</span>
          <!-- <span class="block opacity-0 group-hover:opacity-100 transition-opacity duration-300">{{ item.albumSize }} 张专辑</span>
          <span class="block opacity-0 group-hover:opacity-100 transition-opacity duration-300">{{ item.mvSize }} 个 MV</span> -->
        </div>
      </div>
    </div>
  </section>
</div>

</template>