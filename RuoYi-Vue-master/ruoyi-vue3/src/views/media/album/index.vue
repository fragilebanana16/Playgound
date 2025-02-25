<template>
    <div class="album-container" ref="container" :v-loading="loading > 0">
        <!-- size-field look for item, item-size="300"-->
        <RecycleScroller ref="recycler" class="recycler" :items="list" size-field="size" key-field="id" v-slot="{ item }"
            :emit-update="true" @update="scrollChange" @resize="handleResizeWithDelay">
            <div v-if="item.type === 0" class="head-row" :class="{
                'first': item.id === 1,
                'selected': item.selected,
            }">
                <Icon icon='material-symbols:check-circle-rounded' class="btn text-lg select" @click="selectHead(item)">
                </Icon>
                <span class="name" @click="selectHead(item)">
                    {{ item.name || getHeadName(item) }}
                </span>
            </div>
            <div v-else class="photo-row" :style="{ height: rowHeight + 'px' }">
                <div class="photo" v-for="photo of item.photos" :key="photo.fileid">
                    <Folder v-if="photo.flag & c.FLAG_IS_FOLDER" :data="photo" :rowHeight="rowHeight" :key="photo.fileid" />
                    <Photo v-else :data="photo" :rowHeight="rowHeight" :day="item.day" :collection="item.photos"
                        @select="selectPhoto" @reprocess="deleteFromViewWithAnimation" @clickImg="clickPhoto" />
                </div>
            </div>
        </RecycleScroller>
        <!-- Timeline -->
        <div ref="timelineScroll" class="timeline-scroll" :class="{ scrolling }" @mousemove="timelineHover"
            @touchmove="timelineTouch" @mouseleave="timelineLeave" @mousedown="timelineClick">
            <span class="cursor st dark:bg-[#ffffff]" ref="cursorSt" :style="{ top: timelineCursorY + 'px' }"></span>
            <span class="cursor hv border-t-2 border-black dark:border-t-amber-900"
                :style="{ transform: `translateY(${timelineHoverCursorY}px)` }">{{
                    timelineHoverCursorText }}</span>
            <div v-for="(tick, index) in timelineTicks" :key="tick['dayId']" class="tick" :class="{ 'dash': !tick['text'] }"
                :style="{ top: Math.floor((index === 0 ? 10 : 0) + tick['topC']) + 'px' }">
                <span v-if="tick['text']">{{ tick['text'] }}</span>
            </div>
        </div>
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
            <el-dropdown trigger="click">
                <div class="icon-container">
                    <Icon icon='material-symbols:more-horiz' class="btn text-lg"></Icon>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="favoriteSelection">Favoriate</el-dropdown-item>
                        <el-dropdown-item>Action</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>

        </div>
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
const router = useRoute()
const DESKTOP_ROW_HEIGHT = 200; // Height of row on desktop
const MOBILE_ROW_HEIGHT = 120; // Approx row height on mobile
const baseUrl = '/dev-api';
const SCROLL_LOAD_DELAY = 100; // Delay in loading data when scrolling
const MAX_PHOTO_WIDTH = 175;
const MIN_COLS = 3;
// Define API routes
const API_ROUTES = {
    DAYS: 'days',
    DAY: 'days/{dayId}',
    FOLDER_DAYS: 'folder/{folderId}',
    FOLDER_DAY: 'folder/{folderId}/{dayId}',
};
for (const [key, value] of Object.entries(API_ROUTES)) {
    API_ROUTES[key] = '/apps/memories/api/' + value;
}

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
        Photo
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
            /** Total height of recycler */
            viewHeight: 1000,
            /** Total height of timeline */
            timelineHeight: 100,
            /** Computed timeline ticks */
            timelineTicks: [],
            /** Computed timeline cursor top */
            timelineCursorY: 0,
            /** Timeline hover cursor top */
            timelineHoverCursorY: -5,
            /** Timeline hover cursor text */
            timelineHoverCursorText: "",
            /** Current start index */
            currentStart: 0,
            /** Current end index */
            currentEnd: 0,
            /** State for request cancellations */
            state: Math.random(),
            /** Scrolling currently */
            scrolling: false,
            /** Scrolling timer */
            scrollTimer: null,
            /** Resizing timer */
            resizeTimer: null,
            /** View size reflow timer */
            reflowTimelineReq: false,
            /** Is mobile layout */
            isMobile: false,
            /** Set of dayIds for which images loaded */
            loadedDays: new Set(),
            /** List of selected file ids */
            selection: new Map<number, IPhoto>(),
            /** Flag consts */
            c:c,

        }
    },

    async mounted() {
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
        /** Reset all state */
        resetState() {
            this.clearSelection();
            this.loading = 0;
            this.list = [];
            this.numRows = 0;
            this.heads = {};
            this.days = [];
            this.currentStart = 0;
            this.currentEnd = 0;
            this.timelineTicks = [];
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
            this.timelineHeight = e.clientHeight;

            const recycler = this.$refs.recycler as any;
            recycler.$el.style.height = (height - 4) + 'px';
            // Mobile devices
            if (window.innerWidth <= 768) {
                width -= 4;
                this.isMobile = true;
            } else {
                width -= 40;
                this.isMobile = false;
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
            await this.reflowTimeline(true);
        },

        /**
         * Triggered when position of scroll change.
         * This does NOT indicate the items have changed, only that
         * the pixel position of the recycler has changed.
         */
        scrollPositionChange(event) {
            this.timelineCursorY = event ? event.target.scrollTop * this.timelineHeight / this.viewHeight : 0;
            this.timelineMoveHoverCursor(this.timelineCursorY);
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
            }
            this.scrolling = true;
            this.scrollTimer = setTimeout(() => {
                this.scrolling = false;
                this.scrollTimer = null;
            }, 1500);
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
            let name = dateTaken.toLocaleDateString("en-US", { dateStyle: 'full', timeZone: 'UTC' });
            if (dateTaken.getUTCFullYear() === new Date().getUTCFullYear()) {
                // hack: remove last 6 characters of date string
                name = name.substring(0, name.length - 6);
            }
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
            let url = API_ROUTES.DAYS;
            let params = {};

            if (this.$route.name === 'folders') {
                url = API_ROUTES.FOLDER_DAYS;
                params['folderId'] = this.$route.params.id || 0;
            }

            try {
                // try {
                // this.loading++;
                // const startState = this.state;
                // const res = await axios.get<IDay[]>(generateUrl(this.appendQuery(url), params));
                // const data = res.data;
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
            for (const [dayIdx, day] of data.entries()) {
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
            }

            // Store globally
            this.days = data;
            this.list = list;
            this.heads = heads;

            // Check preloads 预处理了图片，冗余计算？如果fetchDays能先带一部分数据则先处理一部分，不用每次scroll再请求
            for (const day of data) {
                if (day.count && day.detail && day.detail.length > 0) {
                    this.processDay(day);
                }
            }
            this.loading = false;
            // Fix view height variable
            await this.reflowTimeline();

            // Check if we didn't find anything
            if (this.list.length === 0) {
                console.error('No photos to show here');
            }
        },

        /** Fetch image data for one dayId */
        async fetchDay(dayId) {
            // let url = API_ROUTES.DAY;
            // const params = { dayId };
            // if (this.$route.name === 'folders') {
            //     url = API_ROUTES.FOLDER_DAY;
            //     params.folderId = this.$route.params.id || 0;
            // }

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
        /** Re-create timeline tick data in the next frame */
        async reflowTimeline(orderOnly = false) {
            if (this.reflowTimelineReq) {
                return;
            }
            this.reflowTimelineReq = true;
            await this.$nextTick();
            this.reflowTimelineNow(orderOnly);
            this.reflowTimelineReq = false;
        },
        /** Recreate the timeline from scratch */
        recreateTimeline() {
            // Clear timeline
            this.timelineTicks = [];
            // Ticks
            let currTopRow = 0;
            let currTopStatic = 0;
            let prevYear = 9999;
            let prevMonth = 0;
            const thisYear = new Date().getFullYear();
            // Get a new tick
            const getTick = (day: IDay, text?: string | number): ITick => {
                return {
                    dayId: day.dayid,
                    top: currTopRow,
                    topS: currTopStatic,
                    topC: 0,
                    text: text,
                };
            }

            // Itearte over days
            for (const day of this.days) {
                if (day.count === 0) {
                    console.log('skip', day);
                    continue;
                }
                if (Object.values(TagDayID).includes(day.dayid)) {
                    // Blank dash ticks only
                    this.timelineTicks.push(getTick(day));
                } else {
                    // Make date string
                    const dateTaken = utils.dayIdToDate(day.dayid);

                    // Create tick if month changed
                    const dtYear = dateTaken.getUTCFullYear();
                    const dtMonth = dateTaken.getUTCMonth()
                    if (Number.isInteger(day.dayid) && (dtMonth !== prevMonth || dtYear !== prevYear)) {
                        this.timelineTicks.push(getTick(day, (dtYear === prevYear || dtYear === thisYear) ? undefined : dtYear));
                    }
                    prevMonth = dtMonth;
                    prevYear = dtYear;
                }
                currTopStatic += this.heads[day.dayid].size;
                currTopRow += day.rows.size;
            }
        },
        reflowTimelineNow(orderOnly = false) {
            if (!orderOnly) {
                this.recreateTimeline();
            }
            const recycler: any = this.$refs.recycler;
            this.viewHeight = recycler.$refs.wrapper.clientHeight;

            // Compute timeline tick positions
            for (const tick of this.timelineTicks) {
                tick.topC = Math.floor((tick.topS + tick.top * this.rowHeight) * this.timelineHeight / this.viewHeight);
            }
            // Do another pass to figure out which timeline points are visible
            // This is not as bad as it looks, it's actually 12*O(n)
            // because there are only 12 months in a year
            const minGap = parseFloat(getComputedStyle(this.$refs.cursorSt).fontSize) + (this.isMobile ? 5 : 2);
            let prevShow = -9999;
            for (const [idx, tick] of this.timelineTicks.entries()) {
                // You can't see these anyway, why bother?
                if (tick.topC < minGap || tick.topC > this.timelineHeight - minGap) {
                    tick.s = false;
                    continue;
                }
                // Will overlap with the previous tick. Skip anyway.
                if (tick.topC - prevShow < minGap) {
                    tick.s = false;
                    continue;
                }
                // This is a labelled tick then show it anyway for the sake of best effort
                if (tick.text) {
                    tick.s = true;
                    prevShow = tick.topC;
                    continue;
                }
                // Lookahead for next labelled tick
                // If showing this tick would overlap the next one, don't show this one
                let i = idx + 1;
                while (i < this.timelineTicks.length) {
                    if (this.timelineTicks[i].text) {
                        break;
                    }
                    i++;
                }
                if (i < this.timelineTicks.length) {
                    // A labelled tick was found
                    const nextLabelledTick = this.timelineTicks[i];
                    if (tick.topC + minGap > nextLabelledTick.topC &&
                        nextLabelledTick.topC < this.timelineHeight - minGap) { // make sure this will be shown
                        tick.s = false;
                        continue;
                    }
                }
                // Show this tick
                tick.s = true;
                prevShow = tick.topC;
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
                this.reflowTimeline();
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

        /** Handle mouse hover on right timeline */
        timelineHover(event) {
            if (event.buttons) {
                this.timelineClick(event);
            }
            this.timelineMoveHoverCursor(event.offsetY);
        },

        timelineMoveHoverCursor(y) {
            this.timelineHoverCursorY = y;
            // Get index of previous tick
            let idx = this.timelineTicks.findIndex(t => t.topC > y);
            if (idx >= 1) {
                idx = idx - 1;
            } else if (idx === -1 && this.timelineTicks.length > 0) {
                idx = this.timelineTicks.length - 1;
            } else {
                return;
            }
            // DayId of current hover
            const dayId = this.timelineTicks[idx].dayId

            // Special days
            if (Object.values(TagDayID).includes(dayId)) {
                this.timelineHoverCursorText = this.getHeadName(this.heads[dayId]);
                return;
            }

            const date = utils.dayIdToDate(dayId);
            this.timelineHoverCursorText = `${utils.getMonthName(date)} ${date.getUTCFullYear()}`;
        },

        /** Handle touch on right timeline */
        timelineTouch(event) {
            const rect = event.target.getBoundingClientRect();
            const y = event.targetTouches[0].pageY - rect.top;
            this.$refs.recycler.scrollToPosition(this.getTimelinePosition(y));
            event.preventDefault();
            event.stopPropagation();
        },

        /** Handle mouse leave on right timeline */
        timelineLeave() {
            this.timelineMoveHoverCursor(this.timelineCursorY);
        },

        /** Handle mouse click on right timeline */
        timelineClick(event) {
            this.$refs.recycler.scrollToPosition(this.getTimelinePosition(event.offsetY));
        },

        /** Get recycler equivalent position from event */
        getTimelinePosition(y) {
            const tH = this.viewHeight;
            const maxH = this.timelineHeight;
            return y * tH / maxH;
        },

        /** Clicking on photo */
        clickPhoto(photoComponent, photos, current) {
            if (this.selection.size > 0) { // selection mode
                photoComponent.toggleSelect();
            } else {
                photoComponent.openFile(photos, current);
            }
        },
        /** Add a photo to selection list */
        selectPhoto(photo: IPhoto, val?: boolean, noUpdate?: boolean) {
            if (photo.flag & c.FLAG_PLACEHOLDER || photo.flag & c.FLAG_IS_FOLDER) {
                return; // ignore placeholders
            }
            const nval = val ?? !this.selection.has(photo.fileid);
            if (nval) {
                photo.flag |= c.FLAG_SELECTED;
                this.selection.set(photo.fileid, photo);
            } else {
                photo.flag &= ~c.FLAG_SELECTED;
                this.selection.delete(photo.fileid);
            }
            if (!noUpdate && photo.d) {
                this.updateHeadSelected(this.heads[photo.d.dayid]);
                this.$forceUpdate();
            }
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
                this.loading++;
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
                this.loading--;
            }
        },

        /** Delete all selected photos */
        async deleteSelection() {
            if (this.selection.size === 0) {
                return;
            }

            this.loading = true;
            try {
                const list = [...this.selection];
                this.loading++;

                for await (const delIds of dav.deleteFilesByIds(Array.from(this.selection.keys()))) {
                    const delPhotos = delIds.map(id => this.selection.get(id));
                    await this.deleteFromViewWithAnimation(delPhotos);
                }
            } catch (error) {
                console.error(error);
            } finally {
                this.loading--;
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
            this.clearSelection(delPhotos);

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
            this.reflowTimeline();
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
    height: 40px;
    padding-top: 10px;
    padding-left: 3px;
    font-size: 0.9em;
    font-weight: 600;

    @include phone {
        &.first {
            padding-left: 38px;
            padding-top: 12px;
        }
    }

    >.select {
        position: absolute;
        left: 5px;
        top: 50%;
        color: #000000;
        display: none;
        transform: translateY(-30%);
        transition: opacity 0.2s ease;
        border-radius: 50%;
        background-size: 70%;
        cursor: pointer;
    }

    >.name {
        transition: margin 0.2s ease;
        cursor: pointer;
    }

    .hover &,
    &.selected {
        >.select {
            display: inline-block;
            opacity: 1;
        }

        >.name {
            margin-left: 25px;
        }
    }

    &.selected>.select {
        // filter: invert(1);
    }
}


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

    @include phone {
        top: 35px;
        right: 15px;
    }
}

.top-bar .btn {
    display: inline-block;
    margin-right: 3px;
    cursor: pointer;
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

.timeline-scroll {
    overflow-y: clip;
    position: absolute;
    height: 100%;
    width: 36px;
    top: 0;
    right: 0;
    cursor: ns-resize;
    opacity: 0;
    transition: opacity .2s ease-in-out;
    z-index: 1;

    &:hover,
    &.scrolling {
        opacity: 1;
    }

    >.tick {
        pointer-events: none;
        position: absolute;
        font-size: 0.75em;
        font-weight: 600;
        opacity: 0.95;
        right: 7px;
        transform: translateY(-50%);
        z-index: 1;

        &.dash {
            height: 4px;
            width: 4px;
            border-radius: 50%;
            background-color: #000;
            opacity: 0.2;
            display: block;

            @include phone {
                display: none;
            }
        }

        @include phone {
            background-color: #fff;
            padding: 0px 4px;
            border-radius: 4px;
        }
    }

    >.cursor {
        position: absolute;
        pointer-events: none;
        right: 0;
        background-color: #000;
        min-width: 100%;
        min-height: 1.5px;

        &.st {
            font-size: 0.75em;
            opacity: 0;
        }

        &.hv {
            background-color: #fff;
            padding: 2px 5px;
            border-top: 2px solid #000;
            border-radius: 2px;
            width: auto;
            white-space: nowrap;
            z-index: 100;
            font-size: 0.95em;
            font-weight: 600;
        }
    }

    &:hover>.cursor.st {
        opacity: 1;
    }
}

.icon-container {
    display: inline-block;
    position: relative;
    margin-bottom: 0.3rem;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
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
}</style>