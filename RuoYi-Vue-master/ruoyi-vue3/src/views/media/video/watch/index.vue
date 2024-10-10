<template>
  <div class="flex flex-col items-center mt-12 ">
    <div class="">
      <!-- <div>
        <video width="600" controls :src="currentWatchingUrl"></video>
      </div> -->
      <video-player controls :src="currentWatchingUrl"/>
    </div>

    <div class="relative overflow-hidden flex cursor-pointer  rounded-lg shadow-md shadow-black my-4 w-[60vw]">
                        <v-img :src="`${baseUrl}/videos/bat-man.jpg`" cover width="210" height="306"></v-img>
                        <div
                            class="bottom-0 left-0 right-0 h-34 bg-gradient-to-b from-black to-transparent p-4 text-white">
                            <h2 class="text-3xl font-bold truncate">{{ movie.title }}</h2>
                            <p class="text-sm line-clamp-1 mt-2">{{ movie.description }}</p>
                            <p class="text-sm mt-2">评分: {{ movie.rating }} | {{ movie.duration }}</p>
                        </div>
                    </div>
    </div>
    <!-- <audio controls :src="baseUrl + streamingPrefix + 'music/A Sky Full of Stars - Coldplay.mp3'"></audio> -->
</template>
  
<script setup>
import { getVideo } from "@/api/system/video";
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
const streamingPrefix = '/media/streaming/'
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const route = useRoute();
const movie = {
        title: "电影标题",
        description: "电影描述...",
        rating: "9/10",
        duration: 2023,
      }

const relatedMovies =  [
    {
        title: '电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1',
        description: '这是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '120 分钟',
        rating: '8.7/10',
        image: 'transformer-banner.jpg',
    },
    {
        title: '电影标题 2',
        description: '这是电影的描述 2是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'supergirl-banner.jpg',
    },
    {
        title: '电影标题 3',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'black-banner.png',
    },
]

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
.video-js {
    width: 60vw ;
    height: 72vh;
    border: 1px solid #ccc;
    border-radius: 0.3rem;
}

.video-js .vjs-big-play-button {
  top: 50%;
  left: 50%;
  margin-left: -1.5em;
  margin-top: -1em
}

</style>
  