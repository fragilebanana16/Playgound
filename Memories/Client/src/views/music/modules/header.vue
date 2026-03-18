<script setup lang="ts">
import { Icon } from '@iconify/vue'
const props = defineProps<{
  isFullscreen: boolean
}>()

const emit = defineEmits(['toggleFullscreen'])
const router = useRouter()
const keyWord = ref('')
const toSearch = () => {
  //router.push({ path: '/media/musicMan/musicSearch', query: { kw: keyWord.value } })
}
const query = ref('')

</script>
<template>
  <header class="flex justify-between p-2 items-center shrink-0 border-x-0 border-t-0 border-1 border-b-blue-100">
    <div />

    <div class="relative max-w-md">
  <svg
    class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  >
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
  <input
    v-model="query"
    placeholder="Search"
    class="w-full border rounded pl-10 pr-4 py-1.5
           text-sm text-blue-100
           focus:border-blue-400 transition-colors
           placeholder:text-g-500"
  />
</div>
    <Icon 
      class="h-5 w-5 cursor-pointer text-primary/70 hover:text-primary transition-colors duration-200 mr-2" 
      :icon="props.isFullscreen ? 'mdi:arrow-collapse' : 'mdi:arrow-expand'"
      @click="emit('toggleFullscreen')"
    />
  </header>
</template>

<style scoped>

</style>