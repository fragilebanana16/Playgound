<script setup>
import { Icon } from '@iconify/vue'
const { setVolume, volume } = inject('MusicPlayer')
</script>
<template>
  <div class="flex items-center">
    <el-button text circle class="mr-4">
        <Icon icon="prime:volume-up" class="text-lg" />
    </el-button>
    <el-slider
      v-model="volume"
      :show-tooltip="false"
      @change="setVolume"
      class="!w-24"
      size="small"
    />
  </div>
</template>