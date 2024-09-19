import { defineStore } from 'pinia'
import piniaPersistConfig from '@/config/pinaPersist'
import sound1 from '@/assets/我记得-赵雷.mp3'
import sound2 from '@/assets/Diviners & Azertion - Feelings Mp3 Download by NCS - Files Garage.mp3'
import sound3 from '@/assets/Slow Down - Madnap,Pauline Herr.mp3'
import sound4 from '@/assets/sun and moon - Anees.mp3'
import sound5 from '@/assets/Anson Seabra - Kryptonite.mp3'

import cover1 from '@/assets/我记得.jpg'
import cover2 from '@/assets/Diviners & Azertion - Feelings Mp3 Download by NCS - Files Garage.jpeg'
import cover3 from '@/assets/Slow Down - Madnap,Pauline Herr.jpg'
import cover4 from '@/assets/sun and moon - Anees.jpg'

const useMusicStore = defineStore({
    id: 'useAudioStore',
    state: () => ({
        // 歌曲缓存
        trackList: [
            {
                id: "27591651",
                title: "Intro AE 86",
                singer: "陈光荣",
                album: "頭文字[イニシャル]D THE MOVIE SOUND TUNE",
                cover:
                    "http://p4.music.126.net/9KeyafHLjadqSQTRS_tN5Q==/5741649720318487.jpg",
                source: "http://music.163.com/song/media/outer/url?id=27591651.mp3",
                time: 149000,
            },
            {
                id: "409872504",
                title: "Ninelie",
                singer: "Aimer",
                album: "ninelie EP",
                cover:
                    "http://p3.music.126.net/g7aakYG_Wfmrn1_IDfVUXA==/109951165050166241.jpg",
                source: "http://music.163.com/song/media/outer/url?id=409872504.mp3",
                time: 260675,
            },
            {
                id: "2",
                title: "我记得",
                singer: "赵雷",
                album: "==x",
                cover: cover1,
                source: sound1,
                time: 260675,
            },
            {
                id: "3",
                title: "Diviners & Azertion - Feelings Mp3 Download by NCS",
                singer: "Files Garage",
                album: "==x",
                cover: cover2,
                source: sound2,
                time: 260675,
            },
            {
                id: "4",
                title: "Slow Down",
                singer: "Madnap,Pauline Herr",
                album: "==x",
                cover: cover3,
                source: sound3,
                time: 260675,
            },
            {
                id: "5",
                title: "sun and moon",
                singer: "Anees",
                album: "==x",
                cover: cover4,
                source: sound4,
                time: 260675,
            },
            {
                id: "6",
                title: "Anson Seabra",
                singer: "Kryptonite",
                album: "==x",
                cover: cover4,
                source: sound5,
                time: 260675,
            }
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
    },
    persist: piniaPersistConfig('MusicStore')
})

export default useMusicStore
