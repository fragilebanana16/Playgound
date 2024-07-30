<template>
    <v-card
      class="content-bg card mx-auto"
      :max-width="400"
      flat
      tile
      router
    >
      <v-img
      :src="require('../../../../assets/images/login-background.jpg')" 
  
      ></v-img>
      <v-row no-gutters>
        <v-col cols="2">
          <v-list-item class="pl-0 pt-3" router>
            <v-list-item-avatar>
              <v-avatar color="red">
                <span class="white--text headline ">
                  B </span
                >
              </v-avatar>
            </v-list-item-avatar>
          </v-list-item>
        </v-col>
        <v-col>
          <v-card-title
            class="pl-2 pt-3 subtitle-1 font-weight-bold"
            style="line-height: 1.2rem"
          >
             video.title 
          </v-card-title>
  
          <v-card-subtitle class="pl-2 pb-0">
            channel.name 
          </v-card-subtitle>
          <v-card-subtitle class="pl-2 pt-0">
            12000 views<v-icon>mdi-circle-small</v-icon
            > 2024-02-03
          </v-card-subtitle>
        </v-col>
      </v-row>
    </v-card>
  </template>
  
  <script>
  import moment from "moment"
  export default {
    name: "VideoCard",
    props: {
    //   video: {
    //     type: Object,
    //     required: true,
    //   },
    //   channel: {
    //     type: Object,
    //     required: true,
    //   },
    //   card: Object,
    },    
    data() {
      return {
        // url: process.env.VUE_APP_URL,
      };
    },
    methods: {
    //   dateFormatter(date) {
    //     return moment(date).fromNow();
    //   },
    },
  };
  </script>
  
<style lang="scss">
.content-bg {
  background-color: #f9f9f9;
}
.card {
  background: #f9f9f9 !important;
}
</style>