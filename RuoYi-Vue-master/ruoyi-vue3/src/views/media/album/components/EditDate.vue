<template>
    <v-dialog v-model="dialog" max-width="600px">
        <v-card>
          <v-card-title>
            <span class="headline">Input Form</span>
          </v-card-title>

          <v-card-text>
            <v-form>
              <v-text-field label="Title" v-model="title"></v-text-field>
              <v-textarea label="Description" v-model="description"></v-textarea>
              <v-text-field label="Label" v-model="label"></v-text-field>
              <v-text-field label="Tag" v-model="tag"></v-text-field>
            </v-form>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="save">Save</v-btn>
            <v-btn @click="dialog = false">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
</template>
<script>
import { Icon } from '@iconify/vue'
import { c } from "../constants";

export default {
    name: 'EditDate',
    components: {
        Icon
    },
    props: {
        
    },
    data() {
        return {
            dialog: false,
            title: '',
            description: '',
            label: '',
            tag: ''
        }
    },
    mounted() {
    },
    methods: {
        open(){
            // todo
            this.dialog = true;
        },
        save() {
            // todo
            console.log('Saved:', { title: this.title, description: this.description, label: this.label, tag: this.tag });
            this.dialog = false;
        }
    }
}
</script>
<style lang="scss" scoped>
</style>