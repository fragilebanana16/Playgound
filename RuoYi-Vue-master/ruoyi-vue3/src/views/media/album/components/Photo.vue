<template>
    <div class="p-outer" :class="{
        'selected': (data.flag & c.FLAG_SELECTED),
        // 'p-loading': !(data.flag & c.FLAG_LOADED),
        'leaving': (data.flag & c.FLAG_LEAVING),
        'exit-left': (data.flag & c.FLAG_EXIT_LEFT),
        'enter-right': (data.flag & c.FLAG_ENTER_RIGHT),
    }">
        <Icon icon='material-symbols:check-circle-rounded' v-if="!(data.flag & c.FLAG_PLACEHOLDER)"
            class="icon-checkmark select text-lg" @click="toggleSelect"></Icon>
        <Icon v-if="data.flag & c.FLAG_IS_VIDEO" icon='iconamoon:folder-video-fill'
            class="text-xl text-white icon-video-white"></Icon>
        <Icon v-if="data.flag & c.FLAG_IS_FAVORITE" icon='uis:favorite' class="text-white icon-starred"></Icon>
        <div class="img-outer" :style="{
            width: rowHeight + 'px',
            height: rowHeight + 'px',
        }">
            <img @click="click(collection, data.url)" @contextmenu="contextmenu" @touchstart="touchstart"
                @touchend="touchend" @touchmove="touchend" @touchcancel="touchend" :src="getUrl()" :key="data.fileid"
                @load="data.flag |= c.FLAG_LOADED" @error="handleImageError" />
        </div>
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'
import errorsvg from '@/assets/images/error.svg'
import {c} from '../constants'
export default {
    name: 'Photo',
    components: {
        Icon
    },
    props: {
        data: {
            /** @type {IPhoto} */
            type: Object,
            required: true,
        },
        collection: {
            /** @type {IPhoto[]} */
            type: Object,
            required: true
        },
        rowHeight: {
            type: Number,
            required: true,
        },
        day: {
            /** @type {IDay} */
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            touchTimer: 0,
            c:c,
        }
    },
    methods: {
        /** Get URL for image to show */
        getUrl() {
            if (this.data.flag & c.FLAG_PLACEHOLDER) {
                return '';
            } else if (this.data.flag & c.FLAG_LOAD_FAIL) {
                return errorsvg;
            } else if (this.data.flag & c.FLAG_FORCE_RELOAD) {
                this.data.flag &= ~c.FLAG_FORCE_RELOAD;
                return undefined;
            } else {
                return this.data.url
            }
        },
        getCurrentImage() {
            const currentImage = this.collection[0]; // todo get index?
            return currentImage;
        },

        /**
         * 
         * Pass to parent
         * 
         * @param {IPhoto[]} photos - 233
         */
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
            if (this.data.flag & c.FLAG_PLACEHOLDER) {
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
                                this.day.fileInfos = this.day.detail.slice(0, 2);
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
            // Get IPhotos of the deleted file Ids
            const remPhotos = this.day.detail.filter(p => remIds.has(p.fileid));
            this.$emit('delete', remPhotos);
        },
        toggleSelect() {
            if (this.data.flag & this.collection.FLAG_PLACEHOLDER) {
                return;
            }
            this.$emit('select', this.data);
        },
        handleImageError(event) {
            event.target.src = errorsvg
            this.data.flag |= (c.FLAG_LOADED | c.FLAG_LOAD_FAIL);
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
<style lang="scss">
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

.viewer-container {
    z-index: 101 !important;
    /* 弹窗在预览之上 */
}
</style>
<style lang="scss" scoped>
/* Container and selection */
.p-outer {
    &.leaving {
        transition: all 0.2s ease-in;
        transform: scale(0.9);
        opacity: 0;
    }

    &.exit-left {
        transition: all 0.2s ease-in;
        transform: translateX(-20%);
        opacity: 0.4;
    }

    &.enter-right {
        animation: enter-right 0.2s ease-out forwards;
    }
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

/* Extra icons */
.icon-video-white {
    position: absolute;
    background-size: 100%;
    height: 20px;
    width: 20px;
    top: 10px;
    right: 10px;
    z-index: 100;
}

.icon-starred {
    position: absolute;
    background-size: 100%;
    height: 24px;
    width: 24px;
    bottom: 10px;
    left: 10px;
    z-index: 100;
    pointer-events: none;
}

img {
    background-clip: content-box;
    background-color: #eee;
    padding: 2px;
    object-fit: cover;
    border-radius: 3%;
    cursor: pointer;
    width: 100%;
    height: 100%;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;

    .selected & {
        box-shadow: 0 0 6px 2px #eee;
    }

    .p-loading & {
        opacity: 0;
    }
}

.icon-checkmark {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
    color: #fff;
    border-radius: 50%;
    background-size: 80%;
    cursor: pointer;
    opacity: 0;

    .p-outer:hover & {
        opacity: 0.9;
    }

    .selected & {
        opacity: 0.9;
        filter: invert(1);
    }
}

/* Actual image */
div.img-outer {
    padding: 2px;
    transition: transform 0.1s ease-in-out;
    background-clip: content-box, padding-box;

    .selected > & {
        // 父元素是 class 为 selected 的元素，并且 .img-outer 是该 selected 元素的 直接 子元素，实测.selected  &也能触发
        transform: scale(0.9); 
    }

    .p-loading & {
        background-color: #fff;
    }
}</style>