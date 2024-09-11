<script setup>
// import MusicList from '../MusicList.vue'
// import Footer from '../Footer.vue'
// import Header from '../Header.vue'
import MusicList from '../MusicList.vue'
// import DrawerPlayer from '../components/DrawerPlayer'
// import { cloudsearch } from '@/api'
// import { cloudsearchResult } from '@/api/interface'
import MV from './components/MV.vue'
import SongList from './components/SongList.vue'
import Album from './components/Album.vue'
import Artists from './components/Artists.vue'
import { Icon } from '@iconify/vue'

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

const cloudsearch = () => { 
  return new Promise((resolve, reject) => {
  const result = {
    'songs': [
    {
      "name": "Cheating on You",
      "id": 1393800989,
      "pst": 0,
      "t": 0,
      "ar": [
        {
          "id": 90331,
          "name": "Charlie Puth",
          "tns": [
            "查理·普斯"
          ],
          "alias": [
            "断眉"
          ],
          "alia": [
            "断眉"
          ]
        }
      ],
      "al": {
        "id": 82004878,
        "name": "Cheating on You",
        "picUrl": "http://p1.music.126.net/NCOWM8LHJYzPzL-fjP1lTA==/109951164391414873.jpg",
        "tns": [],
        "pic_str": "109951164391414873",
        "pic": 109951164391414880
      },
    }],
    'songCount': 297
  }
  resolve({result});
})

}

// 封装一个公共的搜索函数
const performSearch = async (kw, type, offset, limit = 20) => {
  const { result } = await cloudsearch({ kw, type, limit, offset })
  debugger
  switch (state.activeName) {
    case '1':
      state.tableData = state.tableData = result
      state.total = result.songCount
      break
    case '10':
      state.albumData = state.albumData = result
      state.total = result.albumCount
      break
    case '100':
      state.singerData = state.singerData = result
      state.total = result.artistCount
      break
    case '1000':
      state.songData = state.songData = result
      state.total = result.playlistCount
      break
    case '1004':
      state.mvData = state.mvData = result
      state.total = result.mvCount
      break

    default:
      break
  }
  state.tableData = result
}

// 监听搜索关键字
watch(
  () => route.query.kw,
  (newKw) => {
    if (typeof newKw === 'string') {
      performSearch(newKw)
    }
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
  name: 'MusicKeywordSearch',
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
          <div class="h-[calc(100vh-53px-84px-64px-71px-24px-16px-9px)]">
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
        <el-tab-pane name="1004">
          <template #label>
            <div class="flex gap-1 items-center">
              <Icon icon="solar:video-frame-linear" />
              <span>MV</span>
            </div>
          </template>
          <MV v-model="mvData.mvs" />
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