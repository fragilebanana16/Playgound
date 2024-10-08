<template>
    <div class="banner">
       <div class="slider" style="--quantity: 10">
           <div class="item" style="--position: 1"><img :src="`${baseUrl}/videos/bat-man.jpg`" alt=""></div>
           <div class="item" style="--position: 2"><img :src="`${baseUrl}/videos/blood-shot.jpg`"  alt=""></div>
           <div class="item" style="--position: 3"><img :src="`${baseUrl}/videos/call.jpg`"  alt=""></div>
           <div class="item" style="--position: 4"><img :src="`${baseUrl}/videos/bat-man.jpg`"  alt=""></div>
           <div class="item" style="--position: 5"><img :src="`${baseUrl}/videos/blood-shot.jpg`"  alt=""></div>
           <div class="item" style="--position: 6"><img :src="`${baseUrl}/videos/bat-man.jpg`"  alt=""></div>
           <div class="item" style="--position: 7"><img :src="`${baseUrl}/videos/call.jpg`"  alt=""></div>
           <div class="item" style="--position: 8"><img :src="`${baseUrl}/videos/blood-shot.jpg`"  alt=""></div>
           <div class="item" style="--position: 9"><img :src="`${baseUrl}/videos/bat-man.jpg`"  alt=""></div>
           <div class="item" style="--position: 10"><img :src="`${baseUrl}/videos/call.jpg`"  alt=""></div>
       </div>
   </div>
</template>
 
<script setup>
// const props = defineProps({
//   video: {
//     type: Object,
//     required: true
//   },
//   channel: {
//     type: Number,
//   }
// })
const baseUrl = import.meta.env.VITE_APP_BASE_API;

</script>
 
<style lang="scss">
.banner{
   width: 100%;
   height: 100vh;
   text-align: center;
   overflow: hidden;
   position: relative;
}
.banner .slider{
   position: absolute;
   width: 200px;
   height: 250px;
   top: 10%;
   left: calc(50% - 100px);
   transform-style: preserve-3d;
   transform: perspective(1000px);
   animation: autoRun 120s linear infinite;
   animation-play-state: running;
   z-index: 2;
  --rotate-x: -16deg;
}
@keyframes autoRun{
   from{
       transform: perspective(1000px) rotateX(var(--rotate-x)) rotateY(0deg);
   }to{
       transform: perspective(1000px) rotateX(var(--rotate-x)) rotateY(360deg);
   }
}
.banner .slider .item img{
   border-radius: 20px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}


.banner .slider:hover {
   animation-play-state: paused;
}

.banner .slider:active {
   animation-duration: 1s;
   animation-play-state: running;
}

.banner .slider .item{
   position: absolute;
   inset: 0 0 0 0;
   transform: 
       rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
       translateZ(550px);
    /* 防止背面显示 backface-visibility: hidden;*/
}
.banner .slider .item img{
   width: 100%;
   height: 100%;
   object-fit: cover;
}
.banner .content{
   position: absolute;
   bottom: 0;
   left: 50%;
   transform: translateX(-50%);
   width: min(1400px, 100vw);
   height: max-content;
   padding-bottom: 100px;
   display: flex;
   flex-wrap: wrap;
   justify-content: space-between;
   align-items: center;
   z-index: 1;
}
.banner .content h1{
   font-family: 'ICA Rubrik';
   font-size: 16em;
   line-height: 1em;
   color: #25283B;
   position: relative;
}
.banner .content h1::after{
   position: absolute;
   inset: 0 0 0 0;
   content: attr(data-content);
   z-index: 2;
   -webkit-text-stroke: 2px #d2d2d2;
   color: transparent;
}
.banner .content .author{
   font-family: Poppins;
   text-align: right;
   max-width: 200px;
}
.banner .content h2{
   font-size: 3em;
}
.banner .content .model{
   background-image: url(images/model.png);
   width: 100%;
   height: 75vh;
   position: absolute;
   bottom: 0;
   left: 0;
   background-size: auto 130%;
   background-repeat: no-repeat;
   background-position: top center;
   z-index: 1;
}
@media screen and (max-width: 1023px) {
   .banner .slider{
       width: 160px;
       height: 200px;
       left: calc(50% - 80px);
   }
   .banner .slider .item{
       transform: 
           rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
           translateZ(300px);
   }
   .banner .content h1{
       text-align: center;
       width: 100%;
       text-shadow: 0 10px 20px #000;
       font-size: 7em;
   }
   .banner .content .author{
       color: #fff;
       padding: 20px;
       text-shadow: 0 10px 20px #000;
       z-index: 2;
       max-width: unset;
       width: 100%;
       text-align: center;
       padding: 0 30px;
   }
}
@media screen and (max-width: 767px) {
   .banner .slider{
       width: 100px;
       height: 150px;
       left: calc(50% - 50px);
   }
   .banner .slider .item{
       transform: 
           rotateY(calc( (var(--position) - 1) * (360 / var(--quantity)) * 1deg))
           translateZ(180px);
   }
   .banner .content h1{
       font-size: 5em;
   }
}
</style>