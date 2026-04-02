<template>
  <div v-loading="isSyncing" element-loading-text="数据加载中..." class="drive-layout" @click="closeContextMenu" @contextmenu.prevent  style="height: calc(100vh - 90px)">
    <!-- 移动端遮罩 -->
    <transition name="mask">
      <div v-if="sidebarOpen" class="sidebar-mask" @click.stop="sidebarOpen = false" />
    </transition>
   <main class="flex flex-1 overflow-hidden">
      <!-- 左侧边栏 -->
      <SideBar />
      <!-- 右侧主内容 -->
      <div class="flex-1">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import QrcodeVue from 'qrcode.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEventListener, useWindowSize } from '@vueuse/core'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import moment from 'moment'
import { fetchSyncUpload, fetchFileMetas  } from '@/api/media'
import SideBar from '@/views/cloud/modules/SideBar.vue'
moment.locale('zh-cn')

// ─── 虚拟滚动行高 ───
// 卡片：thumb(96) + meta(54) + grid-row padding-bottom(12) = 162
const GRID_ROW_H = 162
// 列表行高度与 CSS .list-row height 对齐
const LIST_ROW_H = 52
const isSyncing = ref(false)
const page = ref(1)
const total = ref(0)
// 同步处理函数
const handleSync = async () => {
  if (isSyncing.value) return
 
  isSyncing.value = true
 
  try {
    const syncResponse = await fetchSyncUpload();
    ElMessage.success(syncResponse);
    page.value = 1;
    files.value = [];
    total.value = 0;
    
    const res = await fetchFiles();
    files.value.push(...res.vItems);
    total.value = res.total
  } catch (error) {
    console.error('同步失败:', error)
    ElMessage.error('数据同步失败，请重试')
  } finally {
    isSyncing.value = false
  }
}
// 滚动到底部触发加载更多
const handleScrollEnd = async () => {
  if (files.value.length < total.value) {
    page.value++
    const res = await fetchFiles()
    if (res.vItems.length > 0) {
        files.value.push(...res.vItems);
        total.value = res.total;
    }
  }
}

const fetchFiles = async () => {
    const queryResponse = await fetchFileMetas({page:page.value, size:50});
    //{
    //    "id": 18,
    //    "fileName": "CrashRepoterLog.txt",
    //    "filePath": "G:\\uploads\\CrashRepoterLog.txt",
    //    "size": 44,
    //    "extension": "txt",
    //    "isDirectory": 0,
    //    "lastModified": "2026-01-29T10:36:02",
    //    "syncTime": "2026-03-26T13:54:22"
    //},
        
    const vItems = queryResponse.items.map(item => ({ 
        id:  item.id,
        name:item.fileName,
        type:getTypeFromExt(item.fileName), 
        size:item.size, 
        modified:item.lastModified, 
        category:getCategoryFromExt(item.fileName), 
        starred:false, 
        shared:false }));
    return {vItems, total: queryResponse.total};
}
// ─── 响应式列数 ───
const { width } = useWindowSize()
const cols = computed(() => {
  if (width.value <= 480) return 2
  if (width.value <= 768)  return 3 
  if (width.value <= 1200) return 4
  if (width.value <= 1500) return 6
  return 10
})

// filteredFiles 按列数切行，供网格虚拟滚动消费
const gridRows = computed(() => {
  const c = cols.value
  const rows = []
  let rowId = 0
  filteredFiles.value.forEach((file, i) => {
    const rowIndex = Math.floor(i / c)
    if (!rows[rowIndex]) {
      // 用第一个文件的 id 作为行 id，这样相同数据就有相同 rowId
      const firstFileId = filteredFiles.value[rowIndex * c]?.id
      rows[rowIndex] = { rowId: `row-${rowIndex}-${firstFileId}`, files: [] }
    }
    rows[rowIndex].files.push(file)
  })
  return rows
})

// ─── 路由 ───
const route = useRoute()
const router = useRouter()
const currentCategory = ref(route.params.category || 'all')

// ─── 移动端侧边栏 ───
const sidebarOpen = ref(false)

// ─── 导航 ───
const navItems = [
  { key: 'all',   label: '全部文件', icon: 'solar:widget-2-line-duotone'      },
  { key: 'image', label: '图片',     icon: 'solar:gallery-wide-line-duotone'  },
  { key: 'doc',   label: '文档',     icon: 'solar:document-text-line-duotone' },
  { key: 'video', label: '视频',     icon: 'solar:play-circle-line-duotone'   },
  { key: 'audio', label: '音乐',     icon: 'solar:music-note-2-line-duotone'  },
]
const currentNavLabel = computed(() => {
  return navItems.find(n => n.key === currentCategory.value)?.label
    || { shared:'分享', star:'星标文件', trash:'回收站' }[currentCategory.value]
    || '全部文件'
})
const activeTransferCount = ref(2)


const fileInputRef = ref(null)
function triggerUpload() { fileInputRef.value?.click() }

// 此处上传
function handleFileSelect(e) {
  const list = Array.from(e.target.files); if (!list.length) return
  list.forEach(f => 
  files.value.unshift(
    { id: Date.now() + Math.random(), name: f.name, type: getTypeFromExt(f.name), size: f.size, modified: new Date(), category: getCategoryFromExt(f.name), starred: false, shared: false }
  ))

  ElMessage.success(`已添加 ${list.length} 个文件到上传队列`); 
  //router.push('/transfer'); e.target.value = ''
}

</script>

<style scoped>
.drive-layout {
  --c-primary:       #4F6EF7;
  --c-primary-light: #EEF2FF;
  --c-bg:            #F4F5F7;
  --c-surface:       #ffffff;
  --c-border:        #E5E7EB;
  --c-text:          #111827;
  --c-text-muted:    #6B7280;
  --c-text-hint:     #9CA3AF;
  --c-danger:        #EF4444;
  --radius:          10px;
  --sidebar-w:       220px;
  display: flex; height: 100vh; background: var(--c-bg);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative; overflow: hidden;
}


</style>