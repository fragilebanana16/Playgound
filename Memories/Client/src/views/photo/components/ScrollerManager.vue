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
            <div class="text">{{ hoverCursorText }} </div>
            <div class="icon">
                <Icon icon='material-symbols:unfold-more'></Icon>
            </div>
        </span>
        <div v-for="(tick, index) in ticks" :key="tick['dayId']" class="tick" :class="{ 'dash': !tick['text'] }"
            :style="{ top: Math.floor((index === 0 ? 10 : 0) + tick['top']) + 'px' }">
            <span v-if="tick['text']">{{ tick['text'] }}</span>
        </div>
    </div>
</template>
<script lang="ts">
import { Icon } from '@iconify/vue'
import * as utils from "../utils";
import { IDay, IHeadRow, IRow, IRowType, ITick } from '../types';
import { c, TagDayID } from "../constants";
import * as dav from "../DavRequest"


export default {
    name: 'ScrollerManager',
    components: {
        Icon
    },
    props: {
        /** Rows from Timeline */
        rows: {
            type: Object as () => IRow[],
            required: true,
        },
        /** Total height */
        height: {
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
            recyclerHeight: 100,
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
            /** Tick adjust timer */
            adjustTimer: null as number | null
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
            // Ignore if not initialized
            if (!this.ticks.length) return;

            // Get the scroll position
            const scroll = this.recycler?.$el?.scrollTop || 0;
            // Move hover cursor to px position
            this.cursorY = utils.roundHalf(scroll * this.height / this.recyclerHeight);
            this.moveHoverCursor(this.cursorY);

            // Show the scroller for some time
            if (this.scrollingRecyclerTimer) window.clearTimeout(this.scrollingRecyclerTimer);
            this.scrollingRecycler = true;
            this.scrollingRecyclerTimer = window.setTimeout(() => {
                this.scrollingRecycler = false;
                this.scrollingRecyclerTimer = null;
            }, 1500);
        },
        setTickTop(tick: ITick) {
         const extraY = this.recyclerBefore?.clientHeight || 0;
         tick.topF = (extraY + tick.y) * (this.height / this.recyclerHeight);
         tick.top = utils.roundHalf(tick.topF);
        },
        /** Re-create timeline tick data in the next frame */
        async reflow() {
            if (this.reflowRequest) {
                return;
            }
            this.reflowRequest = true;
            await this.$nextTick();
            this.reflowNow();
            this.reflowRequest = false;
        },
        /** Re-create tick data */
        reflowNow() {
            // Ignore if not initialized
            if (!this.recycler?.$refs.wrapper) return;
            // Refresh height of recycler
            this.recyclerHeight = this.recycler.$refs.wrapper.clientHeight;

            // Recreate ticks data
            this.recreate();

            // Recompute which ticks are visible
            this.computeVisibleTicks();
        },
        /** Mark ticks as visible or invisible */
        computeVisibleTicks() {
            // Do another pass to figure out which points are visible
            // This is not as bad as it looks, it's actually 12*O(n)
            // because there are only 12 months in a year
            const fontSizePx = parseFloat(getComputedStyle(this.$refs.cursorSt as any).fontSize);
            const minGap = fontSizePx + (window.innerWidth <= 768 ? 5 : 2);
            let prevShow = -9999;
            for (const [idx, tick] of this.ticks.entries()) {
                // You can't see these anyway, why bother?
                if (tick.top < minGap || tick.top > this.height - minGap) {
                    tick.s = false;
                    continue;
                }

                // Will overlap with the previous tick. Skip anyway.
                if (tick.top - prevShow < minGap) {
                    tick.s = false;
                    continue;
                }

                // This is a labelled tick then show it anyway for the sake of best effort
                if (tick.text) {
                    tick.s = true;
                    prevShow = tick.top;
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
                    if (tick.top + minGap > nextLabelledTick.top &&
                        nextLabelledTick.top < this.height - minGap) { // make sure this will be shown
                        tick.s = false;
                        continue;
                    }
                }

                // Show this tick
                tick.s = true;
                prevShow = tick.top;
            }
        },
        /**
         * Update tick positions without truncating the list
         * This is much cheaper than reflowing the whole thing
         */
        adjust() {
            if (this.adjustTimer) return;
            this.adjustTimer = window.setTimeout(() => {
                this.adjustTimer = null;
                this.adjustNow();
            }, 300); 
        },
        /** Do adjustment synchrnously */
        adjustNow() {
         // Refresh height of recycler
         this.recyclerHeight = this.recycler.$refs?.wrapper?.clientHeight;
         console.log(this.recyclerHeight)

         // Start with the first tick. Walk over all rows counting the
         // y position. When you hit a row with the tick, update y and
         // top values and move to the next tick.
         let tickId = 0;
         let y = 0;
         for (const row of this.rows) {
            // Check if tick is valid
            if (tickId >= this.ticks.length) {
                    return;
            }
            // Check if we hit the next tick
            const tick = this.ticks[tickId];
             if (tick.dayId === row.dayId) {
                 tick.y = y;
                 this.setTickTop(tick);
                 tickId++;
             }
             y += row.size;
         }
        },
        /** Recreate from scratch */
        recreate() {
            // Clear
            this.ticks = [];

            // Ticks
            let y = 0;
            let prevYear = 9999;
            let prevMonth = 0;
            const thisYear = new Date().getFullYear();

            // Get a new tick
            const getTick = (dayId: number, text?: string | number): ITick => {
                const tick = {
                    dayId,
                    y: y,
                    text,
                    topF: 0,
                    top: 0,
                    s: false,
                };
                this.setTickTop(tick);
                return tick
            }

            // Itearte over rows
            for (const row of this.rows) {
                if (row.type === IRowType.HEAD) {
                    if (Object.values(TagDayID).includes(row.dayId)) {
                        // Blank tick
                        this.ticks.push(getTick(row.dayId));
                    } else {
                        // Make date string
                        const dateTaken = utils.dayIdToDate(row.dayId);

                        // Create tick if month changed
                        const dtYear = dateTaken.getUTCFullYear();
                        const dtMonth = dateTaken.getUTCMonth()
                        if (Number.isInteger(row.dayId) && (dtMonth !== prevMonth || dtYear !== prevYear)) {
                            const text = (dtYear === prevYear || dtYear === thisYear) ? undefined : dtYear;
                            this.ticks.push(getTick(row.dayId, text));
                        }
                        prevMonth = dtMonth;
                        prevYear = dtYear;
                    }
                }

                y += row.size;
            }
        },
        /** Change actual position of the hover cursor */
        moveHoverCursor(y: number) {
            this.hoverCursorY = utils.roundHalf(y);

            // Get index of previous tick
            let idx = utils.binarySearch(this.ticks, y, 'topF');
            if (idx === 0) {
             // use this tick
            } else if (idx >= 1) {
                idx = idx - 1;
            } else if (idx === -1 && this.ticks.length > 0) {
                idx = this.ticks.length - 1;
            } else {
                return;
            }
            if(!this.ticks[idx]){
                return
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
    width: 40px;
    top: 0;
    right: 0;
    cursor: ns-resize;
    opacity: 0;
    transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 1;

    // Subtle frosted glass track on hover
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        right: 4px;
        left: auto;
        width: 2px;
        background: rgba(0, 0, 0, 0.08);
        border-radius: 99px;
        transition: opacity 0.25s ease;
        opacity: 0;
    }

    &:hover,
    &.scrolling-recycler {
        opacity: 1;

        &::before {
            opacity: 1;
        }
    }

    // Mobile styles
    @include phone {
        &:not(.scrolling-timeline) {
            .cursor.hv {
                left: 12px;
                border: none;
                background: rgba(255, 255, 255, 0.92);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                box-shadow:
                    0 2px 12px rgba(0, 0, 0, 0.12),
                    0 0 0 1px rgba(0, 0, 0, 0.06);
                height: 32px;
                border-radius: 16px;
                padding: 0 8px;

                > .text {
                    display: none;
                }

                > .icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.5;
                    transform: translateX(-2px);
                }
            }

            > .tick {
                opacity: 0;
            }
        }

        .cursor.st {
            display: none;
        }
    }

    // Tick marks
    > .tick {
        pointer-events: none;
        position: absolute;
        font-size: 0.7em;
        font-weight: 700;
        letter-spacing: 0.02em;
        opacity: 0.55;
        right: 10px;
        transform: translateY(-50%);
        z-index: 1;
        transition: opacity 0.15s ease;

        &:hover {
            opacity: 0.9;
        }

        &.dash {
            height: 3px;
            width: 3px;
            border-radius: 50%;
            background-color: currentColor;
            opacity: 0.15;
            display: block;
            right: 8px;

            @include phone {
                display: none;
            }
        }

        @include phone {
            background: rgba(255, 255, 255, 0.88);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            padding: 1px 5px;
            border-radius: 5px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
    }

    // Cursors
    > .cursor {
        position: absolute;
        pointer-events: none;
        right: 0;
        min-width: 100%;
        will-change: transform;
        transition: opacity 0.2s ease;

        &.st {
            // Scrolling position indicator — thin elegant line
            height: 2px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 99px;
            min-height: unset;
            font-size: 0.75em;
            opacity: 0;

            // Glowing dot at the right end
            &::after {
                content: '';
                position: absolute;
                right: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.8);
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
            }
        }

        &.hv {
            // Hover label — frosted pill
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-top: 1.5px solid rgba(0, 0, 0, 0.75);
            box-shadow:
                0 2px 16px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(0, 0, 0, 0.05);
            padding: 3px 8px 3px 6px;
            border-radius: 0 4px 4px 4px;
            width: auto;
            white-space: nowrap;
            z-index: 100;
            font-size: 0.82em;
            font-weight: 650;
            letter-spacing: 0.01em;
            color: rgba(0, 0, 0, 0.85);

            // Dark mode
            .dark & {
                background: rgba(30, 30, 30, 0.88);
                border-top-color: rgba(255, 200, 100, 0.8);
                color: rgba(255, 255, 255, 0.9);
                box-shadow:
                    0 2px 16px rgba(0, 0, 0, 0.4),
                    0 0 0 1px rgba(255, 255, 255, 0.06);
            }

            > .icon {
                display: none;
                opacity: 0.6;
                transform: translateX(-4px);
            }
        }
    }

    // Reveal st cursor on hover
    &:hover > .cursor.st {
        opacity: 1;
    }

    // Dark mode track
    .dark & {
        &::before {
            background: rgba(255, 255, 255, 0.12);
        }

        > .cursor.st {
            background: rgba(255, 255, 255, 0.75);

            &::after {
                background: rgba(255, 255, 255, 0.9);
                box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.6);
            }
        }

        > .tick {
            opacity: 0.4;

            &.dash {
                opacity: 0.12;
            }
        }
    }
}</style>