<script setup lang="ts">
// import { useUserStore } from '@/stores/modules/user'
// import { gsap } from 'gsap'
import { Icon } from '@iconify/vue'

const route = useRoute()

const sections = [
  {
    titleKey: 'music.aside.explore',
    items: [
    { to: '/media/music/musicCollection', labelKey: 'music.aside.menu.home',      icon: 'mdi:home' },
    { to: '/music/music/mv-list',         labelKey: 'music.aside.menu.mv',        icon: 'mdi:video' },
    { to: '/music/music/charts',          labelKey: 'music.aside.menu.charts',    icon: 'mdi:chart-line' },
    { to: '/music/music/artists',         labelKey: 'music.aside.menu.artists',   icon: 'mdi:account-music' },
    { to: '/music/music/new-albums',      labelKey: 'music.aside.menu.newAlbums', icon: 'mdi:album' },
    { to: '/media/music/musicSearch',     labelKey: 'music.aside.menu.search',    icon: 'ic:round-search' },
    ],
  },
  {
    titleKey: 'music.aside.myMusic',
    items: [
    { to: '/music/my-music', labelKey: 'music.aside.menu.recent', icon: 'mdi:music-box-multiple' },
    { to: '/media/music/localMusic', labelKey: 'music.aside.menu.localMusic', icon: 'mdi:folder-music-outline' },
    ],
  },
  {
    titleKey: 'music.aside.system',
    items: [
    { to: '/music/settings', labelKey: 'music.aside.menu.settings', icon: 'mdi:cog' },
    ],
  },
]

const state = reactive({
  // 用户创建的歌单列表
  userPlaylists: [
    { id: 1, name: '我喜欢的音乐' },
  ],
})
const { userPlaylists } = toRefs(state)
const userStore = {isLoggedIn: true}

// 活动指示器相关
const indicatorRef = ref<HTMLElement | null>(null)
const navContainerRef = ref<HTMLElement | null>(null)

// 检查是否是当前路由
const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
<template>
  <aside class="hidden w-42 shrink-0 py-0 lg:block  overflow-y-auto">
    <div class="glass-card relative h-full p-4">
      <div ref="navContainerRef">
        <div v-for="sec in sections" :key="sec.titleKey" class="mb-6">
          <h3 class="text-primary mb-3 text-xs font-semibold tracking-wide uppercase">
            {{ $t(sec.titleKey) }}
          </h3>
          <nav class="relative space-y-1">
            <router-link
              v-for="item in sec.items"
              :key="item.to"
              :to="item.to"
              class="nav-link text-primary/70 hover:text-primary text-xs relative z-10 flex items-center space-x-3 rounded-lg p-2 transition-all duration-200"
              :class="{
                'nav-link-active text-primary font-medium bg-black/5': isActive(item.to),
                'hover:bg-black/5': !isActive(item.to),
              }"
            >
            <Icon
              class="h-4 w-4 transition-transform duration-200"
              :class="{ 'scale-110': isActive(item.to) }"
              :icon="item.icon"
            />
            <span>{{ $t(item.labelKey) }}</span>
            </router-link>
            <div class="hidden">
              <Icon class="h-4 w-4" icon="mdi:chevron-right" />
            </div>
          </nav>
        </div>
      </div>

      <div class="mt-2" v-if="userStore.isLoggedIn">
        <!-- <h4 class="text-primary/60 mb-3 text-sm font-medium">
          {{ $t('layout.aside.playlists.created') }}
        </h4> -->
        <div class="space-y-2">
          <div
            v-for="playlist in userPlaylists"
            :key="playlist.id"
            class="group flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-all duration-200 hover:bg-white/10"
          >
        <Icon class="h-4 w-4 text-primary/80" icon="mdi:heart" />
            <span
              class="text-primary/80 group-hover:text-primary truncate text-xs transition-colors"
              >{{ playlist.name }}</span
            >
          </div>
        </div>
      </div>
      <div class="hidden">
        <Icon class="h-5 w-5" icon="mdi:home" />
        <Icon class="h-5 w-5" icon="mdi:video" />
        <Icon class="h-5 w-5" icon="mdi:chart-line" />
        <Icon class="h-5 w-5" icon="ic:round-search" />
        <Icon class="h-5 w-5" icon="mdi:music-box-multiple" />
        <Icon class="h-5 w-5" icon="mdi:heart-outline" />
        <Icon class="h-5 w-5" icon="mdi:cog" />
        <Icon class="h-5 w-5" icon="mdi:chevron-right" />
        <Icon class="h-5 w-5" icon="mdi:account-music" />
        <Icon class="h-5 w-5" icon="mdi:album" />
        <Icon class="h-5 w-5" icon="mdi:folder-music-outline" />
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 导航指示器过渡 */
.nav-indicator {
  transition: opacity 0.2s ease;
}

/* 导航链接悬停效果 */
.nav-link {
  position: relative;
}

.nav-link::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.5rem;
  background: transparent;
  transition: background 0.2s ease;
}

.nav-link:hover::before {
  background: rgba(0, 0, 0, 0.05);
}

.nav-link-active::before {
  background: transparent;
}
</style>
