<template>
  <div class="home">
    <Blog :post="welcomeScreen"/>
    <Blog :post="post" v-for="(post, index) in sampleBlogPost" :key="index"/>
  </div>
</template>

<script>
import Blog from "./Blog.vue"
export default {
  name: "Home",
  components: {Blog},
  data() {
    return {
      welcomeScreen: {
        title: "Welcome!",
        blogPost:
          "Weekly blog articles with all things programming including HTML, CSS, JavaScript and more. Register today to never miss a post!",
        welcomeScreen: true,
        photo: "coding",
      },

      sampleBlogPost: [
        {
          title: "This is title",
          blogHtml: "This is html",
          blogCoverPhoto: "beautiful-stories",
        },
        {
          title: "This is title2",
          blogHtml: "This is html2",
          blogCoverPhoto: "designed-for-everyone",
        }
      ]
    };
  },

};
</script>
