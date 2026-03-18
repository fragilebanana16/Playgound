<script setup>
// import { cloudsearch } from '@/api'
// import { cloudsearchResult, PlaylistsResponse } from '@/api/interface'
// const songListRef = ref()

// import Footer from './Footer.vue'
import Header from './modules/header.vue'
import Aside from './modules/aside.vue'
import Footer from './modules/footer.vue'
import DrawerPlayer from './modules/drawerPlayer.vue'

import { useFullscreen, useWindowSize } from '@vueuse/core'
const containerRef = ref(null)
const { isFullscreen, toggle } = useFullscreen(containerRef)
// import MusicList from './MusicList.vue'
// import Main from './Main.vue'
const PlayerDrawerRef = ref()
const state = reactive({
  tableData: {},
  SongList: { playlists: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2, 3, 4, 5] },
})
const url =
  'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
const { tableData, SongList } = toRefs(state)

const handleShow = () => {
  if (PlayerDrawerRef.value) {
    PlayerDrawerRef.value.show()
  }
}

</script>
<script>
export default {
  name: 'Music',
}
</script>
<template>
  <div ref="containerRef" class="flex backdrop-blur-lg  bg-white  flex-col shadow-xl w-full overflow-hidden rounded-lg" style="height: calc(100vh - 90px)">
   <Header class="rounded-t-lg" :isFullscreen="isFullscreen" @toggleFullscreen="toggle"/>
   <main class="flex flex-1 overflow-hidden">
      <!-- 左侧边栏 -->
      <Aside />
      <!-- 右侧主内容 -->
      <div class="flex-1 overflow-y-auto">
        <RouterView />
      </div>
    </main>
    <Footer @show="handleShow" />
    <!-- 播放器抽屉 -->
    <DrawerPlayer ref="PlayerDrawerRef" />
  </div>
</template>

<style scoped>
.banner {
  background-image: url('@/assets/images/login-background.jpg'),
    linear-gradient(to right, #fd31a2, #ff3a8b, #ff4b78, #cf4af3, #e73bd7);
}
</style>