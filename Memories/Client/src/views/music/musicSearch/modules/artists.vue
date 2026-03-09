<script setup lang="ts">
// 定义 Artist 接口
interface Artist {
  name: string
}

// 定义 Item 接口
interface Item {
  id: number
  name: string
  picUrl: string
  artists: Artist[]
}
const url =
  'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
let modelValue = defineModel<Item[]>()
</script>
<template>
  <section
    class="flex-1 p-4 md:p-6 grid gap-4 grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
  >
    <div
      class="group relative overflow-hidden"
      v-for="item in modelValue"
      :key="item.id"
    >
    <!-- "item.picUrl + '?param=260y260'" -->
      <el-image
        :src= "url" 
        lazy
        class="transition-opacity rounded-full"
      />
      <div class="p-2">
        <h3 class="font-medium text-sm line-clamp-1 text-center">
          {{ item.name }}
        </h3>
      </div>
    </div>
  </section>
</template>