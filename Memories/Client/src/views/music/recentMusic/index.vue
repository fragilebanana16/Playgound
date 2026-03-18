<script setup lang="ts">
// import { useAudioStore } from '@/stores/modules/audio'
// import { useAudio } from '@/composables/useAudio'
// import type { Song as StoreSong } from '@/stores/interface'
import { formatTime } from '@/utils/ui'

import useMusicStore from '@/store/modules/music'
import { Icon } from '@iconify/vue'
const isLoading = ref(false)
const currentPlayingId = ref<string | null>(null)

const musicStore = useMusicStore()
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
        width: 240,
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
]
// const { setPlaylist, play } = useAudio()

const recentList = computed(() => [...(musicStore?.playHistory || [])].reverse())

const playAll = () => {
    //   if (!recentList.value.length) return
    //   const list = recentList.value
    //   setPlaylist(list, 0)
    //   play(list[0], 0)
}
</script>

<template>
    <div class="flex flex-1 flex-col overflow-hidden p-4">
        <!-- 头部卡片 -->
        <section class="relative mb-6 shrink-0 overflow-hidden">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 overflow-hidden rounded-3xl bg-blue-500/10">
                <div class="h-full w-full scale-110 accent-gradient opacity-20 blur-3xl"></div>
            </div>
            <!-- 内容 -->
            <div class="relative z-10 overflow-hidden rounded-3xl">
                <div class="glass-container p-4 md:p-5">
                    <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                        <div class="flex items-center gap-4">
                            <div
                                class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 shadow-md">
                                <Icon icon="material-symbols:history" class="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 class="text-primary text-base font-semibold">
                                    {{ $t('最近播放') }}
                                </h3>
                                <p class="text-primary/60 text-sm">
                                    {{ recentList.length }} {{ $t('首', { count: recentList.length }) }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3">
                            <button :disabled="!recentList.length"
                                class="flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
                                @click="playAll">
                                <Icon icon="material-symbols:play-circle" class="h-4 w-4 text-white" />
                                {{ $t('播放全部') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- 音乐列表 -->
        <div class="max-h-[520px] overflow-y-auto p-6">
            <!-- 加载状态 -->
            <div v-if="isLoading" class="text-primary/50 flex items-center justify-center py-12">
                <span class="icon-[mdi--loading] mr-2 h-6 w-6 animate-spin" />
                <span class="text-sm font-medium">{{ t('common.loading') }}</span>
            </div>

            <!-- 空状态 -->
            <div v-else-if="recentList.length === 0"
                class="flex flex-col items-center justify-center py-12 text-center">
                <div class="mb-4 rounded-full bg-white/5 p-6">
                    <span class="icon-[mdi--music-note-off] text-primary/20 h-12 w-12" />
                </div>
                <p class="text-primary/60 mb-2 text-sm font-medium">{{ $t('No Data') }}</p>
                <p class="text-primary/40 mb-4 text-xs">{{ $t('暂无本地音乐，请添加音乐文件') }}</p>
            </div>

            <!-- 音乐列表 -->
            <div v-else class="space-y-0 h-[460px]">
                <el-auto-resizer class="">
                    <template #default="{ height, width }">
                        <el-table-v2 :columns="columns" :data="recentList" :width="width" :height="height"
                            :row-height="66" />
                    </template>
                </el-auto-resizer>
            </div>
        </div>
    </div>
</template>

<style scoped></style>