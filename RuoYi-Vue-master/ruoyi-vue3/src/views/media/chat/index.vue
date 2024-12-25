<script >
// import { fa } from 'element-plus/es/locale'
import VideoChat from './VideoChat.vue'
export default {
  name: 'VideoChatMain',
  components: {
    VideoChat,
  },
  data() {
    return {
      mode: '',
      state: {
        maximized: 'self', // right corner small one
        screenshots: false,
        muteVideo: false,
        stream: null
      },
      isFullScreen: false,
      unreadMessages: false,
    }
  },
  methods: {
    doTogglePanel(mode) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        })
        .then(this.gotStream)
      // this.state.screenshots = !this.state.screenshots
    },
    gotStream(stream) {
      console.log('received local stream');
      this.state.stream = stream
    },
    doVideo() {
      this.state.muteVideo = !this.state.muteVideo
      this.updateStream()
    },
    updateStream() {
      try {
        if (this.state.stream) {
          this.state.stream
            ?.getVideoTracks()
            .forEach(t => (t.enabled = !this.state?.muteVideo))
          this.state.stream
            ?.getAudioTracks()
            .forEach(t => (t.enabled = !this.state?.muteAudio))
        }
      }
      catch (err) {
        console.log(err)
      }
    }
  }
}
</script>
<template>
  <div style="height:calc(100vh - 84px)">
    <div class="hstack h-full">
      <div class="-fit vstack">
        <div class="-fit stack videos -relative">
          <VideoChat :stream="state.stream" :state="state" id="self" muted :mirrored="false" title="Local" />

          <!-- <AppVideo
            v-for="peer in peers"
            :id="peer.remote"
            :key="peer.remote"
            :stream="peer?.peer?.stream"
            :fingerprint="peer?.peer?.fingerprint"
            :name="peer?.peer?.name"
          /> -->

          <!-- <div
            v-if="!state.screenshots && state.requestBugTracking"
            class="message-container -error"
          >
            <div class="message">
              {{ $t("error.ask_to_send_error") }}
              <u @click="doAllow(true)">{{ $t("error.send_allow") }}</u> |
              <u @click="doAllow(false)">{{ $t("error.send_deny") }}</u>
            </div>
          </div>
  
          <div v-else-if="state.error" class="message-container -error">
            <div class="message">
              {{ state.error }}
              <u @click="doReload">Reload page</u>
            </div>
          </div> -->

          <!-- <div
            v-else-if="
              !hasPeers
                && !state.screenshots
                && mode !== 'share'
                && state.showInviteHint
            "
            class="message-container"
          >
            <div
              class="message"
              v-html="$t('share.message', { symbol })"
            />
          </div> -->
        </div>
        <div class="tools hstack">
          <!-- SETTING -->
          <button class="tool" :class="{ '-active': true }" @click="doTogglePanel('settings')">
            <!--        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> -->
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
          <div class="-fit">

            <button class="tool" :class="{ '-off': state.muteVideo }" @click="doVideo">
              <svg v-if="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path
                  d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
            <button class="tool tool-close" @click="doQuit">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <!--          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path><line x1="23" y1="1" x2="1" y2="23"></line></svg> -->
            </button>
            <button class="tool" :class="{ '-off': false }" @click="doAudio">
              <svg v-if="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          <button class="tool" @click="doToggleFullScreen">
            <svg v-if="!isFullScreen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            <svg v-if="isFullScreen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          </button>

          <button class="tool messageBtn" :class="{ '-active': mode === 'chat' }" @click="toggleChat()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="feather feather-message-square">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div v-if="unreadMessages" class="unread-msg" />
          </button>

          <button class="tool" :class="{ '-active': mode === 'share' }" @click="doTogglePanel('share')">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
svg {
  display: inline-block;
  width: 1.25rem !important;
  height: 1.25rem;
  padding: 0;
  margin: 0;
  stroke: currentColor;
  stroke-width: 1.5;
  transform: translateX(50%) translateY(50%)
}

.tools {
  /*background: black;*/
  padding: 1rem;
  padding-top: 0.5rem;
  text-align: center;
}

.tool {
  color: #f8f8f8;
  width: 3rem !important;
  height: 3rem !important;
  font-size: 1.5rem;
  background: #272727;
  border-radius: 2rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  display: inline-flex !important;

  svg {
    width: 1.5rem !important;
    height: 1.5rem;
    padding: 0;
    margin: 0;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  &.-off {
    color: #919191;
  }

  &.-active,
  &:hover {
    color: white;
    background: #676767;
  }

  &:active,
  &:focus {
    color: #cccccc;
    background: black;
  }
}

.tool-close {
  background: #9d0000;

  &:hover {
    background: #f60000;
  }

  &:active,
  &:focus {
    color: white;
    background: #f60000;
  }
}

.video {
  transition: all 1s;
}

.videos {
  padding: 0.25rem;
  padding-bottom: 0;
  flex-wrap: wrap;
  justify-content: center;

  .item {
    display: flex;
    padding: 0.25rem;
    position: relative;
    flex: auto;
    overflow: hidden;
  }

  .video {
    background: #444444;
    border-radius: 0.25rem;
    max-height: 100%;
    display: block;
    margin: 0;
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
}

.vstack,
.stack.-vertical,
.stack.-orientation-vertical {
  flex-direction: column;
}

.-relative {
  position: relative;
}

// https://css-tricks.com/snippets/css/a-guide-to-flexbox/
.stack,
.hstack,
.vstack {
  display: flex;

  >.-fit,
  >.-fill,
  >.-grow {
    flex: auto;
    overflow: hidden; // Important to get the scrollable exceeding contents to work
  }
}
</style>
