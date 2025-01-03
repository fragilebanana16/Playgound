<template>
    <div class="photo-container" :class="{
            'selected': (data.flag & c.FLAG_SELECTED),
            'leaving': (data.flag & c.FLAG_LEAVING),
            'exit-left': (data.flag & c.FLAG_EXIT_LEFT),
            'enter-right': (data.flag & c.FLAG_ENTER_RIGHT),
        }">
        <Icon icon='material-symbols:check' v-if="!(data.flag & c.FLAG_PLACEHOLDER)" class="icon-checkmark select text-lg"  @click="toggleSelect"></Icon>
        <Icon v-if="data.isvideo" icon='iconamoon:folder-video-fill' class="text-xl text-white icon-video-white"></Icon>
        <div class="img-outer" :style="{
                width: rowHeight + 'px',
                height: rowHeight + 'px',
            }">
        <img @click="click(collection, data.url)" 
        @contextmenu="contextmenu"
        @touchstart="touchstart"
        @touchend="touchend"
        @touchmove="touchend"
        @touchcancel="touchend"
        :src="(data.flag & c.FLAG_PLACEHOLDER) ? '' : data.url" :key="data.fileid"
            @error="handleImageError" alt="mountains" />
        </div>
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'
import placeholder from '@/assets/images/error.svg'
import constants from '../constants'
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
        },
        day: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            touchTimer: 0,
            c: constants,
        }
    },
    methods: {
        getCurrentImage() {
            const currentImage = this.collection[0]; // todo get index?
            return currentImage;
        },

        /** Pass to parent */
        click(photos, current) {
            this.$emit('clickImg', this, photos, current);
        },

        /**
         * show v-viewer
         * @param photos one row photos, todo: same day photos
         * @param current current photo url
         */
        openFile(photos, current) {
            // Check if this is a placeholder
            if (this.data.flag & constants.FLAG_PLACEHOLDER) {
                return;
            }
            const urls = photos.map(item => item.url)
            const curIndex = urls.indexOf(current) ?? 0
            this.$viewerApi({
                images: urls,
                options: {
                    initialViewIndex: curIndex,
                    hidden: this.processDeleted, // https://github.com/fengyuanchen/viewerjs?tab=readme-ov-file#options
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
                            this.$modal.confirm('是否确认删除"' + arguments[1] + '"的数据项?').then(() => {
                                // todo
                                this.day.fileInfos = this.day.detail.slice(0,2); 
                                this.$modal.msgSuccess("删除成功");
                            }).catch(() => { });
                        },
                    },
                },
            })

            // Store in day with a original copy
            // this.day.fileInfos = this.day.detail.slice(0,2); // mock data: simulate delete
            this.day.fiOrigIds = new Set(this.day.detail.map(f => f.fileid));
        },
        /** Remove deleted files from main view */
        processDeleted() {
            // This is really an ugly hack, but the viewer
            // does not provide a way to get the deleted files
            // Compare new and old list of ids
            if (!this.day.fileInfos || !this.day.fiOrigIds) {
                console.log(`processDeleted info needed.`)
                return
            }
            const newIds = new Set(this.day.fileInfos.map(f => f.fileid));
            const remIds = new Set([...this.day.fiOrigIds].filter(x => !newIds.has(x)));
            // Exit if nothing to do
            if (remIds.size === 0) {
                return;
            }
            this.day.fiOrigIds = newIds;
            // Remove deleted files from details
            this.day.detail = this.day.detail.filter(d => !remIds.has(d.fileid));
            this.day.count = this.day.detail.length;
            this.$emit('reprocess', this.day);
        },
        toggleSelect() {
            if (this.data.flag & constants.FLAG_PLACEHOLDER) {
                return;
            }
            this.$emit('select', this.data);
        },
        handleImageError(event) {
            event.target.src = placeholder
        },
        touchstart() {
            this.touchTimer = setTimeout(() => {
                this.toggleSelect();
                this.touchTimer = 0;
            }, 600);
        },
        contextmenu(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        touchend() {
            if (this.touchTimer) {
                clearTimeout(this.touchTimer);
                this.touchTimer = 0;
            }
        },
    }
}
</script>
<style scoped>
/* Container and selection */
.photo-container.leaving {
    transition: all 0.2s ease-in;
    transform: scale(0.9);
    opacity: 0;
}
.photo-container.exit-left {
    transition: all 0.2s ease-in;
    transform: translateX(-20%);
    opacity: 0.4;
}
@keyframes enter-right {
    from {
        transform: translateX(20%);
        opacity: 0.4;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
.photo-container.enter-right {
    animation: enter-right 0.2s ease-out forwards;
}
.viewer-container{
    z-index: 101 !important;
}
/* Extra icons */
.icon-video-white {
    position: absolute;
    top: 8px;
    right: 8px;
    transition: padding 0.1s ease-in-out;
}

img {
    background-clip: content-box;
    background-color: #eee;
    padding: 2px;
    object-fit: cover;
    border-radius: 3%;
    cursor: pointer;
    width: 100%; height: 100%;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
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

.photo-container:hover .icon-checkmark {
    opacity: 0.7;
}
.photo-container.selected .icon-checkmark {
    opacity: 0.9;
    filter: invert();
}
.photo-container.selected .img-outer {
    padding: 6%;
}
.photo-container.selected img {
    box-shadow: 0 0 6px 2px #000;
}
.icon-checkmark {
    opacity: 0;
    position: absolute;
    top: 8px; left: 8px;
    background-color: #fff;
    border-radius: 50%;
    background-size: 80%;
    padding: 5px;
    cursor: pointer;
}
/* Actual image */
.img-outer {
    padding: 2px;
    transition: all 0.1s ease-in-out;
}
</style>