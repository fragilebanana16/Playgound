import { AppRouteRecord } from '@/types/router'
import { defineComponent, h, defineAsyncComponent } from 'vue'
import { useMediaQuery } from '@vueuse/core'
const responsive = (desktopLoader: () => Promise<any>, mobileLoader: () => Promise<any>) =>
  defineComponent({
    name: 'ResponsiveRouteComponent',
    setup() {
      // 使用媒体查询监听窗口是否为移动端尺寸（阈值 768px）
      const isMobile = useMediaQuery('(max-width: 768px)')
      // 异步组件定义，按需加载对应端的页面组件
      const Desktop = defineAsyncComponent(desktopLoader)
      const Mobile = defineAsyncComponent(mobileLoader)
      return () => h(isMobile.value ? Mobile : Desktop)
    },
})

export const mediaRoutes: AppRouteRecord = {
  name: 'Media',
  path: '/media',
  component: '/index/index',
  meta: {
    title: '媒体中心',
    icon: 'ri:pie-chart-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'music',
      name: 'Music',
      component: () => Promise.resolve(
        responsive(
          () => import('@/views/music/index.vue'),
          () => import('@/views/music/mobile/index.vue'),
        )
      ),
      redirect: { name: 'MusicCollection' }, 
      meta: {
        title: '音乐',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
        isSingleModule: true, // 只渲染父级，不展开 children
        noTransition: true,
      },
      children: [
        {
          path: 'musicCollection',
          name: 'MusicCollection',
          component: "/music/musicCollection",
          meta: {
            title: '列表',
            icon: 'ri:align-item-bottom-line',
            keepAlive: false,
          },
        },
        {
          path: 'musicSearch',
          name: 'MusicSearch',
          component: "/music/musicSearch",
          meta: {
            title: '搜索',
            icon: 'ri:align-item-bottom-line',
            keepAlive: false,
          },
        },
        {
          path: 'recentMusic',
          name: 'RecentMusic',
          component: "/music/recentMusic",
          meta: {
            title: '最近播放',
            icon: 'ri:align-item-bottom-line',
            keepAlive: false,
          },
        },
        {
          path: 'localMusic',
          name: 'LocalMusic',
          component: () => Promise.resolve(
            responsive(
              () => import('@/views/music/localMusic/index.vue'),
              () => import('@/views/music/localMusic/index.vue'),
            )
          ),
          meta: {
            title: '本地音乐',
            icon: 'ri:home-smile-2-line',
            keepAlive: false,
            fixedTab: true,
          },
        },
      ]
    },
    {
      path: 'photo',
      name: 'Photo',
      component: () => import('@/views/photo/index.vue'),
      meta: {
        title: '相册',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
        isSingleModule: true, // 只渲染父级，不展开 children
        noTransition: true,
      }
    },
    {
      path: 'map',
      name: 'GISMap',
      component: () => import('@/views/map/index.vue'),
      meta: {
        title: '地图',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
        isSingleModule: true, // 只渲染父级，不展开 children
        noTransition: true,
      }
    },
    {
      path: 'chatting',
      name: 'Chatting',
      component: () => import('@/views/chat/index.vue'),
      meta: {
        title: '聊天',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
        isSingleModule: true, // 只渲染父级，不展开 children
        noTransition: true,
      }
    },
    {
      path: 'cloud',
      name: 'Cloud',
      component: () => import('@/views/cloud/index.vue'),
      redirect: { name: 'CloudMain' }, 
      meta: {
        title: '云盘',
        icon: 'ri:home-smile-2-line',
        keepAlive: false,
        fixedTab: true,
        isSingleModule: true, // 只渲染父级，不展开 children
        noTransition: true,
      },
      children: [
        {
          path: 'cloudMain/:type?',
          name: 'CloudMain',
          component: () => import('@/views/cloud/modules/CloudMain.vue'),
          meta: {
            title: '网盘主页',
            icon: 'ri:align-item-bottom-line',
            keepAlive: true,
          },
        },
        {
          path: 'transfer',
          name: 'Transfer',
          component: () => import('@/views/cloud/modules/Transfer.vue'),
          meta: {
            title: '传输',
            icon: 'ri:align-item-bottom-line',
            keepAlive: true,
          },
        }
      ]
    },
    // {
    //   path: 'analysis',
    //   name: 'Analysis',
    //   component: '/dashboard/analysis',
    //   meta: {
    //     title: 'menus.dashboard.analysis',
    //     icon: 'ri:align-item-bottom-line',
    //     keepAlive: false
    //   }
    // },
    // {
    //   path: 'ecommerce',
    //   name: 'Ecommerce',
    //   component: '/dashboard/ecommerce',
    //   meta: {
    //     title: 'menus.dashboard.ecommerce',
    //     icon: 'ri:bar-chart-box-line',
    //     keepAlive: false
    //   }
    // }
  ]
}
