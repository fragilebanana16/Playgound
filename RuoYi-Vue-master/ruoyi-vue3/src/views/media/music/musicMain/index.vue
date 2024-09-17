<script setup>
// import MusicList from '../MusicList.vue'
import Footer from '../Footer.vue'
import Header from '../Header.vue'
import MusicList from '../MusicList.vue'
import DrawerPlayer from '../components/DrawerPlayer'
import { listMusic } from "@/api/system/music";

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

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    title: null,
    duration: null,
    description: null,
    thumbnailUrl: null,
    url: null,
    lyrUrl: null,
    artistId: null
  },
  rules: {
    title: [
      { required: true, message: "标题不能为空", trigger: "blur" }
    ],
    url: [
      { required: true, message: "地址不能为空", trigger: "blur" }
    ],
  }
});
const { queryParams, form, rules } = toRefs(data);

onMounted(() => {
  listMusic(queryParams.value).then(response => {
    tableData.value = response
    console.log(`response:`,response)
  })
  .catch((error) => {
      console.error('Error occurred:', error)
  });
})

</script>
<script>
export default {
  name: 'MusicMain', // 注意要和设置路由musicMain一致
}
</script>
<template>
  <div class="flex flex-col h-[calc(100vh-53px-84px-62px)]">
      <section class="px-6 pt-6">
        <div class="banner rounded-lg flex">
          <div class="flex flex-col p-8">
            <h2 class="text-lg font-semibold text-white line-clamp-1">《黑神话：悟空》将来会写进历史。</h2>
            <p class="mt-2 text-sm text-white line-clamp-2">
              不是因为游戏本身，而是因为它是一个起点，可能会带动中国游戏产业，向着大型化、剧情化、史诗级游戏的道路发展。
              中国早就是世界最大的游戏市场，也制作了很多非常赚钱的明星游戏，比如《原神》。但是，那些游戏都是网络游戏，需要通过网络，多人在线游玩。中国从来没有出现过国产的单机 3A 游戏大作，直到这一次。
            </p>
          </div>
          <!-- <img
        src="@/assets/images/login-background.jpg"
        class="w-full max-w-[350px] mt-[-50px] h-auto hidden md:flex"
      /> -->
        </div>
      </section>
      <section class="flex flex-col overflow-hidden px-6">
        <el-scrollbar class="relative" ref="songListRef">
          <div class="flex mt-6 space-x-4 rounded-xl pb-6">
            <router-link class="flex flex-col gap-2" v-for="item in SongList.playlists" :key="item.id"
              to="/media/musicMan/music_album">
              <el-image :src="url" alt="item.name" class="w-28 h-28 rounded-lg" />
              <span class="text-xs text-center line-clamp-1" :title="item.name">{{
                item.name
              }}</span>
            </router-link>
            <button
              class="absolute top-1/2 -translate-y-1/2 rounded-full bg-background/50 p-2 text-muted-foreground transition-colors duration-300 hover:bg-background/75"
              @click="progress('back')" v-if="SongList.playlists && SongList.playlists.length > 0">
              <svg data-id="13" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </button>
            <button
              class="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-background/50 p-2 text-muted-foreground transition-colors duration-300 hover:bg-background/75"
              @click="progress('forward')" v-if="SongList.playlists && SongList.playlists.length > 0">
              <svg data-id="15" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>
        </el-scrollbar>
      </section>
      <section v-if="tableData?.total > 0" class="rounded-xl overflow-hidden px-6 flex-1">
        <MusicList v-model="tableData.rows" />
      </section>
  </div>
</template>

<style scoped>
.banner {
  background-image: url('@/assets/images/login-background.jpg'),
    linear-gradient(to right, #fd31a2, #ff3a8b, #ff4b78, #cf4af3, #e73bd7);
}
</style>