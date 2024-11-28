<template>
    <div>
        <Icon v-if="data.is_video" icon='iconamoon:folder-video-fill' class="text-xl text-white icon-video-white"></Icon>
        <img @click="show(collection, data.url)" :src="data.ph ? undefined : data.url" :key="data.fileid"
            @error="handleImageError" alt="mountains" v-bind:style="{
                width: rowHeight + 'px',
                height: rowHeight + 'px',
            }" />
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'
export default {
    name: 'Photo',
    components: {
        Icon
    },
    props: {
        data: {
            type: Object,
            required: true
        },
        collection: {
            type: Object,
            required: true
        },
        rowHeight: {
            type: Number,
            required: true,
        }
    },
    methods: {
        getCurrentImage() {
            const currentImage = this.collection[0]; // todo get index?
            return currentImage;
        },
        /**
         * show v-viewer
         * @param photos one row photos, todo: same day photos
         * @param current current photo url
         */
        show(photos, current) {
            // Check if this is a placeholder
            if (this.data.ph) {
                return;
            }
            const urls = photos.map(item => item.url)
            const curIndex = urls.indexOf(current) ?? 0
            this.$viewerApi({
                images: urls,
                options: {
                    initialViewIndex: curIndex,
                    toolbar: {
                        zoomIn: 4,
                        zoomOut: 4,
                        oneToOne: 4,
                        reset: 4,
                        prev: 4,
                        play: {
                            show: 4,
                            size: 'large',
                        },
                        next: 4,
                        rotateLeft: 4,
                        rotateRight: 4,
                        flipHorizontal: 4,
                        flipVertical: 4,
                        download: () => {
                            const curImg = this.getCurrentImage()
                            const a = document.createElement('a');
                            a.href = curImg;
                            const filename = curImg.url.split('/').pop();
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        },
                        delete: () => {
                            console.log(`output->delete`)
                        },
                    },
                },
            })
        },
        handleImageError(event) {
            event.target.src = placeholder
        }
    }
}
</script>
<style>
.icon-video-white {
    position: absolute;
    top: 8px;
    right: 8px;
}

img {
    background-clip: content-box;
    background-color: #eee;
    padding: 2px;
    object-fit: cover;
    border-radius: 3%;
    cursor: pointer;
}

.viewer-download,
.viewer-delete {
    color: #fff;
    font-family: FontAwesome, serif;
    font-size: 0.75rem;
    line-height: 1.2rem;
    text-align: center;
}

.viewer-download::before {
    content: "\2b07";
}

.viewer-delete::before {
    content: "\1F5D1";
}

/* 悬浮提示样式 */
.viewer-download::after,
.viewer-delete::after {
    position: absolute;
    /* todo点击后位置变化? */
    left: 60%;
    /* 水平居中 */
    background-color: rgba(0, 0, 0, 0.7);
    /* 半透明黑色背景 */
    color: #fff;
    /* 白色文字 */
    padding: 5px;
    border-radius: 4px;
    visibility: hidden;
    /* 默认隐藏 */
    opacity: 0;
    /* 隐藏状态 */
    transition: opacity 0.2s, visibility 0.2s;
    /* 动画效果 */
    white-space: nowrap;
    /* 防止换行 */
}

/* 特定内容 */
.viewer-download::after {
    content: "下载";
}

.viewer-delete::after {
    content: "删除";
}

.viewer-download:hover::after,
.viewer-delete:hover::after {
    visibility: visible;
    /* 悬停时可见 */
    opacity: 1;
    /* 悬停时显示 */
}</style>