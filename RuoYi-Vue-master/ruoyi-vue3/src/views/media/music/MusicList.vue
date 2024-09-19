<script setup>
import { ref } from "vue"
import { Icon } from '@iconify/vue'
import useMusicStore from '@/store/modules/music'
import altCover from '@/assets/images/defaultAlbum.jpg'

const { playSong } = inject('MusicPlayer')
// const tableData = ref(Array.from({ length: 100 }, (_, index) => ({
//     al: { name: 'JJ', }, name: index, ar: [{ name: 'JJ', }],
//   })))
const streamingPrefix = '/media/streaming/'
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const tableData = defineModel()
const musicStore = useMusicStore()
const router = useRouter()

const playMusic = async (row) => {
  const existingIndex = musicStore.trackList.findIndex(
    (existingTrack) => existingTrack.id === row.id
  )

  if (existingIndex === -1) {
    try {
      const param = {
        id: row.musicId,
        title: row.title,
        singer: row.artistName,
        cover: row.thumbnailUrl ? baseUrl + '/music/covers/' + row.thumbnailUrl : '',
        time: 'row.dt',
        source: row.url ? baseUrl + streamingPrefix + 'music/' + row.url : '',
      }

      musicStore.addTrackAndPlay(param)
      playSong(param) // 自动播放新添加的歌曲
    } catch (error) {
      console.error('Error fetching music URL:', error)
    }
  } else {
    const existingTrack = musicStore.trackList[existingIndex]
    musicStore.addTrackAndPlay(existingTrack)
    playSong(existingTrack) // 自动播放已存在的歌曲
  }
}

</script>
<template>
    <div class="w-full h-full box-border flex flex-1 flex-col overflow-x-hidden overflow-auto" >
        <el-table :data="tableData" style="
        width: 100%;
        --el-table-border: none;
        --el-table-border-color: none;
      " @row-dblclick="playMusic" class="!text-xs !flex-1">
            <el-table-column prop="title" label="歌名">
                <template #default="{ row }">
                    <div class="flex items-center gap-3">
                        <div class="min-w-10 h-10 ml-1">
                            <el-image class="w-full h-full rounded-lg" lazy :src="row.thumbnailUrl ? baseUrl + '/music/covers/' + row.thumbnailUrl : altCover" :alt="row.title" />
                        </div>
                        <span class="line-clamp-1" :title="row.title">{{ row.title }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="歌手">
                <template #default="{ row }">
                    <span class="line-clamp-1" :title="row.title">{{ row.artistName }}</span>
                </template>
            </el-table-column>
            <el-table-column label="收录时间">
                <template #default="{ row }">
                    <span>
                        {{ row.createTime }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="" width="180">
                <template #default="{ row }">
                    <div class="flex items-center">
                        <el-button type="primary" text circle @click="playMusic(row)">
                            <Icon class="text-lg text-gray-500" icon="ri:play-circle-line" />
                        </el-button>
                        <el-button type="primary" text circle v-if="row.mv && row.mv !== 0"
                            @click="router.push(`/video?id=${row.mv}`)">
                            <Icon class="text-lg text-gray-500" icon="solar:video-frame-linear" />
                        </el-button>
                        <el-button type="primary" text circle @click="downLoadMusic(row)">
                            <Icon class="text-lg text-gray-500" icon="material-symbols:cloud-download-outline" />
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>