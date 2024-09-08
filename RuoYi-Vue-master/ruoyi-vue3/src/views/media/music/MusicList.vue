<script setup>
import { ref } from "vue"
import { Icon } from '@iconify/vue'
const tableData = ref(Array.from({ length: 100 }, (_, index) => ({
    al: { name: 'JJ', }, name: index, ar: [{ name: 'JJ', }],
  })))

const router = useRouter()
const playMusic = () => {}
const { playSong } = ref()
const url =
    'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
</script>
<template>
    <div class="w-full h-full box-border flex flex-1 flex-col overflow-x-hidden overflow-auto" >
        <el-table :data="tableData" style="
        width: 100%;
        --el-table-border: none;
        --el-table-border-color: none;
      " @row-dblclick="playMusic" class="!text-xs !flex-1">
            <el-table-column prop="name" label="歌名">
                <template #default="{ row }">
                    <div class="flex items-center gap-1">
                        <div class="min-w-10 h-10">
                            <el-image class="w-full h-full rounded-lg" lazy :src=url :alt="row.al.name" />
                        </div>
                        <span class="line-clamp-1" :title="row.name">{{ row.name }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="歌手">
                <template #default="{ row }">
                    <span class="line-clamp-1" :title="row.ar.map((ar) => ar.name).join(' / ')">
                        {{ row.ar.map((ar) => ar.name).join(' / ') }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="al.name" label="专辑">
                <template #default="{ row }">
                    <span class="line-clamp-1" :title="row.al.name">
                        row.al.name
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="时间">
                <template #default="{ row }">
                    <span>
                        {{ row.dt }}
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