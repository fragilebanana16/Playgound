<template>
  <div class="transfer-page" style="height: calc(-90px + 100vh);">
    <!-- 页头 -->
    <div class="page-header">
      <div class="header-left">
        <router-link to="/media/cloud/cloudMain" class="back-btn">
          <Icon icon="solar:arrow-left-line-duotone" />
        </router-link>
        <div>
          <h1 class="page-title">传输列表</h1>
          <p class="page-sub">{{ activeCount }} 个任务进行中，{{ doneCount }} 个已完成</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="triggerUpload" type="primary" class="upload-btn">
          <Icon icon="solar:upload-bold" class="mr-1.5" />上传文件
        </el-button>
        <input ref="fileInputRef" type="file" multiple class="hidden" @change="handleFileSelect" />
        <el-button @click="clearDone" :disabled="doneCount === 0">
          <Icon icon="solar:broom-line-duotone" class="mr-1.5" />清除已完成
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#EFF6FF; color:#3B82F6">
          <Icon icon="solar:upload-bold-duotone" />
        </div>
        <div>
          <div class="stat-val">{{ uploadingCount }}</div>
          <div class="stat-label">上传中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#F0FDF4; color:#22C55E">
          <Icon icon="solar:download-bold-duotone" />
        </div>
        <div>
          <div class="stat-val">{{ downloadingCount }}</div>
          <div class="stat-label">下载中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FDF4FF; color:#A855F7">
          <Icon icon="solar:check-circle-bold-duotone" />
        </div>
        <div>
          <div class="stat-val">{{ doneCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF2F2; color:#EF4444">
          <Icon icon="solar:danger-circle-bold-duotone" />
        </div>
        <div>
          <div class="stat-val">{{ errorCount }}</div>
          <div class="stat-label">失败</div>
        </div>
      </div>
    </div>

    <!-- 筛选 Tabs -->
    <div class="filter-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count" :class="{ active: activeTab === tab.key }">{{ tabCount(tab.key) }}</span>
      </div>
    </div>

    <!-- 传输列表 -->
    <div class="transfer-list overflow-y-auto">
      <transition-group name="list-item">
        <div
          v-for="item in filteredTransfers"
          :key="item.id"
          class="transfer-item"
          :class="item.status"
        >
          <!-- 左：文件图标 -->
          <div class="item-icon-wrap">
            <div class="item-icon" :style="{ background: getFileColor(item).bg }">
              <Icon :icon="getFileIcon(item)" :style="{ color: getFileColor(item).color }" class="text-xl" />
            </div>
            <!-- 类型标签 -->
            <div class="item-type-badge" :class="item.type">
              <Icon :icon="item.type === 'upload' ? 'solar:upload-minimalistic-bold' : 'solar:download-minimalistic-bold'" />
            </div>
          </div>

          <!-- 中：信息 + 进度 -->
          <div class="item-body">
            <div class="item-top">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-status-label" :class="item.status">{{ statusLabel(item.status) }}</span>
            </div>

            <!-- 进度条（进行中/暂停显示） -->
            <template v-if="item.status === 'uploading' || item.status === 'downloading' || item.status === 'paused'">
              <el-progress
                :percentage="Math.round((item.loaded / item.size) * 100)"
                :status="item.status === 'paused' ? 'warning' : undefined"
                :stroke-width="5"
                :show-text="false"
                :color="item.status === 'paused' ? '#F59E0B' : progressColor(item)"
                class="item-progress"
              />
              <div class="item-detail">
                <span>{{ formatSize(item.loaded) }} / {{ formatSize(item.size) }}</span>
                <span v-if="item.status !== 'paused'" class="item-speed">
                  <Icon icon="solar:round-arrow-up-line-duotone" v-if="item.type === 'upload'" class="text-blue-400" />
                  <Icon icon="solar:round-arrow-down-line-duotone" v-else class="text-green-400" />
                  {{ formatSize(item.speed) }}/s
                </span>
                <span v-else class="text-amber-500">已暂停</span>
                <span class="item-eta">
                  {{ item.status !== 'paused' && item.speed > 0 ? `剩余 ${formatEta(item)}` : '' }}
                </span>
              </div>
            </template>

            <!-- 完成 -->
            <div v-else-if="item.status === 'done'" class="item-detail">
              <span>{{ formatSize(item.size) }}</span>
              <span class="text-[--c-success]">
                <Icon icon="solar:check-circle-bold" class="text-green-500 mr-1" />
                {{ formatDate(item.startTime) }}完成
              </span>
            </div>

            <!-- 等待 -->
            <div v-else-if="item.status === 'waiting'" class="item-detail">
              <span>{{ formatSize(item.size) }}</span>
              <span class="text-[--c-text-hint]">等待中…</span>
            </div>

            <!-- 错误 -->
            <div v-else-if="item.status === 'error'" class="item-detail error-detail">
              <span>{{ formatSize(item.size) }}</span>
              <span class="error-msg">
                <Icon icon="solar:danger-circle-bold" class="text-red-400 mr-1" />
                {{ item.error }}
              </span>
            </div>
          </div>

          <!-- 右：操作按钮 -->
          <div class="item-actions">
            <!-- 进行中：暂停 -->
            <el-tooltip v-if="item.status === 'uploading' || item.status === 'downloading'" content="暂停">
              <el-button class="act-btn" @click="pauseItem(item)">
                <Icon icon="solar:pause-bold" />
              </el-button>
            </el-tooltip>
            <!-- 暂停中：继续 -->
            <el-tooltip v-if="item.status === 'paused'" content="继续">
              <el-button class="act-btn" @click="resumeItem(item)">
                <Icon icon="solar:play-bold" />
              </el-button>
            </el-tooltip>
            <!-- 等待中：取消 -->
            <el-tooltip v-if="item.status === 'waiting'" content="取消">
              <el-button class="act-btn" @click="cancelItem(item)">
                <Icon icon="solar:close-circle-line-duotone" />
              </el-button>
            </el-tooltip>
            <!-- 错误：重试 -->
            <el-tooltip v-if="item.status === 'error'" content="重试">
              <el-button class="act-btn retry" @click="retryItem(item)">
                <Icon icon="solar:refresh-bold" />
              </el-button>
            </el-tooltip>
            <!-- 完成：打开所在文件夹 -->
            <el-tooltip v-if="item.status === 'done'" content="查看文件">
              <el-button class="act-btn" @click="openFolder(item)">
                <Icon icon="solar:folder-open-line-duotone" />
              </el-button>
            </el-tooltip>
            <!-- 全部：删除任务 -->
            <el-tooltip content="移除">
              <el-button class="act-btn remove" @click="removeItem(item)">
                <Icon icon="solar:close-square-line-duotone" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </transition-group>

      <!-- 空状态 -->
      <div v-if="filteredTransfers.length === 0" class="empty-state">
        <Icon icon="solar:transfer-horizontal-bold-duotone" class="empty-icon" />
        <p>{{ activeTab === 'all' ? '暂无传输任务' : '该分类下暂无任务' }}</p>
        <el-button type="primary" class="mt-4" @click="triggerUpload">上传文件</el-button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import { useIntervalFn } from '@vueuse/core'
import moment from 'moment'
moment.locale('zh-cn')

// ─── 传输数据 ───
const transfers = ref([
  { id: 't1', name: '项目文档合集.zip',       type: 'upload',   size: 128*1024*1024, loaded: 128*1024*1024, status: 'done',        speed: 0,              startTime: new Date(Date.now()-120000), error: null },
  { id: 't2', name: '产品演示视频-高清.mp4',   type: 'upload',   size: 512*1024*1024, loaded: 320*1024*1024, status: 'uploading',   speed: 2.4*1024*1024,  startTime: new Date(Date.now()-60000),  error: null },
  { id: 't3', name: '设计资产包.sketch',       type: 'upload',   size: 89*1024*1024,  loaded: 0,             status: 'waiting',     speed: 0,              startTime: null,                        error: null },
  { id: 't4', name: '年度报告-final.pdf',      type: 'download', size: 4.5*1024*1024, loaded: 4.5*1024*1024, status: 'done',        speed: 0,              startTime: new Date(Date.now()-300000), error: null },
  { id: 't5', name: '会议录像20241201.mp4',    type: 'download', size: 256*1024*1024, loaded: 89*1024*1024,  status: 'downloading', speed: 1.8*1024*1024,  startTime: new Date(Date.now()-45000),  error: null },
  { id: 't6', name: '客户资料备份.zip',        type: 'upload',   size: 67*1024*1024,  loaded: 0,             status: 'error',       speed: 0,              startTime: new Date(Date.now()-900000), error: '网络连接超时' },
  { id: 't7', name: '用户头像批量包.zip',      type: 'upload',   size: 22*1024*1024,  loaded: 0,             status: 'waiting',     speed: 0,              startTime: null,                        error: null },
  { id: 't8', name: '技术文档v3.docx',         type: 'download', size: 1.2*1024*1024, loaded: 1.2*1024*1024, status: 'done',        speed: 0,              startTime: new Date(Date.now()-600000), error: null },
  { id: 't9', name: '数据库备份20241201.sql',  type: 'upload',   size: 340*1024*1024, loaded: 210*1024*1024, status: 'paused',      speed: 0,              startTime: new Date(Date.now()-200000), error: null },
])

// ─── 模拟进度更新 ───
useIntervalFn(() => {
  transfers.value.forEach(item => {
    if (item.status === 'uploading' || item.status === 'downloading') {
      const delta = item.speed * 0.8 + Math.random() * item.speed * 0.4
      item.loaded = Math.min(item.loaded + delta, item.size)
      item.speed = item.speed * 0.9 + Math.random() * 1024 * 1024 * 3 * 0.1
      if (item.loaded >= item.size) {
        item.loaded = item.size
        item.status = 'done'
        item.speed = 0
        item.startTime = new Date()
        ElMessage.success(`${item.name} 传输完成`)
        // 如果有 waiting 任务，自动开始下一个
        const next = transfers.value.find(t => t.status === 'waiting')
        if (next) {
          next.status = next.type === 'upload' ? 'uploading' : 'downloading'
          next.startTime = new Date()
          next.speed = 1.5 * 1024 * 1024 + Math.random() * 1024 * 1024
        }
      }
    }
  })
}, 800)

// ─── Tab 筛选 ───
const activeTab = ref('all')
const tabs = [
  { key: 'all',       label: '全部' },
  { key: 'active',    label: '进行中' },
  { key: 'waiting',   label: '等待中' },
  { key: 'done',      label: '已完成' },
  { key: 'error',     label: '失败' },
]
const filteredTransfers = computed(() => {
  if (activeTab.value === 'all') return transfers.value
  if (activeTab.value === 'active') return transfers.value.filter(t => t.status === 'uploading' || t.status === 'downloading' || t.status === 'paused')
  if (activeTab.value === 'waiting') return transfers.value.filter(t => t.status === 'waiting')
  if (activeTab.value === 'done') return transfers.value.filter(t => t.status === 'done')
  if (activeTab.value === 'error') return transfers.value.filter(t => t.status === 'error')
  return transfers.value
})
function tabCount(key) {
  if (key === 'all') return transfers.value.length
  if (key === 'active') return transfers.value.filter(t => ['uploading','downloading','paused'].includes(t.status)).length
  return transfers.value.filter(t => t.status === key).length
}

// ─── 统计 ───
const activeCount    = computed(() => transfers.value.filter(t => ['uploading','downloading'].includes(t.status)).length)
const doneCount      = computed(() => transfers.value.filter(t => t.status === 'done').length)
const uploadingCount = computed(() => transfers.value.filter(t => t.status === 'uploading').length)
const downloadingCount = computed(() => transfers.value.filter(t => t.status === 'downloading').length)
const errorCount     = computed(() => transfers.value.filter(t => t.status === 'error').length)

// ─── 操作 ───
function pauseItem(item) {
  item.status = 'paused'
  item.speed = 0
}
function resumeItem(item) {
  item.status = item.type === 'upload' ? 'uploading' : 'downloading'
  item.speed = 1.2 * 1024 * 1024 + Math.random() * 1024 * 1024
}
function cancelItem(item) {
  item.status = 'error'
  item.error = '用户取消'
}
function retryItem(item) {
  item.status = item.type === 'upload' ? 'uploading' : 'downloading'
  item.error = null
  item.loaded = 0
  item.startTime = new Date()
  item.speed = 1.5 * 1024 * 1024 + Math.random() * 1024 * 1024
}
function removeItem(item) {
  const idx = transfers.value.findIndex(t => t.id === item.id)
  if (idx !== -1) transfers.value.splice(idx, 1)
}
function openFolder(item) {
  ElMessage.success(`已打开 ${item.name} 所在文件夹`)
}
function clearDone() {
  transfers.value = transfers.value.filter(t => t.status !== 'done')
  ElMessage.success('已清除完成记录')
}

// ─── 上传入口 ───
const fileInputRef = ref(null)
function triggerUpload() { fileInputRef.value?.click() }
function handleFileSelect(e) {
  const fileList = Array.from(e.target.files)
  fileList.forEach((f, i) => {
    const id = 'new-' + Date.now() + i
    transfers.value.push({
      id, name: f.name, type: 'upload', size: f.size, loaded: 0,
      status: activeCount.value < 2 ? 'uploading' : 'waiting',
      speed: activeCount.value < 2 ? (1.5 + Math.random()) * 1024 * 1024 : 0,
      startTime: activeCount.value < 2 ? new Date() : null,
      error: null
    })
  })
  ElMessage.success(`已添加 ${fileList.length} 个上传任务`)
  e.target.value = ''
}

// ─── 工具函数 ───
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return bytes.toFixed(0) + ' B'
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
  if (bytes < 1024*1024*1024) return (bytes/1024/1024).toFixed(1) + ' MB'
  return (bytes/1024/1024/1024).toFixed(2) + ' GB'
}
function formatDate(date) {
  return date ? moment(date).fromNow() : '--'
}
function formatEta(item) {
  if (!item.speed || item.speed === 0) return '--'
  const remaining = item.size - item.loaded
  const secs = remaining / item.speed
  if (secs < 60) return `${Math.ceil(secs)}秒`
  if (secs < 3600) return `${Math.ceil(secs/60)}分钟`
  return `${(secs/3600).toFixed(1)}小时`
}
function statusLabel(status) {
  const map = { uploading:'上传中', downloading:'下载中', done:'已完成', waiting:'等待中', error:'失败', paused:'已暂停' }
  return map[status] || status
}
function progressColor(item) {
  return item.type === 'upload' ? '#3B82F6' : '#22C55E'
}

function getFileIcon(item) {
  const ext = item.name.split('.').pop()?.toLowerCase()
  const map = { mp4:'solar:play-circle-bold-duotone', mov:'solar:play-circle-bold-duotone',
                avi:'solar:play-circle-bold-duotone', mp3:'solar:music-note-2-bold-duotone',
                wav:'solar:music-note-2-bold-duotone', pdf:'solar:document-text-bold-duotone',
                doc:'solar:document-bold-duotone', docx:'solar:document-bold-duotone',
                xls:'solar:chart-square-bold-duotone', xlsx:'solar:chart-square-bold-duotone',
                ppt:'solar:presentation-graph-bold-duotone', pptx:'solar:presentation-graph-bold-duotone',
                zip:'solar:zip-file-bold-duotone', rar:'solar:zip-file-bold-duotone',
                jpg:'solar:gallery-bold-duotone', jpeg:'solar:gallery-bold-duotone',
                png:'solar:gallery-bold-duotone', sql:'solar:database-bold-duotone',
                sketch:'solar:pen-bold-duotone' }
  return map[ext] || 'solar:file-bold-duotone'
}
function getFileColor(item) {
  const ext = item.name.split('.').pop()?.toLowerCase()
  const map = {
    mp4:{ bg:'#F0FDF4', color:'#10B981' }, mov:{ bg:'#F0FDF4', color:'#10B981' },
    mp3:{ bg:'#FEF3C7', color:'#F59E0B' }, wav:{ bg:'#FEF3C7', color:'#F59E0B' },
    pdf:{ bg:'#FEF2F2', color:'#EF4444' },
    doc:{ bg:'#EFF6FF', color:'#3B82F6' }, docx:{ bg:'#EFF6FF', color:'#3B82F6' },
    xls:{ bg:'#F0FDF4', color:'#22C55E' }, xlsx:{ bg:'#F0FDF4', color:'#22C55E' },
    ppt:{ bg:'#FFF7ED', color:'#F97316' }, pptx:{ bg:'#FFF7ED', color:'#F97316' },
    zip:{ bg:'#F5F3FF', color:'#8B5CF6' }, rar:{ bg:'#F5F3FF', color:'#8B5CF6' },
    jpg:{ bg:'#FDF4FF', color:'#A855F7' }, jpeg:{ bg:'#FDF4FF', color:'#A855F7' },
    png:{ bg:'#FDF4FF', color:'#A855F7' }, sql:{ bg:'#EEF2FF', color:'#4F6EF7' },
    sketch:{ bg:'#FFF7ED', color:'#F97316' },
  }
  return map[ext] || { bg:'#F9FAFB', color:'#6B7280' }
}
</script>

<style scoped>
.transfer-page {
  --c-primary: #4F6EF7;
  --c-primary-light: #EEF2FF;
  --c-bg: #F4F5F7;
  --c-surface: #ffffff;
  --c-border: #E5E7EB;
  --c-text: #111827;
  --c-text-muted: #6B7280;
  --c-text-hint: #9CA3AF;
  --c-success: #22C55E;
  --c-danger: #EF4444;
  --radius: 12px;
  display: flex;
  flex-direction: column;
  background: var(--c-bg);
  padding: 28px 32px;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ─── 页头 ─── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.back-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--c-text-muted);
  text-decoration: none;
  font-size: 20px;
  transition: all 0.15s;
}
.back-btn:hover { border-color: var(--c-primary); color: var(--c-primary); }
.page-title { font-size: 20px; font-weight: 600; color: var(--c-text); }
.page-sub { font-size: 13px; color: var(--c-text-muted); margin-top: 2px; }
.header-actions { display: flex; gap: 8px; }
.upload-btn { background: var(--c-primary) !important; border-color: var(--c-primary) !important; }

/* ─── 统计卡片 ─── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat-card {
  background: var(--c-surface);
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 44px; height: 44px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.stat-val { font-size: 22px; font-weight: 700; color: var(--c-text); line-height: 1; }
.stat-label { font-size: 12px; color: var(--c-text-muted); margin-top: 4px; }

/* ─── 筛选 Tabs ─── */
.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 16px;
  width: fit-content;
}
.filter-tab {
  padding: 7px 16px;
  border-radius: 7px;
  font-size: 13.5px;
  color: var(--c-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  display: flex; align-items: center; gap: 6px;
  user-select: none;
}
.filter-tab:hover { background: var(--c-bg); color: var(--c-text); }
.filter-tab.active { background: var(--c-primary); color: #fff; }
.tab-count {
  font-size: 11px;
  background: #F3F4F6;
  color: var(--c-text-muted);
  border-radius: 99px;
  padding: 1px 7px;
  font-weight: 500;
}
.tab-count.active { background: rgba(255,255,255,0.25); color: #fff; }

/* ─── 传输列表 ─── */
.transfer-list { display: flex; flex-direction: column; gap: 8px; }

.transfer-item {
  background: var(--c-surface);
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.transfer-item:hover { border-color: #C7D2FE; box-shadow: 0 2px 8px rgba(79,110,247,0.06); }
.transfer-item.error { border-color: #FCA5A5; background: #FFFBFB; }
.transfer-item.done { opacity: 0.8; }

/* 文件图标 */
.item-icon-wrap { position: relative; flex-shrink: 0; }
.item-icon {
  width: 46px; height: 46px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
}
.item-type-badge {
  position: absolute;
  bottom: -4px; right: -4px;
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  border: 2px solid var(--c-surface);
}
.item-type-badge.upload { background: #3B82F6; color: #fff; }
.item-type-badge.download { background: #22C55E; color: #fff; }

/* 文件信息 */
.item-body { flex: 1; min-width: 0; }
.item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.item-name { font-size: 14px; font-weight: 500; color: var(--c-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 460px; }
.item-status-label {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 9px;
  border-radius: 99px;
  flex-shrink: 0;
  margin-left: 12px;
}
.item-status-label.uploading   { background: #EFF6FF; color: #3B82F6; }
.item-status-label.downloading { background: #F0FDF4; color: #22C55E; }
.item-status-label.done        { background: #F0FDF4; color: #16A34A; }
.item-status-label.waiting     { background: #F3F4F6; color: #6B7280; }
.item-status-label.error       { background: #FEF2F2; color: #EF4444; }
.item-status-label.paused      { background: #FEF3C7; color: #D97706; }

.item-progress { margin-bottom: 4px; }
:deep(.item-progress .el-progress-bar__outer) { background: #F3F4F6; }

.item-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--c-text-muted);
}
.item-speed { display: flex; align-items: center; gap: 3px; }
.item-eta { margin-left: auto; }
.error-detail { color: var(--c-danger); }
.error-msg { display: flex; align-items: center; }

/* 操作按钮 */
.item-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.act-btn {
  width: 32px !important; height: 32px !important;
  padding: 0 !important;
  border-radius: 8px !important;
  border-color: var(--c-border) !important;
  font-size: 15px;
}
.act-btn.retry { color: #3B82F6 !important; border-color: #93C5FD !important; }
.act-btn.retry:hover { background: #EFF6FF !important; }
.act-btn.remove:hover { color: var(--c-danger) !important; border-color: #FCA5A5 !important; background: #FEF2F2 !important; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--c-text-hint);
}
.empty-icon { font-size: 60px; margin-bottom: 12px; opacity: 0.35; display: block; margin-inline: auto; }

/* 列表动画 */
.list-item-enter-active { transition: all 0.25s ease; }
.list-item-leave-active { transition: all 0.2s ease; }
.list-item-enter-from { opacity: 0; transform: translateY(-8px); }
.list-item-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
