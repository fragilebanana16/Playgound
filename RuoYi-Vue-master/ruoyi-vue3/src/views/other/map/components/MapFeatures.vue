<template>
  <div
    class="w-full md:w-auto absolute md:top-[20px] md:left-[60px] z-[2] flex gap-4 px-6 md:px-0 md:py-0 bg-transparent"
  >
    <!-- Search -->
    <div class="relative flex-1 md:min-w-[350px] bg-white shadow-md rounded-md">
      <!-- Search Input -->
      <input
        class="pl-9 pr-4 py-3 text-[14px] focus:outline-none w-full shadow-md rounded-md"
        type="text"
        placeholder="Start your search..."
        v-model="searchQuery"
        @input="search"
        @focus="$emit('toggleSearchResults')"
      />
      <!-- Search Icon -->
      <div class="absolute top-0 left-[8px] h-full flex items-center">
        <Icon icon='material-symbols:search-rounded'></Icon>
      </div>
      <!-- Search Results -->
      <div class="absolute mt-[8px] w-full">
        <!-- Search Queries -->
        <div
          v-if="searchQuery && searchResults"
          class="h-[200px] overflow-scroll bg-white rounded-md"
        >
          <!-- Loading Spinner -->
          <LoadingSpinner v-if="!searchData" />
          <!-- Display Results -->
          <div v-else>
            <div
              class="px-4 py-2 flex gap-x-2 cursor-pointer hover:bg-slate-600 hover:text-white"
              v-for="(result, index) in searchData"
              :key="index"
              @click="selectResult(result)"
            >
              <Icon icon='material-symbols:location-on'></Icon>
              <p class="text-[12px]">{{ result.place_name_en }}</p>
            </div>
          </div>
        </div>
        <!-- Selected Search Result -->
        <div v-if="selectedResult" class="mt-[8px] px-4 py-3 bg-white rounded-md">
          <Icon @click="removeResult" icon='material-symbols:cancel-outline' class="ml-auto"></Icon>
          <h1 class="text-lg">{{ selectedResult.text }}</h1>
          <p class="text-xs mb-1">
            {{ selectedResult.properties.address }}, {{ selectedResult.city }},
            {{ selectedResult.state }}
          </p>
          <p class="text-xs">{{ selectedResult.properties.category }}</p>
        </div>
      </div>
    </div>
    <!-- Geolocation -->
    <div
      class="px-4 flex items-center shadow-md rounded-md min-h-[45px]"
      @click="$emit('getGeolocation')"
      :class="[coords ? 'bg-slate-600' : 'bg-white']"
    >
    <Icon icon='material-symbols:location-searching' :class="{ 'text-white': coords, 'animate-pulse': fetchCoords }" class="text-[18px]"></Icon>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import { Icon } from '@iconify/vue'
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner.vue";
export default {
  props: ["fetchCoords", "coords", "searchResults"],
  components: { LoadingSpinner, Icon },
  setup(props, { emit }) {
    const searchQuery = ref(null);
    const searchData = ref(null);
    const queryTimeout = ref(null);
    const selectedResult = ref(null);

    const search = () => {
      clearTimeout(queryTimeout.value);

      // reset data on a new search
      searchData.value = null;
      queryTimeout.value = setTimeout(async () => {
        // Only make search, if there is value in query input
        if (searchQuery.value !== "") {
          const params = new URLSearchParams({
            fuzzyMatch: true,
            language: "en",
            limit: 10,
            proximity: props.coords ? `${props.coords.lng},${props.coords.lat}` : "0,0",
          });
          const data = await axios.get(`api/search/${searchQuery.value}?${params}`);
          // searchData.value = data.data.features;
          searchData.value = [
          {place_name_en: "Test", geometry: {coordinates: [120, 44.09]}, properties: {address: "123 Test St", category: "Test Category"}, city: "Test City", state: "Test State"},
          {place_name_en: "Test2", geometry: {coordinates: [151.505, -0.09]}, properties: {address: "123 Test2 St", category: "Test2 Category"}, city: "Test2 City", state: "Test2 State"}
          ];
        }
      }, 750);
    };

    const selectResult = (result) => {
      selectedResult.value = result;
      emit("plotResult", result.geometry);
    };

    const removeResult = () => {
      selectedResult.value = null;
      emit("removeResult");
    };

    return {
      searchQuery,
      search,
      searchData,
      selectResult,
      selectedResult,
      removeResult,
    };
  },
};
</script>
