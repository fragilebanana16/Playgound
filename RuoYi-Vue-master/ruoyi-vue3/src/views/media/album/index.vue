<template>
      <div class="album-container" ref="container"
        :class="{ 'icon-loading': loading }">

        <RecycleScroller
            ref="scroller"
            class="scroller"
            :items="list"
            size-field="size"
            key-field="id"
            v-slot="{ item }"
            :emit-update="true"
            @update="scrollChange"
        >
            <h1 v-if="item.head" class="head-row">
                {{ item.name }}
            </h1>

            <div 
                class="photo-row"
                v-bind:style="{ height: rowHeight + 'px' }">

                <div class="photo" v-for="img of item.photos" :key="img.l">
                    <img
                    src="@/assets/images/login-background.jpg" :key="img.l"
          
                        v-bind:style="{
                            width: rowHeight + 'px',
                            height: rowHeight + 'px',
                        }"/>
                </div>
            </div>
        </RecycleScroller>

        <div ref="timelineScroll" class="timeline-scroll"
            @mousemove="timelineHover"
            @mouseleave="timelineLeave"
            @mousedown="timelineClick">
            <span class="cursor"
                  v-bind:style="{ top: timelineCursorY + 'px' }"></span>
            <span class="cursor"
                  v-bind:style="{ transform: `translateY(${timelineHoverCursorY}px)` }"></span>

            <div v-for="(tick, index) in timelineTicks" :key="tick['dayId']" class="tick"
                v-bind:style="{ top: Math.floor((index === 0 ? 10 : 0) + (tick['topS'] + tick['top']  * rowHeight) * timelineHeight / viewHeight) + 'px' }">
                <span v-if="tick['text']">{{ tick['text'] }}</span>
                <span v-else class="dash"></span>
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
const SCROLL_LOAD_DELAY = 100; // Delay in loading data when scrolling
const DESKTOP_ROW_HEIGHT = 200; // Height of row on desktop
const MOBILE_ROW_HEIGHT = 120; // Approx row height on mobile

  export default {
    components: {
      RecycleScroller
    },
    data() {
        return {
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

            /** Current start index */
            currentStart: 0,
            /** Current end index */
            currentEnd: 0,
        }
    },

    mounted() {
        this.handleResize();
        this.fetchDays();

  //       setTimeout(() => {
  //   console.log(`output->this.timelineHeight`, this.$refs.timelineScroll.clientHeight);
  //   this.handleResize();
  // }, 100);

console.log(`output->this.timelineHeight`,this.timelineHeight)
console.log(`output->this.viewHeight`,this.viewHeight)
        // Set scrollbar
        this.$refs.scroller.$el.addEventListener('scroll', (event) => {
            this.timelineCursorY = event.target.scrollTop * this.timelineHeight / this.viewHeight;
          console.log(`this.timelineCursorY`, this.timelineCursorY)

        }, false);
    },

    methods: {
        /** Handle window resize and initialization */
        handleResize() {
            let height = this.$refs.container.clientHeight;
            let width = this.$refs.container.clientWidth - 40;
            this.timelineHeight = this.$refs.timelineScroll.clientHeight;
            console.log(`handleResize->this.timelineHeight`,this.timelineHeight)
            this.$refs.scroller.$el.style.height = (height - 4) + 'px';
 
            if (this.days.length === 0) {
                // Don't change cols if already initialized
                this.numCols = Math.max(4, Math.floor(width / 175));
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
            }, 0);
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
                    // this.fetchDay(item.dayId);
                }
            }
        },

        /** Fetch timeline main call */
        async fetchDays() {
            const mockData = [
              {
                id: '001',
                day_id: 1,
                count: 2,
                photos:[1,2,3]
              },
              {
                id: '002',
                day_id: 1000,
                count: 3,
                photos:[1,2,3]
              },
              {
                id: '003',
                day_id: 3000,
                count: 4,
                photos:[1,2,3]
              }
            ]

            const data = Array.from({length:20}, (_, index) => ({
                id: '00' + index,
                day_id: index * 100,
                count: 3,
                photos:[1,2,3]
              }));
            this.days = data;

            // Ticks
            let currTopRow = 0;
            let currTopStatic = 0;
            let prevYear = new Date().getUTCFullYear();
            let prevMonth = new Date().getUTCMonth();

            for (const [dayIdx, day] of data.entries()) {
                day.count = Number(day.count);

                // Nothing here
                if (day.count === 0) {
                    continue;
                }

                // Make date string
                const dateTaken = new Date(Number(day.day_id)*86400*1000);
                let dateStr = dateTaken.toLocaleDateString("en-US", { dateStyle: 'full', timeZone: 'UTC' });
                if (dateTaken.getUTCFullYear() === new Date().getUTCFullYear()) {
                    // hack: remove last 6 characters of date string
                    dateStr = dateStr.substring(0, dateStr.length - 6);
                }

                // Create tick if month changed
                const dtYear = dateTaken.getUTCFullYear();
                const dtMonth = dateTaken.getUTCMonth()
                if (dtMonth !== prevMonth || dtYear !== prevYear) {
                    this.timelineTicks.push({
                        dayId: day.id,
                        top: currTopRow,
                        topS: currTopStatic,
                        text: dtYear === prevYear ? undefined : dtYear,
                    });
                    prevMonth = dtMonth;
                    prevYear = dtYear;
                }

                // Add header to list
                const head = {
                    id: ++this.numRows,
                    name: dateStr,
                    size: 40,
                    head: true,
                    loadedImages: false,
                    dayId: day.day_id,
                };
                this.heads[day.day_id] = head;
                this.list.push(head);
                currTopStatic += head.size;

                // Add rows
                const nrows = Math.ceil(day.count / this.numCols);
                for (let i = 0; i < nrows; i++) {
                    const row = this.getBlankRow(day.day_id);
                    this.list.push(row);
                    currTopRow++;
                }
            }
console.log(`output->this.timelineTicks`,this.timelineTicks)
            // Fix view height variable
            this.handleViewSizeChange();
            this.loading = false;
        },

        /** Fetch image data for one dayId */
        // async fetchDay(dayId) {
        //     const head = this.heads[dayId];
        //     head.loadedImages = true;

        //     let data = [];
        //     try {
        //         const res = await fetch(`/apps/betterphotos/api/days/${dayId}`);
        //         data = await res.json();
        //         this.days.find(d => d.day_id === dayId).detail = data;
        //     } catch (e) {
        //         console.error(e);
        //         head.loadedImages = false;
        //     }

        //     // Get index of header O(n)
        //     const headIdx = this.list.findIndex(item => item.id === head.id);
        //     let rowIdx = headIdx + 1;

        //     // Add all rows
        //     for (const p of data) {
        //         // Check if we ran out of rows
        //         if (rowIdx >= this.list.length || this.list[rowIdx].head) {
        //             this.list.splice(rowIdx, 0, this.getBlankRow(dayId));
        //         }

        //         // Go to the next row
        //         if (this.list[rowIdx].photos.length >= this.numCols) {
        //             rowIdx++;
        //         }

        //         // Add the photo to the row
        //         this.list[rowIdx].photos.push({
        //             id: p['file_id'],
        //             src: `/core/preview?fileId=${p['file_id']}&c=${p['etag']}&x=250&y=250&forceIcon=0&a=0`,
        //         });
        //     }

        //     // Get rid of any extra rows
        //     let spliceCount = 0;
        //     for (let i = rowIdx + 1; i < this.list.length && !this.list[i].head; i++) {
        //         spliceCount++;
        //     }
        //     if (spliceCount > 0) {
        //         this.list.splice(rowIdx + 1, spliceCount);
        //     }
        // },

        /** Get a new blank row */
        getBlankRow(dayId) {
            return {
                id: ++this.numRows,
                photos:  Array.from({length:Math.round(Math.random() * 8)}, (_, index) => ({
                  l: index,
                })),
                size: this.rowHeight,
                dayId: dayId,
            };
        },

        /** Handle mouse hover on right timeline */
        timelineHover(event) {
            if (event.buttons) {
                this.timelineClick(event);
            }
            this.timelineHoverCursorY = event.offsetY;
        },

        /** Handle mouse leave on right timeline */
        timelineLeave() {
            this.timelineHoverCursorY = -5;
        },

        /** Handle mouse click on right timeline */
        timelineClick(event) {
            this.$refs.scroller.scrollToPosition(this.getTimelinePosition(event));
        },

        /** Get scroller equivalent position from event */
        getTimelinePosition(event) {
            const tH = this.viewHeight;
            const maxH = this.timelineHeight;
            return event.offsetY * tH / maxH;
        },

        /** Scroll to given day Id */
        scrollToDay(dayId) {
            const head = this.heads[dayId];
            if (!head) {
                return;
            }
            this.$refs.scroller.scrollToPosition(1000);
        },

     
    },
}

</script>

  
<style scoped>
.album-container {
  height: calc(100vh - 84px);
    width: 100vw;
    overflow: hidden;
}

.scroller {
    width: calc(100% + 20px);

}

.photo-row .photo {
    display: inline-block;
    position: relative;
    cursor: pointer;
}

.photo-row img {
    background-clip: content-box;
    background-color: #eee;
    padding: 2px;
    object-fit: cover;
    border-radius: 3%;
    cursor: pointer;
}

.photo-row .photo::before {
    content: "";
    position: absolute;
    display: block;
    height: calc(100% - 4px);
    width: calc(100% - 4px);
    top: 2px; left: 2px;
    background: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 95%);
    opacity: 0;
    border-radius: 3%;
    transition: opacity .1s ease-in-out;
    pointer-events: none;
    user-select: none;
}
.photo-row .photo:hover::before {
    opacity: 1;
}

.head-row {
    height: 40px;
    padding-top: 13px;
    padding-left: 3px;
    font-size: 0.9em;
    font-weight: bold;
}

.timeline-scroll {
    position: absolute;
    height: 100%;
    width: 40px;
    top: 0; right: 0;
    overflow: hidden;
    cursor: ns-resize;
}

.timeline-scroll .tick {
    pointer-events: none;
    position: absolute;
    font-size: 0.8em;
    color: grey;
    right: 5px;
    transform: translateY(-50%);
}

.timeline-scroll .tick .dash {
    height: 1px;
    width: 6px;
    background-color: grey;
    opacity: 0.8;
    display: block;
}

.timeline-scroll .cursor {
    position: absolute;
    pointer-events: none;
    right: 5px;
    height: 2px;
    background-color: black;
    border-radius: 4px;
    width: 100%;
}
</style>