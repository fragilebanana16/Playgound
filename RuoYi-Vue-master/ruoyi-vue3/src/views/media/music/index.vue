<script setup>
// import { cloudsearch } from '@/api'
// import { cloudsearchResult, PlaylistsResponse } from '@/api/interface'
// const songListRef = ref()
import Footer from './Footer.vue'
import Header from './Header.vue'
import MusicList from './MusicList.vue'
import DrawerPlayer from './components/DrawerPlayer'
import Main from './Main.vue'
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

// onMounted(() => {
//   Promise.all([
//     cloudsearch({ kw: '境界的彼方' }),
//     cloudsearch({ kw: '境界的彼方', type: 1000 }),
//   ])
//     .then(([result1, result2]) => {
//       state.tableData = result1.result
//       state.SongList = result2.result
//     })
//     .catch((error) => {
//       console.error('Error occurred:', error)
//     })
// })

// const progress = (type: 'back' | 'forward') => {
//   const scrollLeft = songListRef.value.wrapRef.scrollLeft
//   if (type == 'back') {
//     songListRef.value.setScrollLeft(scrollLeft - 150)
//   } else {
//     songListRef.value.setScrollLeft(scrollLeft + 150)
//   }
// }
</script>
<script>
export default {
  name: 'Music', // 菜单配置的是musicLayout，不要配成music
}
</script>
<template>
  <div
    class="h-[calc(100vh-84px)] flex backdrop-blur-lg flex-col justify-center shadow-xl  w-full overflow-hidden bg-white dark:bg-[#636463]">
    <Header />
    <Main/>
    <Footer @show="handleShow" />
    <DrawerPlayer ref="PlayerDrawerRef" />
  </div>
</template>

<style scoped>
.banner {
  background-image: url('@/assets/images/login-background.jpg'),
    linear-gradient(to right, #fd31a2, #ff3a8b, #ff4b78, #cf4af3, #e73bd7);
}
</style>