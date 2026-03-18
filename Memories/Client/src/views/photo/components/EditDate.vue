<template>
    <v-dialog v-model="isDialogOpen" max-width="560px">
        <div class="container">
            <v-card>
                <div v-if="longDateStr">
                    <v-card-title>
                        <span class="head">Edit Date/Time</span>
                    </v-card-title>
                    <v-card-text>
                        <v-form>
                            <span v-if="photos.length > 1">
                                [Newest]
                            </span>
                            {{ longDateStr }}
                            <div class="fields memories__editdate__fields">
                                <v-text-field label="Year" v-model="year" type="number" class="field"
                                    @input="newestChange()" persistent-placeholder></v-text-field>
                                <v-text-field label="Month" v-model="month" type="number" class="field"
                                    @input="newestChange()" persistent-placeholder></v-text-field>
                                <v-text-field label="Day" v-model="day" type="number" class="field"
                                    @input="newestChange()" persistent-placeholder></v-text-field>
                                <v-text-field label="Hour" v-model="hour" type="number" class="field"
                                    @input="newestChange()" persistent-placeholder></v-text-field>
                                <v-text-field label="Minute" v-model="minute" type="number" class="field"
                                    @input="newestChange()" persistent-placeholder></v-text-field>
                            </div>

                            <div v-if="photos.length > 1" class="oldest">
                                <span v-if="photos.length > 1">
                                    [Oldest]
                                </span>
                                {{ longDateStrLast }}
                                <div class="fields memories__editdate__fields">
                                    <v-text-field label="Year" v-model="yearLast" type="number" class="field"
                                        persistent-placeholder></v-text-field>
                                    <v-text-field label="Month" v-model="monthLast" type="number" class="field"
                                        persistent-placeholder></v-text-field>
                                    <v-text-field label="Day" v-model="dayLast" type="number" class="field"
                                        persistent-placeholder></v-text-field>
                                    <v-text-field label="Hour" v-model="hourLast" type="number" class="field"
                                        persistent-placeholder></v-text-field>
                                    <v-text-field label="Minute" v-model="minuteLast" type="number" class="field"
                                        persistent-placeholder></v-text-field>
                                </div>
                            </div>
                            <div v-if="processing" class="info-pad">
                                {{ `Processing ... ${photosDone}/${photos.length}` }}
                            </div>
                        </v-form>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="save">Save</v-btn>
                        <v-btn @click="close">Cancel</v-btn>
                    </v-card-actions>
                </div>

                <div v-else>
                    {{ `Loading data ... ${photosDone}/${photos.length}` }}
                </div>
            </v-card>
        </div>
    </v-dialog>
</template>
<script lang="ts">
import { IPhoto } from '../types';
import * as utils from "../utils";
import * as dav from "../DavRequest"

export default {
    name: 'EditDate',
    data() {
        return {
            photos: [] as IPhoto[],
            longDateStr: '',
            dialog: false,
            year: '0',
            month: '0',
            day: '0',
            hour: '0',
            minute: '0',
            photosDone: 0,
            processing: false,
            longDateStrLast: '',
            yearLast: '0',
            monthLast: '0',
            dayLast: '0',
            hourLast: '0',
            minuteLast: '0',
            secondLast: '0',
        };
    },
    computed: {
        isDialogOpen: {
            get() {
                return this.photos && this.photos.length > 0;
            },
            set() {
                this.photos = [];
            }
        }
    },
    methods: {
        async open(photos: IPhoto[]) {
            this.photos = photos;
            if (photos.length === 0) {
                return;
            }
            this.photosDone = 0;
            this.longDateStr = '';

            const calls = photos.map((p) => async () => {
                try {
                    // const res = await axios.get<any>(generateUrl(INFO_API_URL, { id: p.fileid }));
                    const res = { data: { datetaken: p.datetaken } }; // Mock response for testing
                    if (typeof res.data.datetaken !== "number") {
                        console.error("Invalid date for", p.fileid);
                        return;
                    }

                    p.datetaken = res.data.datetaken * 1000;
                } catch (error) {
                    console.error('Failed to get date info for', p.fileid, error);
                } finally {
                    this.photosDone++;
                }
            });

            for await (const _ of dav.runInParallel(calls, 10)) {
                // nothing to do
            }

            // Remove photos without datetaken
            this.photos = this.photos.filter((p) => p.datetaken !== undefined);

            // Sort photos by datetaken descending
            this.photos.sort((a, b) => b.datetaken - a.datetaken);

            // Get date of newest photo
            let date = new Date(this.photos[0].datetaken);
            this.year = date.getUTCFullYear().toString();
            this.month = (date.getUTCMonth() + 1).toString();
            this.day = date.getUTCDate().toString();
            this.hour = date.getUTCHours().toString();
            this.minute = date.getUTCMinutes().toString();
            this.second = date.getUTCSeconds().toString();

            this.longDateStr = utils.getLongDateStr(date, false, true);

            // Get date of oldest photo
            if (this.photos.length > 1) {
                date = new Date(this.photos[this.photos.length - 1].datetaken);
                this.yearLast = date.getUTCFullYear().toString();
                this.monthLast = (date.getUTCMonth() + 1).toString();
                this.dayLast = date.getUTCDate().toString();
                this.hourLast = date.getUTCHours().toString();
                this.minuteLast = date.getUTCMinutes().toString();
                this.secondLast = date.getUTCSeconds().toString();
                this.longDateStrLast = utils.getLongDateStr(date, false, true);
            }
        },
        close() {
            this.photos = [];
        },
        async saveOne() {
            // Make PATCH request to update date
            try {
                this.processing = true;
                // const res = await axios.patch<any>(generateUrl(EDIT_API_URL, { id: this.photos[0].fileid }), {
                //     date: this.getExifFormat(this.getDate()),
                // });
                console.log(`saveOne->`,this.getDate())
                this.$emit('refresh', true);
                this.close();
            } catch (e) {
                if (e.response?.data?.message) {
                    console.error(e);
                }
            } finally {
                this.processing = false;
            }
        },
        async saveMany() {
            if (this.processing) {
                return;
            }
    
            // Get difference between newest and oldest date
            const date = new Date(this.photos[0].datetaken);
            const dateLast = new Date(this.photos[this.photos.length - 1].datetaken);
            const diff = date.getTime() - dateLast.getTime();
    
            // Get new difference between newest and oldest date
            let dateNew: Date;
            let dateLastNew: Date;
            let diffNew: number;
    
            try {
                dateNew = this.getDate();
                dateLastNew = this.getDateLast();
                diffNew = dateNew.getTime() - dateLastNew.getTime();
            } catch (e) {
                console.error(e);
                return;
            }
    
            // Validate if the old is still old
            if (diffNew < 0) {
                console.error("The newest date must be newer than the oldest date");
                return;
            }
    
            // Mark processing
            this.processing = true;
            this.photosDone = 0;
    
            // Create PATCH requests
            const calls = this.photos.map((p) => async () => {
                try {
                    let pDate = new Date(p.datetaken);
 
                    // Fallback to start date if invalid date
                    if (isNaN(pDate.getTime())) {
                        pDate = date;
                    }
                    const offset = date.getTime() - pDate.getTime();
                    const scale = diff > 0 ? (diffNew / diff) : 0;
                    const pDateNew = new Date(dateNew.getTime() - offset * scale);
                    // const res = await axios.patch<any>(generateUrl(EDIT_API_URL, { id: p.fileid }), {
                    //     date: this.getExifFormat(pDateNew),
                    // });
                    console.log(`saveMany->`,pDateNew)
                } catch (e) {
                    if (e.response?.data?.message) {
                        console.error(e);
                    }
                } finally {
                    this.photosDone++;
                }
            });
    
            for await (const _ of dav.runInParallel(calls, 10)) {
                // nothing to do
            }
            this.processing = false;
            this.$emit('refresh', true);
            this.close();
        },
        async save() {
            if (this.photos.length === 0) {
                return;
            }
    
            if (this.photos.length === 1) {
                return await this.saveOne();
            }
    
            return await this.saveMany();
        },
        newestChange(time = false) {
            // if no input time is false
            if (this.photos.length === 0) {
                return;
            }

            // Set the last date to have the same offset to newest date
            // what for?
            try {
                const date = new Date(this.photos[0].datetaken);
                const dateLast = new Date(this.photos[this.photos.length - 1].datetaken);

                const dateNew = this.getDate();
                const offset = dateNew.getTime() - date.getTime();
                const dateLastNew = new Date(dateLast.getTime() + offset);

                this.yearLast = dateLastNew.getUTCFullYear().toString();
                this.monthLast = (dateLastNew.getUTCMonth() + 1).toString();
                this.dayLast = dateLastNew.getUTCDate().toString();

                if (time) {
                    this.hourLast = dateLastNew.getUTCHours().toString();
                    this.minuteLast = dateLastNew.getUTCMinutes().toString();
                    this.secondLast = dateLastNew.getUTCSeconds().toString();
                }
            } catch (error) { }
        },
        getExifFormat(date: Date) {
            const year = date.getUTCFullYear().toString().padStart(4, "0");
            const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
            const day = date.getUTCDate().toString().padStart(2, "0");
            const hour = date.getUTCHours().toString().padStart(2, "0");
            const minute = date.getUTCMinutes().toString().padStart(2, "0");
            const second = date.getUTCSeconds().toString().padStart(2, "0");
            return `${year}:${month}:${day} ${hour}:${minute}:${second}`;
        },
        getDate() {
            const dateNew = new Date();
            const year = parseInt(this.year, 10);
            const month = parseInt(this.month, 10) - 1;
            const day = parseInt(this.day, 10);
            const hour = parseInt(this.hour, 10);
            const minute = parseInt(this.minute, 10);
            const second = parseInt(this.second, 10) || 0;
    
            if (isNaN(year)) throw new Error("Invalid year");
            if (isNaN(month)) throw new Error("Invalid month");
            if (isNaN(day)) throw new Error("Invalid day");
            if (isNaN(hour)) throw new Error("Invalid hour");
            if (isNaN(minute)) throw new Error("Invalid minute");
            if (isNaN(second)) throw new Error("Invalid second");
    
            dateNew.setUTCFullYear(year);
            dateNew.setUTCMonth(month);
            dateNew.setUTCDate(day);
            dateNew.setUTCHours(hour);
            dateNew.setUTCMinutes(minute);
            dateNew.setUTCSeconds(second);
            return dateNew;
        },
        getDateLast() {
            const dateLast = new Date();
            const dateNew = new Date();
            const year = parseInt(this.yearLast, 10);
            const month = parseInt(this.monthLast, 10) - 1;
            const day = parseInt(this.dayLast, 10);
            const hour = parseInt(this.hourLast, 10);
            const minute = parseInt(this.minuteLast, 10);
            const second = parseInt(this.secondLast, 10) || 0;
    
            if (isNaN(year)) throw new Error("Invalid last year");
            if (isNaN(month)) throw new Error("Invalid last month");
            if (isNaN(day)) throw new Error("Invalid last day");
            if (isNaN(hour)) throw new Error("Invalid last hour");
            if (isNaN(minute)) throw new Error("Invalid last minute");
            if (isNaN(second)) throw new Error("Invalid last second");
    
            dateNew.setUTCFullYear(year);
            dateNew.setUTCMonth(month);
            dateNew.setUTCDate(day);
            dateNew.setUTCHours(hour);
            dateNew.setUTCMinutes(minute);
            dateNew.setUTCSeconds(second);
            return dateLast;
        }
    }
};
</script>

<style lang="scss" scoped>
.container {
    margin: 20px;

    .head {
        font-weight: 500;
    }
}

.fields {
    display: flex;

    .field {
        width: 4.1em;
        display: inline-block;
        margin-right: 0.2rem;
    }
}

.oldest {
     margin-top: 10px;
 }

.buttons {
    margin-top: 10px;
    text-align: right;

    button {
        display: inline-block;
    }
}
.info-pad {
     margin-top: 6px;
     margin-bottom: 2px;
 
     &.warn {
         color: #f44336;
         font-size: 0.8em;
         line-height: 1em;
     }
 }
</style>
<style lang="scss">
 .memories__editdate__fields label {
     font-size: 0.8em;
     padding: 0 !important;
     padding-left: 3px !important;
 }
 </style>