<template>
    <!-- Top bar for selections etc -->
    <div v-if="selection.size > 0" class="top-bar">
        <div class="icon-container">
            <Icon icon='material-symbols:close' class="btn text-lg" @click="clearSelection()"></Icon>
        </div>
        <div class="text">
            {{ selection.size }} item(s) selected
        </div>
        <div class="icon-container" @click="deleteSelection">
            <Icon icon='material-symbols:delete-outline' class="btn text-lg"></Icon>
        </div>
        <v-menu offset-y>
            <template v-slot:activator="{ props }">
                <div class="icon-container" v-bind="props">
                    <Icon icon='material-symbols:more-horiz' class="btn text-lg"></Icon>
                </div>
            </template>
            <v-list>
                <v-list-item class="v-list-item" @click="favoriteSelection">
                    <v-list-item-title class="v-list-item-title">Favorite</v-list-item-title>
                </v-list-item>
                <v-list-item class="v-list-item" @click="editDateSelection">
                    <v-list-item-title class="v-list-item-title">EditDate</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <v-list-item-title>Action</v-list-item-title>
                </v-list-item>
            </v-list>
        </v-menu>

        <EditDate ref="editDate" />
    </div>
</template>
<script lang="ts">
import { Icon } from '@iconify/vue'
import { IHeadRow, IPhoto } from '../types';
import EditDate from "./EditDate.vue";
import { c } from "../constants";
import * as dav from "../DavRequest"
const baseUrl = '/dev-api';
export default {
    name: 'SelectionManager',
    components: {
        Icon,
        EditDate,
    },
    props: {
        selection: {
            type: Object as () => Map<number, IPhoto>,
            required: true,
        },
        heads: {
            type: Object as () => { [dayid: number]: IHeadRow },
            required: true,
        },
    },
    data() {
        return {
            /** Flag consts */
            c: c,
        }
    },
    mounted() {
    },
    methods: {
        /**
         * Open the edit date dialog
         */
        async editDateSelection() {
            (<any>this.$refs.editDate).open(Array.from(this.selection.values()));
        },
        /** Clear all selected photos */
        clearSelection(only?: Set<IPhoto>) {
            const heads = new Set<IHeadRow>();
            const toClear: IterableIterator<IPhoto> = only || this.selection.values();
            Array.from(toClear).forEach((photo: IPhoto) => {
                photo.flag &= ~c.FLAG_SELECTED;
                if (photo.d) {
                    heads.add(this.heads[photo.d.dayid]);
                }
                this.selection.delete(photo.fileid);
            })
            heads.forEach(this.updateHeadSelected);
            this.$forceUpdate();
        },
        /** Check if the day for a photo is selected entirely */
        updateHeadSelected(head: IHeadRow) {
            let selected = true;
            // Check if all photos are selected
            if (head.day && head.day.rows) {
                for (const row of head.day.rows) {
                    if (row.photos) {
                        for (const photo of row.photos) {
                            if (!(photo.flag & c.FLAG_SELECTED)) {
                                selected = false;
                                break;
                            }
                        }
                    }
                }
            }
            // Update head
            head.selected = selected;
        },
        /** Add a photo to selection list */
        selectPhoto(photo: IPhoto, val?: boolean, noUpdate?: boolean) {
            if (photo.flag & this.c.FLAG_PLACEHOLDER ||
                photo.flag & this.c.FLAG_IS_FOLDER ||
                photo.flag & this.c.FLAG_IS_TAG
            ) {
                return; // ignore placeholders
            }

            const nval = val ?? !this.selection.has(photo.fileid);
            if (nval) {
                photo.flag |= this.c.FLAG_SELECTED;
                this.selection.set(photo.fileid, photo);
            } else {
                photo.flag &= ~this.c.FLAG_SELECTED;
                this.selection.delete(photo.fileid);
            }

            if (!noUpdate) {
                if (photo.d) {
                    this.updateHeadSelected(this.heads[photo.d.dayid]);
                    this.$forceUpdate();
                }
            }
        },
        /** Select or deselect all photos in a head */
        selectHead(head: IHeadRow) {
            head.selected = !head.selected;
            if (head.day && head.day.rows) {
                for (const row of head.day.rows) {
                    if (row.photos) {
                        for (const photo of row.photos) {
                            this.selectPhoto(photo, head.selected, true);
                        }
                    }
                }
            }

            this.$forceUpdate();
        },
        /**
    * Check if all files selected currently are favorites
    */
        allSelectedFavorites() {
            return Array.from(this.selection.values() as IPhoto[]).every((p) => p.flag & c.FLAG_IS_FAVORITE);
        },
        /**
         * Favorite the currently selected photos
         */
        async favoriteSelection() {
            try {
                const val = !this.allSelectedFavorites();
                this.$emit('updateLoading', 1);
                for await (const favIds of dav.favoriteFilesByIds(Array.from(this.selection.keys()), val)) {
                    console.log(`favIds->`, favIds)
                    favIds.forEach(id => {
                        const photo = this.selection.get(id);
                        if (!photo) {
                            return;
                        }

                        if (val) {
                            photo.flag |= c.FLAG_IS_FAVORITE;
                        } else {
                            photo.flag &= ~c.FLAG_IS_FAVORITE;
                        }
                    });
                }
                this.clearSelection();
            } finally {
                this.$emit('updateLoading', -1);
            }
        },
        /** Delete all selected photos */
        async deleteSelection() {
            if (this.selection.size === 0) {
                return;
            }

            try {
                this.$emit('updateLoading', 1);
                for await (const delIds of dav.deleteFilesByIds(Array.from(this.selection.keys()))) {
                    const delPhotos = delIds.map(id => this.selection.get(id));
                    this.$emit('delete', delPhotos)
                }
            } catch (error) {
                console.error(error);
            } finally {
                this.$emit('updateLoading', -1);
            }
        },
    }
}
</script>
<style lang="scss" scoped>
/** Top bar */
.top-bar {
    position: absolute;
    font-size: 0.9rem;
    top: 3px;
    right: 15px;
    padding: 6px;
    width: 400px;
    max-width: calc(100vw - 30px);
    background-color: #fff;
    box-shadow: 0 0 2px gray;
    border-radius: 10px;
    opacity: 0.95;
    display: flex;
    vertical-align: middle;
    align-items: center;
    justify-content: space-around;
    margin-right: 2rem;

    >.text {
        flex-grow: 1;
        line-height: 40px;
        padding-left: 8px;
    }

    @media (max-width: 768px) {
        top: 35px;
        right: 15px;
    }
}

.top-bar .btn {
    display: inline-block;
    margin-right: 3px;
    cursor: pointer;
}

.icon-container {
    display: inline-block;
    position: relative;
    margin: 0 0.5rem 0.3rem 0.5rem;
}

.icon-container:hover::before {
    opacity: 1;
}

.icon-container::before {
    content: '';
    opacity: 0;
    position: absolute;
    top: 56%;
    left: 45%;
    width: 30px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: -1;
    /* 背景在图标下面 */
    transition: opacity 0.3s;
}
.v-list-item {
  min-height: 2.2rem;
  .v-list-item-title {
    font-size: 0.8rem;
  }
}
</style>