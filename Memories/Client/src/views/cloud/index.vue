<template>
  <div v-loading="isSyncing" element-loading-text="数据同步中..." class="drive-layout" @click="closeContextMenu" @contextmenu.prevent  style="height: calc(100vh - 90px)">
    <!-- 移动端遮罩 -->
    <transition name="mask">
      <div v-if="sidebarOpen" class="sidebar-mask" @click.stop="sidebarOpen = false" />
    </transition>

    <!-- ───────────────── 侧边栏 ───────────────── -->
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-logo">
        <Icon icon="solar:cloud-storage-bold-duotone" class="logo-icon" />
        <span class="logo-text">我的网盘</span>
        <button class="sidebar-close" @click.stop="sidebarOpen = false">
          <Icon icon="solar:close-circle-line-duotone" />
        </button>
      </div>

      <el-button class="upload-btn" type="primary" @click="triggerUpload">
        <Icon icon="solar:upload-bold" class="mr-2" />上传文件
      </el-button>
      <input ref="fileInputRef" type="file" multiple class="hidden" @change="handleFileSelect" />

      <nav class="sidebar-nav">
        <div class="nav-group-label">文件</div>
        <div
          v-for="nav in navItems" :key="nav.key"
          class="nav-item"
          :class="{ active: currentCategory === nav.key }"
          @click="currentCategory = nav.key; sidebarOpen = false"
        >
          <Icon :icon="nav.icon" class="nav-icon" />
          <span>{{ nav.label }}</span>
        </div>

        <div class="nav-group-label" style="margin-top:16px">其他</div>
        <div  class="nav-item" :class="{ active: currentCategory==='shared' }" @click="sidebarOpen=false">
          <Icon icon="solar:share-circle-line-duotone" class="nav-icon" /><span>分享</span>
        </div>
        <div  class="nav-item" :class="{ active: currentCategory==='star' }" @click="sidebarOpen=false">
          <Icon icon="solar:star-line-duotone" class="nav-icon" /><span>星标文件</span>
        </div>
        <div  class="nav-item" :class="{ active: currentCategory==='trash' }" @click="sidebarOpen=false">
          <Icon icon="solar:trash-bin-trash-line-duotone" class="nav-icon" /><span>回收站</span>
        </div>
        <div  class="nav-item" @click="sidebarOpen=false">
          <Icon icon="solar:transfer-horizontal-line-duotone" class="nav-icon" />
          <span>传输列表</span>
          <span v-if="activeTransferCount" class="nav-badge active">{{ activeTransferCount }}</span>
        </div>
      </nav>

      <div class="storage-card">
        <div class="storage-header">
          <Icon icon="solar:database-line-duotone" style="color:var(--c-primary)" />
          <span>存储空间</span>
        </div>
        <el-progress :percentage="62.1" :stroke-width="6" :show-text="false" color="var(--c-primary)" style="margin:8px 0" />
        <div class="storage-detail"><span class="used">62.1 GB</span><span class="total"> / 100 GB</span></div>
      </div>
    </aside>

    <!-- ───────────────── 主内容区 ───────────────── -->
    <main class="drive-main">

      <!-- 顶部栏 -->
      <header class="topbar">
        <div class="breadcrumb">
          <button class="hamburger" @click.stop="sidebarOpen = true">
            <Icon icon="solar:hamburger-menu-line-duotone" />
          </button>
          <Icon icon="solar:home-2-line-duotone" class="home-icon" style="color:var(--c-text-muted);font-size:16px" />
          <Icon icon="solar:alt-arrow-right-line-duotone" class="home-icon" style="color:var(--c-text-muted);font-size:12px" />
          <span style="font-size:14px;font-weight:500;color:var(--c-text)">{{ currentNavLabel }}</span>
        </div>
        <div class="topbar-right">
          <el-input v-model="searchQuery" placeholder="搜索文件…" class="search-input" clearable>
            <template #prefix><Icon icon="solar:magnifer-line-duotone" style="color:var(--c-text-muted)" /></template>
          </el-input>
          <el-tooltip content="新建文件夹">
            <el-button class="icon-btn" @click="showNewFolderDialog = true">
              <Icon icon="solar:folder-with-files-line-duotone" />
            </el-button>
          </el-tooltip>
          <el-button-group class="view-toggle">
            <el-button :class="{ 'is-active': viewMode==='grid' }" @click="viewMode='grid'">
              <Icon icon="solar:widget-2-line-duotone" />
            </el-button>
            <el-button :class="{ 'is-active': viewMode==='list' }" @click="viewMode='list'">
              <Icon icon="solar:list-line-duotone" />
            </el-button>
          </el-button-group>
          <el-dropdown>
            <el-button class="icon-btn"><Icon icon="solar:sort-vertical-line-duotone" /></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="s in sortOptions" :key="s.key" @click="sortBy=s.key" :class="{'is-active':sortBy===s.key}">
                  <Icon :icon="sortBy===s.key?'solar:check-circle-bold':'solar:circle-line-duotone'" style="margin-right:4px" />{{ s.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <!-- 同步按钮 -->
            <el-tooltip content="同步数据库">
              <el-button 
                class="icon-btn"
                :loading="isSyncing"
                :disabled="isSyncing"
                @click="handleSync"
              >
                <Icon icon="solar:refresh-line-duotone" />
              </el-button>
            </el-tooltip>
        </div>
      </header>

      <!-- 快捷分类卡片（仅全部视图） -->
      <section v-if="currentCategory==='all'" class="quick-section">
        <div v-for="card in quickCards" :key="card.key" class="quick-card" @click="currentCategory=card.key">
          <div class="quick-icon" :style="{ background: card.bg }">
            <Icon :icon="card.icon" :style="{ color: card.color }" style="font-size:20px" />
          </div>
          <div>
            <div class="quick-name">{{ card.label }}</div>
            <div class="quick-count">{{ card.count }} 个文件</div>
          </div>
        </div>
      </section>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-checkbox v-model="allSelected" :indeterminate="isIndeterminate" @change="toggleSelectAll" label="全选" />
          <transition name="fade">
            <div v-if="selectedIds.length" class="batch-actions">
              <el-button size="small" @click="batchDownload"><Icon icon="solar:download-line-duotone" style="margin-right:4px" />下载</el-button>
              <el-button size="small" @click="batchShare"><Icon icon="solar:share-circle-line-duotone" style="margin-right:4px" />分享</el-button>
              <el-button size="small" type="danger" @click="batchDelete"><Icon icon="solar:trash-bin-trash-line-duotone" style="margin-right:4px" />删除</el-button>
              <span class="selected-count">已选 {{ selectedIds.length }} 项</span>
            </div>
          </transition>
        </div>
        <div class="file-total">共 {{ filteredFiles.length }} 个文件</div>
      </div>

      <!-- ───── 虚拟滚动文件区 ───── -->
      <div class="file-area-wrap" @contextmenu.prevent="onAreaRightClick">

        <!-- 网格视图：以「行」为单位虚拟化 -->
        <RecycleScroller
          v-if="viewMode==='grid'"
          class="file-scroller"
          :items="gridRows"
          :item-size="GRID_ROW_H"
          key-field="rowId"
          :key="cols"
          v-slot="{ item: row }"
          @scroll-end="handleScrollEnd"
        >
          <div class="grid-row">
            <div
              v-for="file in row.files" :key="file.id"
              class="file-card" :class="{ selected: selectedIds.includes(file.id) }"
              @click.exact="toggleSelect(file.id)"
              @dblclick="openFile(file)"
              @contextmenu.stop.prevent="onFileRightClick($event, file)"
            >
              <div class="file-card-check">
                <el-checkbox :model-value="selectedIds.includes(file.id)" @change="toggleSelect(file.id)" @click.stop />
              </div>
              <div class="file-card-star" @click.stop="toggleStar(file)">
                <Icon :icon="file.starred?'solar:star-bold':'solar:star-line-duotone'"
                  :style="{ color: file.starred ? '#FBBF24' : '#D1D5DB' }" />
              </div>
              <div class="file-thumb" :style="{ background: getFileColor(file).bg }">
                <Icon :icon="getFileIcon(file)" :style="{ color: getFileColor(file).color }" style="font-size:40px" />
              </div>
              <div class="file-meta">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-info-row">
                  <span class="file-size">{{ file.type==='folder' ? `${file.children} 项` : formatSize(file.size) }}</span>
                  <span class="file-date">{{ formatDate(file.modified) }}</span>
                </div>
              </div>
            </div>
            <!-- 末行补齐空位 -->
            <div v-for="n in Math.max(0, cols - row.files.length)" :key="'pad'+n" class="file-card-pad" />
          </div>
        </RecycleScroller>

        <!-- 列表视图 -->
        <template v-else>
          <div class="list-header">
            <span class="col-name">名称</span>
            <span class="col-size">大小</span>
            <span class="col-date">修改时间</span>
            <span class="col-action"></span>
          </div>
          <RecycleScroller
            class="file-scroller list-scroller"
            :items="filteredFiles"
            :item-size="LIST_ROW_H"
            key-field="id"
            v-slot="{ item: file }"
            @scroll-end="handleScrollEnd"
          >
            <div
              class="list-row" :class="{ selected: selectedIds.includes(file.id) }"
              @click.exact="toggleSelect(file.id)"
              @dblclick="openFile(file)"
              @contextmenu.stop.prevent="onFileRightClick($event, file)"
            >
              <div class="col-name">
                <el-checkbox :model-value="selectedIds.includes(file.id)" @change="toggleSelect(file.id)" @click.stop style="margin-right:8px" />
                <div class="list-file-icon" :style="{ background: getFileColor(file).bg }">
                  <Icon :icon="getFileIcon(file)" :style="{ color: getFileColor(file).color }" />
                </div>
                <span class="list-file-name">{{ file.name }}</span>
                <Icon v-if="file.starred" icon="solar:star-bold" style="color:#FBBF24;font-size:12px;margin-left:4px;flex-shrink:0" />
                <el-tag v-if="file.shared" size="small" style="margin-left:8px;flex-shrink:0;font-size:10px">已分享</el-tag>
              </div>
              <div class="col-size">{{ file.type==='folder' ? `${file.children} 项` : formatSize(file.size) }}</div>
              <div class="col-date">{{ formatDate(file.modified) }}</div>
              <div class="col-action">
                <el-button text class="icon-btn-sm" @click.stop="onFileRightClick($event, file)">
                  <Icon icon="solar:menu-dots-bold" />
                </el-button>
              </div>
            </div>
          </RecycleScroller>
        </template>

        <div v-if="filteredFiles.length===0" class="empty-state">
          <Icon icon="solar:cloud-storage-bold-duotone" style="font-size:56px;opacity:0.35;display:block;margin-bottom:12px" />
          <p>{{ searchQuery ? '没有找到匹配的文件' : '暂无文件' }}</p>
        </div>
      </div>
    </main>

    <!-- ───────────────── 右键菜单 ───────────────── -->
    <transition name="ctx-menu">
      <div v-if="contextMenu.visible" class="context-menu"
        :style="{ left: contextMenu.x+'px', top: contextMenu.y+'px' }" @click.stop>

        <template v-if="contextMenu.file">
          <div class="ctx-file-title">
            <div class="ctx-file-icon" :style="{ background: getFileColor(contextMenu.file).bg }">
              <Icon :icon="getFileIcon(contextMenu.file)" :style="{ color: getFileColor(contextMenu.file).color }" style="font-size:13px" />
            </div>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">{{ contextMenu.file.name }}</span>
          </div>
          <div class="ctx-divider" />
          <div class="ctx-item" @click="ctxOpen"><Icon icon="solar:eye-line-duotone" class="ctx-icon" />打开 / 预览</div>
          <div class="ctx-item" @click="ctxDownload"><Icon icon="solar:download-minimalistic-line-duotone" class="ctx-icon" />下载</div>
          <div class="ctx-divider" />
          <div class="ctx-item" @click="ctxRename"><Icon icon="solar:pen-line-duotone" class="ctx-icon" />重命名</div>
          <div class="ctx-item" @click="ctxMove"><Icon icon="solar:folder-move-line-duotone" class="ctx-icon" />移动到</div>
          <div class="ctx-item" @click="ctxCopy"><Icon icon="solar:copy-line-duotone" class="ctx-icon" />复制到</div>
          <div class="ctx-divider" />
          <div class="ctx-item" @click="ctxShare"><Icon icon="solar:share-circle-line-duotone" class="ctx-icon" />分享链接</div>
          <div class="ctx-item" @click="ctxToggleStar">
            <Icon :icon="contextMenu.file.starred?'solar:star-bold':'solar:star-line-duotone'" class="ctx-icon" :style="contextMenu.file.starred?{color:'#FBBF24'}:{}" />
            {{ contextMenu.file.starred ? '取消星标' : '添加星标' }}
          </div>
          <div class="ctx-item" @click="ctxDetail"><Icon icon="solar:info-circle-line-duotone" class="ctx-icon" />查看详情</div>
          <div class="ctx-divider" />
          <div class="ctx-item danger" @click="ctxDelete"><Icon icon="solar:trash-bin-trash-line-duotone" class="ctx-icon" />删除</div>
        </template>

        <template v-else>
          <div class="ctx-item" @click="triggerUpload();closeContextMenu()"><Icon icon="solar:upload-line-duotone" class="ctx-icon" />上传文件</div>
          <div class="ctx-item" @click="showNewFolderDialog=true;closeContextMenu()"><Icon icon="solar:folder-with-files-line-duotone" class="ctx-icon" />新建文件夹</div>
          <div class="ctx-divider" />
          <div class="ctx-item" @click="sortBy='name';closeContextMenu()"><Icon icon="solar:sort-by-alphabet-line-duotone" class="ctx-icon" />按名称排序</div>
          <div class="ctx-item" @click="sortBy='modified';closeContextMenu()"><Icon icon="solar:calendar-line-duotone" class="ctx-icon" />按时间排序</div>
          <div class="ctx-item" @click="sortBy='size';closeContextMenu()"><Icon icon="solar:sort-vertical-line-duotone" class="ctx-icon" />按大小排序</div>
        </template>
      </div>
    </transition>

    <!-- 新建文件夹 -->
    <el-dialog v-model="showNewFolderDialog" title="新建文件夹" width="380px" align-center>
      <el-input v-model="newFolderName" placeholder="请输入文件夹名称" autofocus @keyup.enter="createFolder" />
      <template #footer>
        <el-button @click="showNewFolderDialog=false">取消</el-button>
        <el-button type="primary" @click="createFolder">创建</el-button>
      </template>
    </el-dialog>

    <!-- 重命名 -->
    <el-dialog v-model="showRenameDialog" title="重命名" width="380px" align-center>
      <el-input v-model="renameValue" autofocus @keyup.enter="confirmRename" />
      <template #footer>
        <el-button @click="showRenameDialog=false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分享 -->
    <el-dialog v-model="showShareDialog" title="分享链接" width="420px" align-center>
      <div class="share-body">
        <div class="share-row">
          <el-input :model-value="shareLink" readonly style="flex:1" />
          <el-button type="primary" @click="copyShareLink"><Icon icon="solar:copy-line-duotone" style="margin-right:4px" />复制</el-button>
        </div>
        <div class="share-label">有效期</div>
        <el-radio-group v-model="shareExpiry">
          <el-radio-button value="1">1天</el-radio-button>
          <el-radio-button value="7">7天</el-radio-button>
          <el-radio-button value="30">30天</el-radio-button>
          <el-radio-button value="0">永久</el-radio-button>
        </el-radio-group>
        <div class="share-label" style="margin-top:12px">提取码</div>
        <div style="display:flex;align-items:center;gap:8px">
          <el-input :model-value="shareCode" readonly style="width:120px" />
          <el-button @click="refreshShareCode"><Icon icon="solar:refresh-line-duotone" />刷新</el-button>
        </div>
        <QrcodeVue :value="shareLink" :size="120" style="margin:16px auto 0;display:block" />
      </div>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="showDetailDrawer" title="文件详情" direction="rtl" size="320px">
      <div v-if="detailFile" class="detail-body">
        <div style="display:flex;justify-content:center;margin-bottom:16px">
          <div class="detail-icon-wrap" :style="{ background: getFileColor(detailFile).bg }">
            <Icon :icon="getFileIcon(detailFile)" :style="{ color: getFileColor(detailFile).color }" style="font-size:36px" />
          </div>
        </div>
        <div class="detail-name">{{ detailFile.name }}</div>
        <el-divider />
        <div class="detail-row"><span>类型</span><span>{{ fileTypeLabel(detailFile) }}</span></div>
        <div class="detail-row"><span>大小</span><span>{{ formatSize(detailFile.size) }}</span></div>
        <div class="detail-row"><span>修改时间</span><span>{{ formatDate(detailFile.modified, true) }}</span></div>
        <div class="detail-row"><span>星标</span><span>{{ detailFile.starred ? '已星标' : '无' }}</span></div>
        <div class="detail-row"><span>分享</span><span>{{ detailFile.shared ? '已分享' : '未分享' }}</span></div>
      </div>
    </el-drawer>

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

onMounted(async () => {
    if (isSyncing.value) return
    isSyncing.value = true;
    const res = await fetchFiles();
    if (res.vItems.length > 0) {
        files.value.push(...res.vItems);
        total.value = res.total;
    }
    isSyncing.value = false;
});
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
      rows[rowIndex] = { rowId: rowId++, files: [] }
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

const quickCards = [
  { key:'image', label:'图片', icon:'solar:gallery-wide-bold-duotone',  bg:'#FFF7ED', color:'#F97316', count:312 },
  { key:'doc',   label:'文档', icon:'solar:document-text-bold-duotone', bg:'#EEF2FF', color:'#4F6EF7', count:48  },
  { key:'video', label:'视频', icon:'solar:play-circle-bold-duotone',   bg:'#F0FDF4', color:'#22C55E', count:17  },
  { key:'audio', label:'音乐', icon:'solar:music-note-2-bold-duotone',  bg:'#FDF4FF', color:'#A855F7', count:34  },
]

const sortBy      = ref('modified')
const sortOptions = [
  { key:'modified', label:'按修改时间' },
  { key:'name',     label:'按名称'     },
  { key:'size',     label:'按大小'     },
]
const viewMode    = ref('grid')
const searchQuery = ref('')

// ─── 文件数据 ───
const files = ref([
  //{ id:1,  name:'2024年度工作总结.docx', type:'doc',    size:856320,    modified:new Date('2024-12-01'), category:'doc',    starred:false, shared:false },
])

const filteredFiles = computed(() => {
  let list = files.value
  if      (currentCategory.value === 'star')   list = list.filter(f => f.starred)
  else if (currentCategory.value === 'shared') list = list.filter(f => f.shared)
  else if (currentCategory.value !== 'all')    list = list.filter(f => f.category === currentCategory.value || f.type === currentCategory.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(f => f.name.toLowerCase().includes(q))
  }
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return a.name.localeCompare(b.name)
    if (sortBy.value === 'size') return b.size - a.size
    return b.modified - a.modified
  })
})

// ─── 多选 ───
const selectedIds     = ref([])
const allSelected     = computed(() => filteredFiles.value.length > 0 && selectedIds.value.length === filteredFiles.value.length)
const isIndeterminate = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < filteredFiles.value.length)
function toggleSelect(id) {
  const i = selectedIds.value.indexOf(id)
  i === -1 ? selectedIds.value.push(id) : selectedIds.value.splice(i, 1)
}
function toggleSelectAll(val) {
  selectedIds.value = val ? filteredFiles.value.map(f => f.id) : []
}

// ─── 操作 ───
function toggleStar(file) { file.starred = !file.starred; ElMessage.success(file.starred ? '已添加星标' : '已取消星标') }
function openFile(file)   { ElMessage.info(file.type === 'folder' ? `打开文件夹：${file.name}` : `预览：${file.name}`) }

function batchDownload() { ElMessage.success(`已加入下载队列：${selectedIds.value.length} 个文件`); selectedIds.value = [] }
function batchShare()    { ElMessage.success('批量分享功能即将开放') }
function batchDelete() {
  ElMessageBox.confirm(`确定删除 ${selectedIds.value.length} 个文件？`, '删除确认', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    .then(() => { const ids = [...selectedIds.value]; files.value = files.value.filter(f => !ids.includes(f.id)); selectedIds.value = []; ElMessage.success('已删除') })
    .catch(() => {})
}

const fileInputRef = ref(null)
function triggerUpload() { fileInputRef.value?.click() }

  // 此处上传
function handleFileSelect(e) {
  const list = Array.from(e.target.files); if (!list.length) return
  list.forEach(f => 
  files.value.unshift(
    { id: Date.now() + Math.random(), name: f.name, type: getTypeFromExt(f.name), size: f.size, modified: new Date(), category: getCategoryFromExt(f.name), starred: false, shared: false }
  ))

  ElMessage.success(`已添加 ${list.length} 个文件到上传队列`); router.push('/transfer'); e.target.value = ''
}

function getTypeFromExt(name) {
  const ext = name.split('.').pop()?.toLowerCase()
  return {jpg:'image',jpeg:'image',png:'image',gif:'image',webp:'image',mp4:'video',mov:'video',avi:'video',mp3:'audio',wav:'audio',pdf:'pdf',doc:'doc',docx:'doc',xls:'xls',xlsx:'xls',ppt:'ppt',pptx:'ppt',zip:'zip',rar:'zip'}[ext] || 'other'
}
function getCategoryFromExt(name) {
  const t = getTypeFromExt(name)
  return {image:'image',video:'video',audio:'audio',pdf:'doc',doc:'doc',xls:'doc',ppt:'doc'}[t] || 'other'
}

const showNewFolderDialog = ref(false); const newFolderName = ref('新建文件夹')
function createFolder() {
  if (!newFolderName.value.trim()) return ElMessage.warning('请输入文件夹名称')
  files.value.unshift({ id:Date.now(), name:newFolderName.value.trim(), type:'folder', size:0, modified:new Date(), category:'folder', starred:false, shared:false, children:0 })
  showNewFolderDialog.value = false; newFolderName.value = '新建文件夹'; ElMessage.success('文件夹已创建')
}

const showRenameDialog = ref(false); const renameValue = ref(''); const renameTargetId = ref(null)
function confirmRename() {
  if (!renameValue.value.trim()) return ElMessage.warning('名称不能为空')
  const f = files.value.find(f => f.id === renameTargetId.value); if (f) f.name = renameValue.value.trim()
  showRenameDialog.value = false; ElMessage.success('重命名成功')
}

const showShareDialog = ref(false); const shareLink = ref('https://drive.example.com/s/abc123'); const shareExpiry = ref('7'); const shareCode = ref('K8Pq')
function copyShareLink()    { navigator.clipboard?.writeText(shareLink.value); ElMessage.success('链接已复制') }
function refreshShareCode() { shareCode.value = Math.random().toString(36).slice(2,6).toUpperCase() }

const showDetailDrawer = ref(false); const detailFile = ref(null)

// ─── 右键菜单 ───
const contextMenu = ref({ visible:false, x:0, y:0, file:null })
function onFileRightClick(e, file) {
  contextMenu.value = { visible:true, x:Math.min(e.clientX, window.innerWidth-208), y:Math.min(e.clientY, window.innerHeight-370), file }
}
function onAreaRightClick(e) {
  contextMenu.value = { visible:true, x:Math.min(e.clientX, window.innerWidth-208), y:Math.min(e.clientY, window.innerHeight-210), file:null }
}
function closeContextMenu() { contextMenu.value.visible = false }
useEventListener('keydown', e => { if (e.key === 'Escape') closeContextMenu() })

function ctxOpen()       { openFile(contextMenu.value.file); closeContextMenu() }
function ctxDownload()   { ElMessage.success(`开始下载：${contextMenu.value.file.name}`); closeContextMenu() }
function ctxRename()     { renameTargetId.value = contextMenu.value.file.id; renameValue.value = contextMenu.value.file.name; showRenameDialog.value = true; closeContextMenu() }
function ctxMove()       { ElMessage.info('移动功能即将开放'); closeContextMenu() }
function ctxCopy()       { ElMessage.info('复制功能即将开放'); closeContextMenu() }
function ctxShare()      { shareLink.value = `https://drive.example.com/s/${Math.random().toString(36).slice(2,10)}`; showShareDialog.value = true; closeContextMenu() }
function ctxToggleStar() { toggleStar(contextMenu.value.file); closeContextMenu() }
function ctxDetail()     { detailFile.value = contextMenu.value.file; showDetailDrawer.value = true; closeContextMenu() }
function ctxDelete() {
  const { name, id } = contextMenu.value.file; closeContextMenu()
  ElMessageBox.confirm(`确定删除「${name}」？`, '删除确认', { confirmButtonText:'删除', cancelButtonText:'取消', type:'warning' })
    .then(() => { files.value = files.value.filter(f => f.id !== id); selectedIds.value = selectedIds.value.filter(i => i !== id); ElMessage.success('已删除') })
    .catch(() => {})
}

// ─── 工具函数 ───
function formatSize(bytes) {
  if (!bytes) return '--'
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1048576)    return (bytes/1024).toFixed(1)    + ' KB'
  if (bytes < 1073741824) return (bytes/1048576).toFixed(1) + ' MB'
  return (bytes/1073741824).toFixed(2) + ' GB'
}
function formatDate(date, full = false) {
  return full ? moment(date).format('YYYY-MM-DD HH:mm') : moment(date).fromNow()
}
function fileTypeLabel(file) {
  return { folder:'文件夹', doc:'Word 文档', pdf:'PDF 文件', xls:'Excel 表格', ppt:'PPT 演示', image:'图片', video:'视频', audio:'音频', zip:'压缩包', other:'其他' }[file.type] || file.type.toUpperCase()
}
function getFileIcon(file) {
  return { folder:'solar:folder-bold-duotone', pdf:'solar:document-text-bold-duotone', doc:'solar:document-bold-duotone', xls:'solar:chart-square-bold-duotone', ppt:'solar:presentation-graph-bold-duotone', image:'solar:gallery-bold-duotone', video:'solar:play-circle-bold-duotone', audio:'solar:music-note-2-bold-duotone', zip:'solar:zip-file-bold-duotone', other:'solar:file-bold-duotone' }[file.type] || 'solar:file-bold-duotone'
}
function getFileColor(file) {
  return { folder:{bg:'#EEF2FF',color:'#4F6EF7'}, pdf:{bg:'#FEF2F2',color:'#EF4444'}, doc:{bg:'#EFF6FF',color:'#3B82F6'}, xls:{bg:'#F0FDF4',color:'#22C55E'}, ppt:{bg:'#FFF7ED',color:'#F97316'}, image:{bg:'#FDF4FF',color:'#A855F7'}, video:{bg:'#F0FDF4',color:'#10B981'}, audio:{bg:'#FEF3C7',color:'#F59E0B'}, zip:{bg:'#F5F3FF',color:'#8B5CF6'}, other:{bg:'#F9FAFB',color:'#6B7280'} }[file.type] || {bg:'#F9FAFB',color:'#6B7280'}
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

/* ─── 侧边栏 ─── */
.sidebar {
  width: var(--sidebar-w); background: var(--c-surface);
  border-right: 1px solid var(--c-border);
  display: flex; flex-direction: column; flex-shrink: 0;
  padding: 20px 12px 16px; overflow-y: auto;
}
.sidebar-logo { display:flex; align-items:center; gap:10px; padding:0 8px 16px; border-bottom:1px solid var(--c-border); margin-bottom:16px; }
.logo-icon { font-size:26px; color:var(--c-primary); }
.logo-text { font-size:16px; font-weight:600; color:var(--c-text); }
.sidebar-close { display:none; align-items:center; justify-content:center; margin-left:auto; width:28px; height:28px; border:none; background:transparent; color:var(--c-text-muted); font-size:20px; cursor:pointer; border-radius:6px; }
.sidebar-close:hover { background:#F3F4F6; }
.upload-btn { width:100% !important; margin-bottom:16px; border-radius:8px !important; background:var(--c-primary) !important; border-color:var(--c-primary) !important; font-weight:500; }
.sidebar-nav { flex:1; }
.nav-group-label { font-size:11px; color:var(--c-text-hint); text-transform:uppercase; letter-spacing:0.6px; padding:0 10px; margin-bottom:4px; }
.nav-item { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; cursor:pointer; font-size:13.5px; color:var(--c-text-muted); text-decoration:none; margin-bottom:2px; transition:all 0.15s; }
.nav-item:hover { background:#F3F4F6; color:var(--c-text); }
.nav-item.active { background:var(--c-primary-light); color:var(--c-primary); font-weight:500; }
.nav-icon { font-size:18px; flex-shrink:0; }
.nav-badge { margin-left:auto; background:#F3F4F6; color:var(--c-text-muted); font-size:11px; padding:1px 7px; border-radius:99px; font-weight:500; }
.nav-badge.active { background:var(--c-primary); color:#fff; }
.storage-card { background:var(--c-primary-light); border-radius:var(--radius); padding:12px 14px; margin-top:auto; }
.storage-header { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; color:var(--c-text); margin-bottom:4px; }
.storage-detail { font-size:12px; color:var(--c-text-muted); }
.storage-detail .used { color:var(--c-primary); font-weight:600; }

/* ─── 主区 ─── */
.drive-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }

.topbar { background:var(--c-surface); border-bottom:1px solid var(--c-border); padding:12px 20px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-shrink:0; }
.breadcrumb { display:flex; align-items:center; gap:6px; }
.topbar-right { display:flex; align-items:center; gap:8px; }
.search-input { width:220px; }
:deep(.search-input .el-input__wrapper) { border-radius:8px; background:#F3F4F6; box-shadow:none !important; border:1px solid transparent; }
:deep(.search-input .el-input__wrapper:hover),:deep(.search-input .el-input__wrapper.is-focus) { border-color:var(--c-primary); background:#fff; }
.icon-btn { width:34px !important; height:34px !important; padding:0 !important; border-radius:8px !important; border-color:var(--c-border) !important; }
.view-toggle :deep(.el-button) { height:34px !important; padding:0 10px !important; border-color:var(--c-border) !important; }
.view-toggle :deep(.el-button.is-active) { background:var(--c-primary-light) !important; color:var(--c-primary) !important; border-color:var(--c-primary) !important; }
.avatar-btn { width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }

.quick-section { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; padding:16px 20px 0; flex-shrink:0; }
.quick-card { background:var(--c-surface); border-radius:var(--radius); border:1px solid var(--c-border); padding:14px; display:flex; align-items:center; gap:12px; cursor:pointer; transition:all 0.15s; }
.quick-card:hover { border-color:var(--c-primary); transform:translateY(-1px); box-shadow:0 4px 12px rgba(79,110,247,0.1); }
.quick-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.quick-name { font-size:13.5px; font-weight:500; color:var(--c-text); }
.quick-count { font-size:12px; color:var(--c-text-hint); margin-top:2px; }

.toolbar { display:flex; align-items:center; justify-content:space-between; padding:10px 20px; flex-shrink:0; }
.toolbar-left { display:flex; align-items:center; gap:12px; }
.batch-actions { display:flex; align-items:center; gap:6px; }
.selected-count { font-size:13px; color:var(--c-primary); font-weight:500; }
.file-total { font-size:13px; color:var(--c-text-hint); }

/* ─── 虚拟滚动容器 ─── */
.file-area-wrap {
  flex: 1;
  min-height: 0;          /* flex 子项必须设，否则无法收缩 */
  display: flex;
  flex-direction: column;
  padding: 0 20px 20px;
  overflow: hidden;
}
.file-scroller {
  flex: 1;
  min-height: 0;
}
/* 列表模式的 scroller 需要自己滚动 */
.list-scroller { overflow-y: auto; }
.list-scroller::-webkit-scrollbar { width:6px; }
.list-scroller::-webkit-scrollbar-thumb { background:#D1D5DB; border-radius:3px; }

/* ─── 网格行 ─── */
.grid-row {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;   /* 与 GRID_ROW_H 计算保持一致 */
}
.file-card {
  flex: 1; min-width: 0;
  background: var(--c-surface); border-radius: var(--radius);
  border: 1.5px solid var(--c-border); overflow: hidden;
  cursor: pointer; transition: all 0.15s; position: relative;
}
.file-card:hover { border-color:var(--c-primary); box-shadow:0 4px 16px rgba(79,110,247,0.12); }
.file-card.selected { border-color:var(--c-primary); background:var(--c-primary-light); }
.file-card-pad { flex:1; min-width:0; } /* 末行空位占位 */

.file-card-check { position:absolute; top:6px; left:8px; opacity:0; transition:opacity 0.15s; z-index:2; }
.file-card:hover .file-card-check,.file-card.selected .file-card-check { opacity:1; }
.file-card-star { position:absolute; top:6px; right:8px; z-index:2; font-size:14px; cursor:pointer; }

.file-thumb { height:96px; display:flex; align-items:center; justify-content:center; }
.file-meta { padding:8px 10px; border-top:1px solid #F3F4F6; height:54px; box-sizing:border-box; }
.file-name { font-size:12.5px; font-weight:500; color:var(--c-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
.file-info-row { display:flex; justify-content:space-between; }
.file-size,.file-date { font-size:11px; color:var(--c-text-hint); }

/* ─── 列表视图 ─── */
.list-header { display:grid; grid-template-columns:1fr 100px 130px 40px; padding:8px 16px; background:#F9FAFB; border:1px solid var(--c-border); border-bottom:none; border-radius:var(--radius) var(--radius) 0 0; font-size:12px; color:var(--c-text-hint); font-weight:500; flex-shrink:0; }
.list-row { display:grid; grid-template-columns:1fr 100px 130px 40px; padding:0 16px; height:52px; align-items:center; border-bottom:1px solid #F3F4F6; cursor:pointer; transition:background 0.1s; background:var(--c-surface); box-sizing:border-box; }
.list-row:hover { background:#F9FAFB; }
.list-row.selected { background:var(--c-primary-light); }
.col-name { display:flex; align-items:center; min-width:0; overflow:hidden; }
.list-file-icon { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-right:10px; flex-shrink:0; }
.list-file-name { font-size:13.5px; color:var(--c-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.col-size,.col-date { font-size:13px; color:var(--c-text-muted); }
.col-action { display:flex; justify-content:center; }
.icon-btn-sm { width:28px !important; height:28px !important; padding:0 !important; }

.empty-state { text-align:center; padding:60px 0; color:var(--c-text-hint); }

/* ─── 右键菜单 ─── */
.context-menu { position:fixed; z-index:9999; background:var(--c-surface); border:1px solid var(--c-border); border-radius:12px; padding:6px; min-width:192px; box-shadow:0 8px 30px rgba(0,0,0,0.12),0 2px 8px rgba(0,0,0,0.06); }
.ctx-file-title { display:flex; align-items:center; gap:8px; padding:6px 10px 8px; font-size:13px; font-weight:500; color:var(--c-text); overflow:hidden; }
.ctx-file-icon { width:26px; height:26px; border-radius:6px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ctx-divider { height:1px; background:var(--c-border); margin:4px 0; }
.ctx-item { display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:7px; font-size:13.5px; color:var(--c-text); cursor:pointer; transition:background 0.1s; user-select:none; }
.ctx-item:hover { background:#F3F4F6; }
.ctx-item.danger { color:var(--c-danger); }
.ctx-item.danger:hover { background:#FEF2F2; }
.ctx-icon { font-size:16px; color:var(--c-text-muted); flex-shrink:0; }
.ctx-item.danger .ctx-icon { color:var(--c-danger); }
.ctx-menu-enter-active { transition:all 0.15s ease; }
.ctx-menu-leave-active { transition:all 0.1s ease; }
.ctx-menu-enter-from { opacity:0; transform:scale(0.95) translateY(-4px); }
.ctx-menu-leave-to   { opacity:0; transform:scale(0.95); }

.fade-enter-active,.fade-leave-active { transition:opacity 0.2s; }
.fade-enter-from,.fade-leave-to { opacity:0; }

/* ─── Dialogs ─── */
.share-body { display:flex; flex-direction:column; gap:12px; }
.share-row { display:flex; gap:8px; }
.share-label { font-size:13px; color:var(--c-text-muted); }
.detail-body { padding:8px 0; }
.detail-icon-wrap { width:72px; height:72px; border-radius:16px; display:flex; align-items:center; justify-content:center; }
.detail-name { text-align:center; font-size:15px; font-weight:500; color:var(--c-text); margin-bottom:8px; word-break:break-all; }
.detail-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F3F4F6; font-size:13.5px; }
.detail-row span:first-child { color:var(--c-text-muted); }
.detail-row span:last-child { color:var(--c-text); font-weight:500; }

/* ─── 汉堡 / 遮罩 ─── */
.hamburger { display:none; align-items:center; justify-content:center; width:34px; height:34px; border-radius:8px; border:1px solid var(--c-border); background:var(--c-surface); color:var(--c-text-muted); font-size:20px; cursor:pointer; flex-shrink:0; margin-right:6px; }
.sidebar-mask { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:199; backdrop-filter:blur(2px); }
.mask-enter-active { transition:opacity 0.25s ease; }
.mask-leave-active { transition:opacity 0.2s ease; }
.mask-enter-from,.mask-leave-to { opacity:0; }

/* ─── 平板 ≤1024px：侧边栏收窄为图标模式 ─── */
@media (max-width: 1024px) {
  .sidebar { width:64px; padding:16px 8px; }
  .logo-text,.nav-group-label,.storage-detail { display:none; }
  .sidebar-logo { justify-content:center; padding-bottom:16px; }
  .upload-btn :deep(span) { display:none; }
  .upload-btn { min-width:0 !important; width:44px !important; padding:0 !important; justify-content:center; }
  .nav-item { justify-content:center; padding:10px; position:relative; }
  .nav-item span:not(.nav-badge) { display:none; }
  .nav-badge { position:absolute; top:4px; right:4px; padding:0; min-width:16px; height:16px; font-size:10px; display:flex; align-items:center; justify-content:center; }
  .nav-icon { font-size:22px; }
  .storage-header { justify-content:center; }
  .storage-header span { display:none; }
  .quick-section { grid-template-columns:repeat(2,1fr); }
  .search-input { width:160px; }
}

/* ─── 手机 ≤640px：侧边栏变抽屉 ─── */
@media (max-width: 640px) {
  .sidebar { position:fixed; top:0; left:0; bottom:0; width:240px !important; padding:20px 12px 16px; z-index:200; transform:translateX(-100%); transition:transform 0.28s cubic-bezier(0.4,0,0.2,1); }
  .sidebar.sidebar-open { transform:translateX(0); box-shadow:4px 0 24px rgba(0,0,0,0.12); }
  .sidebar-mask { display:block; }
  /* 抽屉内恢复完整显示 */
  .logo-text { display:block; }
  .sidebar-logo { justify-content:flex-start; }
  .sidebar-close { display:flex; }
  .upload-btn :deep(span) { display:inline; }
  .upload-btn { width:100% !important; padding:0 16px !important; }
  .nav-group-label { display:block; }
  .nav-item { justify-content:flex-start; padding:9px 10px; }
  .nav-item span:not(.nav-badge) { display:inline; }
  .nav-icon { font-size:18px; }
  .storage-header span,.storage-detail { display:block; }
  .storage-header { justify-content:flex-start; }
  /* 顶部 */
  .hamburger { display:flex; }
  .home-icon { display:none; }
  .topbar { padding:10px 14px; gap:8px; }
  .topbar-right { gap:6px; }
  .search-input { width:120px; }
  .view-toggle { display:none; }
  /* 内容 */
  .quick-section { grid-template-columns:repeat(2,1fr); padding:12px 14px 0; gap:8px; }
  .toolbar { padding:8px 14px; }
  .file-area-wrap { padding:0 14px 16px; }
  /* 列表：只保留名称和操作 */
  .list-header { grid-template-columns:1fr 40px; }
  .list-row { grid-template-columns:1fr 40px; }
  .col-size,.col-date { display:none; }
  :deep(.el-dialog) { width:92vw !important; }
  :deep(.el-drawer) { width:88vw !important; }
}

/* ─── 极小屏 ≤360px ─── */
@media (max-width: 360px) {
  .search-input { width:90px; }
  .quick-count { display:none; }
}
</style>