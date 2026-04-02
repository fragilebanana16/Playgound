<template>
  <div>
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
          :class="{ active: activeId === nav.id }"
          @click="handleNavClick(nav.id)"
        >
          <Icon :icon="nav.icon" class="nav-icon" />
          <span>{{ nav.label }}</span>
        </div>
        <div class="nav-group-label" style="margin-top:16px">其他</div>

        <div
          v-for="nav in independentNavs" :key="nav.key"
          class="nav-item"
          :class="{ active: activeId === nav.path }"
          @click="handleNavClick(nav.path)"
        >
          <Icon :icon="nav.icon" class="nav-icon" />
          <span>{{ nav.label }}</span>
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
import { useCloudStore } from '@/store/modules/menu';
moment.locale('zh-cn')

// store
const cloudStore = useCloudStore();
// ─── 路由 ───
const route = useRoute()
const router = useRouter()


// ─── 移动端侧边栏 ───
const sidebarOpen = ref(false)


// ─── 导航 ───
// 前5个公用项的数据
const navItems = [
  { id: 'all',   label: '全部文件', icon: 'solar:widget-2-line-duotone'      },
  { id: 'image', label: '图片',     icon: 'solar:gallery-wide-line-duotone'  },
  { id: 'doc',   label: '文档',     icon: 'solar:document-text-line-duotone' },
  { id: 'video', label: '视频',     icon: 'solar:play-circle-line-duotone'   },
  { id: 'audio', label: '音乐',     icon: 'solar:music-note-2-line-duotone'  },
]

// 下面独立的项
const independentNavs = [
  { path: '/media/cloud/share',    label: '分享'  ,  icon:'solar:share-circle-line-duotone' },
  { path: '/media/cloud/start',    label: '星标文件', icon:'solar:star-line-duotone'         },
  { path: '/media/cloud/transfer', label: '传输列表', icon: 'solar:transfer-horizontal-line-duotone'},
  { path: '/media/cloud/trash',    label: '回收站',   icon: 'solar:trash-bin-trash-line-duotone'    },
]

const handleNavClick = (nav) => {
  sidebarOpen.value = false;
  const isInternal = navItems.map(item => item.id).includes(nav);
  if (isInternal) {
    cloudStore.setCategory(nav);
    // 如果你当前不在 CloudMain 页面，才需要跳过去
    if (route.name !== 'cloudMain') {
      router.push('/media/cloud/cloudMain');
    }
  } else {
    router.push(nav);
  }
};

const activeId = computed(() => {
  if (route.name === 'CloudMain') {
    return cloudStore.currentCategory;
  }
  // 如果在其他页面，由路由名或路径决定谁亮
  return route.path; 
});

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
/* ─── 基础变量与布局容器 ─── */
/* 注意：如果这些变量定义在父组件，这里可以省略，但在组件内独立使用需保留 */
.sidebar {
  --c-primary:       #4F6EF7;
  --c-primary-light: #EEF2FF;
  --c-surface:       #ffffff;
  --c-border:        #E5E7EB;
  --c-text:          #111827;
  --c-text-muted:    #6B7280;
  --c-text-hint:     #9CA3AF;
  --radius:          10px;
  --sidebar-w:       220px;

  width: var(--sidebar-w); 
  background: var(--c-surface);
  border-right: 1px solid var(--c-border);
  display: flex; 
  flex-direction: column; 
  flex-shrink: 0;
  padding: 20px 12px 16px; 
  overflow-y: auto;
  height: 100%; /* 确保撑满父容器高度 */
  box-sizing: border-box;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s;
}

/* ─── Logo 区域 ─── */
.sidebar-logo { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  padding: 0 8px 16px; 
  border-bottom: 1px solid var(--c-border); 
  margin-bottom: 16px; 
}
.logo-icon { font-size: 26px; color: var(--c-primary); }
.logo-text { font-size: 16px; font-weight: 600; color: var(--c-text); }

/* ─── 移动端关闭按钮 ─── */
.sidebar-close { 
  display: none; 
  align-items: center; 
  justify-content: center; 
  margin-left: auto; 
  width: 28px; 
  height: 28px; 
  border: none; 
  background: transparent; 
  color: var(--c-text-muted); 
  font-size: 20px; 
  cursor: pointer; 
  border-radius: 6px; 
}
.sidebar-close:hover { background: #F3F4F6; }

/* ─── 上传按钮 ─── */
.upload-btn { 
  width: 100% !important; 
  margin-bottom: 16px; 
  border-radius: 8px !important; 
  background: var(--c-primary) !important; 
  border-color: var(--c-primary) !important; 
  font-weight: 500; 
}
.hidden { display: none; }
.mr-2 { margin-right: 8px; }

/* ─── 导航列表 ─── */
.sidebar-nav { flex: 1; }
.nav-group-label { 
  font-size: 11px; 
  color: var(--c-text-hint); 
  text-transform: uppercase; 
  letter-spacing: 0.6px; 
  padding: 0 10px; 
  margin-bottom: 4px; 
}
.nav-item { 
  display: flex; 
  align-items: center; 
  gap: 10px; 
  padding: 9px 10px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 13.5px; 
  color: var(--c-text-muted); 
  text-decoration: none; 
  margin-bottom: 2px; 
  transition: all 0.15s; 
}
.nav-item:hover { background: #F3F4F6; color: var(--c-text); }
.nav-item.active { 
  background: var(--c-primary-light); 
  color: var(--c-primary); 
  font-weight: 500; 
}
.nav-icon { font-size: 18px; flex-shrink: 0; }

/* ─── 徽章 ─── */
.nav-badge { 
  margin-left: auto; 
  background: #F3F4F6; 
  color: var(--c-text-muted); 
  font-size: 11px; 
  padding: 1px 7px; 
  border-radius: 99px; 
  font-weight: 500; 
}
.nav-badge.active { background: var(--c-primary); color: #fff; }

/* ─── 底部存储卡片 ─── */
.storage-card { 
  background: var(--c-primary-light); 
  border-radius: var(--radius); 
  padding: 12px 14px; 
  margin-top: auto; 
}
.storage-header { 
  display: flex; 
  align-items: center; 
  gap: 6px; 
  font-size: 13px; 
  font-weight: 500; 
  color: var(--c-text); 
  margin-bottom: 4px; 
}
.storage-detail { font-size: 12px; color: var(--c-text-muted); }
.storage-detail .used { color: var(--c-primary); font-weight: 600; }

/* ─── 响应式方案 (核心) ─── */

/* 平板模式：收窄为图标 */
@media (max-width: 1024px) {
  .sidebar { width: 64px; padding: 16px 8px; }
  .logo-text, .nav-group-label, .storage-detail, .nav-item span:not(.nav-badge) { display: none; }
  .sidebar-logo { justify-content: center; padding-bottom: 16px; }
  .upload-btn { width: 44px !important; padding: 0 !important; justify-content: center; }
  .upload-btn :deep(span) { display: none; }
  .nav-item { justify-content: center; position: relative; }
  .nav-badge { position: absolute; top: 4px; right: 4px; }
  .storage-header { justify-content: center; }
  .storage-header span { display: none; }
}

/* 手机模式：变为侧滑抽屉 */
@media (max-width: 640px) {
  .sidebar { 
    position: fixed; 
    top: 0; left: 0; bottom: 0; 
    width: 240px !important; 
    z-index: 200; 
    transform: translateX(-100%); 
  }
  .sidebar.sidebar-open { 
    transform: translateX(0); 
    box-shadow: 4px 0 24px rgba(0,0,0,0.12); 
  }
  /* 恢复手机端的文字显示 */
  .logo-text, .nav-group-label, .storage-detail, .nav-item span:not(.nav-badge), .storage-header span { 
    display: block; 
  }
  .sidebar-close { display: flex; }
  .sidebar-logo { justify-content: flex-start; }
  .upload-btn :deep(span) { display: inline; }
  .upload-btn { width: 100% !important; padding: 0 16px !important; }
  .nav-item { justify-content: flex-start; }
}
</style>
