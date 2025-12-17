<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, watch} from 'vue'
import Init from './scripts/Init.vue'
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  Fencer, Name,
} from "./scripts/Classes.ts";

const started = ref(false)
const cyrano = ref(false)
const menu = ref(false)
const winner = ref(false)
const page = ref("bout")
const priorityPicker = ref(false)
const change = ref<false | string>(false)

const config = ref({
  keymap: {
    Menu: "Escape",
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
    Flip: "f",
  },
  leftColor: "#ff0000",
  rightColor: "#0000ff",
  lastNameFirst: false,
  shortenFirst: false,
  shortenSecond: true,
  separator: " ",
  ending: "",
})
const settings = ref({
  piste: 1,
  compe: "",
  pooltab: "1",
  maxTime: 180,
  maxScore: 5,
  rounds: 1,
  allowTies: false,
})
const cyranoOptions = ref({ port: 50100 })
const status = ref<CorrectStatus>({
  pooltab: settings.value.pooltab,
  match: 1,
  round: 1,
  time: "",
  stopwatch: settings.value.maxTime,
  type: "I",
  weapon: "S",
  priority: "N",
  state: "H",
})
const leftfencer = ref<CorrectFencerStatus>({
  fencer: new Fencer("Left", new Name("Left Swordsman"), "", ""),
  score: 0,
  status: "U",
  ycard: false,
  rcard: 0,
  light: false,
  wlight: false,
  medical: 0,
  reserve: "N"
})
const rightfencer = ref<CorrectFencerStatus>({
  fencer: new Fencer("Right", new Name("Right Fencer"), "", ""),
  score: 0,
  status: "U",
  ycard: false,
  rcard: 0,
  light: false,
  wlight: false,
  medical: 0,
  reserve: "N"
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
watch(Lcard, (value) => {
  switch (value) {
    case 0:
      leftfencer.value.ycard = false;
      leftfencer.value.rcard = 0;
      break;
    case 1:
      leftfencer.value.ycard = true;
      leftfencer.value.rcard = 0;
      break;
    case 2:
      leftfencer.value.ycard = false;
      leftfencer.value.rcard = 1;
      break;
  }
})
watch(Rcard, (value) => {
  switch (value) {
    case 0:
      rightfencer.value.ycard = false;
      rightfencer.value.rcard = 0;
      break;
    case 1:
      rightfencer.value.ycard = true;
      rightfencer.value.rcard = 0;
      break;
    case 2:
      rightfencer.value.ycard = false;
      rightfencer.value.rcard = 1;
      break;
  }
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

function changeScore(fencer: typeof rightfencer, value: number) {
  let val = fencer.value.score + value
  if (status.value.priority === "N") {
    if (!(value > 0 && fencer.value.score >= settings.value.maxScore) && (val >= 0)) {
      fencer.value.score = val;
    }
  } else {
    fencer.value.score = val
    status.value.stopwatch = 0
  }
}

function choosePriority(state: "N" | "L" | "R") {
  if (state === "N") {
    if(Math.random() >= 0.5) {
      status.value.priority = "R"
    } else {
      status.value.priority = "L"
    }
  } else {
    status.value.priority = state
  }
  priorityPicker.value = false
}

function reset() {
  status.value.pooltab = settings.value.pooltab
  status.value.stopwatch = settings.value.maxTime
  status.value.priority = "N"
  status.value.state = "H"
  leftfencer.value.score = 0
  leftfencer.value.status = "U"
  leftfencer.value.ycard = false
  leftfencer.value.rcard = 0
  leftfencer.value.light = false
  leftfencer.value.wlight = false
  leftfencer.value.medical = 0
  leftfencer.value.reserve = "N"
  rightfencer.value.score = 0
  rightfencer.value.status = "U"
  rightfencer.value.ycard = false
  rightfencer.value.rcard = 0
  rightfencer.value.light = false
  rightfencer.value.wlight = false
  rightfencer.value.medical = 0
  rightfencer.value.reserve = "N"
  winner.value = false
  menu.value = false
  Lcard.value = 0
  Rcard.value = 0
}

async function startCyrano() {
  const socket = new UDPSocket({
    // remoteAddress: "192.168.2.11",
    // remotePort: cyranoOptions.value.port,
    localAddress: "0.0.0.0",
    localPort: cyranoOptions.value.port,
    receiveBufferSize:256,
  })
  if (!socket) {
    console.log("Socket not connected")
    return
  }
  console.log("socket started on port ", cyranoOptions.value.port)
  cyrano.value = true
  const { readable, writable } = await socket.opened
  const reader = readable.getReader()
  const writer = writable.getWriter()

  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const message = {
    data: encoder.encode("|EFP1|NEXT|1|0||||1||||F|N|||||%||||0|U|0|0|0|0|0||%||||0|U|0|0|0|0|0||%|"),
    remoteAddress: "192.168.2.11",
    remotePort: cyranoOptions.value.port,
  };
  await writer.ready;
  await writer.write(message);
  console.log("sent ", message.data);

  // writer.releaseLock();

  while (cyrano.value) {
    console.log("awaiting message")
    const { value, done } = await reader.read();
    console.log("done reading")
    if (done) {
      console.log("done")
      // |reader| has been canceled.
      break;
    }
    console.log("message got")

    // const { data } = value;
    const { data, remoteAddress, remotePort } = value;
    const decoded = decoder.decode(data)
    console.log(decoded)
    // const message = {
    //   data: encoder.encode("|EFP1|NEXT|1|0||||1||||F|N|||||%||||0|U|0|0|0|0|0||%||||0|U|0|0|0|0|0||%|")
    // };
    if (decoded.includes("HELLO")) {
      const message = "|EFP1|NEXT|1|0||||1||||F|N|||||%||||0|U|0|0|0|0|0||%||||0|U|0|0|0|0|0||%|"
      await writer.ready;
      await writer.write({
        data: encoder.encode(message),
        remoteAddress: remoteAddress,
        remotePort: remotePort}).catch((err: Error) => console.log(err)).finally(() => console.log("sent", message));
    }
  }

  writer.releaseLock();
  reader.releaseLock();
  socket.close();
  console.log("finished")
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

function update() {}

function finishMatch() {
  status.value.state = "E"
  update()
  reset()
  page.value = "bout"
  menu.value = true
}

function end() {
  if (leftfencer.value.score > rightfencer.value.score) {
    leftfencer.value.status = "V"
    rightfencer.value.status = "D"
  } else if (leftfencer.value.score < rightfencer.value.score) {
    leftfencer.value.status = "D"
    rightfencer.value.status = "V"
  } else {
    if (settings.value.allowTies) {
      leftfencer.value.status = "D"
      rightfencer.value.status = "D"
    } else if (status.value.priority === "L") {
      leftfencer.value.status = "V"
      rightfencer.value.status = "D"
    } else if (status.value.priority === "R") {
      leftfencer.value.status = "D"
      rightfencer.value.status = "V"
    } else {
      status.value.state = "H"
      priorityPicker.value = true
      status.value.stopwatch = 60
      return
    }
  }
  winner.value = true
}

function click() {
  if (winner.value) {
    finishMatch()
  } else if (matchOver.value) {
    end()
  } else {
    timer()
  }
}

function keyHandler(e: KeyboardEvent) {
  let key = e.key
  console.log(key);
  if (started.value) {
    if (key === config.value.keymap.Menu) {
      menu.value = !menu.value
      setCookies()
    }
    if (change.value != false) {
      config.value.keymap[change.value] = key
      setCookies()
      change.value = false
    } else if (priorityPicker.value) {
      switch (key) {
        case config.value.keymap.LeftAdd1:
          choosePriority("L");
          break;
        case config.value.keymap.LeftCard:
          choosePriority("L");
          break;
        case config.value.keymap.RightAdd1:
          choosePriority("R");
          break;
        case config.value.keymap.RightCard:
          choosePriority("R");
          break;
        case config.value.keymap.Timer:
          choosePriority("N");
          break;
      }
    } else if (menu.value && (page.value === "bout" || page.value === "cyrano")) {
      if (key === config.value.keymap.Timer) {
        reset()
      }
    } else if (!menu.value) {
      console.log("not menu")
      switch (key) {
        case config.value.keymap.LeftAdd1:
          changeScore(leftfencer, 1);
          break;
        case config.value.keymap.RightAdd1:
          changeScore(rightfencer, 1);
          break;
        case config.value.keymap.LeftAdd2:
          changeScore(leftfencer, 2);
          break;
        case config.value.keymap.RightAdd2:
          changeScore(rightfencer, 2);
          break;
        case config.value.keymap.LeftAdd3:
          changeScore(leftfencer, 3);
          break;
        case config.value.keymap.RightAdd3:
          changeScore(rightfencer, 3);
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
        case config.value.keymap.Flip:
          let f1 = leftfencer.value;
          leftfencer.value = rightfencer.value;
          rightfencer.value = f1;
          let c1 = Lcard.value;
          Lcard.value = Rcard.value;
          Rcard.value = c1;
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
        <h1>{{ leftfencer.fencer.name.toString(
            config.lastNameFirst,
            config.shortenFirst,
            config.shortenSecond,
            config.separator,
            config.ending
        ) }}</h1>
        <h2>{{ leftfencer.fencer.club }}</h2>
      </div>
      <div class="name fencer-2" :style="{backgroundColor: config.rightColor}">
        <h1>{{ rightfencer.fencer.name.toString(
            config.lastNameFirst,
            config.shortenFirst,
            config.shortenSecond,
            config.separator,
            config.ending
        ) }}</h1>
        <h2>{{ rightfencer.fencer.club }}</h2>
      </div>
    </div>
    <div id="scoring-display">
      <div :style="{backgroundColor: status.priority === 'L' ? config.leftColor : 'black'}">
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
            <span>
              {{ Math.floor(status.stopwatch / 60) }}:{{ (Math.floor(status.stopwatch) % 60).toString().padStart(2, "0") }}
            </span>
          </div>
        </div>
        <div id="rounds">
          <span>{{status.round}}</span>/<span>{{settings.rounds}}</span>
        </div>
        <div id="nav">
          <button :class="{ next:matchOver }" @click="click">{{button}}</button>
        </div>
      </div>
      <div :style="{backgroundColor: status.priority === 'R' ? config.rightColor : 'black'}">
        <div id="fencer2-score" class="scoring fencer-2" :style="{borderColor: Rcolor}">
          {{ rightfencer.score }}
        </div>
      </div>
    </div>
  </div>
  <div class="menu" v-if="menu" >
    <nav>
      <a :class="{selected:page === 'bout'}" @click="page='bout'">Bout</a>
      <a :class="{selected:page === 'cyrano'}" @click="page='cyrano'">Cyrano</a>
      <a :class="{selected:page === 'display'}" @click="page='display'">Display</a>
      <a :class="{selected:page === 'controls'}" @click="page='controls'">Controls</a>
    </nav>
    <div id="bout" v-if="page === 'bout'">
      <h3>Bout Settings</h3>
      <menu>
        <li>
          <div>Left fencer name</div>
          <div>
            <input v-model.number="leftfencer.fencer.name.firstName" placeholder="first name" />
            <input v-model.number="leftfencer.fencer.name.lastName" placeholder="surname" />
          </div>
        </li>
        <li>
          <div>Right fencer name</div>
          <div>
            <input v-model.number="rightfencer.fencer.name.firstName" placeholder="first name" />
            <input v-model.number="rightfencer.fencer.name.lastName" placeholder="surname" />
          </div>
        </li>
        <li><div>Max time(in seconds)</div> <input v-model.number="settings.maxTime" /></li>
        <li><div>Max score</div> <input v-model.number="settings.maxScore" /></li>
        <li><div>Rounds</div> <input v-model.number="settings.rounds" /></li>
        <li><div>Allow ties</div> <input type="checkbox" v-model="settings.allowTies" /></li>
      </menu>
      <button @click="reset">Reset Bout</button>
    </div>
    <div id="cyrano" v-if="page === 'cyrano'">
      <button @click="startCyrano" v-if="!cyrano">Start Cyrano</button>
      <button @click="cyrano = false" v-if="cyrano">Stop Cyrano</button>
    </div>
    <div id="display" v-if="page === 'display'">
      <h3>Display Settings</h3>
      <menu>
        <li><div>Left fencer colour</div> <input type="color" v-model="config.leftColor" /></li>
        <li><div>Right fencer colour</div> <input type="color" v-model="config.rightColor" /></li>
        <li><div>Surnames in front</div> <input type="checkbox" v-model="config.lastNameFirst" /></li>
        <li><div>Shorten the first part of the name</div> <input type="checkbox" v-model="config.shortenFirst" /></li>
        <li><div>Shorten the second part of the name</div> <input type="checkbox" v-model="config.shortenSecond" /></li>
        <li><div>Separator between the parts of the name</div> <input v-model="config.separator" /></li>
        <li><div>Ending of the name</div> <input v-model="config.ending" /></li>
      </menu>
    </div>
    <div id="keymap" v-if="page === 'controls'">
      <menu>
        <li v-for="(item, index) in config.keymap" :key="index">
          <div>{{ index }}</div>
          <button @click="change=index" class="bind keys" :class="{selected:change === index}">{{ item }}</button>
        </li>
      </menu>
    </div>
  </div>
  <div class="blurred background" @click="menu = false" v-if="menu"></div>
  <div class="priority" v-if="priorityPicker">
    <h2>Choose Priority</h2>
    <div>
      <button @click="choosePriority('L')" class="half">Left</button>
      <button @click="choosePriority('R')" class="half">Right</button>
    </div>
    <div>
      <button @click="choosePriority('N')">Random</button>
    </div>
  </div>
  <div class="blurred" v-if="priorityPicker"></div>
  <div class="blurred" v-if="matchOver && !winner">
    <h1>{{status.stopwatch === 0 ? "Time" : "Match"}}</h1>
  </div>
  <div class="blurred" v-if="winner">
    <h1>Match {{leftfencer.status === "V" ? "Left" : rightfencer.status === "V" ? "Right" : "Tie"}}</h1>
    <h2>{{leftfencer.score}}-{{rightfencer.score}}</h2>
  </div>
  <div class="blurred" v-if="status.state === 'P'">
    <h1>1-min break</h1>
    <h2 style="color: blue">
      {{ Math.floor(status.stopwatch / 60) }}:{{ (Math.floor(status.stopwatch) % 60).toString().padStart(2, "0") }}
    </h2>
  </div>
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
  background-color: darkslategrey;
  //backdrop-filter: invert(100%);
}
.menu div {
  overflow: hidden;
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
  background-color: rgba(0,0,0,0.8);
  backdrop-filter: blur(5px);
}
.blurred background {
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
  padding: 0.1rem 1rem;
  //border: darkgoldenrod 2px solid;
}
.priority {
  z-index: 1000;
  float: none;
  position: fixed;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 20% 50% 30%;
  width: 30vw;
  height: 40vh;
  top: 40%;
  left: 50%;
  margin-left: -15vw;
  align-self: flex-end;
  background-color: darkslategrey;
  //backdrop-filter: invert(100%);
}
.priority div {
  align-items: center;
  align-self: center;
  height: 100%;
}
.priority button {
  width: 100%;
  height: 100%;
}
button.half {
  width: 50%;
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
.blurred {
  align-self: center;
  align-items: center;
  align-content: center;
  color: white;
}
.blurred * {
  color: white;
}
.blurred h1 {
  font-size: 15em;
}
.blurred h2 {
  font-size: 10em;
}
</style>