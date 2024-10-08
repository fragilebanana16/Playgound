<script setup>
import { Icon } from '@iconify/vue'
import RecentPlayList from './components/RecentPlayList'
import Volume from './Volume.vue'
import { PlayMode } from '@/utils/enum'
import altCover from '@/assets/images/defaultAlbum.jpg'

const {
  currentSong,
  togglePlayPause,
  isPlaying,
  playNext,
  playPrevious,
  currentTime,
  changeCurrentTime,
  duration,
  setPlayMode
} = inject('MusicPlayer')

const Emit = defineEmits(['show'])

const currentMode = ref(PlayMode.Sequence)
const currentModeIcon = ref("fe:list-order")
function switchPlayMode() {
  updatePlayModeIcon()
}

// seq -> random -> loop -> repeat -> seq
function updatePlayModeIcon() {
  let curMode = PlayMode.Sequence
  let curModeIcon = "fe:list-order"
  switch (currentMode.value) {
    case PlayMode.Sequence:
      curMode = PlayMode.Random
      curModeIcon = "fe:random"
      break
    case PlayMode.Random:
      curMode = PlayMode.Loop
      curModeIcon = "fad:loop"
      break
    case PlayMode.Single:
      curMode = PlayMode.Sequence
      curModeIcon = "fe:list-order"
      break
    case PlayMode.Loop:
      curMode = PlayMode.Single
      curModeIcon = "bi:repeat-1"
      break
    default:
      break
  }

  setPlayMode(curMode)
  currentMode.value = curMode
  currentModeIcon.value = curModeIcon
}
// 格式化时间
function formatTime(seconds) {
  // 将秒数转换为整数分钟数和剩余秒数
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)

  // 返回格式化的字符串，确保分钟和秒数都至少有两位数
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}
</script> 
<template>
  <footer class="footer-player border-2 border-x-0 border-b-0 shadow-sm dark:border-t-gray-500 dark:bg-[#636463]">
    <div class="mx-auto flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 w-[240px]">
          <el-image :src="currentSong.cover ? currentSong.cover : altCover" alt="Album cover" class="rounded-md w-9 h-9"
            style="aspect-ratio: 40 / 40; object-fit: cover" @click="Emit('show')"/>
          <div>
            <div class="text-sm font-medium line-clamp-1 dark:text-gray-200" :title="currentSong.title">
              {{currentSong.title}}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1" :title="currentSong.singer">
              {{currentSong.singer}}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <el-button text circle class="!p-3">
            <Icon class="text-lg" icon="mage:previous-fill" @click="playPrevious"/>
          </el-button>
          <el-button text circle class="!p-3" @click="togglePlayPause">
            <Icon :icon="isPlaying
                ? 'ic:round-pause-circle'
                : 'material-symbols:play-circle'
              " class="text-3xl" />
          </el-button>
          <el-button text circle class="!p-3">
            <Icon class="text-lg" icon="mage:next-fill" @click="playNext"/>
          </el-button>
          <el-button text circle class="!p-3">
            <Icon :icon="true ? 'mdi:cards-heart' : 'mdi:cards-heart-outline'" class="text-lg"
              :class="isPlaying ? 'text-red-500' : ''" />
          </el-button>
        </div>
      </div>
      <div class="flex-1 mx-4 flex gap-3 w-full items-center">
        <el-slider v-model="currentTime" :step="1" :show-tooltip="false" @change="changeCurrentTime" :max="duration"
          class="w-full" size="small" />
        <div class="flex items-center gap-2 text-gray-500 text-xs dark:text-gray-400">
          <span>{{ formatTime(currentTime) }}</span>
          <span>/</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      <div class="flex items-center">
        <el-button text circle @click="switchPlayMode" class="mr-2">
          <Icon :icon="currentModeIcon" class="text-lg" />
        </el-button>
        <Volume />
        <RecentPlayList />
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.el-button+.el-button {
  margin-left: 0;
}
</style>  