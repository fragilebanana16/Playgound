<template>
    <div id="home">
        <section>
            <v-carousel height="90vh" cycle interval="200000" hide-delimiter-background>
                <template v-slot:prev="{ props }">
                    <div @click="props.onClick" class="slider-arrow">
                        <v-icon size="40" icon="mdi-chevron-left" class="hover-icon"></v-icon>
                    </div>
                </template>
                <template v-slot:next="{ props }">
                    <div @click="props.onClick" class="slider-arrow">
                        <v-icon size="40" @click="props.onClick" icon="mdi-chevron-right" class="hover-icon"></v-icon>
                    </div>
                </template>
                <v-carousel-item v-for="(movie, i) in movies" :key="i">
                    <v-img aspect-ratio="16/9" cover :src="`${baseUrl}/videos/${movie.image}`"
                        style="mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0));"></v-img>
                    <!-- <div class="overlay"></div> if is black mode, turn this on -->
                    <div class="absolute inset-y-0 left-0 flex items-center p-5 ">
                        <div class="pl-15 max-w-[70%] h-[30%]">
                            <h2 class="text-white text-6xl font-bold mb-4 line-clamp-1">{{ movie.title }}</h2>
                            <div class="flex  items-center mt-3 ">
                                <div class="flex justify-between items-center">
                                    <v-icon size="18" icon=" mdi-timer" color="white" class=" mr-3 "></v-icon>
                                    <span class="text-gray-200">{{ movie.duration }}</span>
                                </div>
                                <span class="bg-red-600 text-white px-2 py-1 rounded-md text-sm ml-4">{{ movie.rating
                                }}</span>
                            </div>
                            <p class="text-gray-300 mt-8">{{ movie.description }}</p>
                            <v-btn class="mt-8" variant="elevated" size="x-large">
                                <div class="flex justify-between items-center">
                                    <v-icon size="28" icon="mdi-play" color="black" class="mr-4"></v-icon>
                                    Play
                                </div>

                            </v-btn>
                        </div>
                    </div>
                </v-carousel-item>
            </v-carousel>

        </section>

        <section>
            <div class="ml-14 mt-14 mb-8 pl-5 uppercase text-xl font-bold border-l-4 border-red-500 flex items-center">
                最新上传
            </div>
            <v-slide-group class="mt-4" show-arrows>
                <div v-for="(movie, index) in moviesRecent" :key="index" class="mx-2 my-2">
                    <div class="relative overflow-hidden cursor-pointer  rounded-lg shadow-md shadow-black">
                        <v-img :src="`${baseUrl}/videos/${movie.image}`" cover width="316" height="460"></v-img>
                        <div
                            class="absolute bottom-0 left-0 right-0 h-34 bg-gradient-to-t from-black to-transparent p-4 text-white">
                            <h2 class="text-3xl font-bold truncate">{{ movie.title }}</h2>
                            <p class="text-sm line-clamp-1 mt-2">{{ movie.description }}</p>
                            <p class="text-sm mt-2">评分: {{ movie.rating }} | {{ movie.duration }}</p>
                        </div>
                    </div>
                </div>
            </v-slide-group>
        </section>

        <section>
            <div class="ml-14 mt-14 mb-8 pl-5 uppercase text-xl font-bold border-l-4 border-red-500 flex items-center">
                高分排行
            </div>
            <v-slide-group class="mt-4" show-arrows>
                <div v-for="(movie, index) in moviesRecent" :key="index" class="mx-2 my-2">
                    <div class="relative overflow-hidden cursor-pointer  rounded-lg shadow-md shadow-black">
                        <v-img :src="`${baseUrl}/videos/${movie.image}`" cover width="316" height="460"></v-img>
                        <div
                            class="absolute bottom-0 left-0 right-0 h-34 bg-gradient-to-t from-black to-transparent p-4 text-white">
                            <h2 class="text-3xl font-bold truncate">{{ movie.title }}</h2>
                            <p class="text-sm line-clamp-1 mt-2">{{ movie.description }}</p>
                            <p class="text-sm mt-2">评分: {{ movie.rating }} | {{ movie.duration }}</p>
                        </div>
                    </div>
                </div>
            </v-slide-group>
        </section>
        <section>
            <div class="ml-14 mt-14 mb-8 pl-5 uppercase text-xl font-bold border-l-4 border-red-500 flex items-center">
                随便看看
            </div>
            <ThreeDMovieSlider  class="mx-14"/>
        </section>

    </div>
</template>
    
<script setup>
import ThreeDMovieSlider from '../components/ThreeDMovieSlider'

const baseUrl = import.meta.env.VITE_APP_BASE_API;

const streamingPrefix = '/media/streaming/videos'
const moviesRecent = [
    {
        title: '电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1',
        description: '这是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '120 分钟',
        rating: '8.7/10',
        image: 'bat-man.jpg',
    },
    {
        title: '电影标题 2',
        description: '这是电影的描述 2是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'blood-shot.jpg',
    },
    {
        title: '电影标题 3',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    },
    {
        title: '电影标题 4',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'blood-shot.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'blood-shot.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'blood-shot.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'blood-shot.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    },
    {
        title: '电影标题 5',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'call.jpg',
    }
]
const movies = [
    {
        title: '电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1电影标题 1',
        description: '这是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '120 分钟',
        rating: '8.7/10',
        image: 'transformer-banner.jpg',
    },
    {
        title: '电影标题 2',
        description: '这是电影的描述 2是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'supergirl-banner.jpg',
    },
    {
        title: '电影标题 3',
        description: '这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。这是电影的描述 3是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1是电影的描述 1。',
        duration: '130 分钟',
        rating: '9.1/10',
        image: 'black-banner.png',
    },
]
</script>
<style >
.video-js .vjs-big-play-button {
    top: 50%;
    left: 50%;
    margin-left: -1.5em;
    margin-top: -1em
}

.slider-arrow {
    backdrop-filter: blur(10px);
    padding: 10px;
    border-radius: 2rem;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    cursor: pointer;
}

.hover-icon {
    color: white;
    transition: color 0.3s ease;
}

.hover-icon:hover {
    color: #c0392b;
}

.overlay {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
}
</style>
    