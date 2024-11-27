<template>
    <div class="folder dark:bg-[#636463]" @click="openFolder(data.file_id)" 
    v-bind:class="{
        hasPreview: previewFileInfos.length > 0,
        onePreview: previewFileInfos.length === 1,}" 
    v-bind:style="{
        width: rowHeight + 'px',
        height: rowHeight + 'px',
    }">
    <div class="big-icon">
        <Icon icon='entypo:folder' class="text-xl text-white icon-folder"></Icon>
        <div class="name">{{ data.name }}</div>
    </div>
    <div class="previews">
            <img v-for="info of previewFileInfos" :key="info.id"
                :src="info.url" />
        </div>
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'
const baseUrl = '/dev-api';
const previewArr = [
    "A Sky Full of Stars - Coldplay.jpg", "After All - Elton John,Charlie Puth.jpg","Attention - Charlie Puth.jpg",
    "Beautiful Mistakes - Maroon 5,Megan Thee Stallion.jpg","Bring Me Back (feat. Claire Ridgely) - Miles Away.jpg",
    "Can We Kiss Forever-Kina,Adriana Proenza.jpg","Ceasefire - BEAUZ,Luke Anders,Ducka Shan,Becca Krueger,Eliason.jpg",
    "Click - Jake Miller.jpg","Clsr (Aash Mehta Flip) - The Chainsmokers,Aash Mehta,Halsey.jpg",
    "Dangerously - Charlie Puth.jpg","Daylight - Maroon 5.jpg","Deep End - William Black.jpg",]
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
        data() {
        return {
            previewFileInfos: [],
        }
    },
    mounted() {
        const prefix = baseUrl + '/music/covers/'

        function getRandomElements(arr, count) {
                const shuffled = [...arr].sort(() => Math.random() - 0.5);
                return shuffled.slice(0, count);
        }
        this.previewFileInfos =  getRandomElements(previewArr, 4).map((url, index) => { return { id: index, url: prefix + url};});
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
    font-size: 1.08em;
    word-wrap: break-word;
    text-overflow: ellipsis;
    max-height: 35%;
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
.big-icon {
    cursor: pointer;
    z-index: 100;
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    transition: opacity 0.2s ease-in-out;
}
.folder.hasPreview .big-icon .name {
    color: white;
}
.folder.hasPreview:hover .big-icon {
    opacity: 0;
}
.folder:hover .previews img {
    filter: brightness(100%);
}
.previews {
    z-index: 3;
    line-height: 0;
    position: absolute;
    height: calc(100% - 4px);
    width: calc(100% - 4px);
    top: 2px; left: 2px;
}
.previews img {
    padding: 0;
    width: 50%;
    height: 50%;
    border-radius: 0;
    display: inline-block;
    filter: brightness(50%);
    transition: filter 0.2s ease-in-out;
}
.previews img:nth-of-type(1) { border-top-left-radius: 3px; }
.previews img:nth-of-type(2) { border-top-right-radius: 3px; }
.previews img:nth-of-type(3) { border-bottom-left-radius: 3px; }
.previews img:nth-of-type(4) { border-bottom-right-radius: 3px; }
.folder.onePreview .previews img {
    width: 100%;
    height: 100%;
    border-radius: 3px;
}
</style>