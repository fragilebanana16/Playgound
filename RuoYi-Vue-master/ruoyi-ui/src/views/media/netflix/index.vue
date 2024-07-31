<template>
  <div id="home" class="pa-4">
    <v-container fluid>
      <v-alert prominent type="error" v-if="false">
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
        <h3 class="headline font-weight-medium">Recommended</h3>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
            lg="3"
            v-for="(video, i) in false ? 12 : 12"
            :key="i"
            class="mx-xs-auto"
          >
            <v-skeleton-loader type="card-avatar" :loading="false">
              <video-card
                :card="{ maxWidth: 350 }"
                :video="video"
                :channel="video.userId"
              ></video-card>
            </v-skeleton-loader>
          </v-col>
        </v-row>
      </main>
    </v-container>
  </div>
</template>
  
  <script>
  import VideoCard from '../netflix/components/VideoCard'
  export default {
    name: "newmmwmw",
    components: {
        VideoCard,
    }
  };
  </script>
  <style scoped>

  </style>
  