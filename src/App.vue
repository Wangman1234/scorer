<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import Init from './scripts/Init.vue'
import {Fencer} from "./scripts/Classes.ts";
import {CountryList} from "./scripts/Country.ts";

const started = ref(false)
const menu = ref(false)
const page = ref("bout")
const change = ref<false | string>(false)

const config = ref({
  piste: 1,
  compe: "",
  keymap: {
    AddMin: "ArrowUp",
    AddSec: "ArrowDown",
    LeftAdd1: "AudioVolumeUp",
    RightAdd1: "PageUp",
    LeftAdd2: "",
    RightAdd2: "",
    LeftAdd3: "",
    RightAdd3: "",
    LeftMinus1: "AudioVolumeDown",
    RightMinus1: "PageDown",
    LeftCard: "ArrowLeft",
    RightCard: "ArrowRight",
    Timer: "Enter",
    ResetTime: "t",
    Period: "p",
  },
  leftColor: "red",
  rightColor: "blue",
})
const settings = ref({
  maxTime: 10,
  maxScore: 5,
  rounds: 3,
  allowTies: false,
  pooltab: "1",
  fencer1: new Fencer(1, ["Wang", "Jason"], CountryList.CAN, "THC"),
  fencer2: new Fencer(2, ["Ito", "David"], CountryList.CAN, "THC"),
})
const status = ref({
  pooltab: settings.value.pooltab,
  round: 1,
  stopwatch: settings.value.maxTime,
  priority: "N",
  state: "H",
})
const leftfencer = ref({
  fencer: settings.value.fencer1,
  score: 0,
  status: "U",
  ycard: 0,
  rcard: 0,
})
const rightfencer = ref({
  fencer: settings.value.fencer2,
  score: 0,
  status: "U",
  ycard: 0,
  rcard: 0,
})
const Lcard = ref(0)
const Rcard = ref(0)

const matchOver = computed(() => {
  return (status.value.stopwatch <= 0 && status.value.round == settings.value.rounds)
      || leftfencer.value.score >= settings.value.maxScore
      || rightfencer.value.score >= settings.value.maxScore;
})
const short = computed(() => {
  return status.value.stopwatch < 10
})
const button = computed(() => {
  let name = "Timer"
  if (matchOver.value) {
    name = "Next"
  }
  return name
})
const Lcolor = computed(() => {
  return color(Lcard)
})
const Rcolor = computed(() => {
  return color(Rcard)
})

let interval: number
function startTimer(set: "F" | "P") {
  status.value.state = set
  interval = setInterval(() => {
    status.value.stopwatch -= 0.01
    if (status.value.stopwatch <= 0) {
      clearInterval(interval)
      if (set === "F" && status.value.round !== settings.value.rounds) {
        status.value.state = "P"
        status.value.stopwatch = 60
        startTimer("P")
      } else {
        status.value.state = "H"
        if (set === "P") {
          status.value.stopwatch = settings.value.maxTime
          status.value.round += 1
        } else {
          status.value.stopwatch = 0
        }
      }
    }
  }, 10)
}
function stopTimer(set: "H") {
  status.value.state = set
  clearInterval(interval)
}
function timer() {
  if (status.value.state === "H") {
    startTimer("F")
  } else if (status.value.state === "F") {
    stopTimer("H")
  }
}

function addTime(time: number) {
  status.value.stopwatch += time
  status.value.stopwatch %= 600
}

function card(card: typeof Lcard) {
  card.value += 1
  card.value %= 3
}

function color(card: typeof Lcard) {
  switch (card.value) {
    case 0: return "white"//"transparent"
    case 1: return "yellow"
    case 2: return "red"
  }
}

function end() {}

function click() {
  if (matchOver.value) {
    end()
  } else {
    timer()
  }
}

function changeScore(fencer: typeof rightfencer, value: number) {
  let val = fencer.value.score + value
  if (!(value > 0 && fencer.value.score >= settings.value.maxScore) && (val >= 0)) {
    fencer.value.score = val;
  }
}

function getCookies() {
  // console.log(localStorage.getItem("config"))
}

function setCookies() {
  // if (!('indexedDB' in window)) {
  //   // Can't use IndexedDB
  //   console.log("This browser doesn't support IndexedDB");
  //   return;
  // } else {
  //
  // }
}

function keyHandler(e: KeyboardEvent) {
  let key = e.key
  console.log(key);
  if (started.value) {
    if (key === "Escape") {
      menu.value = !menu.value
      setCookies()
    }
    if (change.value != false) {
      config.value.keymap[change.value] = key
      setCookies()
      change.value = false
    } else if (!menu.value) {
      console.log("not menu")
      switch (key) {
        case config.value.keymap.LeftAdd1:
          changeScore(leftfencer, 1);
          break;
        case config.value.keymap.RightAdd1:
          changeScore(rightfencer, 1);
          break;
        case config.value.keymap.LeftMinus1:
          changeScore(leftfencer, -1);
          break;
        case config.value.keymap.RightMinus1:
          changeScore(rightfencer, -1);
          break;
        case config.value.keymap.LeftCard:
          card(Lcard);
          break;
        case config.value.keymap.RightCard:
          card(Rcard);
          break;
        case config.value.keymap.Timer:
          click();
          break;
        case config.value.keymap.AddMin:
          addTime(60);
          break;
        case config.value.keymap.AddSec:
          addTime(1);
          break;
        case config.value.keymap.ResetTime:
          status.value.stopwatch = settings.value.maxTime;
          break;
        case config.value.keymap.Period:
          status.value.round = status.value.round % settings.value.rounds + 1;
          break;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", keyHandler)
  getCookies()
})
onUnmounted(() => {
  window.removeEventListener("keydown", keyHandler)
  setCookies()
})
</script>

<template>
  <Init @started="(start) => started = start" v-if="!started" />
  <div class="container" v-else>
    <div id="fencer-display">
      <div class="name fencer-1" :style="{backgroundColor: config.leftColor}">
        <h1>{{ leftfencer.fencer.name.toString(false, true) }}</h1>
        <h2>{{ leftfencer.fencer.club }}</h2>
      </div>
      <div class="name fencer-2" :style="{backgroundColor: config.rightColor}">
        <h1>{{ rightfencer.fencer.name.toString(false, true) }}</h1>
        <h2>{{ rightfencer.fencer.club }}</h2>
      </div>
    </div>
    <div id="scoring-display">
      <div>
        <div id="fencer1-score" class="scoring fencer-1" :style="{borderColor: Lcolor}">
          {{ leftfencer.score }}
        </div>
      </div>
      <div id="center">
        <div id="timer" :class="status.state">
          <div id="short" v-if="short">
            <span>{{ status.stopwatch.toFixed(2) }}</span>
          </div>
          <div id="long" v-else>
            <span>{{ Math.floor(status.stopwatch / 60) }}</span>
            :
            <span>{{ (Math.floor(status.stopwatch) % 60).toString().padStart(2, "0") }}</span>
          </div>
        </div>
        <div id="rounds">
          <span>{{status.round}}</span>/<span>{{settings.rounds}}</span>
        </div>
        <div id="nav">
          <button :class="{ next:matchOver }" @click="click">{{button}}</button>
        </div>
      </div>
      <div>
        <div id="fencer2-score" class="scoring fencer-2" :style="{borderColor: Rcolor}">
          {{ rightfencer.score }}
        </div>
      </div>

    </div>
  </div>
  <Teleport to="body">
    <div class="menu" v-if="menu" >
      <nav>
        <a :class="{selected:page === 'bout'}" @click="page='bout'">Bout</a>
        <a :class="{selected:page === 'cyrano'}" @click="page='cyrano'">Cyrano</a>
        <a :class="{selected:page === 'controls'}" @click="page='controls'">Controls</a>
      </nav>
      <div id="keymap" v-if="page === 'controls'">
        <menu>
          <li v-for="(item, index) in config.keymap" :key="index">
            <div class="a">{{ index }}</div> <button @click="change=index" class="bind keys" :class="{selected:change === index}">{{ item }}</button>
          </li>
        </menu>
      </div>
    </div>
    <div class="blurred" @click="menu = !menu" v-if="menu"></div>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
  background-clip: content-box;
}
.container {
  align-self: center;
  width: 100%;
  height: 100vh;
  display: grid;
  grid-template-rows: 40% 60%;
  grid-template-columns: 100%;
  padding: 1%;
}
.container div {
  height: 100%;
  font-size: 30px;
  text-align: center;
  align-content: center;
}
.fencer-1 {
  float: left;
}
.fencer-2 {
  float: right;
}
#fencer-display div {
  width: 50%;
  padding: 1%;
}
#scoring-display {
  display: grid;
  grid-template-columns: 25% 50% 25%;
  grid-template-rows: 100%;
  height: 100%;
}
#scoring-display div {
  padding: 1% 5%;
}
div.scoring {
  background-clip: border-box;
  background-color: gray;
  align-self: center;
  width: 100%;
  height: 60%;
  //padding: 20% 10%;
  border: solid 40px;
  border-radius: 20px;
  font-size: 10rem;
}
#center {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 50% 30% 20%;
  height: 100%;
  //background-color: dodgerblue;
}
#timer div {
  font-size: 12rem;
}
.H {
  color: white;
}
.F {
  color: yellow;
}
.P {
  color: blue;
}
#rounds {
  //background-color: blueviolet;
  font-size: 5rem;
}
.menu {
  z-index: 999;
  float: none;
  position: fixed;
  display: block;
  width: 50vw;
  height: 60vh;
  top: 20%;
  left: 50%;
  margin-left: -25vw;
  align-self: flex-end;
  background-color: rgb(0.2,0.2,0.2);
  //backdrop-filter: invert(100%);
}
.blurred {
  z-index: 998;
  float: none;
  position: fixed;
  display: block;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
}
nav {
  background-color: dodgerblue;
  height: 2rem;
}
nav a {
  background-clip: border-box;
  display: block;
  font-size: 1.5rem;
  width: fit-content;
  padding: 0 1rem;
  float: left;
}
nav a:hover {
  background-color: darkcyan;
}
menu {
  list-style-type: none;
  padding: 0;
}
li {
  display: flex;
  justify-content: space-between;
  border: darkgoldenrod 2px solid;
}
button {
  background-clip: border-box;
  border: black 2px solid;
  background-color: lightgrey;
}
button:hover {
  background-color: slategrey;
}
.selected {
  background-color: slategrey;
}
</style>