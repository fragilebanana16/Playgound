<template>
    <div class="album-container" ref="container" :v-loading="loading">
        <!-- size-field look for item, item-size="300"-->
        <RecycleScroller ref="scroller" class="scroller" :items="list" size-field="size" key-field="id" v-slot="{ item }"
            :emit-update="true" @update="scrollChange" @resize="handleResizeWithDelay">
            <h1 v-if="item.head" class="head-row" v-bind:class="{ 'first': item.id === 1 }">
                {{ item.name }}
            </h1>
            <div class="photo-row" v-bind:style="{ height: rowHeight + 'px' }">
                <div class="photo" v-for="photo of item.photos" :key="photo.fileid">
                    <Folder v-if="photo.is_folder" :data="photo" :rowHeight="rowHeight" />
                    <Photo v-else :data="photo" :rowHeight="rowHeight" :day="item.day" :collection="item.photos"
                            @select="selectPhoto"
                            @reprocess="processDay"
                            @clickImg="clickPhoto" />
                </div>
            </div>
        </RecycleScroller>
        <!-- Timeline -->
        <div ref="timelineScroll" class="timeline-scroll" v-bind:class="{ scrolling }" @mousemove="timelineHover"
            @touchmove="timelineTouch" @mouseleave="timelineLeave" @mousedown="timelineClick">
            <span class="cursor st dark:bg-[#ffffff]" ref="cursorSt" v-bind:style="{ top: timelineCursorY + 'px' }"></span>
            <span class="cursor hv border-t-2 border-black dark:border-t-amber-900" v-bind:style="{ transform: `translateY(${timelineHoverCursorY}px)` }">{{
                timelineHoverCursorText }}</span>
            <div v-for="(tick, index) in timelineTicks" :key="tick['dayId']" class="tick"
                v-bind:class="{ 'dash': !tick['text'] }"
                v-bind:style="{ top: Math.floor((index === 0 ? 10 : 0) + tick['topC']) + 'px' }">
                <template v-if="tick['s']">
                    <span v-if="tick['text']">{{ tick['text'] }}</span>
                    <span v-else class="dash"></span>
                </template>
            </div>
        </div>
        <!-- Top bar for selections etc -->
        <div v-if="selection.size > 0" class="top-bar">
            <div class="icon-container" @click="clearSelection">
              <Icon icon='material-symbols:close' class="btn text-lg"  @click="clearSelection"></Icon>
            </div>
            <div class="text">
                {{ selection.size }} item(s) selected
            </div>
            <div class="icon-container" @click="deleteSelection">
                <Icon icon='material-symbols:delete-outline' class="btn text-lg"></Icon>
            </div>
            <div class="icon-container">
                <Icon icon='material-symbols:more-horiz' class="btn text-lg"></Icon>
            </div>
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
import Photo  from "./components/Photo.vue";
import constants from "./constants";
const router = useRoute()
const SCROLL_LOAD_DELAY = 100; // Delay in loading data when scrolling
const DESKTOP_ROW_HEIGHT = 200; // Height of row on desktop
const MOBILE_ROW_HEIGHT = 120; // Approx row height on mobile
const baseUrl = '/dev-api';
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
type Day = {
    id: string;
    dayid: string;
    count: number;
    detail: Array<DayDetail>;
    rows: Array<Row>;
}; 
type Row = {
    photos: Array<Photo>;
}
type Photo = {
    flag: number;
    fileid: string
}
type DayDetail = {
    fileid: string;
    dayid: string;
    count: number;
}; 
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
            loading: true,
            /** Main list of rows */
            list: [],
            /** Counter of rows */
            numRows: 0,
            /** Computed number of columns */
            numCols: 5,
            /** Header rows for dayId key */
            heads: {},
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
            /** Is mobile layout */
            isMobile: false,
            /** List of selected file ids */
            selection: new Set(),
            /** Constants for HTML template */
            c: constants,
        }
    },

    mounted() {
        this.handleResize();
        this.fetchDays();

        //       setTimeout(() => {
        //   console.log(`output->this.timelineHeight`, this.$refs.timelineScroll.clientHeight);
        //   this.handleResize();
        // }, 100);

        // Set scrollbar
        // Timeline scroller init
        this.$refs.scroller.$el.addEventListener('scroll', this.scrollPositionChange, false);
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

    methods: {
        /** Reset all state */
        resetState() {
            this.clearSelection();
            this.loading = true;
            this.list = [];
            this.numRows = 0;
            this.heads = {};
            this.days = [];
            this.currentStart = 0;
            this.currentEnd = 0;
            this.timelineTicks = [];
            this.state = Math.random();
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
        handleResize() {
            let height = this.$refs.container.clientHeight;
            let width = this.$refs.container.clientWidth - 40;  // 预留和时间线的间距
            this.timelineHeight = this.$refs.timelineScroll.clientHeight;
            this.$refs.scroller.$el.style.height = (height - 4) + 'px';
            // Mobile devices
            if (window.innerWidth <= 768) {
                width += 10;
                this.isMobile = true;
            } else {
                width -= 12;
                this.isMobile = false;
            }

            if (this.days.length === 0) {
                // Don't change cols if already initialized
                this.numCols = Math.max(MIN_COLS, Math.floor(width / MAX_PHOTO_WIDTH));
            }
            this.rowHeight = Math.floor(width / this.numCols) - 4;

            // Set heights of rows
            this.list.filter(r => !r.head).forEach(row => {
                row.size = this.rowHeight;
            });
            this.handleViewSizeChange();
        },

        /** Handle change in rows and view size */
        handleViewSizeChange() {
            setTimeout(() => {
                this.viewHeight = this.$refs.scroller.$refs.wrapper.clientHeight;
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
            }, 0);
        },

        /**
         * Triggered when position of scroll change.
         * This does NOT indicate the items have changed, only that
         * the pixel position of the scroller has changed.
         */
        scrollPositionChange(event) {
            if (event) {
                this.timelineCursorY = event.target.scrollTop * this.timelineHeight / this.viewHeight;
                this.timelineMoveHoverCursor(this.timelineCursorY);
            }
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
                if ((i < this.currentStart || i > this.currentEnd) && this.list[i].photos) {
                    this.list[i].photos.forEach(photo => {
                        photo.l = 0;
                    });
                }
            }

            // Make sure we don't do this too often
            this.currentStart = startIndex;
            this.currentEnd = endIndex;
            setTimeout(() => {
                if (this.currentStart === startIndex && this.currentEnd === endIndex) {
                    this.loadScrollChanges(startIndex, endIndex);
                }
            }, 300);
        },

        /** Load image data for given view */
        loadScrollChanges(startIndex, endIndex) {
            for (let i = startIndex; i <= endIndex; i++) {
                let item = this.list[i];
                if (!item) {
                    continue;
                }
                let head = this.heads[item.dayId];
                if (head && !head.loadedImages) {
                    head.loadedImages = true;
                    this.fetchDay(item.dayId);
                }
            }
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
            
            if (this.$route.name === 'albums') {
                const id = this.$route.params.id || 0;
                // url = `/apps/polaroid/api/folder/${id}`;
            }
            const startState = this.state;
            // await api
            if (this.state !== startState) return;
            this.days = data;
            for (const [dayIdx, day] of data.entries()) {
                day.count = Number(day.count);
                day.rows = new Set();
                // Nothing here
                if (day.count === 0) {
                    continue;
                }

                // Make date string
                const dateTaken = new Date(Number(day.dayid) * 86400 * 1000);
                // mock data
                const tempYear = dateTaken.getUTCFullYear();
                dateTaken.setUTCFullYear(tempYear + dayIdx * 10);
                // mock data

                let dateStr = dateTaken.toLocaleDateString("en-US", { dateStyle: 'full', timeZone: 'UTC' });
                if (dateTaken.getUTCFullYear() === new Date().getUTCFullYear()) {
                    // hack: remove last 6 characters of date string
                    dateStr = dateStr.substring(0, dateStr.length - 6);
                }

                // Special headers
                if (day.dayid === -0.1) {
                    dateStr = "Folders";
                }
                // Add header to list
                const head = {
                    id: ++this.numRows,
                    name: dateStr,
                    size: 40,
                    head: true,
                    loadedImages: false,
                    dayId: day.dayid,
                    day: day,
                };
                this.heads[day.dayid] = head;
                this.list.push(head);

                // Add rows
                const nrows = Math.ceil(day.count / this.numCols);
                for (let i = 0; i < nrows; i++) {
                    const row = this.getBlankRow(day);
                    this.list.push(row);
                    day.rows.add(row);
                    // Add placeholders wtf?
                    const leftNum = (day.count - i * this.numCols);
                    const rowCount = leftNum > this.numCols ? this.numCols : leftNum;
                    for (let j = 0; j < rowCount; j++) {
                        row.photos.push({
                            flag: constants.FLAG_PLACEHOLDER,
                            fileid: `${day.dayid}-${i}-${j}`,
                        });
                    }
                }
            }

            // Check preloads 预处理了图片，冗余计算？如果fetchDays能先带一部分数据则先处理一部分，不用每次scroll再请求
            for (const day of data) {
                if (day.count && day.detail && day.detail.length > 0) {
                    this.processDay(day);
                }
            }

            // Fix view height variable
            this.reflowTimeline();
            this.handleViewSizeChange();
            this.loading = false;
        },

        /** Fetch image data for one dayId */
        async fetchDay(dayId) {
            // let url = `/apps/polaroid/api/days/${dayId}`;
            // if (this.$route.name === 'albums') {
            //     const id = this.$route.params.id || 0;
            //     url = `/apps/polaroid/api/folder/${id}/${dayId}`;
            // }
            const head = this.heads[dayId];
            head.loadedImages = true;
            const prefix = baseUrl + '/music/covers/'
            let data: SongData[] = [];
            type SongData = {
                fileid: string;
                url: string;
                isvideo: boolean;
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
                data.push({ fileid, url, isvideo: index % 3 === 0, isfolder: index % 5 === 0, name: 'folder' + index / 5  });
            });
            
            // try {
            //     const res = await fetch(`/apps/betterphotos/api/days/${dayId}`);
            //     data = await res.json();
            //     const day = this.days.find(d => d.dayid === dayId);
            //     day.detail = data;
            //     this.processDay(day);
            // } catch (e) {
            //     console.error(e);
            //     head.loadedImages = false;
            // }
            const day = this.days.find(d => d.dayid === dayId);
            day.detail = data;
            day.count = data.length;
            this.processDay(day);
        },
        /** Create timeline tick data */
        reflowTimeline() {
            // Clear timeline
            this.timelineTicks = [];
            // Ticks
            let currTopRow = 0;
            let currTopStatic = 0;
            let prevYear = 9999;
            let prevMonth = 0;
            const thisYear = new Date().getFullYear();
            // Itearte over days
            for (const day of this.days) {
                if (day.count === 0) {
                    console.log('skip', day);
                    continue;
                }
                // Make date string
                const dateTaken = new Date(Number(day.dayid)*86400*1000);
                // Create tick if month changed
                const dtYear = dateTaken.getUTCFullYear();
                const dtMonth = dateTaken.getUTCMonth()
                if (Number.isInteger(day.dayid) && (dtMonth !== prevMonth || dtYear !== prevYear)) {
                    // Format dateTaken as MM YYYY
                    const dateTimeFormat = new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        timeZone: 'UTC',
                    });
                    const monthName = dateTimeFormat.formatToParts(dateTaken)[0].value;
                    // Create tick
                    this.timelineTicks.push({
                        dayId: day.id,
                        top: currTopRow,
                        topS: currTopStatic,
                        topC: 0,
                        text: (dtYear === prevYear || dtYear === thisYear) ? undefined : dtYear,
                        mText: `${monthName} ${dtYear}`,
                    });
                }
                prevMonth = dtMonth;
                prevYear = dtYear;
                currTopStatic += this.heads[day.dayid].size;
                currTopRow += day.rows.size;
            }
        },
        /** Process items from day response */
        processDay(day) {
            const dayId = day.dayid;
            const data = day.detail;
            const head = this.heads[dayId];
            head.loadedImages = true;
            // Reset rows including placeholders
            if (head.day?.rows) {
                for (const row of head.day.rows) {
                    row.photos = [];
                }
            }
            if (head.day) {
                head.day.rows = new Set();
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
                if (rowIdx >= this.list.length || this.list[rowIdx].head) {
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
                photo.flag = 0; // flags
                photo.d = day; // backref to day
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
            for (let i = rowIdx + 1; i < this.list.length && !this.list[i].head; i++) {
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
                this.handleViewSizeChange();
            }
        },

        /** Get a new blank row */
        getBlankRow(day) {
            return {
                id: ++this.numRows,
                photos: [],
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
            this.timelineHoverCursorText = this.timelineTicks[idx].mText;
        },

        /** Handle touch on right timeline */
        timelineTouch(event) {
            const rect = event.target.getBoundingClientRect();
            const y = event.targetTouches[0].pageY - rect.top;
            this.$refs.scroller.scrollToPosition(this.getTimelinePosition(y));
            event.preventDefault();
            event.stopPropagation();
        },

        /** Handle mouse leave on right timeline */
        timelineLeave() {
            this.timelineMoveHoverCursor(this.timelineCursorY);
        },

        /** Handle mouse click on right timeline */
        timelineClick(event) {
            this.$refs.scroller.scrollToPosition(this.getTimelinePosition(event.offsetY));
        },

        /** Get scroller equivalent position from event */
        getTimelinePosition(y) {
            const tH = this.viewHeight;
            const maxH = this.timelineHeight;
            return y * tH / maxH;
        },

        /** Scroll to given day Id */
        scrollToDay(dayId) {
            const head = this.heads[dayId];
            if (!head) {
                return;
            }
            this.$refs.scroller.scrollToPosition(1000);
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
        selectPhoto(photo) {
            const nval = !this.selection.has(photo);
            if (nval) {
                photo.flag |= constants.FLAG_SELECTED;
                this.selection.add(photo);
            } else {
                photo.flag &= ~constants.FLAG_SELECTED;
                this.selection.delete(photo);
            }
            this.$forceUpdate();
        },
        /** Clear all selected photos */
        clearSelection() {
            for (const photo of this.selection) {
                photo.flag &= ~constants.FLAG_SELECTED;
            }
            this.selection.clear();
            this.$forceUpdate();
        },
        /** Delete all selected photos */
        async deleteSelection() {
            if (this.selection.size === 0) {
                return;
            }
            const updatedDays = new Set<Day>();
            const delIds = new Set();
            for (const photo of this.selection) {
                if (!photo.fileid) {
                    continue;
                }
                delIds.add(photo.fileid);
                updatedDays.add(photo.d);
            }

            // Get files data
            // TODO: api call
            // let fileInfos = [];
            // this.loading = true;

            // try {
            //     fileInfos = await dav.getFiles([...delIds]);
            // } catch {
            //     this.loading = false;
            //     alert('Failed to get file info');
            //     return;
            // }
            // // Run all promises together
            // const promises = [];
            // // Delete each file
            // delIds.clear();
            // for (const fileInfo of fileInfos) {
            //     promises.push((async () => {
            //         try {
            //             await dav.deleteFile(fileInfo.filename)
            //             delIds.add(fileInfo.fileid);
            //         } catch {
            //             console.warn('Failed to delete', fileInfo.filename)
            //         }
            //     })());
            // }
            // await Promise.allSettled(promises);
            // this.loading = false;
            // Reflow all touched days

            // Animate the deletion
            for (const photo of this.selection) {
                if (delIds.has(photo.fileid)) {
                    photo.flag |= constants.FLAG_LEAVING;
                }
            }
            // wait for 250ms
            await new Promise(resolve => setTimeout(resolve, 200));
            // Speculate day reflow for animation
            const exitedLeft = new Set();
            for (const day of updatedDays) {
                let nextExit = false;
                for (const row of day.rows) {
                    for (const photo of row.photos) {
                        if (photo.flag & constants.FLAG_LEAVING) {
                            nextExit = true;
                        } else if (nextExit) {
                            photo.flag |= constants.FLAG_EXIT_LEFT;
                            exitedLeft.add(photo.fileid);
                        }
                    }
                }
            }
            // wait for 200ms
            await new Promise(resolve => setTimeout(resolve, 200));

            for (const day of updatedDays) {
                day.detail = day.detail.filter(p => !delIds.has(p.fileid));
                day.count = day.detail.length;
                this.processDay(day);
            }

            // Enter from right all photos that exited left
            for (const day of updatedDays) {
                for (const row of day.rows) {
                    for (const photo of row.photos) {
                        if (exitedLeft.has(photo.fileid)) {
                            photo.flag |= constants.FLAG_ENTER_RIGHT;
                        }
                    }
                }
            }
            // wait for 200ms
            await new Promise(resolve => setTimeout(resolve, 200));
            // Clear enter right flags
            for (const day of updatedDays) {
                for (const row of day.rows) {
                    for (const photo of row.photos) {
                        photo.flag &= ~constants.FLAG_ENTER_RIGHT;
                    }
                }
            }
            this.clearSelection();
            this.reflowTimeline();
            this.handleViewSizeChange();
        },
    },
}

</script>

  
<style scoped>
.album-container {
    height: calc(100vh - 84px);
    width: 100%;
    overflow: hidden;
    user-select: none;
    /* no text will be selected  */
}

.scroller {
    width: calc(100% + 20px);

}

.photo-row .photo {
    display: inline-block;
    position: relative;
    cursor: pointer;
}

/** Top bar */
.top-bar {
    position: absolute;
    font-size: 0.9rem;
    top: 3px; right: 15px;
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
}
.top-bar .text {
    flex-grow: 0.6;
    line-height: 36px;
    padding-left: 8px;
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
.head-row {
    height: 40px;
    padding-top: 10px;
    padding-left: 3px;
    font-size: 0.9em;
    font-weight: bold;
}

.timeline-scroll {
    overflow-y: clip;
    position: absolute;
    height: 100%;
    width: 40px;
    top: 0;
    right: 0;
    cursor: ns-resize;
    opacity: 0;
    transition: opacity .2s ease-in-out;
    z-index: 1;
}

.timeline-scroll:hover,
.timeline-scroll.scrolling {
    opacity: 1;
}

.timeline-scroll .tick {
    pointer-events: none;
    position: absolute;
    font-size: 0.8em;
    right: 5px;
    transform: translateY(-50%);
}

.timeline-scroll .tick .dash {
    height: 4px;
    width: 4px;
    border-radius: 50%;
    background-color: #444;
    opacity: 0.5;
    display: block;
}

.timeline-scroll .cursor {
    position: absolute;
    pointer-events: none;
    right: 5px;
    min-width: 100%;
    min-height: 2px;
}

.timeline-scroll .cursor.st {
    font-size: 0.8em;
    opacity: 0;
}

.timeline-scroll:hover .cursor.st {
    opacity: 1;
}

.timeline-scroll .cursor.hv {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 2px 5px;
    border-radius: 2px;
    width: auto;
    white-space: nowrap;
    z-index: 100;
    font-size: 0.95em;
    font-weight: 600;
}
.icon-container {
    display: inline-block;
    position: relative;
    margin: -2px;
}
.icon-container:hover::before{
    opacity: 1;
}
.icon-container::before {
    content: '';
    opacity: 0;
    position: absolute;
    top: 53%;
    left: 43%;
    width: 30px;
    height: 30px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    z-index: -1; /* 背景在图标下面 */
    transition: opacity  0.3s;
}
@media (max-width: 768px) {
    .top-bar {
        top: 35px;
        right: 5px;
        max-width: calc(100vw - 150px);

    }
    .timeline-scroll .tick {
        background-color: rgba(100, 100, 100, 0.1);
        padding: 1px 4px;
        border-radius: 4px;
    }

    .timeline-scroll .tick.dash {
        display: none;
    }

    .head-row.first {
        padding-left: 34px;
    }
}
</style>