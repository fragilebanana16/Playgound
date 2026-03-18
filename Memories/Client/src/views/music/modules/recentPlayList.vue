<script setup>
import { Icon } from '@iconify/vue'
import useMusicStore from '@/store/modules/music'
import altCover from '@/assets/images/user/avatar.webp'

// const router = useRouter()

const musicStore = useMusicStore();
const { playSong, currentSong } = inject('MusicPlayer')

const playMusic = (id) => {
  const existingIndex = musicStore.trackList.findIndex(
    (existingTrack) => existingTrack.id === id
  )
  const existingTrack = musicStore.trackList[existingIndex]
  musicStore.setCurrentSong(existingIndex)
  playSong(existingTrack)
}

</script>
<template>
  <el-popover :width="450" trigger="click" placement="top-end">
    <div class="py-2">
      <h1 class="text-lg  mb-4 dark:text-white">最近播放 <span class="text-base">({{ musicStore.trackList.length }})</span></h1>
      <el-scrollbar class="!h-[400px] pr-2">
        <ul class="space-y-1">
          <li
            v-for="(song, index) in musicStore.trackList"
            :key="index"
            class="flex items-center px-4 py-1 hover:bg-gray-100 rounded-lg transition-hover duration-300 justify-between group"
            @click="playMusic(song.id)"
          >
            <div class="flex items-center">
              <img
                :src="song.cover ? song.cover :altCover"
                :alt="song.title"
                class="w-8 h-8 rounded-lg mr-4"
              />
              <div>
                <h2 class="text-sm font-semibold dark:text-white line-clamp-1 " :title="song.title">
                  {{ song.title }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ song.singer }}
                </p>
              </div>
            </div>
            <div class="flex items-center">
              <el-button type="primary" text circle>
                <div
                v-if="currentSong.id === song.id"
                  class="equalizer playing" >
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <Icon v-else icon="material-symbols:play-circle" class="text-lg opacity-10 group-hover:opacity-100 transition-opacity duration-500" />
              </el-button>
            </div>
          </li>
        </ul>
      </el-scrollbar>
    </div>
    <template #reference>
      <el-button text circle>
        <Icon icon="bxs:playlist" class="dark:text-white text-lg"></Icon>
      </el-button>
    </template>
  </el-popover>
</template>
<style scoped>
.el-button + .el-button {
  margin-left: 0;
}

.equalizer {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 16px;
}

.equalizer span {
  width: 3px;
  background: currentColor;
  border-radius: 1px;
  height: 4px; /* 暂停时都是矮的 */
  transition: height 0.2s;
}

.equalizer.playing span {
  animation: bar 0.8s ease-in-out infinite alternate;
}

.equalizer.playing span:nth-child(1) { animation-delay: 0s;    }
.equalizer.playing span:nth-child(2) { animation-delay: 0.2s;  }
.equalizer.playing span:nth-child(3) { animation-delay: 0.4s;  }

@keyframes bar {
  0%   { height: 3px;  }
  100% { height: 14px; }
}
</style>