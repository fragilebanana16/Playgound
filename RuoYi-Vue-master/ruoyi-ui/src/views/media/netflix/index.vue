<template>
    <div>
        <v-row no-gutters>
          <v-col
            v-for="n in 4"
            :key="n"
            cols="12"
            sm="3"
          >
          <video-card></video-card>
          </v-col>
        </v-row>
         hahahah
        <v-skeleton-loader type="card-avatar" :loading="true">
        </v-skeleton-loader>
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
  