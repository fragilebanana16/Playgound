<template>
    <div>
        <Icon v-if="data.is_video" icon='iconamoon:folder-video-fill' class="text-xl text-white icon-video-white"></Icon>
        <img @click="show(collection, data.url)" :src="data.ph ? undefined : data.url" :key="data.file_id" @error="handleImageError" alt="mountains" v-bind:style="{
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
                    initialViewIndex: curIndex
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
</style>