<script setup>
// import MusicList from '../MusicList.vue'
// import Footer from '../Footer.vue'
// import Header from '../Header.vue'
import MusicList from '../modules/musicList.vue'
// import DrawerPlayer from '../components/DrawerPlayer'
// import { cloudsearch } from '@/api'
// import { cloudsearchResult } from '@/api/interface'
import SongList from './modules/songList.vue'
import Album from './modules/album.vue'
import Artists from './modules/artists.vue'
import { Icon } from '@iconify/vue'
import mockData from './searchData.json'
const typeMap = {
  '1': 'songs',
  '10': 'albums',
  '100': 'artists',
  '1000': 'playlists',
  '1004': 'mvs',
}

const pageMap = {
  '1': 8,
  '10': 10,
  '100': 10,
  '1000': 10,
  '1004': 2,
}

const mockSearch = (keywords, type = '1', offset = 0, limit = 6) => {
  const key = typeMap[type]
  const limitPage = pageMap[type]
  const allData = mockData[key] ?? {}
  const embedded = allData[key] ?? []
  const slice = embedded.slice(offset, offset + limitPage)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 200,
        result: {
          [`${key}Count`]: embedded.length,
          [key]: slice                         // songs: 切片后的数据
        }
      })
    }, 300)
  })
}

const url =
  'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'

const route = useRoute()
onMounted(() => {
    console.log(`route.query.kw:`,route.query.kw)
})

const state = reactive({
  activeName: '1',
  tableData: {},
  albumData: { albums: [] },
  singerData: { artists: [] },
  songData: { playlists: [] },
  mvData: { mvs: [] },
  currentPage: 1,
  size: 'small',
  total: 0,
})

const {
  tableData,
  activeName,
  mvData,
  songData,
  singerData,
  albumData,
  currentPage,
  size,
  total,
} = toRefs(state)

// 封装一个公共的搜索函数
const performSearch = async (kw, type, page = 1, limit = 6) => {
  const offset = (page - 1) * pageMap[state.activeName]
  const res = await mockSearch(kw, type, offset, limit)
  const result = res.result
  switch (state.activeName) {
    case '1':
      state.tableData = result
      state.total = result.songsCount
      break
    case '10':
      state.albumData = result
      state.total = result.albumsCount
      break
    case '100':
      state.singerData = result
      state.total = result.artistsCount
      break
    case '1000':
      state.songData = result
      state.total = result.playlistsCount
      break
    case '1004':
      state.mvData = result
      state.total = result.mvsCount
      break
  }
}

// 监听搜索关键字
watch(
  () => route.query.kw,
  (newKw) => {
    // if (typeof newKw === 'string') {
    //   performSearch(newKw)
    // }
    // mock
    performSearch(newKw)

  },
  { immediate: true }
)

const handleTabClick = ({ props }) => {
  state.currentPage = 1 // 用户切 tab 基本都是想从头看，重置到第 1 页反而更符合直觉
  performSearch(route.query.kw, props.name)
}

const handleCurrentPageNumChange = (current) => {
  performSearch(
    route.query.kw,
    state.activeName,
    current,
    state.pageSize
  )
}

</script>
<script>
export default {
  name: 'MusicSearch',
}
</script>
<template>
  <div >
    <div
    class=" h-full py-4 gap-2 w-full box-border flex flex-1 flex-col overflow-x-hidden"
  >
    <div
      class="flex flex-col px-4 gap-8 md:gap-12 lg:gap-16 overflow-x-hidden"
    >
      <el-tabs v-model="activeName" class="demo-tabs" @tabClick="handleTabClick">
        <el-tab-pane name="1">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="iconamoon:music-album-light" />
              <span>Songs</span>
            </div>
          </template>
          <div class="tab-panel">
            <MusicList v-model="tableData.songs"/>
          </div>
        </el-tab-pane>
        <el-tab-pane name="10">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="f7:music-albums" />
              <span>Album</span>
            </div>
          </template>
          <div class="tab-panel">
            <Album v-model="albumData.albums" />
          </div>
        </el-tab-pane>
        <el-tab-pane name="100">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="iconamoon:music-artist" />
              <span>Artists</span>
            </div>
          </template>
          <div class="tab-panel">
            <Artists v-model="singerData.artists" />
          </div>
        </el-tab-pane>
        <el-tab-pane name="1000">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="streamline:music-folder-song" />
              <span>SongList</span>
            </div>
          </template>
          <div class="tab-panel">
            <SongList v-model="songData.playlists" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-pagination
      class="flex items-center justify-center"
      v-model:current-page="currentPage"
      v-model:page-size="pageMap[activeName]"
      :size="size"
      layout="total, prev, pager, next, jumper"
      :total="total"
      @current-change="handleCurrentPageNumChange"
    />
  </div>
  </div>
</template>

<style scoped>
.tab-panel {
  height: calc( 100vh - 360px );
}
</style>