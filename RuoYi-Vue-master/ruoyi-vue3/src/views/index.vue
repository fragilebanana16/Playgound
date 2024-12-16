<template>
  <div class="app-container home">
    NoContent
  </div>
</template>

<script setup name="Index">
const version = ref('3.8.8')

function goTarget(url) {
  window.open(url, '__blank')
}
</script>

<style scoped lang="scss">
.home {

}
</style>

