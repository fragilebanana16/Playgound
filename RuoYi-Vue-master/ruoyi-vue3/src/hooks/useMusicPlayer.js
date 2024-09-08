import { PlayMode } from '@/utils/enum'
import useMusicStore from '@/store/modules/music'
import { ElNotification } from 'element-plus'
export function useMusicPlayer() {
  const musicStore = useMusicStore();
  const currentSong = computed(() => musicStore.trackList[musicStore.currentSongIndex]);
  const playMode = ref(PlayMode.Sequence);

  // 创建一个新的audio元素
  const audio = new Audio();

  // 是否正在播放，是一个响应式的引用
  const isPlaying = ref(false);

  // 添加当前时间和总时间的响应式引用
  const currentTime = ref(0);
  const duration = ref(0);

  // 默认最大音量为1
  const volume = ref(50);

  // 在组件挂载时添加事件监听器
  onMounted(() => {
    audio.src = currentSong.value.source
    audio.ontimeupdate = () => {
      currentTime.value = audio.currentTime;
    };

    audio.onloadedmetadata = () => {
      duration.value = audio.duration;
    };
    // 初始化音量
    audio.volume = volume.value / 100; // 将音量转换为 0 到 1 的范围

    // 歌曲播放完毕后自动切换
    audio.onended = () => {
      playNext();
    };

    // 添加错误监听
    audio.onerror = async () => {
      handleAudioError()
    }
  });

  const handleAudioError = async () => {
    if (!audio.error) return;
    currentTime.value = 0;
    duration.value = 0;
    try {
      audio.load()
      play()
    } catch (e) {
    }
  }

  // 添加播放歌曲的方法
  const playSong = (song) => {
      audio.src = song.source; // 确保您设置此歌曲的音频源
      play(); // 播放歌曲
  };
  // 播放音乐
  function play() {
    audio.play();
    isPlaying.value = true;
  }

  // 暂停音乐的方法
  const pause = () => {
    audio.pause();
    isPlaying.value = false;
  };

  function togglePlayPause() {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  }
  // 设置播放模式
  function setPlayMode(mode) {
    playMode.value = mode;
    ElNotification({
      title: 'Play mode',
      message: mode + ' mode',
      type: 'success',
    })
  }
  // 播放下一首歌曲
  function playNext() {
    switch (playMode.value) {
      case PlayMode.Random: // 如果是随机模式，则随机选择一首歌曲播放
        playRandomSong();
        break;
      case PlayMode.Single: // 单曲循环模式，重新播放当前歌曲
        audio.currentTime = 0; // 回到开头
        play();
        break;
      default: // 对于顺序播放和列表循环模式，播放列表中的下一首歌
        let nextIndex = musicStore.currentSongIndex + 1;
        if (nextIndex >= musicStore.trackList.length) {
          nextIndex = 0; // 如果是最后一首歌，则回到列表的开始
        }
        musicStore.setCurrentSong(nextIndex);
        audio.src = currentSong.value.source; // 更新audio元素的资源地址
        play();
        break;
    }
  }

  // 播放上一首歌曲
  function playPrevious() {
    let previousIndex = musicStore.currentSongIndex - 1;
    if (previousIndex < 0) {
      previousIndex = musicStore.trackList.length - 1; // 如果是第一首歌，则跳到列表的最后
    }
    musicStore.setCurrentSong(previousIndex);
    audio.src = currentSong.value.source; // 更新audio元素的资源地址
    // Loadlyrics()
    play();
  }

  // 随机播放一首歌曲
  function playRandomSong() {
    const randomIndex = Math.floor(Math.random() * musicStore.trackList.length);
    musicStore.setCurrentSong(randomIndex); // 设置当前歌曲为随机选择的歌曲
    audio.src = currentSong.value.source; // 更新audio元素的资源地址
    play();
  }

  // 改变当前歌曲时间
  const changeCurrentTime = (currentTime) => {
    audio.currentTime = currentTime;
  };

  // 设置音量
  const setVolume = (newVolume) => {
    volume.value = newVolume;
    audio.volume = newVolume / 100; // 将音量转换为 0 到 1 的范围
  };


  // 播放下一曲的方法
  const nextTrack = () => {

    console.log("nextTrack")
  };

  // 播放上一曲的方法
  const prevTrack = () => {
    console.log("prevTrack")
  };

  // 返回钩子函数，这些都是响应式的，可以直接在模板中使用
  return {
    currentSong,
    isPlaying, // 当前是否在播放
    play,
    playNext,
    playPrevious,
    togglePlayPause,
    playMode,
    setPlayMode,
    audio,
    currentTime, // 暴露当前播放时间
    duration, // 暴露歌曲总时间
    changeCurrentTime,
    setVolume,
    volume,
    playSong
  };
}