<template>
  <div style="height:100vh; width:100vw">
    <!--  use-global-leaflet: github.com/vue-leaflet/vue-leaflet/issues/278 -->
    <LMap ref="map" :zoom="8" :center="[34.41322, 108.219482]" :use-global-leaflet="false">
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></LTileLayer>
    </LMap>
  </div>
    
</template>
<script>
// https://support.google.com/maps/answer/18539?hl=zh-Hans&co=GENIE.Platform%3DDesktop
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
export default {
  components: {
    LMap,
    LTileLayer,
  },
  data() {
    return {
    };
  },
};
</script>

<style></style>