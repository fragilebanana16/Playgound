// src/hooks/usePlaceMarkers.ts
import * as Cesium from 'cesium'
import { ref } from 'vue'

export interface PlaceIndex {
  id: number
  key: string
  name: string
  lon: number
  lat: number
  cover?: string
}

export interface PlaceDetail {
  id: number
  name: string
  rating?: number
  reviewCount?: number
  tags?: string[]
  description?: string
  reviews?: any[]
  photos?: string[]
}

export function usePlaceMarkers(viewer: () => Cesium.Viewer | null, onSelect: (detail: PlaceDetail) => void) {
  const places = ref<PlaceIndex[]>([])
  const selectedKey = ref<string | null>(null)
  let clickHandler: Cesium.ScreenSpaceEventHandler | null = null

  // 加载索引并打点
  async function loadPlaces() {
    const v = viewer()
    if (!v) return

    const res = await fetch('/map/places-index.json')
    const data: PlaceIndex[] = await res.json()
    places.value = data

    data.forEach(place => addMarker(v, place))
    initClickHandler(v)
  }

  // 单个打点
  function addMarker(v: Cesium.Viewer, place: PlaceIndex) {
    v.entities.add({
      position: Cesium.Cartesian3.fromDegrees(place.lon, place.lat),
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString('#409EFF'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        scaleByDistance: new Cesium.NearFarScalar(500, 1.5, 500000, 0.4),
      },
      label: {
        text: place.name,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        scaleByDistance: new Cesium.NearFarScalar(500, 1.2, 500000, 0.6),
      },
      properties: new Cesium.PropertyBag({ key: place.key, name: place.name }),
    })
  }

  // 点击监听
  function initClickHandler(v: Cesium.Viewer) {
    clickHandler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas)
    clickHandler.setInputAction(
      async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = v.scene.pick(click.position)
        if (!picked?.id?.properties) return

        const key = picked.id.properties.key?.getValue()
        if (!key) return

        // 同一个点再点一次取消选中
        if (selectedKey.value === key) {
          selectedKey.value = null
          return
        }

        selectedKey.value = key

        const res = await fetch(`/map/places/${key}.json`)
        const detail: PlaceDetail = await res.json()
        onSelect(detail)
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )
  }

  // 清理
  function disposePlaceMarkers() {
    clickHandler?.destroy()
    clickHandler = null
  }

  return {
    places,
    selectedKey,
    loadPlaces,
    disposePlaceMarkers,
  }
}