<template>
    <v-dialog v-model="isDialogOpen" max-width="560px">
        <div class="container">
            <v-card>
                <v-card-title>
                    <span class="head">Edit Date/Time</span>
                </v-card-title>
                <v-card-text>
                    <v-form>
                        <div v-if="photos.length === 1 && longDateStr">
                            {{ longDateStr }}
                            <div class="fields">
                                <v-text-field label="Year" v-model="year" type="number" class="field"
                                    persistent-placeholder></v-text-field>
                                <v-text-field label="Month" v-model="month" type="number" class="field"
                                    persistent-placeholder></v-text-field>
                                <v-text-field label="Day" v-model="day" type="number" class="field"
                                    persistent-placeholder></v-text-field>
                                <v-text-field label="Hour" v-model="hour" type="number" class="field"
                                    persistent-placeholder></v-text-field>
                                <v-text-field label="Minute" v-model="minute" type="number" class="field"
                                    persistent-placeholder></v-text-field>
                            </div>
                        </div>
                    </v-form>
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" @click="save">Save</v-btn>
                    <v-btn @click="close">Cancel</v-btn>
                </v-card-actions>
            </v-card>
        </div>
    </v-dialog>
</template>
<script lang="ts">
import { IPhoto } from '../types';
import * as utils from "../utils";

export default {
    name: 'EditDate',
    props: {
    },
    data() {
        return {
            photos: [] as IPhoto[],
            longDateStr: '',
            dialog: false,
            year: '',
            month: '',
            day: '',
            hour: '',
            minute: '',
        };
    },
    computed: {
        isDialogOpen: {
            get() {
                return this.photos && this.photos.length > 0;
            },
            set(value) {
                this.photos = [];
            }
        }
    },
    methods: {
        open(photos: IPhoto[]) {
            this.photos = photos;
            if (photos.length === 0) {
                return;
            }

            //  const res = await axios.get<any>(generateUrl(INFO_API_URL, { id: this.photos[0].fileid }));
            const res = { data: { datetaken: "2023-10-01" } }; // Mock response for testing
            if (typeof res.data.datetaken !== "string") {
                console.error("Invalid date");
                return;
            }

            const utcEpoch = Date.parse(res.data.datetaken + " UTC");
            const date = new Date(utcEpoch);
            this.year = date.getUTCFullYear().toString();
            this.month = (date.getUTCMonth() + 1).toString();
            this.day = date.getUTCDate().toString();
            this.hour = date.getUTCHours().toString();
            this.minute = date.getUTCMinutes().toString();
            this.second = date.getUTCSeconds().toString();

            this.longDateStr = utils.getLongDateStr(date, false, true);
        },
        close() {
            this.photos = [];
        },
        save() {
            // Pad zeros to the left
            this.year = this.year.padStart(4, '0');
            this.month = this.month.padStart(2, '0');
            this.day = this.day.padStart(2, '0');
            this.hour = this.hour.padStart(2, '0');
            this.minute = this.minute.padStart(2, '0');
            this.second = this.second.padStart(2, '0');

            // Make PATCH request to update date
            try {
                //  const res = await axios.patch<any>(generateUrl(EDIT_API_URL, { id: this.photos[0].fileid }), {
                //      date: `${this.year}:${this.month}:${this.day} ${this.hour}:${this.minute}:${this.second}`,
                //  });
                const res = { data: { message: "Date updated successfully" } }; // Mock response for testing
                console.log(`${this.year}:${this.month}:${this.day} ${this.hour}:${this.minute}:${this.second}`);
                this.close();
            } catch (e) {
                if (e.response?.data?.message) {
                    console.error(e.response.data.message);
                }
            }
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
    margin-top: 5px;
    display: flex;

    .field {
        width: 4.1em;
        display: inline-block;
        margin-right: 0.2rem;
    }
}

.buttons {
    margin-top: 10px;
    text-align: right;

    button {
        display: inline-block;
    }
}
</style>