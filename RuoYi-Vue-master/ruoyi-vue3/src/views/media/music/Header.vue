<script setup>
import { Icon } from '@iconify/vue'

const keyWord = ref('')
const toSearch = () => {
}

</script>
<template>
  <header
    class="flex justify-between p-2  items-center border-b dark:border-gray-600 dark:bg-[#141414]"
  >
  <div/>
          <el-input
            v-model="keyWord"
            placeholder="string"
            style="--el-input-border-radius: 30px; width: 300px"
            @keyup.enter="toSearch"
            class="dark:text-white"
          >
            <template #prefix>
              <Icon icon="material-symbols:search" />
            </template>
          </el-input>
  </header>
</template>

<style scoped>
.app-region {
  -webkit-app-region: drag;
  -webkit-user-select: none;
  user-select: none;
}

.search,
.avatar,
.btn-back,
.btncontainer {
  -webkit-app-region: no-drag;
  /* 使得子元素可点击 */
}

.btn {
  height: 15px;
  width: 15px;
  margin: 5px;
  border-radius: 50%;
  cursor: pointer;
  /* 其他样式保持不变 */
}

.btn1 {
  background: #fac536;
  position: relative;
  overflow: hidden;
}

.btn1::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 10%;
  opacity: 0;
  background: #222;
  transition: 300ms;
}

.btn1:hover::before {
  opacity: 1;
  top: 50%;
}

.btn2 {
  background: #39ea49;
  position: relative;
  overflow: hidden;
}

.btn2::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 45%;
  height: 45%;
  opacity: 0;
  background: #222;
  transition: 300ms;
}

.btn2::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 15%;
  height: 80%;
  opacity: 0;
  background: #39ea49;
  transition: 300ms;
}

.btn2:hover::before,
.btn2:hover::after {
  opacity: 1;
  top: 50%;
}

.btn3 {
  background: #f25056;
  position: relative;
  overflow: hidden;
}

.btn3::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 15%;
  height: 50%;
  opacity: 0;
  background: #222;
  transition: 300ms;
}

.btn3::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 15%;
  opacity: 0;
  height: 50%;
  background: #222;
  transition: 300ms;
}

.btn3:hover::before,
.btn3:hover::after {
  opacity: 1;
  top: 50%;
}
</style>