<template>
  <div style="display: flex; align-items: center; justify-content: center">
    <!-- <div>
      <video width="600" controls :src="currentWatchingUrl"></video>
    </div> -->

    <video-player :playsinline="true" :options="playerOptions">
    </video-player>
  </div>
</template>
  
<script>
import { getVideo } from "@/api/system/video";
import { videoPlayer } from 'vue-video-player'
import 'video.js/dist/video-js.css'
const streamingPrefix = '/dev-api/media/video/streaming/'
export default {
  name: "Watch",
  components: {
    videoPlayer
  },
  data: () => ({
    currentWatchingUrl: '',
    playerOptions: {
      height: 620,
      width: 1120,
      muted: false,
      language: 'en',
      playbackRates: [0.7, 1.0, 1.5, 2.0],
      sources: [{
        type: "video/mp4",
        src: "" // /dev-api/media/video/streaming/恶搞之家.Family.Guy.S01E02.mp4
      }],
      // poster: "/static/images/author.jpg",
    }
  }),
  created() {

  },
  mounted: function () {
    const videoId = this.$route.query && this.$route.query.videoId;
    debugger
    if (videoId) {
      console.log(videoId)
      getVideo(videoId).then(response => {
        console.log("Watching:" + response.data.url)
        this.currentWatchingUrl = streamingPrefix + response.data.url
        this.playerOptions.sources[0].src = streamingPrefix + response.data.url
      });
    }
  },
  computed: {

  },
  methods: {
  },
};
</script>

<style>
.video-js .vjs-big-play-button {
  top: 50%;
  left: 50%;
  margin-left: -1.5em;
  margin-top: -1em
}
</style>
  