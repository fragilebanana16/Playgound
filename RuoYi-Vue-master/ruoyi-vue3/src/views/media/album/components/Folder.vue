<template>
    <div class="folder fill-block dark:bg-[#636463]" @click="openFolder(data.fileid)"
        v-bind:class="{
        hasPreview: previewFileInfos.length > 0,
        onePreview: previewFileInfos.length === 1,
    }">
        <div class="big-icon fill-block">
            <Icon icon='entypo:folder' class="text-xl text-white icon-folder"></Icon>
            <div class="name">{{ data.name }}</div>
        </div>
        <div class="previews fill-block">
            <div class="img-outer" v-for="info of previewFileInfos" :key="info.fileid">
                <img class="fill-block" :class="{ 'error': info.flag & c.FLAG_LOAD_FAIL }"
                :key="info.fileid" :src="info.url" 
                @error="info.flag |= c.FLAG_LOAD_FAIL"/>
            </div>
        </div>
    </div>
</template>
<script>
import { Icon } from '@iconify/vue'
import { c } from "../constants";

const baseUrl = '/dev-api';
const previewArr = [
    "A Sky Full of Stars - Coldplay.jpg", "After All - Elton John,Charlie Puth.jpg", "Attention - Charlie Puth.jpg",
    "Beautiful Mistakes - Maroon 5,Megan Thee Stallion.jpg", "Bring Me Back (feat. Claire Ridgely) - Miles Away.jpg",
    "Can We Kiss Forever-Kina,Adriana Proenza.jpg", "Ceasefire - BEAUZ,Luke Anders,Ducka Shan,Becca Krueger,Eliason.jpg",
    "Click - Jake Miller.jpg", "Clsr (Aash Mehta Flip) - The Chainsmokers,Aash Mehta,Halsey.jpg",
    "Dangerously - Charlie Puth.jpg", "Daylight - Maroon 5.jpg", "Deep End - William Black.jpg",]
export default {
    name: 'Folder',
    components: {
        Icon
    },
    props: {
        data: {
            /** @type {IFolder} */
            type: Object,
            required: true
        }
    },
    data() {
        return {
            previewFileInfos: [],
            /** Flag consts */
            c:c,
        }
    },
    mounted() {
        const prefix = baseUrl + '/music/covers/'

        function getRandomElements(arr, count) {
            const shuffled = [...arr].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        }
        this.previewFileInfos = getRandomElements(previewArr, 4).map((url, index) => { return { id: index, url: prefix + url }; });
    },
    methods: {
        /** Open album folder :IFolder*/
        openFolder(id) {
            this.$router.push({ path: `/media/album/folder/${id}` }); // const path = folder.path.split('/').slice(3).join('/')
        },
    }
}
</script>
<style lang="scss" scoped>
// Fill all available space
.fill-block {
    width: 100%;
    height: 100%;
    display: block;
}

.folder {
    cursor: pointer;

    .name {
        cursor: pointer;
        width: 100%;
        padding: 0 5%;
        text-align: center;
        font-size: 1.08em;
        word-wrap: break-word;
        text-overflow: ellipsis;
        max-height: 35%;
        line-height: 1em;
    }
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

.big-icon {
    cursor: pointer;
    z-index: 100;
    position: absolute;
    top: 0;
    left: 0;
    transition: opacity 0.2s ease-in-out;

    .folder.hasPreview & {
        .icon-folder {
            opacity: 1;
        }

        .name {
            color: white;
        }
    }

    .folder.hasPreview:hover & {
        opacity: 0;
    }

    .icon-folder {
        cursor: pointer;
        height: 65%;
        width: 100%;
        opacity: 0.3;
        background-size: 40%;
        background-position: bottom;
    }
}

.previews {
    z-index: 3;
    line-height: 0;
    position: absolute;
    height: calc(100% - 4px);
    width: calc(100% - 4px);
    top: 2px;
    left: 2px;
    @media (max-width: 768px) { padding: 1px; }

    padding: 0;
    border-radius: 0;
    display: inline-block;
    filter: brightness(50%);
    transition: filter 0.2s ease-in-out;

    > .img-outer {
        padding: 0;
        margin: 0;
        width: 50%;
        height: 50%;
        display: inline-block;
        transition: filter 0.2s ease-in-out;
        filter: brightness(50%);

        .folder.onePreview & {
            width: 100%;
            height: 100%;
        }
        > img {
            &.error { display: none; }
            .folder:hover & { filter: brightness(100%); }
        }
    }
}</style>