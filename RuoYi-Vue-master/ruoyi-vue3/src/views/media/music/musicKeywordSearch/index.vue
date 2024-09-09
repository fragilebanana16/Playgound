<script setup>
// import MusicList from '../MusicList.vue'
// import Footer from '../Footer.vue'
// import Header from '../Header.vue'
// import MusicList from '../MusicList.vue'
// import DrawerPlayer from '../components/DrawerPlayer'

const url =
  'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg'
const route = useRoute()
onMounted(() => {
    console.log(`route.query.kw:`,route.query.kw)
})

</script>
<script>
export default {
  name: 'MusicKeywordSearch',
}
</script>
<template>
  <div class="flex flex-col h-[calc(100vh-53px-84px-62px)]">
     keyword search page route.query.kw -> {{ route.query.kw }}
  </div>
</template>

<style scoped>
</style>