<template>
  <div class="h-screen relative">
    <GeoErrorModal v-if="geoError" :geoErrorMsg="geoErrorMsg" @closeGeoError="closeGeoError" />
    <MapFeatures :fetchCoords="fetchCoords" :coords="coords" @toggleSearchResults="toggleSearchResults"
      @getGeolocation="getGeolocation" @plotResult="plotResult" @removeResult="removeResult"
      :searchResults="searchResults" class="w-full md:w-auto absolute md:top-[40px] md:left-[60px] z-[2]" />
    <div id="mapid" class="h-full z-[1]"></div>
  </div>

</template>
<script>
// https://support.google.com/maps/answer/18539?hl=zh-Hans&co=GENIE.Platform%3DDesktop
// https://leafletjs.com/examples/quick-start/
// https://github.com/johnkomarnicki/express-vue3-tailwind-map/blob/main/client/src/views/HomeView.vue
// 如何查找经纬度https://support.google.com/maps/answer/18539?hl=zh-Hans&co=GENIE.Platform%3DDesktop&oco=1
import "leaflet/dist/leaflet.css";
import leaflet from "leaflet";
import { onMounted, ref } from "vue";
import GeoErrorModal from "./components/GeoErrorModal.vue";
import MapFeatures from "./components/MapFeatures.vue";

export default {
  components: { GeoErrorModal, MapFeatures },
  setup() {
    let map;
    onMounted(() => {
      // init map
      map = leaflet
        .map("mapid")
        .setView([51.505, -0.09], 13);

      // add tile layers
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

      map.on("moveend", () => {
        closeSearchResults();
        adjustMarkerSize();
      });

      map.on("zoomend", () => {
      });
      // get users location
      getGeolocation();

      plotLocations();
    });
    const coords = shallowRef(null);
    const fetchCoords = shallowRef(null);
    const geoMarker = shallowRef(null); // current location marker
    const geoError = shallowRef(null);
    const geoErrorMsg = shallowRef(null);
    const starLocations = shallowRef([
      { lat: 39.9042, lng: 116.4074, name: "Beijing" }, // 北京
      { lat: 31.2304, lng: 121.4737, name: "Shanghai" }, // 上海
      { lat: 23.1291, lng: 113.2644, name: "Guangzhou" }, // 广州
    ]);

    const plotLocations = () => {
      starLocations.value.forEach((location) => {
        const marker = leaflet
          .marker([location.lat, location.lng], { icon: createCustomMarker('yellow', 20) })
          .addTo(map);

        marker.bindPopup(`<b>${location.name}</b>`);
        // 保存 Marker 引用
        starLocations.marker = marker;
      });
    };

    const getGeolocation = () => {
      // if function is called, only run if we dont have coords
      if (!coords.value) {
        // check to see if we have coods in session sotrage
        if (sessionStorage.getItem("coords")) {
          coords.value = JSON.parse(sessionStorage.getItem("coords"));
          plotGeoLocation(coords.value);
          return;
        }

        // else get coords from geolocation API
        fetchCoords.value = true;
        navigator.geolocation.getCurrentPosition(setCoords, getLocError);
        return;
      }

      // otherwise, remove location
      coords.value = null;
      sessionStorage.removeItem("coords");
      map.removeLayer(geoMarker.value);
    };

    const setCoords = (pos) => {
      // stop fetching
      fetchCoords.value = null;

      // set coords in session storage
      const setSessionCoords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      sessionStorage.setItem("coords", JSON.stringify(setSessionCoords));

      // set ref coords value
      coords.value = setSessionCoords;

      plotGeoLocation(coords.value);
    };

    const getLocError = (error) => {
      // stop fetching coords
      fetchCoords.value = null;
      geoError.value = true;
      geoErrorMsg.value = error.message;
    };

    // Current location marker
    const plotGeoLocation = (coords) => {
      // create new marker with coords and custom marker
      geoMarker.value = leaflet
        .marker([coords.lat, coords.lng], { icon: createCustomMarker('red', 35) })
        .addTo(map);

      geoMarker.value.bindPopup("You are Here!").openPopup();

      // set map view to current location
      map.setView([coords.lat, coords.lng], 10);
    };

    const resultMarker = ref(null); // result marker
    const plotResult = (coords) => {
      // If there is already a marker, remove it. Only allow 1
      if (resultMarker.value) {
        map.removeLayer(resultMarker.value);
      }
      resultMarker.value = leaflet
        .marker([coords.coordinates[1], coords.coordinates[0]], { icon: createCustomMarker('blue', 35) })
        .addTo(map);
      map.setView([coords.coordinates[1], coords.coordinates[0]], 13);
    };

    const removeResult = () => {
      map.removeLayer(resultMarker.value);
    };

    const closeGeoError = () => {
      geoErrorMsg.value = null;
      geoError.value = null;
    };

    const searchResults = ref(null);
    const toggleSearchResults = () => {
      searchResults.value = !searchResults.value;
    };
    const closeSearchResults = () => {
      searchResults.value = null;
    };

    const adjustMarkerSize = () => {
      const zoomLevel = map.getZoom();
      let newSize;
      if (zoomLevel >= 15) {
        newSize = 50;
      } else if (zoomLevel >= 10) {
        newSize = 35;
      } else {
        newSize = 20;
      }
      // 更新当前定位的 Marker 大小
      if (geoMarker.value) {
        geoMarker.value.setIcon(createCustomMarker('red', newSize));
        if (geoMarker.value && map.hasLayer(geoMarker.value) && geoMarker.value.getPopup()) {
          geoMarker.value.getPopup().update(); // 更新 Popup 的位置
        }
      } 
      // 更新搜索结果的 Marker 大小
      if (resultMarker.value) {
        resultMarker.value.setIcon(createCustomMarker('blue', newSize));
      }
      if (starLocations.value) {
        // 更新 starLocations 的 Marker 大小
        starLocations.value.forEach((location) => {
          if (location.marker) {
            location.marker.setIcon(createCustomMarker('yellow', newSize - 10));
            if (location.marker && map.hasLayer(location.marker) && location.marker.getPopup()) {
              debugger
              location.marker.getPopup().update(); // 更新 Popup 的位置
            }
          }
        });
      }
    }

    const createCustomMarker = (type, size) => {
      let url = null;
      switch (type) {
        case 'red': url = new URL('@/assets/icons/svg/map-marker-red.svg', import.meta.url).href;
          break;
        case 'blue': url = new URL('@/assets/icons/svg/map-marker-blue.svg', import.meta.url).href;
          break;
        case 'yellow': url = new URL('@/assets/icons/svg/star-yellow.svg', import.meta.url).href;
          break;
      }
      return leaflet.icon({
        iconUrl: url,
        iconSize: [size, size],
      });
    };
    return {
      geoError,
      closeGeoError,
      geoErrorMsg,
      fetchCoords,
      coords,
      getGeolocation,
      plotResult,
      searchResults,
      toggleSearchResults,
      closeSearchResults,
      removeResult,
    };
  },
};
</script>
<style></style>