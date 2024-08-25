<template>
  <v-card class="mx-auto" width="344" :to="{ path: '/media/film/watch', query: { videoId: video.videoId } }">
    <v-img height="200px" :src="poster" cover></v-img>

    <v-card-title>
      {{ video.title }}
    </v-card-title>


    <v-card-subtitle>
      {{ video.views }} views · 2024-02-03
    </v-card-subtitle>

  </v-card>
</template>
  
<script setup>
import poster from "@/assets/images/login-background.jpg"
const props = defineProps({
  video: {
    type: Object,
    required: true
  },
  channel: {
    type: Number,
  }
})

</script>
  
<style lang="scss"></style>