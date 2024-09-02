import sound from '../../../assets/test.mp3'
import { PlayMode } from '@/utils/enum'

export function useMusicPlayer() {
  // 创建一个新的audio元素
  const audio = new Audio();

  // 是否正在播放，是一个响应式的引用
  const isPlaying = ref(false);

  const playMode = ref(PlayMode.Sequence);

  // 添加当前时间和总时间的响应式引用
  const currentTime = ref(0);
  const duration = ref(0);


  // 默认最大音量为1
  const volume = ref(50);

  // 当前歌曲信息
  const currentTrackSong = ''

      // 在组件挂载时添加事件监听器
      onMounted(() => {
        audio.src = sound
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
          console.log('playNext();')
        };

        // 添加错误监听
        audio.onerror = async () => {
            handleAudioError()
        }
    });

    const handleAudioError = async () => {
      if (!audio.error) return;

      // if (audio.error.code === audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      //     currentTime.value = 0;
      //     duration.value = 0;
      //     try {
      //         // 尝试获取新的音源地址，然后重新播放
      //         const { data } = await urlV1(currentSong.value.id);
      //         audio.src = data[0].url;
      //         audioStore.setCurrentSongUrl(data[0].url)
      //         audio.load()
      //         play()
      //     } catch (e) {
      //         // 如果有获取新源失败的专用错误信息
      //         // errorMessage = "获取新源失败。";
      //     }
      // }
  };

  // 加载音轨的方法，用于更新audio元素的src，并重置currentTime和duration
  const loadTrack = (index) => {
    audio.src = sound;
    audio.load();


    // 当音轨的元数据加载完成时，更新歌曲的总时长
    audio.addEventListener("loadedmetadata", () => {
      console.log("loadedmetadata")
    });
  };

      // 改变当前歌曲时间
      const changeCurrentTime = (currentTime) => {
        audio.currentTime = currentTime;
    };

    // 设置音量
    const setVolume = (newVolume) => {
        volume.value = newVolume;
        audio.volume = newVolume / 100; // 将音量转换为 0 到 1 的范围
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

  // 播放下一曲的方法
  const nextTrack = () => {

    console.log("nextTrack")
  };

  // 播放上一曲的方法
  const prevTrack = () => {
    console.log("prevTrack")
  };


  const addTrackAndPlay = () => {

  };

  // 初始化时加载当前索引的音轨
  loadTrack(1123);

  // 返回钩子函数，这些都是响应式的，可以直接在模板中使用
  return {
    isPlaying, // 当前是否在播放
    // currentTrackIndex, // 当前播放的曲目索引
    currentTime, // 当前播放时间
    duration, // 音乐总时长
    // play, // 控制播放的函数
    togglePlayPause,
    // nextTrack, // 播放下一首的函数
    // prevTrack, // 播放上一首的函数
    changeCurrentTime, //seek
    // currentTrackSong, //当前歌曲信息
    setVolume, // 控制音量
    volume, //音量
    // LyricList, //歌词
    // currentLyricIndex, // 当前高亮歌词的索引
    // lyricTranslateY, // 用于居中显示当前歌词的 translateY 值
    // addTrackAndPlay, // 添加并播放新的音轨
  };
}