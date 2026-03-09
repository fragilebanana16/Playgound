<script setup>
import { Icon } from '@iconify/vue'
import { PlayMode } from '@/enums/musicEnum'

// import { Comment } from '@/api/interface'
// import { commentMusic } from '@/api'

const state = reactive({
  direction: 'btt',
  drawer: false,
  commentListData: [],
  commenDrawer: false,
  commenTotal: 0,
})

import altCover from '@/assets/images/user/avatar.webp'

const { direction, drawer, commentListData, commenDrawer, commenTotal } = toRefs(state)
const {
  currentSong,
  togglePlayPause,
  isPlaying,
  playNext,
  playPrevious,
  currentTime,
  duration,
  changeCurrentTime,
  Loadlyrics,
  lyricsData,
  currentLyricIndex,
  scrollStyle,
  setPlayMode,
} = inject('MusicPlayer')

// const SettingStore = useSettingStore()

const show = () => {
  state.drawer = true
  // Loadlyrics()
//   getCommentPlaylist()
}

// 格式化时间
function formatTime(seconds) {
  // 将秒数转换为整数分钟数和剩余秒数
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)

  // 返回格式化的字符串，确保分钟和秒数都至少有两位数
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function parseLyricInfo(lyricString) {
  return lyricString
    .replace(/\n/g, '<br />') // 将换行符替换为 <br />
    .replace(/^\s*|\s*$/g, '') // 去除前后空格
}

// 时间
let LocalhostcurrentTime = ref(new Date().toLocaleTimeString())

// 更新时间的函数
function updateTime() {
  LocalhostcurrentTime.value = new Date().toLocaleTimeString()
}

// 打开评论抽屉
const showDrawer = () => {
  state.commenDrawer = true
//   if (state.commentListData.length > 0) return
//   commentMusic({ offset: 1, id: currentSong.value.id }).then((res) => {
//     state.commentListData = res.comments
//     state.commenTotal = res.total
//   })
}

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

// const getCommentPlaylist = (pages = 1) => {
//   if (state.commentListData.length > 0) return
//   commentMusic({ offset: pages, id: currentSong.value.id }).then((res) => {
//     state.commentListData = state.commentListData.concat(res.comments)
//     state.commenTotal = res.total
//   })
// }

function handlePlayNext() {
//   state.commentListData = []
//   state.commenTotal = 0
  playNext()
//   getCommentPlaylist(1)
}

function handlePlayPrevious() {
//   state.commentListData = []
//   state.commenTotal = 0
  playPrevious()
//   getCommentPlaylist(1)
}

onMounted(() => {
  setInterval(updateTime, 1000)
})

defineExpose({
  show,
})
</script>
<template>
  <el-drawer
    :style="{ '--track-cover-url':  currentSong.cover ? `url('${currentSong.cover}')` :`thisShouldBeUserInfoOrWhat` }"
    v-model="drawer"
    :direction="direction"
    style="box-shadow: none"
    size="100%"
    :modal="false"
    :showClose="false"
    class="drawer-bg"
  >
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center justify-center gap-2">
          <el-button text circle @click="drawer = false">
            <Icon class="rotate-90" icon="material-symbols:arrow-back-ios" />
          </el-button>
          <div class="flex items-center gap-1 w-[80px]">
            <Icon icon="material-symbols:nest-clock-farsight-analog-outline" />
            <span class="text-sm">
              {{ LocalhostcurrentTime }}
            </span>
          </div>
        </div>
      </div>
    </template>
    <div class="flex h-full w-full flex-col gap-3 px-6 py-2">
      <!-- 背景层 -->
    <div class="absolute inset-0 overflow-hidden" style="z-index: 0; pointer-events: none">
      <img
        :src="currentSong.cover || altCover"
        class="w-full h-full object-cover"
        style="transform: scale(1.2); filter: blur(40px); opacity: 0.4"
      />
    </div>
      <div class="flex flex-row flex-1 items-center justify-between">
        <div
          class="md:flex-[50%] md:max-w-[50%] flex-1 max-w-full flex h-full items-center justify-center"
        >
          <div class="items-center justify-center flex flex-col h-full w-full">
            <div
              :class="`music-player-container ${isPlaying ? 'is-playing' : ''}`"
            >
              <div class="album">
                <div
                  class="album-art rounded-md"
                  :style="{
                    '--track-cover-url': currentSong.cover ? `url('${currentSong.cover}')` :`url(${altCover})`,
                  }"
                ></div>
                <div
                  class="vinyl"
                  :style="{
                    '--track-cover-url': currentSong.cover ? `url('${currentSong.cover}')` :`url(${altCover})`,
                    animationPlayState: isPlaying ? 'running' : 'paused',
                  }"
                ></div>
              </div>
            </div>
            <!-- 标题和作者 -->
            <div class="flex flex-col items-center gap-1 mt-4">
              <span class="text-base font-semibold truncate max-w-[440px]">
                {{ currentSong.title }}
              </span>
              <span class="text-sm truncate max-w-[340px]">
                {{ currentSong.singer }}
              </span>
            </div>
            <div class="flex flex-col items-center w-96 mt-5">
              <div class="flex gap-1 items-center justify-center">
                <el-button text circle @click="setPlayMode(PlayMode.Sequence)">
                  <Icon icon="octicon:three-bars-16" class="text-lg" />
                </el-button>
                <el-button text circle @click="setPlayMode(PlayMode.Random)">
                  <Icon icon="lets-icons:sort-random" class="text-lg" />
                </el-button>
                <el-button text circle @click="handlePlayPrevious" class="!p-3">
                  <Icon icon="solar:skip-previous-bold" class="text-lg" />
                </el-button>
                <el-button text circle class="!p-3" @click="togglePlayPause">
                  <Icon
                    :icon="
                      isPlaying
                        ? 'ic:round-pause-circle'
                        : 'material-symbols:play-circle'
                    "
                    class="text-3xl"
                  />
                </el-button>
                <el-button text circle class="!p-3" @click="handlePlayNext">
                  <Icon icon="solar:skip-previous-bold" class="transform scale-x-[-1] text-lg" />
                </el-button>
                <el-button text circle @click="setPlayMode(PlayMode.Loop)">
                  <Icon icon="cil:loop" class="text-lg" />
                </el-button>
                <el-button text circle @click="setPlayMode(PlayMode.Single)">
                  <Icon icon="cil:loop-1" class="text-lg" />
                </el-button>
              </div>
              <div class="flex gap-2 w-full items-center pt-2">
                <span class="text-xs w-10 text-foreground/50 dark:text-white">
                  {{formatTime(currentTime)}}
                </span>
                <el-slider
                  v-model="currentTime"
                  :show-tooltip="false"
                  @change="changeCurrentTime"
                  :max="duration"
                  class="w-full"
                  size="small"
                />
                <span class="text-xs w-10 text-foreground/50 dark:text-white">{{
                  formatTime(duration)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      <div
          class="flex-[50%] max-w-[50%] md:flex hidden h-full items-center justify-center"
        >
          <template v-if="lyricsData.lines.length > 0">
            <div class="items-center justify-center flex h-full">
              <el-scrollbar
                class="flex items-center justify-center w-full"
                wrap-class="mask-gradient w-full text-center !h-[600px]"
                style="--scroll-shadow-size: 40px"
              >
                <ul :style="scrollStyle">
                  <li
                    v-for="(item, index) in lyricsData.lines"
                    :key="index"
                    :class="[
                      'text-sm py-1 transition-all duration-300 ease-in-out font-body',
                      {
                        'text-[--el-color-primary] text-xl':
                          currentLyricIndex === index,
                        'text-gray-500 dark:text-gray-400':
                          currentLyricIndex !== index,
                      },
                    ]"
                  >
                    <p v-if="item.text">
                      {{ item.text }}
                    </p>
                    <p
                      v-if="item.translation"
                    >
                      {{ item.translation }}
                    </p>
                    <p v-if="item.romaLrc">
                      {{ item.romaLrc }}
                    </p>
                  </li>
                </ul>
              </el-scrollbar>
            </div>
          </template>
          <template v-else>
            <div
              class="h-full flex items-center justify-center w-full text-[--el-color-primary-light-2] dark:text-gray-500 text-sm"
              v-html="parseLyricInfo(lyricsData.remark ?? '')"
              v-if="false"
            ></div>
          </template>
        </div>
    </div>
  </div>

  </el-drawer>
</template>
<style lang="scss" scoped>
.music-player-container {
    display: inline-block;
    height: 315px;
    min-width: 325px;
}

.album {
    box-shadow: 3px 3px 15px rgba(0, 0, 0, 0.65);
    height: 100%;
    position: relative;
    width: 100%;
    z-index: 10;
    border-radius: 8px;
}

// .album
.album-art {
    background: #fff var(--track-cover) center / cover no-repeat;
    height: 315px;
    position: relative;
    width: 325px;
    z-index: 10;
    --track-cover: var(--track-cover-url, none);
}

.vinyl {
    animation: spin 6s linear infinite;
    transition: all 500ms;
    background-image: url('@/assets/images/music/vinyl.png'), var(--track-cover);
    background-position: center, center;
    background-size: cover, 40% auto;
    background-repeat: no-repeat;
    border-radius: 100%;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    height: 300px;
    left: 5%;
    position: absolute;
    top: 8px;
    width: 300px;
    z-index: 5;
    will-change: transform, left;
    --track-cover: var(--track-cover-url, none);


    .is-playing & {
        left: 52%;
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.loading {
    display: flex;
    transform: rotate(180deg);
}

.load {
    width: 2px;
    height: 33px;
    background-color: limegreen;
    animation: 1s move6 infinite;
    border-radius: 5px;
    margin: 0.1em;
}

.load:nth-child(1) {
    animation-delay: 0.2s;
}

.load:nth-child(2) {
    animation-delay: 0.4s;
}

.load:nth-child(3) {
    animation-delay: 0.6s;
}


@keyframes move6 {
    0% {
        height: 0.2em;
    }

    25% {
        height: 0.7em;
    }

    50% {
        height: 1.5em;
    }

    100% {
        height: 0.2em;
    }
}

</style>