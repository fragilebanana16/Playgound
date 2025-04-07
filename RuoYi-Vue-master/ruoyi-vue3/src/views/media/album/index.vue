<template>
    <div class="album-container" ref="container" :v-loading="loading > 0">
        <!-- size-field look for item, item-size="300"-->
        <RecycleScroller ref="recycler" class="recycler" :items="list" size-field="size" key-field="id" v-slot="{ item }"
            :emit-update="true" @update="scrollChange" @resize="handleResizeWithDelay">
            <div v-if="item.type === 0" class="head-row" :class="{
                'selected': item.selected,
            }" :style="{ height: item.size + 'px' }" :key="item.id">
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
            <!-- <template v-else>本身不会生成 DOM 元素，只会将它包裹的内容插入到父元素中 -->
            <template v-else>
                <div class="photo-row" :style="{ height: item.size + 'px', width: rowWidth + 'px' }">
                    <div class="photo" v-for="photo in item.photos" :key="photo.fileid" 
                            :style="{
                                height: photo.dispH ? photo.dispH + 'px' : undefined,
                                width: photo.dispWp * rowWidth + 'px',
                                transform: 'translateX(' + photo.dispXp * rowWidth + 'px) translateY(' + photo.dispY + 'px)',
                            }">
                        <Folder v-if="photo.flag & c.FLAG_IS_FOLDER" :data="photo" :key="photo.fileid" />
                        <Photo v-else :data="photo" :day="item.day" :collection="item.photos"
                            @select="selectionManager.selectPhoto" @delete="deleteFromViewWithAnimation" @clickImg="clickPhoto" />
                    </div>
                </div>
            </template>
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
import justifiedLayout from "justified-layout";
const router = useRoute()
const MOBILE_ROW_HEIGHT = 120; // Approx row height on mobile
const ServerUrl = '/dev-api';
const SCROLL_LOAD_DELAY = 100; // Delay in loading data when scrolling
const DESKTOP_ROW_HEIGHT = 200; // Height of row on desktop
 const MOBILE_NUM_COLS = 3; // Number of columns on phone

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
            numCols: 0,
            /** Keep all images square */
            squareMode: false,
            /** Header rows for dayId key */
            heads: {} as { [dayid: number]: IHeadRow },
            /** Original days response */
            days: [],
            /** Computed row height */
            rowHeight: 100,
            /** Computed row width */
            rowWidth: 100,
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
        // Timeline recycler init
        this.$refs.recycler.$el.addEventListener('scroll', this.scrollPositionChange, false);
        // Get data
        await this.fetchDays();
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
            this.heads = {};
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
            this.rowWidth = e.clientWidth - 40; // 预留和时间线的间距
            this.scrollerHeight = height;
            const recycler = this.$refs.recycler as any;
            recycler.$el.style.height = (height - 4) + 'px';
            if (window.innerWidth <= 768) {
                // Mobile
                this.numCols = MOBILE_NUM_COLS;
                this.rowHeight = Math.floor(this.rowWidth / this.numCols);
                this.squareMode = true;
            } else {
                // Desktop
                this.rowWidth -= 40;
                this.rowHeight = DESKTOP_ROW_HEIGHT;
                this.squareMode = false; // todo: can be set with localStorage.setItem
                if (this.squareMode) {
                 // Set columns first, then height
                 this.numCols = Math.max(3, Math.floor(this.rowWidth / DESKTOP_ROW_HEIGHT));
                 this.rowHeight = Math.floor(this.rowWidth / this.numCols);
                } else {
                    // As a heuristic, assume all images are 4:3 landscape
                    this.rowHeight = DESKTOP_ROW_HEIGHT;
                    this.numCols = Math.ceil(this.rowWidth / (this.rowHeight * 4 / 3));
                }
            }
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
                        // Any row that has placeholders has ONLY placeholders
                        // so we can calculate the display width
                        row.photos[j] = {
                            flag: c.FLAG_PLACEHOLDER,
                            fileid: `${row.dayId}-${i}-${j}`,
                            dispWp: utils.round(1 / this.numCols, 4, true),
                            dispXp: utils.round(j / this.numCols, 4, true),
                            dispY: 0,
                        };
                    }
                    delete row.pct;
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
        /** Store the current scroll position to restore later */
        getScrollY() {
            const recycler = this.$refs.recycler as any;
            return recycler.$el.scrollTop
        },
        /** Restore the stored scroll position */
        setScrollY(y: number) {
            const recycler = this.$refs.recycler as any;
            recycler.scrollToPosition(y);
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

            // Try cache first
            let cache: IDay[];
            const cacheUrl = window.location.pathname + 'api/days';

            try {
                // try {
                // this.loading++;
                // const startState = this.state;
                // let data: IDay[] = [];
                // if (this.$route.name === 'ThisDay') {
                //     data = await dav.getOnThisDayData();
                // } else {
                //  // Try the cache
                //  cache = await utils.getCachedData(cacheUrl);
                //  if (cache) {
                //      await this.processDays(cache);
                //      this.loading--;
                //  }
                //  // Get from network
                //     data = (await axios.get<IDay[]>(generateUrl(this.appendQuery(url), params))).data;
                // }
                // mock data
                if (this.$route.name === 'Thisday') {
                    data.splice(0,3);
                }
                // mock data

                // // Put back into cache
                // utils.cacheData(cacheUrl, data);
    
                // Make sure we're still on the same page
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
                // if (!cache) this.loading--;
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
                day.rows = [];
                // Nothing here
                if (day.count === 0) {
                    continue;
                }

                // Add header to list
                const head: IHeadRow = {
                    id: `${day.dayid}-head`,
                    num: -1,
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
                    const row = this.addRow(day);
                    list.push(row);
                    // Add placeholders wtf?
                    const leftNum = (day.count - i * this.numCols);
                    row.pct = leftNum > this.numCols ? this.numCols : leftNum;
                    row.photos = [];
                }

                // Continue processing
                prevDay = day;
            }

            // Store globally
            this.list = list;
            this.heads = heads;
            this.loadedDays.clear();

            // Iterate the preload map
            // Now the inner detail objects are reactive
            for (const dayId in preloads) {
                this.processDay(Number(dayId), preloads[dayId].detail);
            }

            this.loading = false;
            // Fix view height variable
            await this.scrollerManager.reflow();
            this.scrollPositionChange();
        },

        /** Fetch image data for one dayId */
        async fetchDay(dayId: number) {
            let baseUrl = '/apps/memories/api/days/dayId=' + dayId;
            // const params = { dayId };

            const head = this.heads[dayId];
            if (!head) return;

            // Do this in advance to prevent duplicate requests
            this.loadedDays.add(dayId);

            // ******************* [Do it later] *******************
            // // Look for cache
            // this.processDay(dayId, await utils.getCachedData(url));
            // ******************* [Do it later] *******************

            try {
                const startState = this.state;
                // const res = await axios.get(url);
                // const data = res.data;

                // *************** mock data ********************
                const prefix = ServerUrl + '/music/covers/'
                let data: SongData[] = [];
                type SongData = {
                    fileid: string;
                    url: string;
                    isvideo: boolean;
                    isfavorite: boolean;
                    isfolder: boolean;
                    name: string;
                    w: number;
                    h: number;
                };
                    const commonImageSizes = [
                    { w: 1920, h: 1080 }, // 16:9
                    { w: 1280, h: 720}, // 16:9
                    { w: 800, h: 600 }, // 4:3
                    { w: 1024, h: 768 }, // 4:3
                    { w: 640, h: 480 }, // 4:3
                    { w: 1080, h: 1920 }, // 9:16
                    { w: 720, h: 1280 }, // 9:16
                    { w: 600, h: 800 }, // 3:4
                    { w: 768, h: 1024 }, // 3:4
                    { w: 480, h: 640 }, // 3:4
                ];
                function getRandomImageSize() {
                    const randomIndex = Math.floor(Math.random() * commonImageSizes.length);
                    return commonImageSizes[randomIndex];
                }
                function getRandomElements(arr, count) {
                    const shuffled = [...arr].sort(() => Math.random() - 0.5);
                    return shuffled.slice(0, count);
                }
                const randomArray = getRandomElements(MOCK_IMG_DATA, 16); // 单日16张
                randomArray.forEach((img, index) => {
                    const fileid = `001${index + 1}`;
                    const url = `${prefix}${img}`;
                    let {w, h} = getRandomImageSize()
                    const isfolder = index % 5 === 0
                    if (isfolder) {
                        w = h
                    }
                    data.push({ w, h ,fileid, url, isvideo: index % 3 === 0, isfolder, name: 'folder' + index / 5, isfavorite: index % 6 === 0 });
                });

                if (this.state !== startState) return;
                // Store cache asynchronously
                // Do this regardless of whether the state has
                // changed just to be sure
                
                // ******************* [Do it later] *******************
                // utils.cacheData(url, data);
                // ******************* [Do it later] *******************

                // // *************** verify: no need ********************
                // // Check if the response has any delta
                // if (head.day.detail?.length) {
                //  if (head.day.detail.length === data.length &&
                //   head.day.detail.every((p, i) => p.fileid === data[i].fileid && p.etag === data[i].etag)
                //   ) {
                //       return;
                //   }
                // }
                // // *************** verify: no need ********************

                // *************** mock data ********************
                this.processDay(dayId, data);
            } catch (e) {
                console.error(e);
            }
        },
        /**
         * Process items from day response.
         * Do not auto reflow if you plan to cal the reflow function later.
         *
         * @param dayId id of day
         * @param data photos
         * @param isAnimating prevents glitches due to height changes
         */
        processDay(dayId: number, data: IPhoto[], isAnimating=false)  {
            if (!data) return;

            const head = this.heads[dayId];
            const day = head.day;
            this.loadedDays.add(dayId);
    
            // Filter out items we don't want to show at all
            // Note: flags are not converted yet
            // if (!this.config_showHidden) {
            //     // Hidden folders
            //     data = data.filter((p) => !(p.isfolder && (<IFolder>p).name.startsWith('.')));
            // }
    
            // Set and make reactive
            day.count = data.length;
            day.detail = data;

            // Reset rows including placeholders
            for (const row of head.day.rows || []) {
                row.photos = [];
            }

            // Create justified layout with correct params
            const justify = justifiedLayout(day.detail.map(p => {
                return {
                    width: (this.squareMode ? null : p.w) || this.rowHeight,
                    height: (this.squareMode ? null : p.h) || this.rowHeight,
                };
            }), {
                containerWidth: this.rowWidth,
                containerPadding: 0,
                boxSpacing: 0,
                targetRowHeight: this.rowHeight,
                targetRowHeightTolerance: 0.1,
            });
            // Check if some rows were added
            let addedRows: IRow[] = [];
    
            // Check if row height changed
            let rowSizeDelta = 0;

            // Get index of header O(n)
            const headIdx = this.list.findIndex(item => item.id === head.id);
            let rowIdx = headIdx + 1;
            // Store the scroll position in case we change any rows
            const scrollY = this.getScrollY();
    
            // Previous justified row
            let prevJustifyTop = justify['boxes'][0]?.top || 0;

            // Add all rows
            let dataIdx = 0;
            while (dataIdx < data.length) {
                // Check if we ran out of rows
                if (rowIdx >= this.list.length || this.list[rowIdx].type === IRowType.HEAD) {
                 const newRow = this.addRow(day);
                 addedRows.push(newRow);
                 rowSizeDelta += newRow.size;
                 this.list.splice(rowIdx, 0, newRow);
                }

                // Go to the next row
                const jbox = justify['boxes'][dataIdx];
                if (jbox.top !== prevJustifyTop) {
                    prevJustifyTop = jbox.top;
                    rowIdx++;
                    continue;
                }

                // Set row height
                const row = this.list[rowIdx];
                const jH = Math.round(jbox.height);
                const delta = jH - row.size;
                // If the difference is too small, it's not worth risking an adjustment
                // especially on square layouts on mobile. Also don't do this if animating.
                if (Math.abs(delta) > 5 && !isAnimating) {
                    rowSizeDelta += delta;
                    row.size = jH;
                }

                // Add the photo to the row
                const photo = data[dataIdx];
                if (typeof photo.flag === "undefined") {
                    photo.flag = 0; // flags
                    photo.d = day; // backref to day
                }

                // Flag conversion
                utils.convertFlags(photo);
                // Get aspect ratio
                const setPos = () => {
                    photo.dispWp = utils.round(jbox.width / this.rowWidth, 4, true);
                    photo.dispXp = utils.round(jbox.left / this.rowWidth, 4, true);
                    photo.dispY = 0;
                    photo.dispH = 0;
                    photo.dispRowNum = row.num;
                };
                if (photo.dispWp !== undefined) { // photo already displayed: animate
                    window.setTimeout(setPos, 50);
                    if (photo.dispRowNum !== undefined &&
                        photo.dispRowNum !== row.num &&
                        photo.dispRowNum >= 0 &&
                        photo.dispRowNum < day.rows.length
                    ) { // Row change animation
                        const start = Math.min(photo.dispRowNum, row.num);
                        const end = Math.max(photo.dispRowNum, row.num);
                        const sizeDelta = day.rows.slice(start, end).reduce((acc, r) => {
                            acc += r.size;
                            return acc;
                        }, 0);
                        photo.dispY = sizeDelta * (photo.dispRowNum < row.num ? -1 : 1);
                        photo.dispH = day.rows[photo.dispRowNum].size;
                    }
                } else {
                    setPos();
                }
                dataIdx++;

                // Add photo to row
                row.photos.push(photo);
            }

            // Rows that were removed
            const removedRows: IRow[] = [];
            let headRemoved = false;

            // No rows, splice everything including the header
            if (data.length === 0) {
                removedRows.push(...this.list.splice(headIdx, 1));
                rowIdx = headIdx - 1;
                headRemoved = true;
                delete this.heads[dayId];
            }

            // Get rid of any extra rows
            let spliceCount = 0;
            for (let i = rowIdx + 1; i < this.list.length && this.list[i].type !== IRowType.HEAD; i++) {
                spliceCount++;
            }
            if (spliceCount > 0) {
                removedRows.push(...this.list.splice(rowIdx + 1, spliceCount));
            }

            // Update size delta for removed rows and remove from day
            for (const row of removedRows) {
                if (row.size) {
                  rowSizeDelta -= row.size;
                  const idx = head.day.rows.indexOf(row);
                  if (idx >= 0) head.day.rows.splice(idx, 1);
                }
            }

            // This will be true even if the head is being spliced
            // because one row is always removed in that case
            // So just reflow the timeline here
            if (rowSizeDelta !== 0) {
                if (headRemoved) {
                    // If the head was removed, we need a reflow,
                    // or adjust isn't going to work right
                    this.scrollerManager.reflow();
                } else {
                    // Otherwise just adjust the ticks
                    this.scrollerManager.adjust();
                }
    
                // Scroll to the same actual position if the added rows
                // were above the current scroll position
                // ***************** todo: what the hell is happening here? *****************
                if (!isAnimating) {
                    const recycler: any = this.$refs.recycler;
                    const midIndex = (recycler.$_startIndex + recycler.$_endIndex) / 2;
                    if (midIndex > headIdx) {
                        // this.setScrollY(scrollY + rowSizeDelta);
                    }
                }
                // ***************** todo: what the hell is happening here? *****************
            }
        },

        /** Add and get a new blank photos row */
        addRow(day) {
            let rowType = IRowType.PHOTOS;
            if (day.dayid === TagDayID.FOLDERS) {
                rowType = IRowType.FOLDERS;
            }

            const row = {
                id: `${day.dayid}-${day.rows.length}`,
                num: day.rows.length,
                photos: [],
                type: rowType,
                size: this.rowHeight,
                dayId: day.dayid,
                day: day,
            };

            // Add to day
            day.rows.push(row);
            return row;
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

            for (const day of updatedDays) {
                const newDetail = (day.detail ?? []).filter(p => !delPhotosSet.has(p));
                this.processDay(day.dayid, newDetail, true);
            }
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

.recycler .photo {
    display: block;
    position: absolute;
    top: 0; left: 0;
    cursor: pointer;
    height: 100%;
    transition: width 0.2s ease-in-out,
                height 0.2s ease-in-out,
                transform 0.2s ease-in-out; // reflow
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