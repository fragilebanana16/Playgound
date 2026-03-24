<template>
  <div class="flex backdrop-blur-lg  bg-white  flex-col shadow-xl w-full overflow-hidden rounded-lg" style="height: calc(100vh - 90px)">

    <!-- ══════════════════════════════ TOP NAV ══════════════════════════════ -->
    <header class="topbar">
      <div class="topbar-logo">
        <div class="logo-icon">
          <el-icon size="18" color="#fff"><Location /></el-icon>
        </div>
        <span class="logo-text">GeoVision</span>
      </div>

      <div class="topbar-actions">
        <el-tooltip content="路线规划" placement="bottom">
          <button class="action-btn" @click="activePanel = 'route'">
            <el-icon size="16"><Guide /></el-icon>
          </button>
        </el-tooltip>
        <el-tooltip content="收藏夹" placement="bottom">
          <button class="action-btn" @click="activePanel = 'saved'">
            <el-icon size="16"><Star /></el-icon>
          </button>
        </el-tooltip>
        <el-divider direction="vertical" style="height:18px;margin:0 4px;border-color:#e2e8f0" />
        <el-dropdown trigger="click">
          <div class="avatar-btn">
            <el-avatar :size="30" src="https://api.dicebear.com/7.x/shapes/svg?seed=geo" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>偏好设置</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- ══════════════════════════════ MAIN BODY ══════════════════════════════ -->
    <div class="main-body">

      <!-- 桌面端：折叠按钮，直接挂在 main-body 下，left 相对于 main-body 左边缘 -->
      <button
        v-if="!isMobile"
        class="collapse-btn-desktop"
        :style="{ left: sidebarCollapsed ? '0px' : '300px' }"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <el-icon size="13" :style="{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform .28s' }">
          <ArrowLeft />
        </el-icon>
      </button>

      <!-- ══════ MAP AREA ══════ -->
      <main class="map-area">
        <CesiumMap ref="mapRef" mode="3D" @place-selected="onPlaceSelected" />
        <!-- <slot name="map">
          <div class="map-placeholder">
            <el-icon size="52" color="rgba(0,0,0,0.06)"><MapLocation /></el-icon>
            <p style="color:rgba(0,0,0,0.1);font-size:13px;margin-top:12px;letter-spacing:.2em">地图区域</p>
          </div>
        </slot> -->
        <!-- Map Style Switcher -->
        <div class="map-style-switcher">
          <el-tooltip v-for="style in mapStyles" :key="style.key" :content="style.label" placement="left">
            <button :class="['map-style-btn', { active: activeMapStyle === style.key }]" @click="activeMapStyle = style.key">
              {{ style.icon }}
            </button>
          </el-tooltip>
        </div>

        <!-- POI Detail Card -->
        <Transition name="pop-up">
          <div v-if="activePoi" class="poi-detail-card">
            <button class="poi-detail-close" @click="activePoi = null">
              <el-icon size="14"><Close /></el-icon>
            </button>
            <div class="poi-detail-header">
              <div class="poi-detail-rank">{{ activePoi.id }}</div>
              <div>
                <div class="poi-detail-name">{{ activePoi.name }}</div>
                <div class="poi-detail-address">
                  <el-icon size="11"><Location /></el-icon> {{ activePoi.address }}
                </div>
              </div>
            </div>
            <div class="poi-detail-rating">
              <el-rate :model-value="activePoi.rating" disabled allow-half size="small" />
              <span style="color:#f59e0b;font-size:14px;font-weight:600;margin-left:4px">{{ activePoi.rating }}</span>
              <span style="color:#94a3b8;font-size:12px;margin-left:4px">({{ activePoi.reviews }}条)</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
              <el-button type="primary" size="small" style="flex:1">
                <el-icon><Guide /></el-icon>&nbsp;导航
              </el-button>
              <el-button size="small" style="flex:1">
                <el-icon><Star /></el-icon>&nbsp;收藏
              </el-button>
              <el-button size="small">
                <el-icon><Share /></el-icon>
              </el-button>
            </div>
          </div>
        </Transition>
      </main>

      <!-- ══════ LEFT SIDEBAR（桌面）/ BOTTOM DRAWER（移动）══════ -->
      <aside
        ref="sidebarRef"
        :class="['left-sidebar', { 'collapsed': sidebarCollapsed, 'is-dragging': isDragging }]"
        :style="drawerStyle"
      >
        <!-- 移动端：顶部拖拽把手 -->
        <div
          v-if="isMobile"
          class="drawer-handle"
          @click="sidebarCollapsed = !sidebarCollapsed"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <span class="handle-bar"></span>
        </div>

        <div class="sidebar-inner">
          <!-- Category Grid -->
          <div class="sidebar-section">
            <p class="section-label">分类浏览</p>
            <div class="category-grid">
              <button
                v-for="cat in categories" :key="cat.key"
                :class="['cat-chip', { active: activeCategory === cat.key }]"
                @click="activeCategory = cat.key"
              >
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-name">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Filters -->
          <div class="sidebar-section border-t-divider">
            <div class="flex items-center justify-between mb-2">
              <p class="section-label" style="margin-bottom:0">筛选条件</p>
              <button class="reset-btn" @click="resetFilters">重置</button>
            </div>
            <div class="filter-row">
              <span class="filter-label">距离</span>
              <el-slider v-model="filterDistance" :min="0.5" :max="50" :step="0.5" size="small" class="flex-1 mx-3" />
              <span class="filter-value">{{ filterDistance }}km</span>
            </div>
            <div class="filter-row mt-2">
              <span class="filter-label">评分</span>
              <el-rate v-model="filterRating" size="small" class="flex-1 ml-2" allow-half />
            </div>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <el-tag
                v-for="tag in filterTags" :key="tag"
                :type="activeFilterTags.includes(tag) ? 'primary' : 'info'"
                size="small"
                :effect="activeFilterTags.includes(tag) ? 'light' : 'plain'"
                class="cursor-pointer select-none"
                style="border-radius:999px"
                @click="toggleFilterTag(tag)"
              >{{ tag }}</el-tag>
            </div>
          </div>

          <!-- Photo Gallery -->
          <div class="sidebar-section border-t-divider">
            <div class="flex items-center justify-between mb-2">
              <p class="section-label" style="margin-bottom:0">实景图片</p>
              <button class="reset-btn" @click="activePhoto = null">全部</button>
            </div>
            <!-- 大图预览 -->
            <Transition name="pop-up">
              <div v-if="activePhoto" class="photo-preview">
                <img :src="activePhoto.url" :alt="activePhoto.label" class="photo-preview-img" />
                <div class="photo-preview-bar">
                  <span class="photo-preview-label">{{ activePhoto.label }}</span>
                  <button class="photo-preview-close" @click.stop="activePhoto = null">
                    <el-icon size="12" @click="onPhotoCloseClick"><Close /></el-icon>
                  </button>
                </div>
              </div>
            </Transition>
            <!-- 缩略图网格 -->
            <div class="photo-grid">
              <div
                v-for="photo in photos" :key="photo.id"
                :class="['photo-thumb', { active: activePhoto?.id === photo.id }]"
                @click="onPhotoClick(photo)"
              >
                <img :src="photo.url" :alt="photo.label" />
                <div class="photo-thumb-overlay">
                  <span>{{ photo.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- POI List -->
          <div class="sidebar-section border-t-divider">
            <div class="flex items-center justify-between mb-2">
              <p class="section-label" style="margin-bottom:0">附近地点</p>
              <span class="count-badge">{{ poiList.length }} 个</span>
            </div>
            <div class="sort-bar">
              <button
                v-for="s in sortOptions" :key="s.key"
                :class="['sort-btn', { active: sortBy === s.key }]"
                @click="sortBy = s.key"
              >{{ s.label }}</button>
            </div>
            <div class="poi-list-static">
              <div
                v-for="poi in sortedPois" :key="poi.id"
                :class="['poi-item', { active: activePoi?.id === poi.id }]"
                @click="activePoi = poi"
              >
                <div class="poi-rank">{{ poi.id }}</div>
                <div class="poi-info">
                  <div class="poi-name">{{ poi.name }}</div>
                  <div class="poi-meta">
                    <el-icon size="11"><Location /></el-icon>
                    <span>{{ poi.address }}</span>
                  </div>
                  <div class="poi-tags-row">
                    <el-tag v-for="t in poi.tags" :key="t" size="small" effect="plain" type="info"
                      style="border-radius:999px;padding:0 6px;font-size:10px">{{ t }}</el-tag>
                  </div>
                </div>
                <div class="poi-stats">
                  <div class="poi-rating">
                    <el-icon size="11" color="#f59e0b"><StarFilled /></el-icon>
                    <span>{{ poi.rating }}</span>
                  </div>
                  <div class="poi-dist">{{ poi.dist }}km</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Layer Controls -->
          <div class="sidebar-section border-t-divider">
            <div class="flex items-center justify-between mb-2 cursor-pointer select-none"
              @click="layerPanelOpen = !layerPanelOpen">
              <p class="section-label flex items-center gap-1.5" style="margin-bottom:0">
                <el-icon size="12"><Grid /></el-icon> 图层控制
              </p>
              <el-icon size="13" :style="{ transform: layerPanelOpen ? 'rotate(180deg)' : '', transition:'transform .2s' }">
                <ArrowDown />
              </el-icon>
            </div>
            <Transition name="slide-down">
              <div v-show="layerPanelOpen" class="layer-list">
                <div v-for="layer in mapLayers" :key="layer.key" class="layer-item">
                  <div class="flex items-center gap-2">
                    <span class="layer-dot" :style="{ background: layer.color }"></span>
                    <span class="layer-name">{{ layer.name }}</span>
                  </div>
                  <el-switch v-model="layer.enabled" size="small" inline-prompt active-text="开" inactive-text="关" />
                </div>
              </div>
            </Transition>
          </div>

          <!-- Mini Stats -->
          <div class="sidebar-section border-t-divider">
            <div class="stats-grid">
              <div v-for="stat in miniStats" :key="stat.label" class="stat-card">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import {
  Location, Search, Guide, Star, StarFilled,
  ArrowLeft, ArrowDown, Grid, Plus, Minus,
  Close, MapLocation, Share
} from '@element-plus/icons-vue'
import CesiumMap from './modules/cesiumMap.vue'

const mapRef = ref(null)

function addPhoto() {
  // 从图片 EXIF 读取的 GPS 坐标
  mapRef.value.addPoint(116.39, 39.91, '北京故宫')
}

function onPlaceSelected(detail) {
  console.log(`output->detail`,detail)
 // sidebarData.value = detail
}
// ── 响应式断点 ───────────────────────────────
const bp       = useBreakpoints(breakpointsTailwind)
const isMobile = bp.smaller('md')   // < 768px

// ── Sidebar 状态 ─────────────────────────────
const sidebarCollapsed = ref(false)
const sidebarRef       = ref(null)
const activePanel      = ref('explore')
const layerPanelOpen   = ref(true)

// ── 移动端抽屉拖拽 ───────────────────────────
const DRAWER_VH   = 0.65                          // 抽屉展开高度 65vh
const HANDLE_H    = 44                            // 把手高度 px
const isDragging  = ref(false)
const dragY       = ref(null)                     // null = 用 class 控制；有值 = 拖拽中
let   _startY     = 0
let   _startDragY = 0

const collapsedTranslate = () =>
  window.innerHeight * DRAWER_VH - HANDLE_H       // 收起时 translateY

// aside 的动态 style：拖拽中用精确 translateY，否则交给 CSS class
const drawerStyle = computed(() => {
  if (!isMobile.value) return {}
  if (dragY.value !== null) {
    return { transform: `translateY(${dragY.value}px)`, transition: 'none' }
  }
  return {}
})

function onPhotoCloseClick(){
  activePhoto.value = null
  mapRef.value?.clearPin()
}

function onPhotoClick(photo) {
  if (activePhoto.value?.id === photo.id) {
    activePhoto.value = null
  } else {
    activePhoto.value = photo
    mapRef.value?.flyTo(photo.lon, photo.lat)
  }
}

const onTouchStart = (e) => {
  if (!isMobile.value) return
  _startY     = e.touches[0].clientY
  _startDragY = sidebarCollapsed.value ? collapsedTranslate() : 0
  isDragging.value = true
  dragY.value      = _startDragY
}
const onTouchMove = (e) => {
  if (!isDragging.value) return
  const delta = e.touches[0].clientY - _startY
  const next  = Math.max(0, Math.min(collapsedTranslate(), _startDragY + delta))
  dragY.value = next
}
const onTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  // 超过一半就收起，否则展开
  sidebarCollapsed.value = dragY.value > collapsedTranslate() / 2
  dragY.value = null    // 还给 CSS class 控制
}

// ── 搜索 ─────────────────────────────────────
const globalSearch   = ref('')
const activeCategory = ref('all')

const categories = [
  { key: 'all',      icon: '🗺️', name: '全部'  },
  { key: 'food',     icon: '🍜', name: '餐饮'  },
  { key: 'hotel',    icon: '🏨', name: '住宿'  },
  { key: 'shop',     icon: '🛍️', name: '购物'  },
  { key: 'park',     icon: '🌲', name: '公园'  },
  { key: 'transit',  icon: '🚇', name: '交通'  },
  { key: 'hospital', icon: '🏥', name: '医疗'  },
  { key: 'edu',      icon: '🎓', name: '教育'  },
]

const filterDistance   = ref(5)
const filterRating     = ref(3.5)
const filterTags       = ['营业中', '可预约', '免费停车', 'Wi-Fi', '支持外卖', '24小时']
const activeFilterTags = ref(['营业中'])


watch(filterDistance, (val) => {
  if (val) {
    mapRef.value?.showRangeCircle(val)
  } else {
    mapRef.value?.clearRangeCircle()
  }
})

const toggleFilterTag = (tag) => {
  const idx = activeFilterTags.value.indexOf(tag)
  idx === -1 ? activeFilterTags.value.push(tag) : activeFilterTags.value.splice(idx, 1)
}
const resetFilters = () => {
  filterDistance.value = 5; filterRating.value = 3.5; activeFilterTags.value = ['营业中']
}

const sortBy = ref('rating')
const sortOptions = [
  { key: 'rating', label: '评分' },
  { key: 'dist',   label: '距离' },
  { key: 'hot',    label: '热门' },
]

const activePoi = ref(null)
const poiList   = ref([
  { id: 1, name: '云海日料 · 旗舰店',     address: '建国路88号国贸大厦B1',   rating: 4.9, dist: 0.3, reviews: 2841,  tags: ['日料', '预约']  },
  { id: 2, name: '星穹精品酒店',           address: '朝阳区东三环中路9号',    rating: 4.8, dist: 0.7, reviews: 1203,  tags: ['住宿', '停车']  },
  { id: 3, name: '潮白河湿地公园',         address: '通州区潮白河北路',        rating: 4.7, dist: 1.2, reviews: 5621,  tags: ['公园', '免费']  },
  { id: 4, name: 'Blend Coffee Roasters',  address: '三里屯太古里南区S5-01',  rating: 4.6, dist: 1.5, reviews: 987,   tags: ['咖啡', 'Wi-Fi'] },
  { id: 5, name: '超级文和友 · 北京',      address: '东城区王府井大街88号',   rating: 4.5, dist: 2.1, reviews: 8834,  tags: ['餐饮', '热门']  },
  { id: 6, name: '798艺术区',              address: '朝阳区酒仙桥路4号',      rating: 4.8, dist: 3.0, reviews: 15432, tags: ['文化', '免费']  },
  { id: 7, name: '京深海鲜市场',           address: '丰台区大红门路甲58号',   rating: 4.3, dist: 4.2, reviews: 3201,  tags: ['海鲜', '24H']   },
])

const sortedPois = computed(() =>
  [...poiList.value].sort((a, b) => {
    if (sortBy.value === 'rating') return b.rating - a.rating
    if (sortBy.value === 'dist')   return a.dist - b.dist
    return b.reviews - a.reviews
  })
)

const mapLayers = reactive([
  { key: 'traffic',   name: '实时路况', color: '#ef4444', enabled: true  },
  { key: 'transit',   name: '公共交通', color: '#3b82f6', enabled: true  },
  { key: 'satellite', name: '卫星影像', color: '#22c55e', enabled: false },
  { key: 'terrain',   name: '地形起伏', color: '#f59e0b', enabled: false },
  { key: 'poi',       name: 'POI 标注', color: '#a855f7', enabled: true  },
  { key: 'heatmap',   name: '热力分布', color: '#ec4899', enabled: false },
])

const activeMapStyle = ref('standard')
const mapStyles = [
  { key: 'standard',  label: '标准', icon: '🗺' },
  { key: 'satellite', label: '卫星', icon: '🛰' },
  { key: 'night',     label: '夜间', icon: '🌙' },
  { key: 'terrain',   label: '地形', icon: '⛰' },
]

// ── 图片展示 ─────────────────────────────────
const activePhoto = ref(null)
const photos = [
  { id: 1, label: '国贸夜景',   url: 'https://picsum.photos/seed/map1/400/260', lon: 116.4615, lat: 39.9093 },
  { id: 2, label: '三里屯街景', url: 'https://picsum.photos/seed/map2/400/260', lon: 116.4551, lat: 39.9373 },
  { id: 3, label: '公园绿道',   url: 'https://picsum.photos/seed/map3/400/260', lon: 116.3912, lat: 39.9828 },
  { id: 4, label: '美食广场',   url: 'https://picsum.photos/seed/map4/400/260', lon: 116.4074, lat: 39.9042 },
  { id: 5, label: '798艺术区',  url: 'https://picsum.photos/seed/map5/400/260', lon: 116.4997, lat: 39.9842 },
  { id: 6, label: '湿地清晨',   url: 'https://picsum.photos/seed/map6/400/260', lon: 116.6687, lat: 39.9952 },
]

const miniStats = [
  { value: '2,847', label: '附近地点' },
  { value: '156',   label: '收藏地点' },
  { value: '38',    label: '游览记录' },
  { value: '4.7★',  label: '平均评分' },
]


</script>

<style scoped>
/* ════════════════════ ROOT ════════════════════ */
.map-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f0f4f8;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
}

/* ════════════════════ TOPBAR ════════════════════ */
.topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 0 16px; height: 54px;
  background: #ffffff; border-bottom: 1px solid #e8ecf0;
  flex-shrink: 0; z-index: 50;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.topbar-logo { display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
.logo-icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  box-shadow: 0 2px 8px rgba(37,99,235,0.35);
}
.logo-text { font-weight: 700; font-size: 15px; letter-spacing: .1em; color: #1e293b; }
@media (max-width: 480px) { .logo-text { display: none; } }

:deep(.global-search-input .el-input__wrapper) {
  background: #f8fafc !important;
  box-shadow: 0 0 0 1px #e2e8f0 !important;
  border-radius: 10px !important; transition: box-shadow .2s;
}
:deep(.global-search-input .el-input__wrapper:hover),
:deep(.global-search-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #bfdbfe !important; background: #fff !important;
}
:deep(.global-search-input .el-input__inner) { color: #1e293b; font-size: 13px; }
.search-kbd {
  font-size: 11px; padding: 1px 6px; border-radius: 5px;
  background: #f1f5f9; border: 1px solid #e2e8f0; color: #94a3b8; font-family: monospace;
}
.topbar-actions { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.action-btn {
  width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; background: #f8fafc; border: 1px solid #e8ecf0;
  cursor: pointer; transition: all .18s;
}
.action-btn:hover { color: #2563eb; background: #eff6ff; border-color: #bfdbfe; }
.avatar-btn { cursor: pointer; border-radius: 50%; display: flex; }
.avatar-btn:hover :deep(.el-avatar) { outline: 2px solid #93c5fd; }

/* ════════════════════ MAIN BODY ════════════════════ */
.main-body {
  display: flex; flex: 1;
  position: relative;
  overflow: hidden;
}

@media (max-width: 767px) {
  /* 移动端 main-body 不能 overflow:hidden，否则抽屉圆角被裁 */
  .main-body {
    overflow: visible;
  }
}

/* ════════════════════ MAP AREA ════════════════════ */
/* 桌面：flex item，宽度自动填满剩余空间 */
.map-area {
  flex: 1;
  position: relative;
  overflow: hidden;   /* 地图区自己裁切内容，不依赖父级 overflow */
  background: #e8edf2;
  width: 100%;
  height: 100%;
}
.map-placeholder {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}

/* ════════════════════ 桌面折叠按钮 ════════════════════ */
/* 挂在 .main-body(position:relative) 下，left 从 main-body 左边缘算起 */
.collapse-btn-desktop {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  transition: left .28s cubic-bezier(0.4,0,0.2,1), background .18s, color .18s;
  z-index: 40;
  width: 22px; height: 48px;
  border-radius: 0 8px 8px 0;
  display: flex; align-items: center; justify-content: center;
  background: #ffffff; border: 1px solid #e8ecf0; border-left: none;
  color: #64748b; cursor: pointer;
  box-shadow: 3px 0 8px rgba(0,0,0,0.08);
}
.collapse-btn-desktop:hover { background: #eff6ff; color: #2563eb; }

/* Map Style Switcher */
.map-style-switcher {
  position: absolute; right: 16px; top: 16px;
  display: flex; flex-direction: column; gap: 4px; z-index: 20;
}
.map-style-btn {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; cursor: pointer;
  background: rgba(255,255,255,0.95); border: 1px solid #e2e8f0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08); transition: all .18s;
}
.map-style-btn:hover  { border-color: #93c5fd; background: #eff6ff; }
.map-style-btn.active { border-color: #2563eb; background: #dbeafe; }

/* POI Detail Card */
.poi-detail-card {
  position: absolute; left: 16px; bottom: 16px; z-index: 20;
  width: 310px; padding: 16px; border-radius: 16px;
  background: rgba(255,255,255,0.98); border: 1px solid #e2e8f0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}
.poi-detail-close {
  position: absolute; top: 12px; right: 12px;
  width: 24px; height: 24px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8; background: #f1f5f9; border: none; cursor: pointer; transition: all .15s;
}
.poi-detail-close:hover { color: #1e293b; background: #e2e8f0; }
.poi-detail-header { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
.poi-detail-rank {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
}
.poi-detail-name    { font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.3; }
.poi-detail-address { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94a3b8; margin-top: 3px; }
.poi-detail-rating  { display: flex; align-items: center; margin-top: 6px; }

/* ════════════════════ SIDEBAR（桌面） ════════════════════ */
.left-sidebar {
  /* 桌面：左侧推拉 */
  width: 300px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e8ecf0;
  overflow: hidden;
  transition: width .28s cubic-bezier(0.4,0,0.2,1);
  z-index: 30;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  order: -1;   /* 确保在 map-area 左边 */
}
.left-sidebar.collapsed { width: 0; border-right: none; box-shadow: none; }

.sidebar-inner {
  width: 300px;
  height: 100%;
  /* 纯滚动容器，内容自然撑开，不再 flex 分配高度 */
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
.sidebar-inner::-webkit-scrollbar       { width: 4px; }
.sidebar-inner::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

/* ════════════════════ SIDEBAR（移动端 = 底部抽屉） ════════════════════ */
@media (max-width: 767px) {
  .left-sidebar {
    /* 脱离 flex 流，绝对定位到底部 */
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 65vh;
    width: calc(100% - 0px) !important;
    border-right: none;
    border-top: 1px solid #e8ecf0;
    border-radius: 18px 18px 0 0;
    box-shadow: 0 -6px 24px rgba(0,0,0,0.10);
    overflow: visible;          /* 让把手圆角不被裁切 */
    clip-path: none;            /* 确保不被父级 clip */
    /* 展开：translateY(0) */
    transform: translateY(0);
    transition: transform .32s cubic-bezier(0.4,0,0.2,1);
    z-index: 100;
    order: 0;
  }
  /* 收起：只露出把手 44px */
  .left-sidebar.collapsed {
    transform: translateY(calc(65vh - 44px));
  }
  /* 拖拽中关闭 transition，跟手 */
  .left-sidebar.is-dragging {
    transition: none !important;
  }

  .sidebar-inner {
    width: 100%;
    height: calc(65vh - 44px);
    padding-top: 0;
    margin-top: 44px;           /* 为顶部把手让出空间 */
  }

  /* 地图区全屏，抽屉浮在上方 */
  .map-area {
    position: absolute;
    inset: 0;
  }

  /* POI 详情卡移到上方，避免被抽屉遮住 */
  .poi-detail-card {
    left: 8px; right: 8px; width: auto;
    bottom: calc(65vh - 30px);
  }
}

/* ════════════════════ 拖拽把手 ════════════════════ */
.drawer-handle {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 44px;
  display: flex; align-items: center; justify-content: center;
  cursor: grab; background: #ffffff;
  border-radius: 18px 18px 0 0;
  border-bottom: 1px solid #f1f5f9;
  z-index: 1;
  user-select: none;
}
.drawer-handle:active { cursor: grabbing; }
.handle-bar {
  width: 40px; height: 4px; border-radius: 99px; background: #cbd5e1;
}

/* ════════════════════ SIDEBAR CONTENT ════════════════════ */
.sidebar-section   { padding: 10px 12px; }
.border-t-divider  { border-top: 1px solid #f1f5f9; }
.border-b-divider  { border-bottom: 1px solid #f1f5f9; }
.section-label {
  font-size: 10px; font-weight: 600; letter-spacing: .1em;
  color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block;
}
.reset-btn { font-size: 12px; color: #2563eb; background: none; border: none; cursor: pointer; padding: 0; }
.reset-btn:hover { color: #1d4ed8; text-decoration: underline; }
.count-badge { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 1px 8px; border-radius: 999px; }

.category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.cat-chip {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 8px 4px; border-radius: 10px; cursor: pointer;
  background: #f8fafc; border: 1px solid #e8edf2; transition: all .18s; user-select: none;
}
.cat-chip:hover  { background: #eff6ff; border-color: #bfdbfe; }
.cat-chip.active { background: #dbeafe; border-color: #93c5fd; }
.cat-icon { font-size: 16px; line-height: 1; }
.cat-name { font-size: 10px; color: #64748b; }
.cat-chip.active .cat-name { color: #1d4ed8; font-weight: 600; }

.filter-row   { display: flex; align-items: center; gap: 4px; }
.filter-label { font-size: 12px; color: #94a3b8; flex-shrink: 0; width: 28px; }
.filter-value { font-size: 12px; color: #2563eb; flex-shrink: 0; width: 42px; text-align: right; font-weight: 600; }

.sort-bar { display: flex; gap: 4px; margin-bottom: 8px; flex-shrink: 0; }
.sort-btn {
  padding: 4px 12px; border-radius: 7px; font-size: 12px;
  color: #94a3b8; background: #f1f5f9; border: none; cursor: pointer; transition: all .18s;
}
.sort-btn:hover  { color: #1e293b; background: #e8edf2; }
.sort-btn.active { color: #2563eb; background: #dbeafe; font-weight: 600; }


.poi-list-static {
  display: flex; flex-direction: column; gap: 4px;
}
.poi-item {
  display: flex; gap: 10px; padding: 10px; border-radius: 10px;
  cursor: pointer; transition: all .18s; align-items: flex-start;
  background: transparent; border: 1px solid transparent;
}
.poi-item:hover  { background: #f8fafc; border-color: #e8edf2; }
.poi-item.active { background: #eff6ff; border-color: #bfdbfe; }
.poi-rank {
  width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #2563eb; background: #dbeafe; margin-top: 2px;
}
.poi-item.active .poi-rank { background: #2563eb; color: #fff; }
.poi-info { flex: 1; min-width: 0; }
.poi-name { font-size: 13px; font-weight: 500; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.poi-meta { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; }
.poi-tags-row { display: flex; gap: 4px; margin-top: 5px; flex-wrap: wrap; }
.poi-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
.poi-rating { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #f59e0b; font-weight: 600; }
.poi-dist   { font-size: 11px; color: #94a3b8; }

.layer-list { display: flex; flex-direction: column; gap: 5px; margin-top: 4px; }
.layer-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 8px; background: #f8fafc;
  border: 1px solid #f1f5f9; transition: background .18s;
}
.layer-item:hover { background: #f1f5f9; }
.layer-dot  { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.layer-name { font-size: 12px; color: #475569; }

.stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 4px; }
.stat-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 4px; border-radius: 9px; background: #f8fafc; border: 1px solid #f1f5f9;
}
.stat-value { font-size: 13px; font-weight: 700; color: #2563eb; }
.stat-label { font-size: 9px; color: #94a3b8; margin-top: 2px; text-align: center; line-height: 1.3; }

/* ════════════════════ PHOTO GALLERY ════════════════════ */
.photo-preview {
  position: relative;
  width: 100%; height: 150px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
  background: #f1f5f9;
}
.photo-preview-img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.photo-preview-bar {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px;
  background: linear-gradient(to top, rgba(0,0,0,0.55), transparent);
}
.photo-preview-label { font-size: 11px; color: #fff; font-weight: 500; }
.photo-preview-close {
  width: 20px; height: 20px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.25); border: none; color: #fff; cursor: pointer;
}
.photo-preview-close:hover { background: rgba(255,255,255,0.45); }

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
}
.photo-thumb {
  position: relative; border-radius: 8px; overflow: hidden;
  aspect-ratio: 1 / 1; cursor: pointer;
  background: #f1f5f9;
  border: 2px solid transparent;
  transition: border-color .18s, transform .18s;
}
.photo-thumb:hover   { transform: scale(1.03); }
.photo-thumb.active  { border-color: #2563eb; }
.photo-thumb img {
  width: 100%; height: 100%;
  object-fit: cover; display: block;
}
.photo-thumb-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%);
  display: flex; align-items: flex-end; padding: 4px 5px;
  opacity: 0; transition: opacity .18s;
}
.photo-thumb:hover .photo-thumb-overlay,
.photo-thumb.active .photo-thumb-overlay { opacity: 1; }
.photo-thumb-overlay span { font-size: 9px; color: #fff; font-weight: 500; line-height: 1.2; }

/* ════════════════════ TRANSITIONS ════════════════════ */
.slide-down-enter-active,
.slide-down-leave-active { transition: all .22s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { max-height: 0; opacity: 0; }
.slide-down-enter-to, .slide-down-leave-from { max-height: 280px; opacity: 1; }

.pop-up-enter-active { transition: all .24s cubic-bezier(0.34,1.56,0.64,1); }
.pop-up-leave-active { transition: all .16s ease; }
.pop-up-enter-from   { opacity: 0; transform: translateY(14px) scale(0.95); }
.pop-up-leave-to     { opacity: 0; transform: translateY(6px); }
</style>