<script setup>
import Main from './Main.vue'
</script>
<script>
export default {
  name: 'Video', // 菜单配置的是videoLayout，不要配成video
}
</script>
<template>
  <div
    class="h-[calc(100vh-84px)] flex backdrop-blur-lg flex-col justify-center shadow-xl  w-full overflow-hidden bg-white dark:bg-[#636463]">
    <Main/>
  </div>
</template>