import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    sampleBlogCards: [
      {
        blogTitle: "Blog Card 1",
        blogCoverPhoto: "stock-1",
        blogDate: "May 1",
      },
      {
        blogTitle: "Blog Card 2",
        blogCoverPhoto: "stock-2",
        blogDate: "May 2",
      },
      {
        blogTitle: "Blog Card 3",
        blogCoverPhoto: "stock-3",
        blogDate: "May 3",
      },
    ],
    
    editPost: null
  },
  mutations: {
    toggleEditPost(state, payload) {
      state.editPost = payload;
    },
  },
  actions: {
  },
  modules: {
  }
})
