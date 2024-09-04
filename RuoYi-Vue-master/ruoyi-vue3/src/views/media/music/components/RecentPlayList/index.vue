<script setup>
import { Icon } from '@iconify/vue'

// const router = useRouter()

// const audioStore = useAudioStore()

const { playSong } = inject('MusicPlayer')

const playMusic = (id) => {
//   const existingIndex = audioStore.trackList.findIndex(
//     (existingTrack) => existingTrack.id === id
//   )
//   const existingTrack = audioStore.trackList[existingIndex]
//   audioStore.setCurrentSong(existingIndex)
//   playSong(existingTrack)
}

const audioStore = {
    trackList: [
        {id: '1', cover: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png', title: 'AABB', singer: 'Bat'},
        {id: '2', cover: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png', title: 'CCC', singer: 'ERRR'},
        {id: '3', cover: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png', title: 'EEE', singer: 'QWE'},
    ]
}
</script>
<template>
  <el-popover :width="450" trigger="click" placement="top-end">
    <div class="py-4">
      <h1 class="text-xl  mb-4 dark:text-white">最近播放 <span class="text-base">({{ audioStore.trackList.length }})</span></h1>
      <el-scrollbar class="!h-[300px]">
        <ul class="space-y-1">
          <li
            v-for="(song, index) in audioStore.trackList"
            :key="index"
            class="flex items-center px-4 py-1 hover:bg-gray-300 dark:hover:bg-[#414243] rounded-lg transition justify-between"
            @click="playMusic(song.id)"
          >
            <div class="flex items-center">
              <img
                :src="song.cover"
                :alt="song.title"
                class="w-8 h-8 rounded-lg mr-4"
              />
              <div>
                <h2 class="text-sm font-semibold dark:text-white">
                  {{ song.title }}
                </h2>
                <p class="text-gray-600 dark:text-gray-400">
                  {{ song.singer }}
                </p>
              </div>
            </div>

            <div class="flex items-center">
              <el-button type="primary" text circle @click="playMusic(song.id)">
                <Icon icon='material-symbols:play-circle' class="text-lg text-gray-500" />
              </el-button>
              <el-button
                type="primary"
                text
                circle
                v-if="song.mv && song.mv !== 0"
                @click="router.push(`/video?id=${song.mv}`)"
              >
              <Icon class="text-lg text-gray-500" icon="solar:video-frame-linear" />
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
</style>