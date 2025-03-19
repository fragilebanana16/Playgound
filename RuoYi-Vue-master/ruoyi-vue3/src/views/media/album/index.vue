<template>
    <div class="album-container" ref="container" :v-loading="loading > 0">
        <!-- size-field look for item, item-size="300"-->
        <RecycleScroller ref="recycler" class="recycler" :items="list" size-field="size" key-field="id" v-slot="{ item }"
            :emit-update="true" @update="scrollChange" @resize="handleResizeWithDelay">
            <div v-if="item.type === 0" class="head-row" :class="{
                'selected': item.selected,
            }">
                <div class="super" v-if="item.super !== undefined">
                    {{ item.super }}
                </div>
                <div class="main" @click="selectionManager.selectHead(item)">
                    <Icon icon='material-symbols:check-circle-rounded' class="btn text-lg select" @click="selectionManager.selectHead(item)" />
                    <span class="name">
                        {{ item.name || getHeadName(item) }}
                    </span>
                </div>
            </div>
            <div v-else class="photo-row" :style="{ height: rowHeight + 'px' }">
                <div class="photo" v-for="photo of item.photos" :key="photo.fileid">
                    <Folder v-if="photo.flag & c.FLAG_IS_FOLDER" :data="photo" :rowHeight="rowHeight" :key="photo.fileid" />
                    <Photo v-else :data="photo" :rowHeight="rowHeight" :day="item.day" :collection="item.photos"
                        @select="selectionManager.selectPhoto" @delete="deleteFromViewWithAnimation" @clickImg="clickPhoto" />
                </div>
            </div>
        </RecycleScroller>

        <!-- Managers -->
        <ScrollerManager ref="scrollerManager"
             :rows="list"
             :height="scrollerHeight"
             :recycler="$refs.recycler" />
        <SelectionManager ref="selectionManager"
             :selection="selection" :heads="heads"
             @delete="deleteFromViewWithAnimation"
             @updateLoading="updateLoading" />
    </div>
</template>

<script lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { defineComponent } from "vue";
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { Icon } from '@iconify/vue'
import Folder from "./components/Folder.vue";
import Photo from "./components/Photo.vue";
import { TagDayID, c } from "./constants";
import * as utils from "./utils";
import * as dav from "./DavRequest"
import { IDay, IHeadRow, IPhoto, IRow, IRowType, ITick } from "./types";
import moment from 'moment';
import SelectionManager from './components/SelectionManager.vue';
import ScrollerManager from './components/ScrollerManager.vue';
const router = useRoute()
const DESKTOP_ROW_HEIGHT = 200; // Height of row on desktop
const MOBILE_ROW_HEIGHT = 120; // Approx row height on mobile
const baseUrl = '/dev-api';
const SCROLL_LOAD_DELAY = 100; // Delay in loading data when scrolling
const MAX_PHOTO_WIDTH = 175;
const MIN_COLS = 3;

const MOCK_IMG_DATA = [
    "A Sky Full of Stars - Coldplay.jpg",
    "After All - Elton John,Charlie Puth.jpg",
    "Attention - Charlie Puth.jpg",
    "Beautiful Mistakes - Maroon 5,Megan Thee Stallion.jpg",
    "Bring Me Back (feat. Claire Ridgely) - Miles Away.jpg",
    "Can We Kiss Forever-Kina,Adriana Proenza.jpg",
    "Ceasefire - BEAUZ,Luke Anders,Ducka Shan,Becca Krueger,Eliason.jpg",
    "Click - Jake Miller.jpg",
    "Clsr (Aash Mehta Flip) - The Chainsmokers,Aash Mehta,Halsey.jpg",
    "Dangerously - Charlie Puth.jpg",
    "Daylight - Maroon 5.jpg",
    "Deep End - William Black.jpg",
    "Disenchanted - My Chemical Romance.jpg",
    "Diviners & Azertion - Feelings Mp3 Download by NCS - Files Garage.jpeg",
    "Don't Say (Felix Palmqvist & Severo Remix) - The Chainsmokers,Emily Warren,Felix Palmqvist,Severo.jpg",
    "Empire Of Angels - Two Steps From Hell.jpg",
    "Empty Cups - Charlie Puth.jpg",
    "Everglow - Coldplay.jpg",
    "Fix You - Coldplay.jpg",
    "Free(From Disney's The One And Only Ivan) - Charlie Puth.jpg",
    "Girls Like You - Maroon 5,Cardi B.jpg",
    "Gotta Be You - One Direction.jpg",
    "History - One Direction.jpg",
    "How Long - Charlie Puth.jpg",
    "Is It Just Me (feat. Charlie Puth) - Sasha Alex Sloan.jpg",
    "Jealous - Faustix.jpg",
    "Just A Feeling - Maroon 5.jpg",
    "Keep You Mine - NOTD,SHY Martin.jpg",
    "Left and Right (Feat. Jung Kook of BTS) - Charlie Puth,BTS (防弹少年团).jpg",
    "Let Somebody Go - Coldplay,Selena Gomez.jpg",
    "Like 1999 - Valley.jpg",
    "Love You Like the Movies - Anthem Lights.jpg",
    "Maps - Maroon 5.jpg",
    "Memories - Maroon 5.jpg",
    "Miracles - Coldplay.jpg",
    "Night Changes - One Direction.jpg",
    "No More Drama - Charlie Puth.jpg",
    "Nobody Compares - One Direction.jpg",
    "One Thing - One Direction.jpg",
    "Oops - Little Mix,Charlie Puth.jpg",
    "Overtime - Cash Cash.jpg",
    "Paradise - Coldplay.jpg",
    "Patient - Charlie Puth.jpg",
    "Payphone - Maroon 5,Wiz Khalifa.jpg",
    "Rum n Tequila - John K.jpg",
    "Say Something - A Great Big World.jpg",
    "See You Again - Wiz Khalifa,Charlie Puth.jpg",
    "Slow Down - Madnap,Pauline Herr.jpg",
    "Slow It Down - Charlie Puth.jpg",
    "Something Just Like This - The Chainsmokers,Coldplay.jpg",
    "Sugar - Maroon 5.jpg",
    "sun and moon - Anees.jpg",
    "Sunroof - Nicky Youre,Dazy.jpg",
    "That's Hilarious - Charlie Puth.jpg",
    "THATS WHAT I WANT - Lil Nas X.jpg",
    "The Scientist - Coldplay.jpg",
    "The Way I Am - Charlie Puth.jpg",
    "Viva La Vida - Coldplay.jpg",
    "Waiting For Love - Avicii,Martin Garrix,Simon Aldred.jpg",
    "Waiting for You - Daniel Padim.jpg",
    "We All Want the Same Thing - Push Baby.jpg",
    "What Lovers Do - Maroon 5,SZA.jpg",
    "What Makes You Beautiful - One Direction.jpg",
];

export default {
    components: {
        RecycleScroller,
        Icon,
        Folder,
        Photo,
        SelectionManager,
        ScrollerManager
    },
    data() {
        return {
            images: [
                "https://picsum.photos/200/200",
                "https://picsum.photos/300/200",
                "https://picsum.photos/250/200"
            ],
            /** Loading days response */
            loading: 0,
            /** Main list of rows */
            list: [] as IRow[],
            /** Counter of rows */
            numRows: 0,
            /** Computed number of columns */
            numCols: 5,
            /** Header rows for dayId key */
            heads: {} as { [dayid: number]: IHeadRow },
            /** Original days response */
            days: [],
            /** Computed row height */
            rowHeight: 100,
            /** Current start index */
            currentStart: 0,
            /** Current end index */
            currentEnd: 0,
            /** State for request cancellations */
            state: Math.random(),
            /** Resizing timer */
            resizeTimer: null,
            /** Height of the scroller */
            scrollerHeight: 100,
            /** Set of dayIds for which images loaded */
            loadedDays: new Set(),
            /** List of selected file ids */
            selection: new Map<number, IPhoto>(),
            /** Flag consts */
            c:c,
            /** selectionManager */
            selectionManager: SelectionManager,
            /** Scroller manager component */
            scrollerManager: ScrollerManager,
        }
    },

    async mounted() {
        this.selectionManager = this.$refs.selectionManager;
        this.scrollerManager = this.$refs.scrollerManager;
        // // Wait for one tick before doing anything
        await this.$nextTick();
        // Fit to window
        await this.handleResize();
        // Get data
        await this.fetchDays();

        // Timeline recycler init
        this.$refs.recycler.$el.addEventListener('scroll', this.scrollPositionChange, false);
        this.scrollPositionChange();
    },

    watch: {
        $route(from, to) {
            console.log('route changed', from, to)
            this.resetState();
            this.fetchDays();
        },
    },
    beforeDestroy() {
        this.resetState();
    },
    created() {
        window.addEventListener("resize", this.handleResizeWithDelay);
    },
    destroyed() {
        window.removeEventListener("resize", this.handleResizeWithDelay);
    },
    methods: {
        updateLoading(delta: number) {
         this.loading += delta;
        },
        /** Reset all state */
        resetState() {
            this.selectionManager.clearSelection();
            this.loading = 0;
            this.list = [];
            this.numRows = 0;
            this.heads = {};
            this.days = [];
            this.currentStart = 0;
            this.currentEnd = 0;
            this.scrollerManager.reset();
            this.state = Math.random();
            this.loadedDays.clear();
        },
        /** Do resize after some time */
        handleResizeWithDelay() {
            if (this.resizeTimer) {
                clearTimeout(this.resizeTimer);
            }
            this.resizeTimer = setTimeout(() => {
                this.handleResize();
                this.resizeTimer = null;
            }, 300);
        },
        /** Handle window resize and initialization */
        async handleResize() {
            const e = this.$refs.container as Element;
            if (!e) {
                console.log('handleResize null e')
                return;
            }
            let height = e.clientHeight;
            let width = e.clientWidth - 40; // 预留和时间线的间距
            this.scrollerHeight = height;
            const recycler = this.$refs.recycler as any;
            recycler.$el.style.height = (height - 4) + 'px';
            // Desktop scroller width
            if (window.innerWidth > 768) {
                width -= 40;
            }

            if (this.days.length === 0) {
                // Don't change cols if already initialized
                this.numCols = Math.max(MIN_COLS, Math.floor(width / MAX_PHOTO_WIDTH));
            }
            this.rowHeight = Math.floor(width / this.numCols);

            // Set heights of rows
            this.list.filter(r => r.type !== IRowType.HEAD).forEach(row => {
                row.size = this.rowHeight;
            });
            this.scrollerManager.reflow();
        },

        /**
         * Triggered when position of scroll change.
         * This does NOT indicate the items have changed, only that
         * the pixel position of the recycler has changed.
         */
        scrollPositionChange(event) {
            this.scrollerManager.recyclerScrolled(event)
        },

        /** Trigger when recycler view changes */
        scrollChange(startIndex, endIndex) {
            if (startIndex === this.currentStart && endIndex === this.currentEnd) {
                return;
            }

            // Reset image state
            for (let i = startIndex; i < endIndex; i++) {
                const row = this.list[i];
                if (!row) {
                    continue;
                }
                // Initialize photos and add placeholders
                if (row.pct && !row.photos.length) {
                    row.photos = new Array(row.pct);
                    for (let j = 0; j < row.pct; j++) {
                        row.photos[j] = {
                            flag: c.FLAG_PLACEHOLDER,
                            fileid: `${row.dayId}-${i}-${j}`,
                        };
                    }
                    delete row.pct;
                }
                // Force reload all loaded images
                if ((i < this.currentStart || i > this.currentEnd) && row.photos) {
                    for (const photo of row.photos) {
                        if (photo.flag & c.FLAG_LOADED) {
                            photo.flag = (photo.flag & ~c.FLAG_LOADED) | c.FLAG_FORCE_RELOAD; // Reload only if already loaded
                        }
                    }
                }
            }

            // Make sure we don't do this too often
            this.currentStart = startIndex;
            this.currentEnd = endIndex;
            setTimeout(() => {
                // Get the overlapping range between startIndex and
                // currentStart and endIndex and currentEnd.
                // This is the range of rows that we need to update.
                const start = Math.max(startIndex, this.currentStart);
                const end = Math.min(endIndex, this.currentEnd);
                if (end - start > 0) {
                    this.loadScrollChanges(start, end);
                }
            }, SCROLL_LOAD_DELAY);
        },

        /** Load image data for given view */
        loadScrollChanges(startIndex, endIndex) {
            // Make sure start and end valid
            startIndex = Math.max(0, startIndex);
            endIndex = Math.min(this.list.length - 1, endIndex);
            // Fetch all visible days
            for (let i = startIndex; i <= endIndex; i++) {
                let item = this.list[i];
                if (!item || this.loadedDays.has(item.dayId)) {
                    continue;
                }
                this.loadedDays.add(item.dayId);
                this.fetchDay(item.dayId);
            }
        },

        /** Get query string for API calls */
        appendQuery(url) {
            const query = new URLSearchParams();
            // Favorites
            if (this.$route.name === 'Favorite') {
                query.set('fav', '1');
            }
            
            // Folder
            if (this.$route.name === 'folders') {
                query.set('folder', this.$route.params.path || '/');
            }

            // Create query string and append to URL
            const queryStr = query.toString();
            if (queryStr) {
                url += '?' + queryStr;
            }
            console.log(`appendQuery->`, url)
            return url;
        },

        /** Get name of header */
        getHeadName(head: IHeadRow) {
            // Check cache
            if (head.name) {
                return head.name;
            }
            // Special headers
            if (head.dayId === TagDayID.FOLDERS) {
                head.name = "Folders";
                return head.name;
            }
            // Make date string
            // The reason this function is separate from processDays is
            // because this call is terribly slow even on desktop
            const dateTaken = utils.dayIdToDate(head.dayId);
            const name = utils.getLongDateStr(dateTaken, true);
            // Cache and return
            head.name = name;
            return head.name;
        },

        /** Fetch timeline main call */
        async fetchDays() {
            const data = Array.from({ length: 5 }, (_, index) => ({
                id: '00' + index,
                dayid: index * 1000,
                // const today = new Date();
                // const epoch = new Date(0); // 1970年1月1日
                // const diffTime = today - epoch; // 计算天数差以毫秒为单位
                // const dayid = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 转换为天数
                count: 16, // 这里要和fetchDay的每天数量一致，否则recycle高度和timeline高度不匹配
                detail: [], // [{"fileid": 6580,"dayid": 19355, "w": 4032,"h": 2268, "isfavorite": 1}]
                rows: new Set()
            }));
            let url = '/apps/memories/api/days';
            let params = {};

            try {
                // try {
                // this.loading++;
                // const startState = this.state;
                // let data: IDay[] = [];
                // if (this.$route.name === 'ThisDay') {
                //     data = await dav.getOnThisDayData();
                // } else {
                //     data = (await axios.get<IDay[]>(generateUrl(this.appendQuery(url), params))).data;
                // }
                // mock data
                if (this.$route.name === 'Thisday') {
                    data.splice(0,3);
                }
                // mock data

                // if (this.state !== startState) return;
                // await this.processDays(data);
                // } finally {
                //     this.loading--;
                // }
                this.loading++;
                const startState = this.state;
                this.appendQuery(url) // for test favoirate menu
                if (this.state !== startState) return;
                await this.processDays(data);
            }
            finally {
                this.loading--;
            }
        },
        /** Process the data for days call including folders */
        async processDays(data: IDay[]) {
            const list: typeof this.list = [];
            const heads: typeof this.heads = {};

            // Store the preloads in a separate map.
            // This is required since otherwise the inner detail objects
            // do not become reactive (which happens only after assignment).
            const preloads: {
                [dayId: number]: {
                    day: IDay,
                    detail: IPhoto[],
                };
            } = {};

            let prevDay: IDay | null = null;
            for (const day of data) {
                day.count = Number(day.count);
                day.rows = new Set();
                // Nothing here
                if (day.count === 0) {
                    continue;
                }

                // Add header to list
                const head: IHeadRow = {
                    id: ++this.numRows,
                    size: 40,
                    type: IRowType.HEAD,
                    selected: false,
                    dayId: day.dayid,
                    day: day,
                };

                // Special headers
                if (this.$route.name === 'Thisday' && (!prevDay || Math.abs(prevDay.dayid - day.dayid) > 30)) {
                    // thisday view with new year title
                    head.size = 76;
                    const dateTaken = moment(utils.dayIdToDate(day.dayid));
                    const text = dateTaken.locale('en-US').fromNow();
                    head.super = text.charAt(0).toUpperCase() + text.slice(1);
                }
    
                // Add header to list
                heads[day.dayid] = head;
                list.push(head);

                // Add rows
                const nrows = Math.ceil(day.count / this.numCols);
                for (let i = 0; i < nrows; i++) {
                    const row = this.getBlankRow(day);
                    list.push(row);
                    day.rows.add(row);
                    // Add placeholders wtf?
                    const leftNum = (day.count - i * this.numCols);
                    row.pct = leftNum > this.numCols ? this.numCols : leftNum;
                    row.photos = [];
                }

                // Continue processing
                prevDay = day;
            }

            // Store globally
            this.days = data;
            this.list = list;
            this.heads = heads;

            // Iterate the preload map
            // Now the inner detail objects are reactive
            for (const dayId in preloads) {
                const preload = preloads[dayId];
                preload.day.detail = preload.detail;
                this.processDay(preload.day);
            }

            this.loading = false;
            // Fix view height variable
            await this.scrollerManager.reflow();
        },

        /** Fetch image data for one dayId */
        async fetchDay(dayId) {
            // let url = '/apps/memories/api/days/{dayId}';
            // const params = { dayId };

            // Do this in advance to prevent duplicate requests
            this.loadedDays.add(dayId);
            try {
                const startState = this.state;
                // const res = await axios.get(generateUrl(this.appendQuery(url), params));
                // const data = res.data;

                // *************** mock data ********************
                const prefix = baseUrl + '/music/covers/'
                let data: SongData[] = [];
                type SongData = {
                    fileid: string;
                    url: string;
                    isvideo: boolean;
                    isfavorite: boolean;
                    isfolder: boolean;
                    name: string;
                };

                function getRandomElements(arr, count) {
                    const shuffled = [...arr].sort(() => Math.random() - 0.5);
                    return shuffled.slice(0, count);
                }
                const randomArray = getRandomElements(MOCK_IMG_DATA, 16); // 单日16张
                randomArray.forEach((img, index) => {
                    const fileid = `001${index + 1}`;
                    const url = `${prefix}${img}`;
                    data.push({ fileid, url, isvideo: index % 3 === 0, isfolder: index % 5 === 0, name: 'folder' + index / 5, isfavorite: index % 6 === 0 });
                });

                if (this.state !== startState) return;
                // *************** mock data ********************
                const day = this.days.find(d => d.dayid === dayId);
                day.detail = data;
                day.count = data.length;
                this.processDay(day);
            } catch (e) {
                console.error(e);
            }
        },
        /**
         * Process items from day response.
         * Do not auto reflow if you plan to cal the reflow function later.
         *
         * @param {any} day Day object
         */
        processDay(day) {
            const dayId = day.dayid;
            const data = day.detail;
            const head = this.heads[dayId];
            this.loadedDays.add(dayId);
            // Reset rows including placeholders
            if (head.day?.rows) {
                for (const row of head.day.rows) {
                    row.photos = [];
                }
            }
            if (head.day) {
                head.day.rows.clear();
            }

            // Check if some row was added
            let addedRow = false;

            // Get index of header O(n)
            const headIdx = this.list.findIndex(item => item.id === head.id);
            let rowIdx = headIdx + 1;

            // Add all rows
            let dataIdx = 0;
            while (dataIdx < data.length) {
                // Check if we ran out of rows
                if (rowIdx >= this.list.length || this.list[rowIdx].type === IRowType.HEAD) {
                    addedRow = true;
                    this.list.splice(rowIdx, 0, this.getBlankRow(day));
                }

                const row = this.list[rowIdx];

                // Go to the next row
                if (row.photos.length >= this.numCols) {
                    rowIdx++;
                    continue;
                }

                // Add the photo to the row
                const photo = data[dataIdx];
                if (typeof photo.flag === "undefined") {
                    photo.flag = 0; // flags
                    photo.d = day; // backref to day
                }

                // Flag conversion
                if (photo.isvideo) {
                    photo.flag |= c.FLAG_IS_VIDEO;
                    delete photo.isvideo;
                }
                if (photo.isfavorite) {
                    photo.flag |= c.FLAG_IS_FAVORITE;
                    delete photo.isfavorite;
                }
                if (photo.isfolder) {
                    photo.flag |= this.c.FLAG_IS_FOLDER;
                    delete photo.isfolder;
                }
                this.list[rowIdx].photos.push(photo);
                dataIdx++;

                // Add row to day
                head.day?.rows.add(row);
            }
            // No rows, splice everything including the header
            if (head.day.rows.size === 0) {
                this.list.splice(headIdx, 1);
                rowIdx = headIdx - 1;
                delete this.heads[dayId];
            }

            // Get rid of any extra rows
            let spliceCount = 0;
            for (let i = rowIdx + 1; i < this.list.length && this.list[i].type !== IRowType.HEAD; i++) {
                spliceCount++;
            }
            if (spliceCount > 0) {
                this.list.splice(rowIdx + 1, spliceCount);
            }
            // This will be true even if the head is being spliced
            // because one row is always removed in that case
            // So just reflow the timeline here
            if (addedRow || spliceCount > 0) {
                this.scrollerManager.reflow();
            }
        },

        /** Get a new blank row */
        getBlankRow(day) {
            let rowType = IRowType.PHOTOS;
            if (day.dayid === TagDayID.FOLDERS) {
                rowType = IRowType.FOLDERS;
            }

            return {
                id: ++this.numRows,
                photos: [],
                type: rowType,
                size: this.rowHeight,
                dayId: day.dayid,
                day: day,
            };
        },

        /** Clicking on photo */
        clickPhoto(photoComponent, photos, current) {
            if (this.selection.size > 0) { // selection mode
                photoComponent.toggleSelect();
            } else {
                photoComponent.openFile(photos, current);
            }
        },
        /**
         * Delete elements from main view with some animation
         * This function looks horribly slow, probably isn't that bad
         * in all practical scenarios.
         *
         * This is also going to update day.detail for you and make
         * a call to processDay so just pass it the list of ids to
         * delete and the days that were updated.
         *
         * @param delPhotos photos to delete
         */
        async deleteFromViewWithAnimation(delPhotos: IPhoto[]) {
            if (delPhotos.length === 0) {
                return;
            }

            // Get all days that need to be updatd
            const updatedDays = new Set<IDay>(delPhotos.map(p => p.d as IDay));
            const delPhotosSet = new Set(delPhotos);

            // Animate the deletion
            for (const photo of delPhotos) {
                photo.flag |= c.FLAG_LEAVING;
            }

            // wait for 200ms
            await new Promise(resolve => setTimeout(resolve, 200));

            // clear selection at this point
            this.selectionManager.clearSelection(delPhotos);

            // Speculate day reflow for animation
            const exitedLeft = new Set<IPhoto>();
            for (const day of updatedDays) {
                let nextExit = false;
                for (const row of day.rows ?? []) {
                    for (const photo of row.photos ?? []) {
                        if (photo.flag & c.FLAG_LEAVING) {
                            nextExit = true;
                        } else if (nextExit) {
                            photo.flag |= c.FLAG_EXIT_LEFT;
                            exitedLeft.add(photo);
                        }
                    }
                }
            }
            // wait for 200ms
            await new Promise(resolve => setTimeout(resolve, 200));

            for (const day of updatedDays) {
                day.detail = (day.detail ?? []).filter(p => !delPhotosSet.has(p));
                day.count = day.detail.length;
                this.processDay(day);
            }

            // Enter from right all photos that exited left
            exitedLeft.forEach((photo) => {
                photo.flag &= ~c.FLAG_EXIT_LEFT;
                photo.flag |= c.FLAG_ENTER_RIGHT;
            });

            // wait for 200ms
            await new Promise(resolve => setTimeout(resolve, 200));
            // Clear enter right flags
            exitedLeft.forEach((photo) => {
                photo.flag &= ~c.FLAG_ENTER_RIGHT;
            });

            // Reflow timeline
            this.scrollerManager.reflow();
        },
    },
}

</script>

  
<style lang="scss" scoped>
@mixin phone {
    @media (max-width: 768px) {
        @content;
    }
}

.album-container {
    height: calc(100vh - 84px);
    width: 100%;
    overflow: hidden;
    user-select: none;
    /* no text will be selected  */
    * {
        -webkit-tap-highlight-color: transparent; // Disable webkit tap highlight, seems useless?
        -webkit-touch-callout: none;
    }
}

.recycler {
    height: 300px;
    width: calc(100% + 20px);
}

.photo-row>.photo {
    display: inline-block;
    position: relative;
    cursor: pointer;
    vertical-align: top;
}

.head-row {
    padding-top: 10px;
    padding-left: 3px;
    font-size: 0.9em;
    > div {
         position: relative;
         &.super {
             font-size: 1.3em;
             font-weight: bold;
             margin-bottom: 4px;
         }
         &.main { font-weight: 600; }
    }

    .select {
        position: absolute;
        left: 0px; top: 50%;
        color: #000000;
        display: none;
        transform: translateY(-50%);
        transition: opacity 0.2s ease;
        border-radius: 50%;
        background-size: 70%;
        cursor: pointer;
    }

    .name {
        display: block;
        transition: transform 0.2s ease;
        cursor: pointer;
    }

    .hover &,
    &.selected {
        .select {
            display: inline-block;
            opacity: 1;
        }

        .name {
            transform: translateX(22px);
        }
    }

    &.selected .select { opacity: 1; }

    @include phone { transform: translateX(8px); }
}
.photo-row .photo::before {
    content: "";
    position: absolute;
    display: block;
    height: calc(100% - 4px);
    width: calc(100% - 4px);
    top: 2px;
    left: 2px;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 95%);
    opacity: 0;
    border-radius: 3px;
    transition: opacity .1s ease-in-out;
    pointer-events: none;
    user-select: none;
}

.photo-row .photo:hover::before {
    opacity: 1;
}

</style>