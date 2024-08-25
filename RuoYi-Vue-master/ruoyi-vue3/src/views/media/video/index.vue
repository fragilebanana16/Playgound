<template>
    <div id="home" class="pa-4">
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
            <source :src="`${baseUrl}/media/video/streaming/test1.mp4`">
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
const streamingPrefix = '/media/video/streaming/'
const videos = ref([]);
const loading = ref(false)
const loaded = ref(false)
const errored = ref(false)
const page = ref(1)

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
</style>
    