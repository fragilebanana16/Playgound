<template>
  <div style="display: flex; align-items: center; justify-content: center">
    <!-- <div>
      <video width="600" controls :src="currentWatchingUrl"></video>
    </div> -->
    <video-player controls :src="currentWatchingUrl"/>
    <audio controls :src="baseUrl + streamingPrefix + 'music/A Sky Full of Stars - Coldplay.mp3'"></audio>
  </div>
</template>
  
<script setup>
import { getVideo } from "@/api/system/video";
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
const streamingPrefix = '/media/streaming/'
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const route = useRoute();

const currentWatchingUrl = ref('')

function initVideoFromRoute() {
  const videoId = route.query && route.query.videoId;
  if (videoId) {
    getVideo(videoId).then(response => {
      console.log("Watching:" + response.data.url)
      currentWatchingUrl.value = baseUrl + streamingPrefix + 'videos/' + response.data.url
    });
  }
}

initVideoFromRoute()
</script>

<style>
.video-js .vjs-big-play-button {
  top: 50%;
  left: 50%;
  margin-left: -1.5em;
  margin-top: -1em
}
</style>
  