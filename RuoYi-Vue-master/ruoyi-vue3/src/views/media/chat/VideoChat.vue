<script >
export default {
  name: 'Chat',
  props: {
    stream: {
      type: MediaStream,
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
    },
    mirrored: {
      type: Boolean,
      default: false,
    },
    fingerprint: {
      type: String,
    },
    id: {
      type: String,
    },
    name: {
      type: String,
    },
    state: {
      type: Object,
    },
  },
  data() {
    return {
      showPlayButton: false
    }
  },
  watch: {
    stream(value) {
      this.doConnectStream(value)
    },
  },
  methods: {
    async doConnectStream(stream) {
      if (stream) {
        try {
          await this.$nextTick()
          const video = this.$refs.videoElement
          if (stream) {
            if ('srcObject' in video)
              video.srcObject = stream
            else
              video.src = window.URL.createObjectURL(stream) // for older browsers

            // Keep in mind https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
            // But if the user allows to access camera it should be fine
            // https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
            video.onloadedmetadata = () => this.playVideo(video)
            video.onloadeddata = () => this.playVideo(video)
            video.onpause = () => this.playVideo(video)
            video.oncanplay = () => this.playVideo(video)
          }
        }
        catch (err) {
          console.log(err)
        }
      }
    },
    playVideo(video) {
      const startPlayPromise = video.play().catch((err) => {
        console.log(err)
      })
      console.log('play', startPlayPromise)
      if (startPlayPromise !== undefined) {
        startPlayPromise
          .then(() => {
            // Start whatever you need to do only after playback
            // has begun.
          })
          .catch((error) => {
            if (error.name === 'NotAllowedError')
              this.showPlayButton = true
            else
              console.log(error)
          })
      }
    },
    handleClick() {
      // if (this.showPlayButton)
      //   this.doPlay()
      // else if (this.state.maximized === this.id)
      // this.state.maximized = ''
      // else
      // this.state.maximized = this.id


    },
    async doPlay() {
      try {
        this.$refs?.videoElement?.play()
        this.showPlayButton = false
      }
      catch (err) {
        console.log(err)
      }
    }
  }
}
</script>

<template>
  <div class="peer item h-full" :class="{ '-maximized': state.maximized === id }" @click="handleClick">
    <!-- SCREENSHOT -->
    <div v-if="state.screenshots"
      :style="`background:url('/dev-api/music/covers/A Sky Full of Stars - Coldplay.jpg'); background-size: cover; background-position: center;`"
      alt="" class="video h-full w-full" :class="{ '-mirrored': false }" />
    <!-- VIDEO -->
    <video v-else-if="stream" ref="videoElement" class="video" :class="{ '-mirrored': false }" autoplay playsinline
      :muted="muted" data-fit="cover" autoPictureInPicture="true" />
    <!-- PLACEHOLADER -->
    <div v-else class="video video-placeholder -content-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-icon-placeholder">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
      <label>{{ "Wait for Connection" }}</label>
    </div>
    <!-- MUTED_VIDEO -->
    <div v-if="stream && state.muteVideo && id === 'self'" class="video video-placeholder -content-placeholder">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-icon-placeholder">
        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      <label>{{ "Video Muted" }}</label>
    </div>
    <!-- <div
        v-if="fingerprint" v-show="!state.maximized"
        class="video video-placeholder video-fingerprint -content-placeholder -overlay -info"
      >
        <label v-show="!showCode" title="Verification code" class="-short" @click.stop.prevent="doToggleShow">
          <svg
            xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="feather feather-shield"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {{ fingerprint.substr(fingerprint.length - 4, 4) }}
        </label>
        <label v-show="showCode" title="Verification code" class="-long" @click.stop.prevent="doToggleShow">
          {{ $t("main.security_info") }}
          <br>
          <code>{{ fingerprint }}</code>
        </label>
        <label v-if="String(name).trim().length" title="Name" class="-short" style="right: 5rem">
          {{ name }}
        </label>
      </div>
      <div v-if="state.muteVideo && id === 'self'" class="video video-placeholder -content-placeholder">
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-icon-placeholder"
        >
          <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <label>{{ $t("main.video_muted") }}</label>
      </div>
      <div v-if="stream && showPlayButton" class="video video-placeholder -content-placeholder -overlay">
        <svg
          xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-icon-placeholder"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" />
        </svg>
        <label>{{ $t("main.action_restart_video") }}</label>
      </div> -->

    <div v-if="stream && showPlayButton" class="video video-placeholder -content-placeholder -overlay">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="-icon-placeholder">
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" />
      </svg>
      <label>{{ "Restart Video" }}</label>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.peer {
  z-index: 2;

  &.-maximized {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    bottom: 0;
    right: 0.25rem;
    z-index: 1;
  }

  &:not(.-maximized) {
    height: 6rem;
    width: 6rem;
    flex-grow: 0;
    flex-shrink: 0;
    margin: 0;

    .video {
      border: 0.5px solid #272727;
      background: #272727;
    }
  }
}

.video {
  background: #444444;
  border-radius: 0.25rem;
  max-height: 100%;
  display: block;
  margin: 0;
  // Safari Hack
  position: absolute;
  top: calc(50%);
  left: calc(50%);
  width: calc(100% - 0.5rem) !important;
  height: calc(100% - 0.5rem) !important;
  transform: translateY(-50%) translateX(-50%);

  &[data-fit='cover'] {
    object-fit: cover;
  }

  &[data-fit='contain'] {
    object-fit: contain;
  }

  &.-mirrored {
    transform: translateY(-50%) translateX(-50%) scaleX(-1);
  }
}

.video-placeholder {
  min-height: 6rem;
  background: #333333;
  color: white;
  display: flex;

  &.-overlay {
    background: rgba(51, 51, 51, 0.2);
  }

  &.-info {
    label {
      position: absolute;
      bottom: 8px;
      right: 4px;
      border-radius: 4px;
      padding: 4px 8px;
      background: rgba(255, 255, 255, 0.5);
      color: #333333;
      font-size: 0.8rem;

      &:hover {
        background: rgba(255, 255, 255, 1);
        color: black !important;
        cursor: pointer;
      }
    }

    .-long {
      display: block;
      text-align: left;
      left: 8px;
      font-size: 1em;
      background: rgba(255, 255, 255, 0.9);
      padding: 16px;
    }

    .-short {
      display: flex;
      align-items: center;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);

      svg {
        display: inline-block;
        width: 0.8rem !important;
        height: 0.8rem;
        padding: 0;
        margin: 0;
        margin-right: 0.4rem;
        // stroke: rgba(255, 255, 255, 0.5);
        stroke-width: 3;
      }
    }
  }

  svg.-icon-placeholder {
    display: inline-block;
    padding: 0;
    margin: 0;
    stroke: currentColor;
    stroke-width: 1;
    text-align: center;
    width: 4rem !important;
    height: 4rem;
    color: white;
    animation: blink 1000ms infinite;
  }

  label {
    display: block;
    margin-top: 1rem;
  }
}

.-content-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #cccccc;
  text-align: center;
  padding: 16px;
}

.item {
  display: flex;
  padding: 0.25rem;
  position: relative;
  flex: auto;
  overflow: hidden;
}
</style>
