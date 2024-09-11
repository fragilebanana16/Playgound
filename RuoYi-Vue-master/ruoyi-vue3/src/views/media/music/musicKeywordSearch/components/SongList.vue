<script setup lang="ts">
// 定义 Artist 接口
interface Artist {
  name: string
}

// 定义 Item 接口
interface Item {
  id: number
  name: string
  coverImgUrl: string
  artists: Artist[]
  creator: {
    nickname: string
  }
}
let modelValue = defineModel<Item[]>()
const url =
  'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
</script>
<template>
  <section
    class="flex-1 p-4 md:p-6 grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
  >
    <router-link
      class="group relative overflow-hidden"
      v-for="item in modelValue"
      :key="item.id"
      :to="`/songlist?id=${item.id}`"
    >
    <!-- :src="item.coverImgUrl + '?param=200y200'" -->
      <el-image
        :src= "url" 
        lazy
        class="transition-opacity rounded-lg"
      />
      <div class="p-2">
        <h3 class="font-medium text-sm line-clamp-1">
          {{ item.name }}
        </h3>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <span class="line-clamp-1 text-xs">{{ item.creator.nickname }}</span>
        </div>
      </div>
    </router-link>
  </section>
</template>