<script setup>
// import { playlistDetail, commentPlaylist } from '@/api'
// import { playlistDetailResponse } from '@/api/interface'
// import { Track } from '@/stores/interface'
// import { Comment } from '@/api/interface'
import useMusicStore from '@/store/modules/music'
import { Icon } from '@iconify/vue'
import altCover from '@/assets/images/profile.jpg'
import MusicList from '../MusicList.vue'

const route = useRoute()
const musicStore = useMusicStore()
const state = reactive({
  playlistData: {
    playlist: {
      tracks: [],
    },
  }, //  as unknown as playlistDetailResponse
  commentListData: [],// as Comment[],
  drawer: false,
})
const { playlistData, commentListData, drawer } = toRefs(state)
const mockPlaylist = {
    "id": 12210493597,
    "name": "梦核美学：渗透灵魂的量子冥想感知乐",
    "coverImgId": 109951169730500460,
    "coverImgUrl": "https://p1.music.126.net/gMEhNHiRM23rBraXm49lIw==/109951169730500468.jpg",
    "coverImgId_str": "109951169730500468",
    "commentCount": "3022",
    "userId": 342371680,
    "createTime": 1719032194163,
    "status": 0,
    "updateTime": 1723953329001,
    "trackCount": 77,
    "trackUpdateTime": 1725620589574,
    "playCount": 95334,
    "trackNumberUpdateTime": 1723953329001,
    "description": "寂静，幽暗，\n孤独，忧伤。\n仿佛独自一人\n于寂静的夜晚回眸凝望，\n目之所及，\n是抓不住的如水月光，\n和流水一样渐行渐远的斑驳过往……",
    "tags": [
        "电子",
        "安静",
        "孤独"
    ],
    "tracks": [
        {
            "name": "green to blue (slowed + reverbed)",
            "id": 1983780110,
            "pst": 0,
            "t": 0,
            "ar": [
                {
                    "id": 48705509,
                    "name": "Daniel.mp3",
                    "tns": [],
                    "alias": []
                }
            ],
            "alia": [],
            "pop": 100,
            "st": 0,
            "rt": "",
            "fee": 8,
            "v": 7,
            "crbt": null,
            "cf": "",
            "al": {
                "id": 152096645,
                "name": "green to blue (slowed + reverbed)",
                "picUrl": "http://p1.music.126.net/5J2wVc8duegHT2pfP_5hDA==/109951167901314672.jpg",
                "tns": [],
                "pic_str": "109951167901314672",
                "pic": 109951167901314670
            },
            "dt": 187068,
            "h": {
                "br": 320002,
                "fid": 0,
                "size": 7485693,
                "vd": -22465
            },
            "m": {
                "br": 192002,
                "fid": 0,
                "size": 4491433,
                "vd": -19819
            },
            "l": {
                "br": 128002,
                "fid": 0,
                "size": 2994303,
                "vd": -18013
            },
            "sq": {
                "br": 609972,
                "fid": 0,
                "size": 14263343,
                "vd": -23519
            },
            "hr": null,
            "a": null,
            "cd": "01",
            "no": 1,
            "rtUrl": null,
            "ftype": 0,
            "rtUrls": [],
            "djId": 0,
            "copyright": 1,
            "s_id": 0,
            "mark": 139392,
            "originCoverType": 3,
            "originSongSimpleData": null,
            "tagPicList": null,
            "resourceState": true,
            "version": 7,
            "songJumpInfo": null,
            "entertainmentTags": null,
            "awardTags": null,
            "single": 0,
            "noCopyrightRcmd": null,
            "alg": null,
            "displayReason": null,
            "rtype": 0,
            "rurl": null,
            "mst": 9,
            "cp": 743010,
            "mv": 0,
            "publishTime": 1664985600000
        },
        {
            "name": "Lotus Butterfly",
            "id": 2616057299,
            "pst": 0,
            "t": 0,
            "ar": [
                {
                    "id": 56056564,
                    "name": "凌晨一点的莱茵猫",
                    "tns": [],
                    "alias": []
                }
            ],
            "alia": [],
            "pop": 100,
            "st": 0,
            "rt": "",
            "fee": 8,
            "v": 7,
            "crbt": null,
            "cf": "",
            "al": {
                "id": 244608667,
                "name": "Lotus Butterfly",
                "picUrl": "http://p1.music.126.net/vG94Pq2dyz4TenbygpNpTw==/109951169860367856.jpg",
                "tns": [],
                "pic_str": "109951169860367856",
                "pic": 109951169860367860
            },
            "dt": 150000,
            "h": {
                "br": 320002,
                "fid": 0,
                "size": 6002982,
                "vd": -59505
            },
            "m": {
                "br": 192002,
                "fid": 0,
                "size": 3601807,
                "vd": -56890
            },
            "l": {
                "br": 128002,
                "fid": 0,
                "size": 2401219,
                "vd": -55053
            },
            "sq": {
                "br": 1395019,
                "fid": 0,
                "size": 26156621,
                "vd": -59537
            },
            "hr": null,
            "a": null,
            "cd": "01",
            "no": 1,
            "rtUrl": null,
            "ftype": 0,
            "rtUrls": [],
            "djId": 0,
            "copyright": 0,
            "s_id": 0,
            "mark": 17180008448,
            "originCoverType": 0,
            "originSongSimpleData": null,
            "tagPicList": null,
            "resourceState": true,
            "version": 7,
            "songJumpInfo": null,
            "entertainmentTags": null,
            "awardTags": null,
            "single": 0,
            "noCopyrightRcmd": null,
            "alg": null,
            "displayReason": null,
            "rtype": 0,
            "rurl": null,
            "mst": 9,
            "cp": 0,
            "mv": 0,
            "publishTime": 1723219200000,
            "tns": [
                "忘忧蝶"
            ]
        },
    ],
    "trackIds": [
        {
            "id": 1983780110,
            "v": 7,
            "t": 0,
            "at": 1719547690414,
            "alg": null,
            "uid": 342371680,
            "rcmdReason": "",
            "sc": null,
            "f": null,
            "sr": null,
            "dpr": null
        },
        {
            "id": 2616057299,
            "v": 7,
            "t": 0,
            "at": 1723287125291,
            "alg": null,
            "uid": 342371680,
            "rcmdReason": "",
            "sc": null,
            "f": null,
            "sr": null,
            "dpr": null
        }
    ],
}
onMounted(() => {
    console.log(`route.query.id:`,route.query.id)
    state.playlistData.playlist = mockPlaylist

//   playlistDetail(route.query.id).then((res) => {
//     state.playlistData = res
//   })
})

function formatNumber(num) {
  if (num < 10000) {
    return num.toString() // 直接返回小于10000的数字
  } else if (num < 100000) {
    const formatted = (num / 10000).toFixed(1)
    return formatted.endsWith('.0')
      ? formatted.slice(0, -2) + '万'
      : formatted + '万' // 处理 1.0万 和 1.5万
  } else {
    return (num / 10000).toFixed(0) + '万' // 对于大于或等于100000的数字，直接显示为整数的万
  }
}

function formattedDate(str) {
  return new Date(str).toLocaleString()
}

const getCommentPlaylist = (pages = 1) => {
    console.log(`getCommentPlaylist`)
//   commentPlaylist({ offset: pages, id: route.query.id}).then(
//     (res) => {
//       state.commentListData = state.commentListData.concat(res.comments)
//     }
//   )
}

const showDrawer = () => {
  state.drawer = true
//   if (state.commentListData.length > 0) return
//   commentPlaylist({ offset: 1, id: route.query.id}).then((res) => {
//     state.commentListData = res.comments
//   })
}

const playMusic = () => {
  let newArr = playlistData.value.playlist.tracks.map((row) => {
    return {
      id: row.id,
      title: row.name,
      singer: row.ar.map((ar) => ar.name).join(' / '),
      album: row.al.name,
      cover: row.al.picUrl,
      time: row.dt,
      source: '',
      mv: row.mv,
    }
  })
  musicStore.addTrack(newArr)
}
</script>
<template>
  <div
    class="h-full px-4 md:px-6 pt-6 w-full box-border flex flex-1 flex-col overflow-x-hidden"
  >
    <div class="flex flex-col md:flex-row h-full gap-8 md:gap-12 lg:gap-16">
      <div
        class="lg:flex flex-col items-center gap-4 relative hidden w-[320px]"
      >
        <img
          :src="playlistData.playlist.coverImgUrl"
          alt="Summer Vibes Playlist"
          width="300"
          height="300"
          class="rounded-lg object-cover aspect-square"
        />
        <div
          class="absolute top-2 right-2 bg-gray-400/50 dark:bg-gray-600/50 px-2 py-1 rounded-md text-white text-sm flex items-center gap-1"
        >
        <Icon icon= "material-symbols:play-circle"/>
          {{ formatNumber(playlistData.playlist.playCount) }}
        </div>
        <div class="text-center flex flex-col gap-3">
          <h1 class="text-2xl font-bold tracking-tight dark:text-white">
            {{ playlistData.playlist.name }}
          </h1>
          <div
            class="flex items-center justify-center gap-2 text-muted-foreground dark:text-gray-300 text-sm md:text-base"
          >
            <span
              class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md text-sm" 
              v-for="item in playlistData.playlist.tags" :key="item"
              >{{ item }}</span
            >
          </div>
          <p
            class="text-muted-foreground dark:text-gray-300 text-sm md:line-clamp-5"
            :title="playlistData.playlist.description"
          >
            {{ playlistData.playlist.description }}
          </p>
          <div class="flex items-center justify-center gap-1 w-full">
            <div class="flex items-center">
              <el-button text circle class="!p-3" @click="playMusic">
                <Icon icon= "material-symbols:play-circle"
              class="text-xl dark:text-white" />
              </el-button>
              <span class="text-sm dark:text-gray-300">
                {{ formatNumber(playlistData.playlist.playCount) }}
              </span>
            </div>
            <div class="flex items-center">
              <el-button text circle class="!p-3">
                <Icon icon='mdi:cards-heart-outline' class="text-xl dark:text-white" />
              </el-button>
              <span class="text-sm dark:text-gray-300">
                {{ formatNumber(playlistData.playlist.subscribedCount) }}
              </span>
            </div>
            <div class="flex items-center">
              <el-button text circle class="!p-3" @click="showDrawer">
                <Icon icon='icon-park-outline:comment' class="text-xl dark:text-white" />
              </el-button>
              <span class="text-sm dark:text-gray-300">
                {{ formatNumber(playlistData.playlist.commentCount) }}
              </span>
            </div>
          </div>
          <div class="flex px-6 justify-between items-center space-x-2 text-muted-foreground dark:text-gray-300 text-sm">
            <span>{{ formattedDate(playlistData.playlist.createTime) }}</span>
            <span>{{ playlistData.playlist.trackCount }} songs</span>
            {{ route.query.id }}
            </div>
        </div>
      </div>
      <div class="gap-6 flex flex-1">
        <div class="relative w-full h-full overflow-hidden">
          <MusicList v-model="playlistData.playlist.tracks" />
        </div>
      </div>
    </div>
  </div>
</template>