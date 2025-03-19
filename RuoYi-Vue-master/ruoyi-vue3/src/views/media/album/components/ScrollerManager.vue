<template>
    <!-- Timeline -->
    <div class="scroller" :class="{
        'scrolling-recycler': scrollingRecycler,
        'scrolling-timeline': scrolling,
    }" @mousemove="mousemove" @touchmove="touchmove" @mouseleave="mouseleave" @mousedown="mousedown">
        <span class="cursor st dark:bg-[#ffffff]" ref="cursorSt" :style="{ transform: `translateY(${cursorY}px)` }">
        </span>
        <span class="cursor hv border-t-2 border-black dark:border-t-amber-900"
            :style="{ transform: `translateY(${hoverCursorY}px)` }">
            <div class="text"> {{ hoverCursorText }} </div>
            <div class="icon">
                <Icon icon='material-symbols:unfold-more'></Icon>
            </div>
        </span>
        <div v-for="(tick, index) in ticks" :key="tick['dayId']" class="tick" :class="{ 'dash': !tick['text'] }"
            :style="{ top: Math.floor((index === 0 ? 10 : 0) + tick['topC']) + 'px' }">
            <span v-if="tick['text']">{{ tick['text'] }}</span>
        </div>
    </div>
</template>
<script lang="ts">
import { Icon } from '@iconify/vue'
import * as utils from "../utils";
import { IHeadRow, IDay, ITick } from '../types';
import { c, TagDayID } from "../constants";
import * as dav from "../DavRequest"
export default {
    name: 'ScrollerManager',
    components: {
        Icon
    },
    props: {
        /** Days from Timeline */
        days: {
            type: Object as () => IDay[],
            required: true,
        },
        /** Heads from Timeline */
        heads: {
            type: Object as () => { [dayid: number]: IHeadRow },
            required: true,
        },
        /** Total height */
        height: {
            type: Number,
            required: true,
        },
        /** Height of a row */
        rowHeight: {
            type: Number,
            required: true,
        },
        /** Actual recycler component */
        recycler: {
            type: undefined,
            required: true,
        },
        // /** Recycler before slot component */
        // recyclerBefore: {
        //     type: Object as any,
        //     required: true,
        // },
    },
    data() {
        return {
            /** Height of the entire photo view */
            recyclerHeight: 0,
            /** Computed ticks */
            ticks: [],
            /** Computed cursor top */
            cursorY: 0,
            /** Hover cursor top */
            hoverCursorY: -5,
            /** Hover cursor text */
            hoverCursorText: "",
            /** Scrolling currently */
            scrolling: false,
            /** Scrolling timer */
            scrollingTimer: null as number | null,
            /** Scrolling recycler currently */
            scrollingRecycler: false,
            /** Scrolling recycler timer */
            scrollingRecyclerTimer: null as number | null,
            /** View size reflow timer */
            reflowRequest: false,
            /** Flag consts */
            c: c,
        }
    },
    mounted() {
    },
    methods: {
        /** Reset state */
        reset() {
            this.ticks = [];
            this.cursorY = 0;
            this.hoverCursorY = -5;
            this.hoverCursorText = "";
            this.scrolling = false;
            this.scrollingTimer = null;
            this.reflowRequest = false;
        },
        /** Recycler scroll event, must be called by timeline */
        recyclerScrolled(event?: any) {
            this.cursorY = event ? event.target.scrollTop * this.height / this.recyclerHeight : 0;
            this.moveHoverCursor(this.cursorY);
            if (this.scrollingRecyclerTimer) window.clearTimeout(this.scrollingRecyclerTimer);
            this.scrollingRecycler = true;
            this.scrollingRecyclerTimer = window.setTimeout(() => {
                this.scrollingRecycler = false;
                this.scrollingRecyclerTimer = null;
            }, 1500);
        },
        /** Re-create timeline tick data in the next frame */
        async reflow(orderOnly = false) {
            if (this.reflowRequest) {
                return;
            }
            this.reflowRequest = true;
            await this.$nextTick();
            this.reflowNow(orderOnly);
            this.reflowRequest = false;
        },
        /** Re-create tick data */
        reflowNow(orderOnly = false) {
            if (!orderOnly) {
                this.recreate();
            }

            this.recyclerHeight = this.recycler.$refs.wrapper.clientHeight;

            // // Static extra height at top
            // const rb = this.recyclerBefore as Element;
            // const extraHeight = rb?.clientHeight || 0;

            // Compute tick positions
            for (const tick of this.ticks) {
                tick.topC = (tick.topS + tick.top * this.rowHeight) * this.height / this.recyclerHeight;
            }

            // Do another pass to figure out which points are visible
            // This is not as bad as it looks, it's actually 12*O(n)
            // because there are only 12 months in a year
            const fontSizePx = parseFloat(getComputedStyle(this.$refs.cursorSt as any).fontSize);
            const minGap = fontSizePx + (window.innerWidth <= 768 ? 5 : 2);
            let prevShow = -9999;
            for (const [idx, tick] of this.ticks.entries()) {
                // You can't see these anyway, why bother?
                if (tick.topC < minGap || tick.topC > this.height - minGap) {
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
                while (i < this.ticks.length) {
                    if (this.ticks[i].text) {
                        break;
                    }
                    i++;
                }
                if (i < this.ticks.length) {
                    // A labelled tick was found
                    const nextLabelledTick = this.ticks[i];
                    if (tick.topC + minGap > nextLabelledTick.topC &&
                        nextLabelledTick.topC < this.height - minGap) { // make sure this will be shown
                        tick.s = false;
                        continue;
                    }
                }

                // Show this tick
                tick.s = true;
                prevShow = tick.topC;
            }
        },
        /** Recreate from scratch */
        recreate() {
            // Clear
            this.ticks = [];

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
                    continue;
                }
                if (Object.values(TagDayID).includes(day.dayid)) {
                    // Blank dash ticks only
                    this.ticks.push(getTick(day));
                } else {
                    // Make date string
                    const dateTaken = utils.dayIdToDate(day.dayid);

                    // Create tick if month changed
                    const dtYear = dateTaken.getUTCFullYear();
                    const dtMonth = dateTaken.getUTCMonth()
                    if (Number.isInteger(day.dayid) && (dtMonth !== prevMonth || dtYear !== prevYear)) {
                        this.ticks.push(getTick(day, (dtYear === prevYear || dtYear === thisYear) ? undefined : dtYear));
                    }
                    prevMonth = dtMonth;
                    prevYear = dtYear;
                }

                currTopStatic += this.heads[day.dayid].size;
                currTopRow += day.rows.size;
            }
        },
        /** Change actual position of the hover cursor */
        moveHoverCursor(y: number) {
            this.hoverCursorY = y;

            // Get index of previous tick
            let idx = this.ticks.findIndex(t => t.topC > y);
            if (idx >= 1) {
                idx = idx - 1;
            } else if (idx === -1 && this.ticks.length > 0) {
                idx = this.ticks.length - 1;
            } else {
                return;
            }

            // DayId of current hover
            const dayId = this.ticks[idx].dayId

            // Special days
            if (Object.values(TagDayID).includes(dayId)) {
                this.hoverCursorText = "";
                return;
            }

            const date = utils.dayIdToDate(dayId);
            this.hoverCursorText = utils.getShortDateStr(date);
        },
        /** Handle mouse hover */
        mousemove(event: MouseEvent) {
            if (event.buttons) {
                this.mousedown(event);
            }
            this.moveHoverCursor(event.offsetY);
        },
        /** Handle mouse leave */
        mouseleave() {
            this.moveHoverCursor(this.cursorY);
        },

        /** Handle mouse click */
        mousedown(event: MouseEvent) {
            this.recycler.scrollToPosition(this.getRecyclerY(event.offsetY));
            this.handleScroll();
        },
        /** Handle touch */
        touchmove(event: any) {
            const rect = event.target.getBoundingClientRect();
            const y = event.targetTouches[0].pageY - rect.top;
            this.recycler.scrollToPosition(this.getRecyclerY(y));
            event.preventDefault();
            event.stopPropagation();
            this.handleScroll();
        },

        /** Update this is being used to scroll recycler */
        handleScroll() {
            if (this.scrollingTimer) window.clearTimeout(this.scrollingTimer);
            this.scrolling = true;
            this.scrollingTimer = window.setTimeout(() => {
                this.scrolling = false;
                this.scrollingTimer = null;
            }, 1500);
        },

        /** Get recycler equivalent position from event */
        getRecyclerY(y: number) {
            const tH = this.recyclerHeight;
            const maxH = this.height;
            return y * tH / maxH;
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

.scroller {
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
    &.scrolling-recycler {
        opacity: 1;
    }

    // Hide ticks on mobile unless hovering
    @include phone {
        &:not(.scrolling-timeline) {
            .cursor.hv {
                left: 15px;
                border: none;
                box-shadow: 0 0 5px -3px #000;
                height: 30px;
                border-radius: 15px;

                >.text {
                    display: none;
                }

                >.icon {
                    display: block;
                    transform: translate(-3px, 5px);
                }
            }

            >.tick {
                opacity: 0;
            }
        }

        .cursor.st {
            display: none;
        }
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
        will-change: transform;

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

            >.icon {
                display: none;
                transform: translateX(-5px);
            }
        }
    }

    &:hover>.cursor.st {
        opacity: 1;
    }
}</style>