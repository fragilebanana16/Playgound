<template>
  <div class="cesium-wrapper">
    <div ref="cesiumContainer" class="cesium-container" />

    <!-- 顶部居中搜索栏 -->
    <div class="top-search">
      <el-input
        v-model="searchText"
        placeholder="搜索地点..."
        size="small"
        clearable
        style="width:280px"
        @keyup.enter="doSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
        <template #suffix>
          <el-button text size="small" @click="doSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 右侧控件栏 -->
    <div class="map-controls">
      <!-- 视图切换 -->
      <div class="ctrl-group">
        <button class="ctrl-btn" :class="{ active: currentMode === '3D' }" title="3D 地球" @click="switchTo3D">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path d="M2 12h20"/>
          </svg>
        </button>
        <button class="ctrl-btn" :class="{ active: currentMode === '2D' }" title="2D 平面" @click="switchTo2D">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
          </svg>
        </button>
        <button class="ctrl-btn" :class="{ active: currentMode === 'CV' }" title="哥伦布视图" @click="switchToColumbus">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 20L12 4L22 20"/><path d="M5 14h14"/>
          </svg>
        </button>
      </div>

      <div class="ctrl-divider" />

      <!-- 图层选择 -->
      <el-popover placement="left" :width="185" trigger="click" popper-class="layer-popover">
        <template #reference>
          <button class="ctrl-btn" title="图层选择">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </button>
        </template>
        <div class="layer-panel">
        <div class="layer-panel-title">底图图层</div>
        <div v-for="layer in baseLayers" :key="layer.id" class="layer-item"
          :class="{ active: activeLayer === layer.id }" @click="switchLayer(layer)">
          <span class="layer-dot" :style="{ background: layer.color }" />
          {{ layer.name }}
          <el-icon v-if="activeLayer === layer.id" class="layer-check"><Check /></el-icon>
        </div>

        <div class="layer-divider" />
        <div class="layer-panel-title">地形</div>
        <div class="layer-item" :class="{ active: terrainEnabled }" @click="setTerrain(true)">
          <span class="layer-dot" style="background:#8B6914" />真实地形
          <el-icon v-if="terrainEnabled" class="layer-check"><Check /></el-icon>
        </div>
        <div class="layer-item" :class="{ active: !terrainEnabled }" @click="setTerrain(false)">
          <span class="layer-dot" style="background:#909399" />平面地形
          <el-icon v-if="!terrainEnabled" class="layer-check"><Check /></el-icon>
        </div>

        <!-- 新增叠加层 -->
        <div class="layer-divider" />
        <div class="layer-panel-title">叠加图层</div>
        <div
          v-for="overlay in overlayLayers"
          :key="overlay.id"
          class="layer-item"
          :class="{ active: activeOverlays.includes(overlay.id) }"
          @click="toggleOverlay(overlay)"
        >
          <span class="layer-dot" :style="{ background: overlay.color }" />
          {{ overlay.name }}
          <el-icon v-if="activeOverlays.includes(overlay.id)" class="layer-check"><Check /></el-icon>
        </div>
      </div>
      </el-popover>

      <div class="ctrl-divider" />

      <!-- 标点 -->
      <button class="ctrl-btn" :class="{ active: marking }" title="添加标点" @click="toggleMarking">
        <el-icon><Location /></el-icon>
      </button>

      <!-- 绘制道路 -->
      <button class="ctrl-btn" :class="{ active: drawingRoad }" title="绘制道路" @click="toggleRoadDrawing">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 17 C6 17 6 7 12 7 C18 7 18 17 21 17"/>
          <circle cx="3" cy="17" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
          <circle cx="21" cy="17" r="1.5" fill="currentColor"/>
        </svg>
      </button>

      <!-- 加载 GeoJSON 道路文件 -->
      <button class="ctrl-btn" title="加载 GeoJSON 道路文件" @click="triggerLoadJson">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </button>
      <input ref="jsonFileInput" type="file" accept=".json,.geojson"
        multiple style="display:none" @change="onJsonFilesSelected" />

      <!-- 框选飞行 -->
      <button class="ctrl-btn" :class="{ active: boxSelecting }" title="框选飞行" @click="toggleBoxSelect">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M3 9V5a2 2 0 0 1 2-2h4"/>
          <path d="M15 3h4a2 2 0 0 1 2 2v4"/>
          <path d="M21 15v4a2 2 0 0 1-2 2h-4"/>
          <path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
        </svg>
      </button>

      <!-- 清除所有 -->
      <button class="ctrl-btn danger" title="清除所有标记" @click="clearMarkers">
        <el-icon><Delete /></el-icon>
      </button>

      <div class="ctrl-divider" />

      <button class="ctrl-btn" title="回到默认视角" @click="resetCamera"><el-icon><Aim /></el-icon></button>
      <button class="ctrl-btn" title="放大" @click="zoomIn"><el-icon><ZoomIn /></el-icon></button>
      <button class="ctrl-btn" title="缩小" @click="zoomOut"><el-icon><ZoomOut /></el-icon></button>
    </div>

    <!-- 模式提示条 -->
    <Transition name="slide-down">
      <div v-if="marking" class="mode-hint">
        <el-icon><Location /></el-icon>
        点击地图添加标记点 &nbsp;·&nbsp;
        <span class="hint-cancel" @click="toggleMarking">退出</span>
      </div>
    </Transition>
    <Transition name="slide-down">
      <div v-if="drawingRoad" class="mode-hint road-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <path d="M3 17 C6 17 6 7 12 7 C18 7 18 17 21 17"/>
        </svg>
        左键添加节点 &nbsp;·&nbsp; 右键撤销 &nbsp;·&nbsp;
        <span class="hint-action" @click="finishRoad">完成</span> &nbsp;·&nbsp;
        <span class="hint-cancel" @click="cancelRoad">取消</span>
        <span v-if="roadPoints.length > 0" class="hint-badge">{{ roadPoints.length }} 节点</span>
      </div>
    </Transition>
    <Transition name="slide-down">
      <div v-if="boxSelecting" class="mode-hint box-hint">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
        </svg>
        按住左键拖拽框选，松开后飞行 &nbsp;·&nbsp;
        <span class="hint-cancel" @click="toggleBoxSelect">退出</span>
      </div>
    </Transition>

    <!-- 框选矩形遮罩 -->
    <div v-if="boxRect" class="box-select-rect" :style="{
      left: boxRect.left + 'px', top: boxRect.top + 'px',
      width: boxRect.width + 'px', height: boxRect.height + 'px',
    }" />

    <!-- 已加载道路列表（左下角） -->
    <Transition name="fade">
      <div v-if="loadedRoads.length > 0" class="road-list">
        <div class="road-list-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 17 C6 17 6 7 12 7 C18 7 18 17 21 17"/>
          </svg>
          道路图层 ({{ loadedRoads.length }})
        </div>
        <div
          v-for="road in loadedRoads" :key="road.id"
          class="road-list-item"
          :class="{ hidden: !road.visible }"
        >
          <span
            class="road-color-dot"
            :style="{ background: road.color }"
            @click="flyToRoad(road)"
            title="飞到此道路"
          />
          <span class="road-name" :title="road.name" @click="flyToRoad(road)">{{ road.name }}</span>
          <div class="road-actions">
            <button class="road-btn" :title="road.visible ? '隐藏' : '显示'" @click="toggleRoadVisible(road)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path v-if="road.visible" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle v-if="road.visible" cx="12" cy="12" r="3"/>
                <path v-if="!road.visible" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line v-if="!road.visible" x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
            <button class="road-btn danger-btn" title="删除" @click="removeRoad(road)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 坐标栏 -->
    <div class="coord-bar">
      <span v-if="hoverCoord">
        {{ hoverCoord.lon }}°E &nbsp; {{ hoverCoord.lat }}°N
      </span>
    </div>

    <!-- 保存道路弹窗 -->
    <el-dialog v-model="saveRoadDialog" title="保存道路" width="360px" :close-on-click-modal="false">
      <el-form label-width="80px" style="margin-top:8px">
        <el-form-item label="道路名称">
          <el-input v-model="roadName" placeholder="请输入道路名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="节点数量">
          <span style="font-size:13px;color:#909399">{{ pendingRoadPoints.length }} 个节点</span>
        </el-form-item>
        <el-form-item label="格式">
          <span style="font-size:13px;color:#909399">GeoJSON LineString</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveRoadDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRoad">
          <el-icon><Download /></el-icon>&nbsp;下载 GeoJSON
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { Search, Location, Delete, Aim, ZoomIn, ZoomOut, Check, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePlaceMarkers } from '@/hooks/map/usePlaceMarkers'
import { fetchGetPhotos, fetchPhotosByBbox  } from '@/api/media'

import { api as viewerApi } from 'v-viewer'
import { CustomDataSource } from 'cesium'
// ---- 类型 ----
interface BaseLayer { id: string; name: string; color: string }
interface HoverCoord { lon: string; lat: string; alt: string }
interface LonLat { lon: number; lat: number }
interface BoxRect { left: number; top: number; width: number; height: number }
interface LoadedRoad {
  id: string
  name: string
  color: string
  visible: boolean
  entity: Cesium.Entity
  points: LonLat[]
}


// ---- Cesium ----
const cesiumContainer = ref<HTMLDivElement | null>(null)
const jsonFileInput = ref<HTMLInputElement | null>(null)
let viewer: Cesium.Viewer | null = null
let markingHandler: Cesium.ScreenSpaceEventHandler | null = null
let roadHandler: Cesium.ScreenSpaceEventHandler | null = null
let moveHandler: Cesium.ScreenSpaceEventHandler | null = null
let boxHandler: Cesium.ScreenSpaceEventHandler | null = null
let clickHandler: Cesium.ScreenSpaceEventHandler | null = null // 缩略图点击
// ---- 状态 ----
const currentMode = ref<'3D' | '2D' | 'CV'>('3D')
const activeLayer = ref('osm')
const terrainEnabled = ref(false)
const marking = ref(false)
const searchText = ref('')
const hoverCoord = ref<HoverCoord | null>(null)

// 创建一个 DataSource 专门放标记
const photoDataSource = new Cesium.CustomDataSource('photos')


// 道路绘制
const drawingRoad = ref(false)
const roadPoints = ref<LonLat[]>([])
let roadPolylineEntity: Cesium.Entity | null = null
let roadNodeEntities: Cesium.Entity[] = []
let previewPolylineEntity: Cesium.Entity | null = null
let currentMousePos: LonLat | null = null

// 保存道路
const saveRoadDialog = ref(false)
const roadName = ref('')
const pendingRoadPoints = ref<LonLat[]>([])

// 加载道路
const loadedRoads = ref<LoadedRoad[]>([])
const roadColors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#9B59B6', '#1ABC9C', '#F39C12', '#E74C3C']
let colorIndex = 0

// 框选
const boxSelecting = ref(false)
const boxRect = ref<BoxRect | null>(null)
let boxStart: { x: number; y: number } | null = null
let pulseEntity: Cesium.Entity | null = null

// ---- 图层配置 ----
const baseLayers: BaseLayer[] = [
  { id: 'osm', name: '街道地图', color: '#4A90D9' },
  { id: 'satellite', name: '卫星影像', color: '#2ECC71' },
  { id: 'dark', name: '暗色地图', color: '#34495E' },
]
const emit = defineEmits<{ placeSelected: [detail: any] }>()
const { places, selectedKey, loadPlaces, disposePlaceMarkers } = usePlaceMarkers(
    () => viewer,
    (detail) => emit('placeSelected', detail)
)
async function initCluster(viewer){
  await viewer.dataSources.add(photoDataSource)
  // 开启聚合
  photoDataSource.clustering.enabled = true
  photoDataSource.clustering.pixelRange = 30    // 20px 内的点聚合
  photoDataSource.clustering.minimumClusterSize = 6  // 至少6个才聚合
  
  photoDataSource.clustering.clusterEvent.addEventListener(
      (clusteredEntities, cluster) => {
        cluster.point.show = false
        cluster.label.show = false
        cluster.billboard.show = true
    
        // 取第一个实体的缩略图
        const first = clusteredEntities[0]
        const pos = first.position?.getValue(Cesium.JulianDate.now())
        if (pos) {
          cluster.billboard.id = { isCluster: true, position: pos }
        }
        const photo = first.properties?.photo?.getValue(Cesium.JulianDate.now())
        cluster.billboard.scaleByDistance = new Cesium.NearFarScalar(
          1000,   // 距离 1000m 时
          1.0,    // 原始大小
          5000000, // 距离 500km 时
          0.3     // 缩小到 0.3
        )
        cluster.billboard.image = `${photo.thumbnailUrl}`
        cluster.billboard.width = 60
        cluster.billboard.height = 60
        cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY

        // 数量角标用 label 叠在右上角
        const count = clusteredEntities.length
        cluster.label.show = true
        cluster.label.text = String(count)
        cluster.label.font = 'bold 11px sans-serif'
        cluster.label.fillColor = Cesium.Color.WHITE
        cluster.label.outlineColor = Cesium.Color.BLACK
        cluster.label.outlineWidth = 2
        cluster.label.style = Cesium.LabelStyle.FILL_AND_OUTLINE
        cluster.label.showBackground = true
        cluster.label.backgroundColor = new Cesium.Color(0.2, 0.6, 1.0, 0.9)
        cluster.label.backgroundPadding = new Cesium.Cartesian2(4, 2)
        cluster.label.pixelOffset = new Cesium.Cartesian2(30, -50)
        cluster.label.horizontalOrigin = Cesium.HorizontalOrigin.LEFT
        cluster.label.scaleByDistance = new Cesium.NearFarScalar(1000, 1.0, 5000000, 0.3)
        cluster.label.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1000, 1.0, 5000000, 0.3)
        cluster.label.verticalOrigin = Cesium.VerticalOrigin.BOTTOM
        cluster.label.disableDepthTestDistance = Number.POSITIVE_INFINITY
      }
    )
}
// ================================================================
// 初始化
// ================================================================
onMounted(async () => {
  Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

  viewer = new Cesium.Viewer(cesiumContainer.value!, {
    baseLayerPicker: false, navigationHelpButton: false,
    animation: false, timeline: false, homeButton: false,
    sceneModePicker: false, geocoder: false, fullscreenButton: false,
    infoBox: false, selectionIndicator: false,
  })
  await initCluster(viewer);
  
  // 默认视角中国
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(104.0, 35.0, 5000000),
  })
  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.addImageryProvider(
    new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
  )
  viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  // 真实地形
  //Cesium.CesiumTerrainProvider.fromIonAssetId(1).then(terrain => {
  //  if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = terrain
  //})

  viewer.scene.screenSpaceCameraController.minimumZoomDistance = 100
  viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000

  moveHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  moveHandler.setInputAction((e: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    const cartesian = viewer!.camera.pickEllipsoid(e.endPosition)
    if (cartesian) {
      const carto = Cesium.Cartographic.fromCartesian(cartesian)
      const lon = Cesium.Math.toDegrees(carto.longitude)
      const lat = Cesium.Math.toDegrees(carto.latitude)
      hoverCoord.value = { lon: lon.toFixed(5), lat: lat.toFixed(5), alt: (carto.height / 1000).toFixed(1) }
      currentMousePos = { lon, lat }
      if (drawingRoad.value) updatePreviewLine()
    } else {
      hoverCoord.value = null
      currentMousePos = null
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  loadPlaces()
  // await loadPhotos()
  initClickHandler()
  
  viewer!.camera.moveEnd.addEventListener(async () => {
      const rect = viewer!.camera.computeViewRectangle()
      if (!rect) return

      const bbox = {
        west:  Cesium.Math.toDegrees(rect.west),
        east:  Cesium.Math.toDegrees(rect.east),
        south: Cesium.Math.toDegrees(rect.south),
        north: Cesium.Math.toDegrees(rect.north),
      }
      // 先清空
      photoDataSource.entities.removeAll()
      // 传当前视野范围给后端，只返回这个范围内的照片
      const photos = await fetchPhotosByBbox(bbox)
      photos.forEach(photo => addPhotoMarker(photo))
    })
})

onUnmounted(() => {
  markingHandler?.destroy(); roadHandler?.destroy()
  moveHandler?.destroy(); boxHandler?.destroy()
  clickHandler?.destroy();
  if (viewer && !viewer.isDestroyed()) viewer.destroy()
  if (pulseEntity) clearInterval((pulseEntity as any)._bounceHandle)
  disposePlaceMarkers()
})

// ================================================================
// 视图 / 图层 / 地形
// ================================================================
function switchTo3D() { currentMode.value = '3D'; viewer?.scene.morphTo3D(0.8) }
function switchTo2D() { currentMode.value = '2D'; viewer?.scene.morphTo2D(0.8) }
function switchToColumbus() { currentMode.value = 'CV'; viewer?.scene.morphToColumbusView(0.8) }


// 初始化 viewer 之后调一次
function initClickHandler() {
  if (!viewer || clickHandler) return  // 已经初始化过就跳过
  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {

  
    const picked = viewer!.scene.pick(click.position)
    if(!picked) return
    // 聚合点
    if (Cesium.defined(picked.primitive)) {
      const clusterId = picked.primitive.id
      if (clusterId?.isCluster) {
        const pos = clusterId.position  // Cartesian3
        const carto = Cesium.Cartographic.fromCartesian(pos)
        const currentHeight = viewer!.camera.positionCartographic.height

        viewer!.camera.flyTo({
          destination: Cesium.Cartesian3.fromRadians(
            carto.longitude,
            carto.latitude,
            currentHeight < 50000 ? currentHeight : 20000
          ),
          duration: 1.5
        })
      }
    }
    // 普通实体
    if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
      const props = picked.id.properties
      if (!props) return
        const curPhoto = props.photo?.getValue(Cesium.JulianDate.now())
        if (curPhoto) {
          viewerApi({
            images: [curPhoto.originalUrl],
            options: {
              toolbar: false,
              transition: false,
              navbar: false,
              title: (image: HTMLImageElement) => {
                  return `${curPhoto.filename} | ${curPhoto.shootTime} | ${curPhoto.location ?? ''}`
                }
            }
          })
        }
            
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}


function addPhotoMarker(photo: Api.Media.PhotoInfo) {
  if (!viewer) return
    
  // 用缩略图作为标点图标
  photoDataSource.entities.add({
    position: Cesium.Cartesian3.fromDegrees(
      photo.lng,
      photo.lat,
      photo.altitude + 10 ?? 0 // 加100防止钻到地里
    ),
    billboard: {
      image: `${photo.thumbnailUrl}`,
      width: 60,
      height: 60,
      // 圆形裁剪效果用 pixelOffset 配合
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      // 白色描边效果
      color: Cesium.Color.WHITE,
    },
    /*label: {
      text: photo.shootTime?.slice(2) ?? '',
      font: '11px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.TOP,
      pixelOffset: new Cesium.Cartesian2(0, 4),
      showBackground: true,
      backgroundColor: new Cesium.Color(0, 0, 0, 0.5),
    },*/
    // 存原始数据，点击时用
    properties: new Cesium.PropertyBag({ photo })
  })
}

async function loadPhotos() {
  try {
    const photos: Api.Media.PhotoInfo[] = await fetchGetPhotos()

    photos.forEach(photo => addPhotoMarker(photo))

    // 有数据时飞到第一个点
    if (photos.length > 0) {
      viewer?.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          photos[0].lng,
          photos[0].lat,
          5000
        ),
        duration: 2
      })
    }
  } catch (e) {
    console.error('加载图片数据失败', e)
  }
}

// 叠加层配置
const overlayLayers = [
  { id: 'osm-roads', name: '路网', color: '#E6A23C' },
  { id: 'place-labels', name: '地名标注', color: '#909399' },
]

const activeOverlays = ref<string[]>([])
const overlayImageryMap = new Map<string, Cesium.ImageryLayer>()

// 叠加层切换
async function toggleOverlay(overlay: { id: string }) {
  if (!viewer) return

  if (activeOverlays.value.includes(overlay.id)) {
    activeOverlays.value = activeOverlays.value.filter(id => id !== overlay.id)
    const layer = overlayImageryMap.get(overlay.id)
    if (layer) { viewer.imageryLayers.remove(layer); overlayImageryMap.delete(overlay.id) }
  } else {
    activeOverlays.value.push(overlay.id)
    let provider

    if (overlay.id === 'osm-roads') {
      provider = new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
    } else if (overlay.id === 'place-labels') {
      provider = new Cesium.OpenStreetMapImageryProvider({ url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_labels/' })
    }

    if (provider) {
      const imageryLayer = viewer.imageryLayers.addImageryProvider(provider)
      imageryLayer.alpha = overlay.id === 'osm-roads' ? 0.5 : 0.7
      overlayImageryMap.set(overlay.id, imageryLayer)
    }
  }
}

async function switchLayer(layer: BaseLayer) {
  if (!viewer) return
  activeLayer.value = layer.id
  viewer.imageryLayers.removeAll()
  if (layer.id === 'osm') {
    viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }))
  } else if (layer.id === 'satellite') {
    const p = await Cesium.IonImageryProvider.fromAssetId(2)
    viewer.imageryLayers.addImageryProvider(p)
  } else if (layer.id === 'dark') {
    viewer.imageryLayers.addImageryProvider(new Cesium.OpenStreetMapImageryProvider({ url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/' }))
  }
}

async function setTerrain(enable: boolean) {
  if (!viewer || terrainEnabled.value === enable) return
  terrainEnabled.value = enable
  if (enable) {
    const t = await Cesium.CesiumTerrainProvider.fromIonAssetId(1)
    if (viewer && !viewer.isDestroyed()) viewer.terrainProvider = t
  } else {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
  }
}

// ================================================================
// 模式互斥
// ================================================================
function stopAllModes() {
  if (marking.value) { markingHandler?.destroy(); markingHandler = null; marking.value = false }
  if (drawingRoad.value) cancelRoad()
  if (boxSelecting.value) stopBoxSelect()
}

// ================================================================
// 标点
// ================================================================
function toggleMarking() {
  if (marking.value) { markingHandler?.destroy(); markingHandler = null; marking.value = false; return }
  stopAllModes()
  marking.value = true
  markingHandler = new Cesium.ScreenSpaceEventHandler(viewer!.scene.canvas)
  markingHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const cartesian = viewer!.camera.pickEllipsoid(click.position)
    if (!cartesian) return
    const carto = Cesium.Cartographic.fromCartesian(cartesian)
    const lon = Cesium.Math.toDegrees(carto.longitude)
    const lat = Cesium.Math.toDegrees(carto.latitude)
    addPoint(lon, lat, `${lon.toFixed(4)}, ${lat.toFixed(4)}`)
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

function addPoint(lon: number, lat: number, label: string) {
  viewer?.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lon, lat),
    point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#409EFF'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    label: {
      text: label, font: '12px sans-serif',
      fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -14),
    }
  })
}

function clearMarkers() {
  viewer?.entities.removeAll()
  roadPoints.value = []
  roadNodeEntities = []
  roadPolylineEntity = null
  previewPolylineEntity = null
  loadedRoads.value = []
  ElMessage.success('已清除所有标记')
}



// ================================================================
// 道路绘制
// ================================================================
function toggleRoadDrawing() {
  if (drawingRoad.value) { cancelRoad(); return }
  stopAllModes()
  drawingRoad.value = true
  roadPoints.value = []

  roadHandler = new Cesium.ScreenSpaceEventHandler(viewer!.scene.canvas)
  roadHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const cartesian = viewer!.camera.pickEllipsoid(click.position)
    if (!cartesian) return
    const carto = Cesium.Cartographic.fromCartesian(cartesian)
    const lon = Cesium.Math.toDegrees(carto.longitude)
    const lat = Cesium.Math.toDegrees(carto.latitude)
    roadPoints.value.push({ lon, lat })
    addRoadNode(lon, lat, roadPoints.value.length)
    updateRoadPolyline()
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  roadHandler.setInputAction(() => {
    if (roadPoints.value.length === 0) return
    roadPoints.value.pop()
    const last = roadNodeEntities.pop()
    if (last) viewer?.entities.remove(last)
    updateRoadPolyline()
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

function addRoadNode(lon: number, lat: number, index: number) {
  const entity = viewer!.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lon, lat),
    point: { pixelSize: 8, color: Cesium.Color.fromCssColorString('#F56C6C'), outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
    label: {
      text: String(index), font: '11px sans-serif',
      fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, outlineWidth: 1,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -12),
    }
  })
  roadNodeEntities.push(entity)
}

function updateRoadPolyline() {
  if (!viewer) return
  if (roadPolylineEntity) { viewer.entities.remove(roadPolylineEntity); roadPolylineEntity = null }
  if (roadPoints.value.length < 2) return
  roadPolylineEntity = viewer.entities.add({
    polyline: {
      positions: roadPoints.value.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat)),
      width: 10,
      material: new Cesium.PolylineDashMaterialProperty({ color: Cesium.Color.fromCssColorString('#F56C6C'), dashLength: 16 }),
      clampToGround: true,
    }
  })
}

function updatePreviewLine() {
  if (!viewer || roadPoints.value.length === 0 || !currentMousePos) {
    if (previewPolylineEntity) { viewer?.entities.remove(previewPolylineEntity); previewPolylineEntity = null }
    return
  }
  const last = roadPoints.value[roadPoints.value.length - 1]
  const positions = [
    Cesium.Cartesian3.fromDegrees(last.lon, last.lat),
    Cesium.Cartesian3.fromDegrees(currentMousePos.lon, currentMousePos.lat),
  ]
  if (previewPolylineEntity) {
    ;(previewPolylineEntity.polyline!.positions as Cesium.ConstantProperty).setValue(positions)
  } else {
    previewPolylineEntity = viewer.entities.add({
      polyline: { positions, width: 10, material: Cesium.Color.fromCssColorString('#F56C6C').withAlpha(0.35), clampToGround: true }
    })
  }
}

function finishRoad() {
  if (roadPoints.value.length < 2) { ElMessage.warning('至少需要 2 个节点才能构成道路'); return }
  pendingRoadPoints.value = [...roadPoints.value]
  roadName.value = ''
  saveRoadDialog.value = true
}

function cancelRoad() {
  drawingRoad.value = false
  roadHandler?.destroy(); roadHandler = null
  roadNodeEntities.forEach(e => viewer?.entities.remove(e)); roadNodeEntities = []
  if (roadPolylineEntity) { viewer?.entities.remove(roadPolylineEntity); roadPolylineEntity = null }
  if (previewPolylineEntity) { viewer?.entities.remove(previewPolylineEntity); previewPolylineEntity = null }
  roadPoints.value = []
}

function saveRoad() {
  if (!roadName.value.trim()) { ElMessage.warning('请输入道路名称'); return }
  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: roadName.value.trim(), createdAt: new Date().toISOString(), nodeCount: pendingRoadPoints.value.length, stroke: '#409EFF', 'stroke-width': 3 },
      geometry: { type: 'LineString', coordinates: pendingRoadPoints.value.map(p => [p.lon, p.lat]) }
    }]
  }
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${roadName.value.trim()}.geojson`; a.click()
  URL.revokeObjectURL(url)

  const savedPoints = [...pendingRoadPoints.value]
  const color = roadColors[colorIndex++ % roadColors.length]
  cancelRoad()

  const entity = viewer!.entities.add({
    polyline: {
      positions: savedPoints.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat)),
      width: 10,
      material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.15, color: Cesium.Color.fromCssColorString(color) }),
      clampToGround: true,
    }
  })

  loadedRoads.value.push({
    id: Date.now().toString(),
    name: roadName.value.trim(),
    color,
    visible: true,
    entity,
    points: savedPoints,
  })

  saveRoadDialog.value = false
  ElMessage.success(`已保存：${roadName.value.trim()}.geojson`)
}

// ================================================================
// 加载 GeoJSON 文件
// ================================================================
function triggerLoadJson() {
  jsonFileInput.value?.click()
}

function onJsonFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (!files.length) return

  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const geojson = JSON.parse(ev.target?.result as string)
        renderGeoJsonRoads(geojson, file.name.replace(/\.(json|geojson)$/i, ''))
      } catch {
        ElMessage.error(`${file.name} 解析失败，请确认是有效的 GeoJSON`)
      }
    }
    reader.readAsText(file)
  })

  // 清空 input 以便重复选同一文件
  input.value = ''
}

function renderGeoJsonRoads(geojson: any, fileName: string) {
  if (!viewer) return
  const features = geojson.type === 'FeatureCollection'
    ? geojson.features
    : geojson.type === 'Feature'
      ? [geojson]
      : []

  let loaded = 0
  features.forEach((feature: any, i: number) => {
    const geom = feature.geometry
    if (!geom) return

    // 支持 LineString 和 MultiLineString
    const lineStrings: number[][][] = []
    if (geom.type === 'LineString') {
      lineStrings.push(geom.coordinates)
    } else if (geom.type === 'MultiLineString') {
      lineStrings.push(...geom.coordinates)
    } else {
      return // Point / Polygon 等跳过
    }

    lineStrings.forEach((coords, li) => {
      const points: LonLat[] = coords.map(([lon, lat]: number[]) => ({ lon, lat }))
      if (points.length < 2) return

      const color = roadColors[colorIndex++ % roadColors.length]
      const name = feature.properties?.name
        || (features.length === 1 ? fileName : `${fileName} #${i + 1}${lineStrings.length > 1 ? `-${li + 1}` : ''}`)

      const entity = viewer!.entities.add({
        polyline: {
          positions: points.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat)),
          width: 10,
          material: new Cesium.PolylineGlowMaterialProperty({ glowPower: 0.15, color: Cesium.Color.fromCssColorString(color) }),
          clampToGround: true,
        }
      })

      loadedRoads.value.push({ id: `${Date.now()}-${i}-${li}`, name, color, visible: true, entity, points })
      loaded++
    })
  })

  if (loaded > 0) {
    ElMessage.success(`成功加载 ${loaded} 条道路`)
    // 飞到第一条道路
    flyToRoad(loadedRoads.value[loadedRoads.value.length - loaded])
  } else {
    ElMessage.warning('未找到可渲染的 LineString 数据')
  }
}

function flyTo(lon: number, lat: number, height = 800) {
  // 移除上一个标注
  if (pulseEntity) {
    viewer?.entities.remove(pulseEntity)
    pulseEntity = null
  }

  viewer?.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    duration: 1.5,
    complete: () => {
      // 飞到后添加跳动图标
      pulseEntity = viewer!.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        billboard: {
          image: createPinSvg(),
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scale: 1.0,
          scaleByDistance: new Cesium.NearFarScalar(500, 1.5, 500000, 0.4),
        }
      })
      startBounce(pulseEntity)
    }
  })
}

function createPinSvg() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z" fill="#409EFF"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

function startBounce(entity: Cesium.Entity) {
  let t = 0
  const amplitude = 12
  const totalFrames = 60

  // 先初始化为 ConstantProperty
  entity.billboard!.pixelOffset = new Cesium.ConstantProperty(new Cesium.Cartesian2(0, 0))

  const handle = setInterval(() => {
    if (!entity || !viewer || viewer.isDestroyed()) {
      clearInterval(handle)
      return
    }
    t++
    const progress = t / totalFrames
    const offset = Math.abs(Math.sin(progress * Math.PI * 2)) * amplitude * (1 - progress)
    ;(entity.billboard!.pixelOffset as Cesium.ConstantProperty).setValue(
      new Cesium.Cartesian2(0, offset)  // ← 正数是往上
    )

    if (t >= totalFrames) {
      clearInterval(handle)
      ;(entity.billboard!.pixelOffset as Cesium.ConstantProperty).setValue(
        new Cesium.Cartesian2(0, 0)
      )
    }
  }, 16)

  ;(entity as any)._bounceHandle = handle
}

function clearPin() {
  if (pulseEntity) {
    clearInterval((pulseEntity as any)._bounceHandle)
    viewer?.entities.remove(pulseEntity)
    pulseEntity = null
  }
}


let rangeCircleEntity: Cesium.Entity | null = null

function showRangeCircle(radiusKm: number) {
  // 以当前视野中心为圆心
  const center = viewer!.camera.pickEllipsoid(
    new Cesium.Cartesian2(
      viewer!.canvas.clientWidth / 2,
      viewer!.canvas.clientHeight / 2
    )
  )
  if (!center) return

  if (rangeCircleEntity) viewer!.entities.remove(rangeCircleEntity)

  rangeCircleEntity = viewer!.entities.add({
    position: center,
    ellipse: {
      semiMajorAxis: radiusKm * 1000,
      semiMinorAxis: radiusKm * 1000,
      material: Cesium.Color.fromCssColorString('#FF0000').withAlpha(0.1),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    }
  })
}

function clearRangeCircle() {
  if (rangeCircleEntity) {
    viewer?.entities.remove(rangeCircleEntity)
    rangeCircleEntity = null
  }
}

// ================================================================
// 道路列表操作
// ================================================================
function flyToRoad(road: LoadedRoad) {
  if (!viewer || road.points.length === 0) return
  const lons = road.points.map(p => p.lon)
  const lats = road.points.map(p => p.lat)
  const padding = 0.02
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(
      Math.min(...lons) - padding,
      Math.min(...lats) - padding,
      Math.max(...lons) + padding,
      Math.max(...lats) + padding,
    ),
    duration: 1.2,
  })
}

function toggleRoadVisible(road: LoadedRoad) {
  road.visible = !road.visible
  road.entity.show = road.visible
}

function removeRoad(road: LoadedRoad) {
  viewer?.entities.remove(road.entity)
  const idx = loadedRoads.value.findIndex(r => r.id === road.id)
  if (idx !== -1) loadedRoads.value.splice(idx, 1)
}

// ================================================================
// 框选飞行
// ================================================================
function toggleBoxSelect() {
  if (boxSelecting.value) { stopBoxSelect(); return }
  stopAllModes()
  boxSelecting.value = true
  viewer!.scene.screenSpaceCameraController.enableRotate = false
  viewer!.scene.screenSpaceCameraController.enableTranslate = false
  viewer!.scene.screenSpaceCameraController.enableTilt = false

  boxHandler = new Cesium.ScreenSpaceEventHandler(viewer!.scene.canvas)

  boxHandler.setInputAction((e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    boxStart = { x: e.position.x, y: e.position.y }
    boxRect.value = { left: e.position.x, top: e.position.y, width: 0, height: 0 }
  }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

  boxHandler.setInputAction((e: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
    if (!boxStart) return
    boxRect.value = {
      left: Math.min(boxStart.x, e.endPosition.x),
      top: Math.min(boxStart.y, e.endPosition.y),
      width: Math.abs(e.endPosition.x - boxStart.x),
      height: Math.abs(e.endPosition.y - boxStart.y),
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

  boxHandler.setInputAction((_e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    if (!boxStart || !boxRect.value || boxRect.value.width < 10 || boxRect.value.height < 10) {
      boxRect.value = null; boxStart = null; return
    }
    const r = boxRect.value
    const p0 = viewer!.camera.pickEllipsoid(new Cesium.Cartesian2(r.left, r.top))
    const p1 = viewer!.camera.pickEllipsoid(new Cesium.Cartesian2(r.left + r.width, r.top + r.height))
    if (p0 && p1) {
      const c0 = Cesium.Cartographic.fromCartesian(p0)
      const c1 = Cesium.Cartographic.fromCartesian(p1)
      viewer!.camera.flyTo({
        destination: Cesium.Rectangle.fromRadians(
          Math.min(c0.longitude, c1.longitude), Math.min(c0.latitude, c1.latitude),
          Math.max(c0.longitude, c1.longitude), Math.max(c0.latitude, c1.latitude),
        ),
        duration: 1.2,
      })
    } else {
      ElMessage.warning('框选区域超出地球范围')
    }
    boxRect.value = null; boxStart = null
    stopBoxSelect()
  }, Cesium.ScreenSpaceEventType.LEFT_UP)
}

function stopBoxSelect() {
  boxSelecting.value = false; boxRect.value = null; boxStart = null
  boxHandler?.destroy(); boxHandler = null
  if (viewer && !viewer.isDestroyed()) {
    viewer.scene.screenSpaceCameraController.enableRotate = true
    viewer.scene.screenSpaceCameraController.enableTranslate = true
    viewer.scene.screenSpaceCameraController.enableTilt = true
  }
}

// ================================================================
// 相机 / 搜索
// ================================================================
function resetCamera() { viewer?.camera.flyHome(1.0) }
function zoomIn() { viewer?.camera.zoomIn(viewer.camera.positionCartographic.height * 0.4) }
function zoomOut() { viewer?.camera.zoomOut(viewer.camera.positionCartographic.height * 0.6) }

async function doSearch() {
  if (!searchText.value.trim()) return
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText.value)}&format=json&limit=1`)
    const data = await res.json()
    if (data.length > 0) {
      const { lon, lat, display_name } = data[0]
      viewer?.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat), 100000), duration: 1.5 })
      addPoint(parseFloat(lon), parseFloat(lat), display_name.split(',')[0])
      searchText.value = ''
    } else {
      ElMessage.warning('未找到该地点')
    }
  } catch {
    ElMessage.error('搜索失败，请重试')
  }
}

defineExpose({ addPoint, switchTo2D, switchTo3D, switchToColumbus, clearMarkers, renderGeoJsonRoads, flyTo, clearPin, showRangeCircle, clearRangeCircle })
</script>

<style scoped>
.cesium-wrapper { position: relative; width: 100%; height: 100%; }
.cesium-container { width: 100%; height: 100%; }

/* ---- 顶部搜索栏 ---- */
.top-search {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  padding: 5px 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.6);
}

/* ---- 右侧控件栏 ---- */
.map-controls {
  position: absolute;
  top: 16px; right: 16px;
  z-index: 100;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 10px; padding: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid rgba(255,255,255,0.6);
}
.ctrl-group { display: contents; }
.ctrl-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 6px;
  cursor: pointer; color: #606266;
  transition: background 0.15s, color 0.15s; font-size: 15px;
}
.ctrl-btn:hover { background: rgba(64,158,255,0.1); color: #409EFF; }
.ctrl-btn.active { background: rgba(64,158,255,0.15); color: #409EFF; }
.ctrl-btn.danger:hover { background: rgba(245,108,108,0.1); color: #F56C6C; }
.ctrl-divider { width: 20px; height: 1px; background: rgba(0,0,0,0.06); margin: 3px 0; }

/* ---- 模式提示条 ---- */
.mode-hint {
  position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
  background: rgba(64,158,255,0.92); backdrop-filter: blur(8px);
  color: white; padding: 7px 18px; border-radius: 999px;
  font-size: 13px; display: flex; align-items: center; gap: 6px;
  box-shadow: 0 4px 12px rgba(64,158,255,0.3); z-index: 101; white-space: nowrap;
}
.road-hint { background: rgba(245,108,108,0.92); box-shadow: 0 4px 12px rgba(245,108,108,0.3); }
.box-hint { background: rgba(103,194,58,0.92); box-shadow: 0 4px 12px rgba(103,194,58,0.3); }
.hint-cancel { cursor: pointer; text-decoration: underline; opacity: 0.85; }
.hint-cancel:hover { opacity: 1; }
.hint-action { cursor: pointer; font-weight: 500; background: rgba(255,255,255,0.25); padding: 1px 10px; border-radius: 999px; transition: background 0.15s; }
.hint-action:hover { background: rgba(255,255,255,0.4); }
.hint-badge { background: rgba(255,255,255,0.2); padding: 1px 8px; border-radius: 999px; font-size: 12px; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }

/* ---- 框选矩形 ---- */
.box-select-rect {
  position: absolute;
  border: 2px solid rgba(103,194,58,0.9);
  background: rgba(103,194,58,0.08);
  pointer-events: none; z-index: 99;
}

/* ---- 道路列表（左下角） ---- */
.road-list {
  position: absolute; bottom: 36px; left: 16px;
  z-index: 100; min-width: 200px; max-width: 260px; max-height: 240px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
  border-radius: 10px; padding: 8px 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12); border: 1px solid rgba(255,255,255,0.6);
  overflow-y: auto;
}
.road-list-header {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #909399; padding: 2px 6px 6px;
  letter-spacing: 0.05em;
}
.road-list-item {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 6px; border-radius: 6px;
  transition: background 0.15s;
}
.road-list-item:hover { background: rgba(0,0,0,0.04); }
.road-list-item.hidden { opacity: 0.45; }
.road-color-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  cursor: pointer; transition: transform 0.15s;
}
.road-color-dot:hover { transform: scale(1.3); }
.road-name {
  font-size: 12px; color: #303133; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: pointer;
}
.road-name:hover { color: #409EFF; }
.road-actions { display: flex; gap: 2px; flex-shrink: 0; }
.road-btn {
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: 4px;
  cursor: pointer; color: #909399; transition: background 0.15s, color 0.15s;
}
.road-btn:hover { background: rgba(64,158,255,0.1); color: #409EFF; }
.road-btn.danger-btn:hover { background: rgba(245,108,108,0.1); color: #F56C6C; }

/* ---- 坐标栏 ---- */
.coord-bar {
  position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  color: rgba(255,255,255,0.85); font-size: 11px; font-family: 'Courier New', monospace;
  padding: 4px 14px; border-radius: 999px;
  pointer-events: none; z-index: 100; white-space: nowrap; min-height: 22px;
}

/* ---- 图层面板 ---- */
:global(.layer-popover) { padding: 8px !important; }
.layer-panel-title { font-size: 11px; color: #909399; padding: 2px 6px 6px; letter-spacing: 0.05em; }
.layer-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 6px; cursor: pointer;
  font-size: 13px; color: #303133; transition: background 0.15s;
}
.layer-item:hover { background: rgba(64,158,255,0.08); }
.layer-item.active { background: rgba(64,158,255,0.1); color: #409EFF; font-weight: 500; }
.layer-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.layer-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 4px 0; }
.layer-check { margin-left: auto; font-size: 13px; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

:deep(.cesium-widget-credits) { display: none !important; }
</style>