<template>
    <div id="home" class="pa-4">
        <v-carousel height="100vh" cycle interval="20000" hide-delimiter-background>
            <template v-slot:prev="{ props }">
                <div @click="props.onClick" class="slider-arrow">
                    <v-icon size="40" icon="mdi-chevron-left"></v-icon>
                </div>
            </template>
            <template v-slot:next="{ props }">
                <div @click="props.onClick" class="slider-arrow">
                    <v-icon size="40" @click="props.onClick" icon="mdi-chevron-right"></v-icon>
                </div>

            </template>
            <v-carousel-item v-for="(slide, i) in slides" :key="i">
                <!-- <v-sheet
        :color="colors[i]"
        height="100%"
      >
        <div class="d-flex fill-height justify-center align-center">
          <div class="text-h2">
            {{ slide }} Slide
          </div>
        </div>
      </v-sheet> -->
                <!-- <img :src="`${baseUrl}/videos/123.png`" width="200" /> -->
                <!-- <img src="@/assets/images/transformer-banner.jpg" alt="dark" /> -->
                <v-img aspect-ratio="16/9" cover :src="`${baseUrl}/videos/${slide}`"></v-img>
            </v-carousel-item>
        </v-carousel>

        <v-container fluid>
            <v-alert prominent type="error" v-if="errored">
                <v-row align="center">
                    <v-col class="grow">
                        <div class="title">Error!</div>
                        <div>
                            Something went wrong, but don’t fret — let’s give it another shot.
                        </div>
                    </v-col>
                    <v-col class="shrink">
                        <v-btn @click="getAllVideos">Take action</v-btn>
                    </v-col>
                </v-row>
            </v-alert>

            <main v-else>
                <!-- <img :src="`${baseUrl}/videos/123.png`" width="200" />
  
          <div>static resoruce way</div>
          <video width="300" controls>
            <source :src="`${baseUrl}/videos/test1.mp4`">
          </video>
  
          <div>streaming way</div>
          <video width="600" controls>
            <source :src="`${baseUrl}/media/streaming/video/test1.mp4`">
          </video> -->
                <v-row>
                    <v-col cols="12" sm="6" md="4" lg="3" v-for="(video, i) in loading ? 12 : videos" :key="i"
                        class="mx-xs-auto">
                        <v-skeleton-loader type="card-avatar" :loading="loading">
                            <video-card :card="{ maxWidth: 350 }" :video="video" :channel="video.videoId"></video-card>
                        </v-skeleton-loader>
                    </v-col>

                    <v-col class="text-center" v-if="videos.length === 0 && !loading">
                        <p>No videos yet</p>
                    </v-col>

                    <v-col cols="12" sm="12" md="12" lg="12">
                        <InfiniteLoading @infinite="getAllVideos">
                            <template v-slot:complete>
                                end...
                            </template>
                        </InfiniteLoading>
                    </v-col>
                </v-row>
            </main>
        </v-container>
    </div>
</template>
    
<script setup>
import VideoCard from './components/VideoCard'
import { listVideo } from "@/api/system/video";
import { getVideos, getTest } from "@/api/media/video";
import InfiniteLoading from "v3-infinite-loading";
import "v3-infinite-loading/lib/style.css";
const baseUrl = import.meta.env.VITE_APP_BASE_API;
const streamingPrefix = '/media/streaming/videos'
const videos = ref([]);
const loading = ref(false)
const loaded = ref(false)
const errored = ref(false)
const page = ref(1)
const slides = ['transformer-banner.jpg', 'supergirl-banner.jpg', 'black-banner.png']
const colors = ['#ADD8E6', '#98FB98', '#F08080', '#FFA07A']
async function getAllVideos($state) {
    if (loading.value) {
        return
    }

    if (!loaded.value) {
        loading.value = true
    }

    const videosRsp = await listVideo({
        pageNum: page.value,
        pageSize: 2,
        reasonable: false
    })
        .catch((err) => {
            console.log(err)
            errored.value = true
        })
        .finally(() => {
            loading.value = false
        })

    if (typeof videosRsp === 'undefined') return
    if (videosRsp.rows && videosRsp.rows.length > 0) {
        page.value += 1
        videos.value.push(...videosRsp.rows)
        if ($state) {
            $state.loaded()

        }
        loaded.value = true
    } else {
        console.log('no more videos')
        if ($state) {

            $state.complete()
        }

    }
}

//
//   import InfiniteLoading from 'vue-infinite-loading'
//   import 'video.js/dist/video-js.css'
//   import { videoPlayer } from 'vue-video-player'

</script>
<style >
.video-js .vjs-big-play-button {
    top: 50%;
    left: 50%;
    margin-left: -1.5em;
    margin-top: -1em
}

.slider-arrow {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 2rem;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}
</style>
    