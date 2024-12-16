<template>
    <div>
        chat index
        <video ref="videoElement" autoplay controls></video>
        <button @click="onClick">click</button>
    </div>
</template>

<script>
export default {
    name: 'Chat',
    data() {
        return {
            localStream: null,
        }
    },
    methods: {
        onClick() {
            navigator.mediaDevices
                .getUserMedia({
                    audio: true,
                    video: { width: 1280, height: 720 },
                })
                .then(this.gotStream)
        },
        gotStream(stream) {
            console.log('received local stream');
            this.$refs.videoElement.srcObject = stream;
        }
    }
}
</script>