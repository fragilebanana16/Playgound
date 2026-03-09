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


</script>
<template>
  <header class="flex justify-between p-2 items-center shrink-0 border-x-0 border-t-0 border-1 border-b-blue-100">
    <div />

    <el-input v-model="keyWord" placeholder="string" style="--el-input-border-radius: 30px; width: 300px"
      @keyup.enter="toSearch" class="dark:text-white">
      <template #prefix>
        <Icon icon="material-symbols:search" />
      </template>
    </el-input>
    <Icon 
      class="h-5 w-5 cursor-pointer text-primary/70 hover:text-primary transition-colors duration-200 mr-2" 
      :icon="props.isFullscreen ? 'mdi:arrow-collapse' : 'mdi:arrow-expand'"
      @click="emit('toggleFullscreen')"
    />
  </header>
</template>

<style scoped>

</style>