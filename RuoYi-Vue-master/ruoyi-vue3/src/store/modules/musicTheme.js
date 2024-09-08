import { defineStore } from 'pinia'
import piniaPersistConfig from '@/config/pinaPersist'

/**
 * 主题设置s
 */
const useMusicThemeStore = defineStore({
    id: 'useMusicThemeStore',
    state: () => ({
        isDark: false,
        primary: '#000000',
        language: 'Chinese'
    }),
    actions: {
        setDark(isDark) {
            this.isDark = isDark
        },
        setPrimary(primary) {
            this.primary = primary
        },
        setLanguage(language) {
            this.language = language
        },
    },
    persist: piniaPersistConfig('MusicThemeStore'),
})
export default useMusicThemeStore
