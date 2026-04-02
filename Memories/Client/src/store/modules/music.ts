import { defineStore } from 'pinia'
import piniaPersistConfig from '@/config/pinaPersist'
import sound1 from '@/assets/我记得-赵雷.mp3'
import sound2 from '@/assets/Diviners & Azertion - Feelings Mp3 Download by NCS - Files Garage.mp3'
import sound3 from '@/assets/Slow Down - Madnap,Pauline Herr.mp3'
import sound4 from '@/assets/sun and moon - Anees.mp3'
import sound5 from '@/assets/Anson Seabra - Kryptonite.mp3'


const useMusicStore = defineStore('useAudioStore', {
    state: () => ({
        // 歌曲缓存
        trackList: [
            {
                id: "2",
                title: "我记得",
                singer: "赵雷",
                album: "==x",
                source: sound1,
                time: 260675,
            },
        ],
        // 播放历史记录
        playHistory: [
            {
            id: "2",
            title: "我记得",
            singer: "赵雷",
            album: "==x",
            source: sound1,
            time: 260675,
        },
    ],
        currentSongIndex: 0
    }),
    actions: {
        // 设置当前歌曲
        setCurrentSong(index) {
            if (index >= 0 && index < this.trackList.length) {
                this.currentSongIndex = index;
            }
        },
        // 设置当前歌曲链接
        setCurrentSongUrl(url) {
            this.trackList[this.currentSongIndex].source = url
        },
        // 设置当前歌曲歌词
        setCurrentSonglyrics(Lyric) {
            this.trackList[this.currentSongIndex].Lyric = Lyric
        },
        addTrack(param) {
            if (Array.isArray(param)) {
                this.trackList = this.trackList.concat(param);
            } else {
                this.trackList.push(param);
            }
        },
        addTrackAndPlay(param) {
            let addedIndex = -1; // 用于记录新添加的歌曲索引
            let existingIndex = -1; // 用于记录已存在歌曲的索引

            const addTrack = (track) => {
                existingIndex = this.trackList.findIndex(existingTrack => existingTrack.id === track.id);

                if (existingIndex === -1) {
                    this.trackList.push(track);
                    addedIndex = this.trackList.length - 1; // 记录新添加的歌曲索引
                } else {
                    // console.warn(`Track with ID ${track.id} already exists at index ${existingIndex}.`);
                    addedIndex = existingIndex; // 更新 addedIndex 为已存在歌曲的索引
                }
            };

            if (Array.isArray(param)) {
                param.forEach(track => addTrack(track));
            } else {
                addTrack(param);
            }

            // 设置当前歌曲为新添加的或已存在的歌曲
            if (addedIndex !== -1) {
                this.setCurrentSong(addedIndex);
            }
        },
        clearAllSong() {
            this.trackList = [];
        },
        // 添加到播放历史
        addToHistory(song) {
            // 移除已存在的相同歌曲（避免重复）
            const existingIndex = this.playHistory.findIndex((s: { id: string | number }) => s.id === song.id)
            if (existingIndex !== -1) {
                this.playHistory.splice(existingIndex, 1)
            }
    
            // 添加到历史记录末尾
            this.playHistory.push(song)
    
            // 限制历史记录数量
            if (this.playHistory.length > 100) {
                this.playHistory.shift()
            }
        },
    
        // 清空播放历史
        clearHistory() {
            this.playHistory = []
        },
    },
    // persist: piniaPersistConfig('useAudioStore', [])
})

export default useMusicStore
