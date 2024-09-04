<script setup>
import { Icon } from '@iconify/vue'
const { setVolume, volume } = inject('MusicPlayer')

let restoreVolume = 0
function muteClick(){
  if (volume.value !== 0) {
    restoreVolume = volume.value
    setVolume(0)
  } else{
    setVolume(restoreVolume)
  }
}

function rtChangeVolume(val){
  setVolume(val)
}
</script>
<template>
  <div class="flex items-center">
    <el-button text circle class="mr-4">
        <Icon icon="prime:volume-up" class="text-lg" @click="muteClick"/>
    </el-button>
    <el-slider
      v-model="volume"
      :show-tooltip="false"
      class="!w-24"
      size="small"
      :format-tooltip="rtChangeVolume"
    />
  </div>
</template>