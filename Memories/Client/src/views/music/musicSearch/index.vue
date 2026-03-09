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

 const mockSearch = (keywords, type = '1') => {
  const key = typeMap[type]
  const data = mockData[key]
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ code: 200, result: data })
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
  pageSize: 30,
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
  pageSize,
  size,
  total,
} = toRefs(state)

// 封装一个公共的搜索函数
const performSearch = async (kw, type, offset, limit = 20) => {
  const res = await mockSearch(kw, type, offset, limit)
  const result = res.result
  switch (state.activeName) {
    case '1':
      state.tableData = result
      state.total = result.songCount
      break
    case '10':
      state.albumData = result
      state.total = result.albumCount
      break
    case '100':
      state.singerData = result
      state.total = result.artistCount
      break
    case '1000':
      state.songData = result
      state.total = result.playlistCount
      break
    case '1004':
      state.mvData = result
      state.total = result.mvCount
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

// handleClick 函数
const handleClick = ({ props }) => {
  state.currentPage = 1
  performSearch(route.query.kw, props.name)
}

const handleSizeChange = (Size) => {
  performSearch(
    route.query.kw,
    state.activeName,
    state.currentPage,
    Size
  )
}

const handleCurrentChange = (current) => {
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
  <div class="h-[calc(100vh-53px-84px-64px)]">
    <div
    class=" h-full py-4 gap-2 w-full box-border flex flex-1 flex-col overflow-x-hidden"
  >
    <div
      class="flex flex-col px-4 gap-8 md:gap-12 lg:gap-16 overflow-x-hidden"
    >
      <el-tabs v-model="activeName" class="demo-tabs" @tabClick="handleClick">
        <el-tab-pane name="1">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="iconamoon:music-album-light" />
              <span>Songs</span>
            </div>
          </template>
          <div class="h-[calc(100vh-340px)]">
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
          <Album v-model="albumData.albums" />
        </el-tab-pane>
        <el-tab-pane name="100">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="iconamoon:music-artist" />
              <span>Artists</span>
            </div>
          </template>
          <Artists v-model="singerData.artists" />
        </el-tab-pane>
        <el-tab-pane name="1000">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="streamline:music-folder-song" />
              <span>SongList</span>
            </div>
          </template>
          <SongList v-model="songData.playlists" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <el-pagination
      class="flex items-center justify-center"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="[10, 20, 30, 40]"
      :size="size"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  </div>
</template>

<style scoped>
</style>