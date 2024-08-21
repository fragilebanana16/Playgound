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
            <v-btn @click="getVideos">Take action</v-btn>
          </v-col>
        </v-row>
      </v-alert>

      <main v-else>
        <!-- <div> 
          <video-player :playsinline="true" :options="playerOptions">
          </video-player>
        </div>

        <img src="/dev-api/profile/avatar/2024/08/03/无标题_20240803094337A001.png" width="200" />
        <img src="/dev-api/videos/123.png" width="200" />

        <div>static resoruce way</div>
        <video width="300" controls>
          <source src="/dev-api/videos/test.mp4">
        </video>

        <div>streaming way</div>
        <video width="600" controls>
          <source src="/dev-api/media/video/streaming/123">
        </video> -->

        <h3 class="headline font-weight-medium">Recommended</h3>
        <v-btn @click="getAllVideos">Take action</v-btn>
        <v-row>
          <v-col cols="12" sm="6" md="4" lg="3" v-for="(video, i) in loading ? 12 : videos" :key="i" class="mx-xs-auto">
            <v-skeleton-loader type="card-avatar" :loading="loading">
              <video-card :card="{ maxWidth: 350 }" :video="video" :channel="video.videoId"></video-card>
            </v-skeleton-loader>
          </v-col>

          <v-col class="text-center" v-if="videos.length === 0 && !loading">
            <p>No videos yet</p>
          </v-col>

          <v-col cols="12" sm="12" md="12" lg="12">
            <infinite-loading @infinite="getAllVideos">
              <div slot="spinner">
                <v-progress-circular indeterminate color="red"></v-progress-circular>
              </div>
              <div slot="no-results"></div>
              <span slot="no-more"></span>
              <div slot="error" slot-scope="{ trigger }">
                <v-alert prominent type="error">
                  <v-row align="center">
                    <v-col class="grow">
                      <div class="title">Error!</div>
                      <div>
                        Something went wrong, but don’t fret — let’s give it
                        another shot.
                      </div>
                    </v-col>
                    <v-col class="shrink">
                      <v-btn @click="trigger">Take action</v-btn>
                    </v-col>
                  </v-row>
                </v-alert>
              </div>
            </infinite-loading>
          </v-col>
        </v-row>
      </main>
    </v-container>
  </div>
</template>
  
<script>
import VideoCard from './components/VideoCard'
import { listVideo } from "@/api/system/video";
import { getVideos, getTest } from "@/api/media/video";
import InfiniteLoading from 'vue-infinite-loading'
import 'video.js/dist/video-js.css'
import { videoPlayer } from 'vue-video-player'

export default {
  name: "HomeVideo",
  components: {
    VideoCard,
    videoPlayer,
    InfiniteLoading
  },
  data: () => ({
    videos: [],
    loading: false,
    loaded: false,
    errored: false,
    page: 1,
    playerOptions: {
      height: 620,
      width: 1120,
      muted: false,
      language: 'en',
      playbackRates: [0.7, 1.0, 1.5, 2.0],
      sources: [{
        type: "video/mp4",
        src: ""
      }],
      // poster: "/static/images/author.jpg",
    }
  }),
  created() {
    // this.getAllVideos();
  },
  computed: {

  },
  methods: {
    async getAllVideos($state) {
      if (!this.loaded) {
        this.loading = true
      }

      const videos = await listVideo({
        pageNum: this.page,
        pageSize: 2,
        reasonable: false
      })
        .catch((err) => {
          console.log(err)
          this.errored = true
        })
        .finally(() => {
          this.loading = false
        })

      if (typeof videos === 'undefined') return
      if (videos.rows && videos.rows.length > 0) {
        this.page += 1
        this.videos.push(...videos.rows)
        $state.loaded()
        this.loaded = true
      } else {
        console.log('no more videos')
        $state.complete()
      }
    },

    dateFormatter(date) {
      return moment(date).fromNow()
    }
  },
};
</script>
<style >
.video-js .vjs-big-play-button {
  top: 50%;
  left: 50%;
  margin-left: -1.5em;
  margin-top: -1em
}
</style>
  