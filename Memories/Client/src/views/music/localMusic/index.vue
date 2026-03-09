<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { Icon } from '@iconify/vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import useMusicStore from '@/store/modules/music'

const musicStore = useMusicStore();
const { playSong, setPlaylist } = inject('MusicPlayer')
// i18n mock（如果没有 vue-i18n 环境可直接用）
const t = (key: string, opts?: any) => {
  const map: Record<string, string> = {
    'components.settings.localMusic': '本地音乐',
    'components.settings.localMusicEmpty': '暂无本地音乐，请添加音乐文件',
    'components.settings.addMusic': '添加音乐',
    'commonUnits.songs': '首',
    'common.loading': '加载中...',
    'common.noData': '暂无数据',
  }
  return map[key] ?? key
}

// ---- 工具函数 ----
function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

// ---- Mock 数据 ----
interface MockMusic {
  id: string
  title: string
  singer: string
  cover?: string
  album?: string
  source?: string
  time?: number,
}

const MOCK_MUSICS: MockMusic[] = [
  {
    id: "409872504",
    title: "Ninelie",
    singer: "Aimer",
    album: "ninelie EP",
    cover: "http://p3.music.126.net/g7aakYG_Wfmrn1_IDfVUXA==/109951165050166241.jpg",
    source: "http://music.163.com/song/media/outer/url?id=409872504.mp3",
    time: 260675,
  },
  {
      id: "27591651",
      title: "Intro AE 86",
      singer: "陈光荣",
      album: "頭文字[イニシャル]D THE MOVIE SOUND TUNE",
      cover:
          "http://p4.music.126.net/9KeyafHLjadqSQTRS_tN5Q==/5741649720318487.jpg",
      source: "http://music.163.com/song/media/outer/url?id=27591651.mp3",
      time: 149000,
  },
]

// ---- 状态 ----
const musics = ref<MockMusic[]>([])
const isLoading = ref(false)
const currentPlayingId = ref<string | null>(null)

// ---- 数据转换 ----
const convertToSong = (music: MockMusic) => ({
  id: music.id,
  title: music.title,
  singer: music.singer,
  cover: music.cover,
  source: music.source,
  time: music.time,
})

// ---- 加载（用 mock 替代 API） ----
const loadMusics = async () => {
  isLoading.value = true
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 600))
  musics.value = MOCK_MUSICS
  isLoading.value = false
}

onMounted(() => {
  loadMusics()
})

// ---- 播放操作 ----
const handlePlayAll = () => {
  if (musics.value.length === 0) return
  const songs = musics.value.map(m => convertToSong(m))
  if(songs.length === 0) return
  setPlaylist(songs)
  const song = convertToSong(songs[0])
  playSong(song)
}

const columns = [
  // 序号 / 播放状态
  {
    key: 'index',
    dataKey: 'index',
    title: '',
    width: 48,
    align: 'center',
    cellRenderer: ({ rowIndex, rowData }) => {
      const isPlaying = currentPlayingId.value === rowData.id
      if (isPlaying) {
        return h(Icon, { icon: 'mdi:volume-high', class: 'h-3.5 w-3.5 text-blue-400' })
      }
      return h('span', { class: 'text-xs text-primary/30' }, rowIndex + 1)
    }
  },

  // 歌曲名
  {
    key: 'title',
    dataKey: 'title',
    title: '歌曲',
    flexGrow: 1,
    sortable: true, 
    cellRenderer: ({ rowData }) => {
      const isPlaying = currentPlayingId.value === rowData.id
      return h('span', {
        class: ['truncate text-xs font-medium', isPlaying ? 'text-blue-400' : 'text-primary']
      }, rowData.title)
    }
  },

  // 艺术家
  {
    key: 'singer',
    dataKey: 'singer',
    title: '艺术家',
    width: 300,
    sortable: true, 
    cellRenderer: ({ rowData }) =>
      h('span', { class: 'truncate text-xs text-primary' }, rowData.singer)
  },

  // 专辑
  {
    key: 'album',
    dataKey: 'album',
    title: '专辑',
    width: 200,
    sortable: true, 
    cellRenderer: ({ rowData }) =>
      h('span', { class: 'truncate text-xs text-primary' }, rowData.album ?? '-')
  },

  // 时长
  {
    key: 'time',
    dataKey: 'time',
    title: '时长',
  width: 100,
    align: 'right',
    sortable: true, 
    cellRenderer: ({ rowData }) =>
      h('span', { class: 'text-xs tabular-nums text-primary' }, formatTime(rowData.time))
  },
  {
  key: 'action',
  dataKey: 'action',
  title: '',
  width: 60,
  align: 'center',
  cellRenderer: ({ rowData }) => {
  const isPlaying = currentPlayingId.value === rowData.id
  const isHovered = hoveredRowId.value === rowData.id

  if (isPlaying) {
    return h(Icon, {
      icon: 'mdi:pause-circle',
      class: 'h-5 w-5 text-blue-400 cursor-pointer',
    })
  }

  return h(Icon, {
    icon: 'mdi:play-circle',
    class: [
      'h-5 w-5 text-primary/60 cursor-pointer transition-opacity duration-200',
      isHovered ? 'opacity-100' : 'opacity-0'
    ],
    onClick: (e) => {
      e.stopPropagation()
      handlePlaySong(rowData)
    }
  })
}
},
  // 操作
  {
    key: 'actions',
    dataKey: 'actions',
    title: '',
    width: 60,
    align: 'center',
    cellRenderer: ({ rowData }) => {
    return h(ElDropdown, { trigger: 'click' }, {
      default: () => h(Icon, {
        icon: 'mdi:dots-horizontal',
        class: 'h-4 w-4 text-primary cursor-pointer hover:text-blue-400 transition-colors',
        onClick: (e: MouseEvent) => e.stopPropagation()
      }),
      dropdown: () => h(ElDropdownMenu, {}, {
        default: () => [
          h(ElDropdownItem, { onClick: () => handlePlay(rowData) }, {
            default: () => [h(Icon, { icon: 'mdi:play', class: 'mr-2' }), '播放']
          }),
          h(ElDropdownItem, { onClick: () => handleAddToQueue(rowData) }, {
            default: () => [h(Icon, { icon: 'mdi:playlist-plus', class: 'mr-2' }), '添加到队列']
          }),
          h(ElDropdownItem, { onClick: () => handleFavorite(rowData) }, {
            default: () => [h(Icon, { icon: 'mdi:heart-outline', class: 'mr-2' }), '收藏']
          }),
          h(ElDropdownItem, { divided: true, class: 'text-red-400', onClick: () => handleDelete(rowData) }, {
            default: () => [h(Icon, { icon: 'mdi:delete-outline', class: 'mr-2' }), '删除']
          }),
        ]
      })
    })}
  },
]

const data = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `用户${i + 1}`,
  singer: Math.floor(Math.random() * 50),
  time: Math.floor(Math.random() * 50) + 18,
}))


const sortState = ref<any>({ key: '', order: undefined })

const onSort = ({ key }: any) => {
  const current = sortState.value

  // 同一列：asc -> desc -> null 循环切换
  if (current.key === key) {
    if (current.order === 'asc') sortState.value = { key, order: 'desc' }
    else if (current.order === 'desc') sortState.value = { key: '', order: null }
    else sortState.value = { key, order: 'asc' }
  } else {
    // 新列：直接 asc
    sortState.value = { key, order: 'asc' }
  }
}

const handlePlaySong = (rowData: any) => {
  const song = convertToSong(rowData)
  playSong(song)
}

const hoveredRowId = ref(null)
const rowEventHandlers = {
  onMouseenter: ({ rowData }) => { hoveredRowId.value = rowData.id },
  onMouseleave: () => { hoveredRowId.value = null },
  onDblclick: ({ rowData }) => { handlePlaySong(rowData) }
}

const sortedData = computed(() => {
  const { key, order } = sortState.value
  if (!key || !order) return MOCK_MUSICS

  return [...MOCK_MUSICS].sort((a, b) => {
    if (order === 'asc') return a[key] > b[key] ? 1 : -1
    if (order === 'desc') return a[key] < b[key] ? 1 : -1
    return 0
  })
})
</script>

<template>
  <div class="glass-card overflow-hidden rounded-3xl transition-all">
    <!-- 头部操作栏 -->
    <div class="flex items-center justify-between border-glass p-6">
      <div class="flex items-center gap-4">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 shadow-md"
        >
        <Icon icon="material-symbols:folder" class="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 class="text-primary text-base font-semibold">
            {{ t('components.settings.localMusic') }}
          </h3>
          <p class="text-primary/60 text-sm">
            {{ musics.length }} {{ t('commonUnits.songs', { count: musics.length }) }}
          </p>
        </div>
      </div>

      <!-- 全部播放按钮 -->
      <button
        v-if="musics.length > 0 && !isLoading"
        class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
        @click="handlePlayAll"
      >
      <Icon icon="material-symbols:play-circle" class="h-4 w-4 text-white"/>
        播放全部
      </button>
    </div>

    <!-- 音乐列表 -->
    <div class="max-h-[520px] overflow-y-auto p-6">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-primary/50 flex items-center justify-center py-12">
        <span class="icon-[mdi--loading] mr-2 h-6 w-6 animate-spin" />
        <span class="text-sm font-medium">{{ t('common.loading') }}</span>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="musics.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <div class="mb-4 rounded-full bg-white/5 p-6">
          <span class="icon-[mdi--music-note-off] text-primary/20 h-12 w-12" />
        </div>
        <p class="text-primary/60 mb-2 text-sm font-medium">{{ t('common.noData') }}</p>
        <p class="text-primary/40 mb-4 text-xs">{{ t('components.settings.localMusicEmpty') }}</p>
      </div>

      <!-- 音乐列表 -->
      <div v-else class="space-y-0 h-[460px]">
        <el-auto-resizer class="">
    <template #default="{ height, width }">
      <el-table-v2
        :columns="columns"
        :data="sortedData"
        :row-event-handlers="rowEventHandlers"
        :width="width"
        :height="height"
        :row-height="66"
        :sort-by="sortState"
        @column-sort="onSort"
      />
    </template>
  </el-auto-resizer>
</div>
    </div>
  </div>
</template>

<style scoped>

</style>