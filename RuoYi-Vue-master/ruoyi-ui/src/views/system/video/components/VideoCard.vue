<template>
  <v-card class="content-bg card mx-auto" :max-width="500" flat tile router>
    <v-img style="border-radius: 0.6rem" :src="require('../../../../assets/images/login-background.jpg')"></v-img>
    <v-row no-gutters>
      <v-col cols="2">
        <v-list-item class="pl-0 pt-3" router>
          <v-list-item-avatar>
            <v-avatar>
              <v-img alt="John" src="https://cdn.vuetifyjs.com/images/john.jpg"></v-img>
            </v-avatar>
          </v-list-item-avatar>
        </v-list-item>
      </v-col>
      <v-col>
        <v-card-title style="line-height: 1.2rem; font-size: 1rem; font-weight: 900;height: calc(2em * 2);padding-top: 8px;">
          <div class="title">
            {{ video.title }}
          </div>
        </v-card-title>

        <v-card-subtitle style="  padding: 5px 16px;">
          <div class="subTitle">
            {{ video.description }}
          </div>
        </v-card-subtitle>
        <v-card-subtitle style="padding: 5px 16px">
          {{ video.views }} views · 2024-02-03
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
    video: {
      type: Object,
      required: true,
    },
    // channel: {
    //   type: Object,
    //   required: true,
    // },
    // card: Object,
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

.title {
  font-size: 1.1rem;
  line-height: 1.2rem;
  font-weight: 500;
  overflow: hidden;
  max-height: 4.4rem;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  white-space: normal;
}

.subTitle {
  font-size: 0.6rem;
  line-height: 1.2rem;
  font-weight: 500;
  overflow: hidden;
  max-height: 4.4rem;
  -webkit-line-clamp: 1;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  white-space: normal;

}
</style>