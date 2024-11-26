<template>
    <div class="folder dark:bg-[#636463]" @click="openFolder(data.file_id)" v-bind:style="{
        width: rowHeight + 'px',
        height: rowHeight + 'px',
    }">
        <Icon icon='entypo:folder' class="text-xl dark:text-white icon-folder"></Icon>
        <div class="name">{{ data.name }}</div>
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'

export default {
    name: 'Folder',
    components: {
        Icon
    },
    props: {
        data: {
            type: Object,
            required: true
        },
        rowHeight: {
            type: Number,
            required: true,
        }
    },
    methods: {
        /** Open album folder */
        openFolder(id) {
            this.$router.push({ path: `/media/album/folder/${id}` });
        },
    }
}
</script>
<style>

.folder {
    cursor: pointer;
    background-clip: content-box;
    padding: 2px;
    object-fit: cover;
    border-radius: 3%;
}

.folder .name {
    cursor: pointer;
    position: absolute;
    width: 100%;
    top: 80%;
    text-align: center;
}

.icon-folder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    background-size: 40%;
    height: 60%;
    width: 100%;
    background-position: bottom;
    opacity: 0.6;
}
</style>