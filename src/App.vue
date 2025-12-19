<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Init from "./scripts/Init.vue";
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  emptyFencer,
  Fencer,
  type keyMap,
} from "./scripts/Classes.ts";
import { Cyrano } from "./scripts/Cyrano.ts";

// Defaults
function defaultFencerStatus(): CorrectFencerStatus {
  return {
    fencer: new Fencer(),
    score: 0,
    status: "U",
    ycard: false,
    rcard: 0,
    light: false,
    wlight: false,
    medical: 0,
    reserve: "",
  };
}
const defaultKeymaps: Record<string, keyMap> = {
  remoteKeymap1: {
    Menu: "Escape",
    AddMin: "ArrowUp",
    AddSec: "w",
    MinusMin: "ArrowDown",
    MinusSec: "s",
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
  keyboardKeymap1: {
    Menu: "Escape",
    AddMin: "ArrowUp",
    AddSec: "2",
    MinusMin: "ArrowDown",
    MinusSec: "1",
    LeftAdd1: "ArrowLeft",
    RightAdd1: "ArrowRight",
    LeftAdd2: "",
    RightAdd2: "",
    LeftAdd3: "",
    RightAdd3: "",
    LeftMinus1: ",",
    RightMinus1: ".",
    LeftCard: "j",
    RightCard: "k",
    Timer: "Enter",
    ResetTime: "t",
    Period: "p",
    Flip: "f",
  },
};
const decoder = new TextDecoder();
const encoder = new TextEncoder();
let cyranoProtocol: "EFP1" | "EFP1.1" = "EFP1.1";

// Flags
const started = ref(false);
const cyrano = ref(false);
const menu = ref(false);
const winner = ref(false);
const page = ref("bout");
const priorityPicker = ref(false);
const sendingData = ref(false);
const change = ref<false | keyof keyMap>(false);
const keymap = ref("remoteKeymap1");

// async
let socket: UDPSocket;
let reader: ReadableStreamDefaultReader;
let writer: WritableStreamDefaultWriter;

// Event data
// const fencers = ref<Fencer[]>([])
const matches = ref<
  Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
>({
  "": [defaultFencerStatus(), defaultFencerStatus()],
});

// Match data
const config = ref<{
  keymap: keyMap;
  leftColor: string;
  rightColor: string;
  lastNameFirst: boolean;
  shortenFirst: boolean;
  shortenSecond: boolean;
  separator: string;
  ending: string;
}>({
  keymap: Object.assign({}, defaultKeymaps.remoteKeymap1),
  leftColor: "#ff0000",
  rightColor: "#0000ff",
  lastNameFirst: false,
  shortenFirst: false,
  shortenSecond: true,
  separator: " ",
  ending: "",
});
const settings = ref({
  piste: "1",
  compe: "0",
  phase: 0,
  maxTime: 180,
  maxScore: 5,
  rounds: 1,
  allowTies: false,
});
const cyranoOptions = ref({
  port: 50100,
  remoteAddress: "192.168.2.11",
  pointsPerPeriod: 5,
  protocol: "ESP1.1",
});
const status = ref<CorrectStatus>({
  poultab: "",
  match: "",
  round: 1,
  time: "",
  stopwatch: settings.value.maxTime,
  type: "I",
  weapon: "S",
  priority: "N",
  state: "H",
});
const cyranoOut = ref("");
const Lcard = ref(0);
const Rcard = ref(0);

// Reactive data
const stopwatch = computed(() => {
  if (status.value.stopwatch === "") {
    return 0;
  } else {
    return status.value.stopwatch;
  }
});
const match = computed<[CorrectFencerStatus, CorrectFencerStatus]>(() => {
  return (
    matches.value[status.value.match] ?? [
      defaultFencerStatus(),
      defaultFencerStatus(),
    ]
  );
});
const matchOver = computed(() => {
  return (
    (stopwatch.value <= 0 && status.value.round == settings.value.rounds) ||
    ((match.value[0].score >= settings.value.maxScore ||
      match.value[1].score >= settings.value.maxScore) &&
      status.value.priority === "N")
  );
});
const short = computed(() => {
  return stopwatch.value < 10;
});
// const button = computed(() => {
//   let name = "Timer"
//   if (matchOver.value) {
//     name = "Next"
//   }
//   return name
// })
const Lcolor = computed(() => {
  return color(Lcard);
});
const Rcolor = computed(() => {
  return color(Rcard);
});
watch(Lcard, (value) => {
  switch (value) {
    case 0:
      match.value[0].ycard = false;
      match.value[0].rcard = 0;
      break;
    case 1:
      match.value[0].ycard = true;
      match.value[0].rcard = 0;
      break;
    case 2:
      match.value[0].ycard = true;
      match.value[0].rcard = 1;
      break;
  }
});
watch(Rcard, (value) => {
  switch (value) {
    case 0:
      match.value[1].ycard = false;
      match.value[1].rcard = 0;
      break;
    case 1:
      match.value[1].ycard = true;
      match.value[1].rcard = 0;
      break;
    case 2:
      match.value[1].ycard = true;
      match.value[1].rcard = 1;
      break;
  }
});
watch(keymap, (value) => {
  config.value.keymap = Object.assign({}, defaultKeymaps[value]);
});

// Timer
let interval: number;
function startTimer(set: "F" | "P") {
  status.value.state = set;
  interval = setInterval(() => {
    if (status.value.stopwatch === "") {
      throw TypeError("time not set");
    }
    status.value.stopwatch -= 0.01;
    if (status.value.stopwatch <= 0) {
      clearInterval(interval);
      if (set === "F" && status.value.round !== settings.value.rounds) {
        status.value.state = "P";
        status.value.stopwatch = 60;
        startTimer("P");
      } else {
        status.value.state = "H";
        if (set === "P") {
          status.value.stopwatch = settings.value.maxTime;
          status.value.round += 1;
        } else {
          status.value.stopwatch = 0;
        }
      }
    }
  }, 10);
}
function stopTimer(set: "H") {
  status.value.state = set;
  clearInterval(interval);
}
function addTime(time: number) {
  if (status.value.stopwatch === "") {
    throw TypeError("time not set");
  }
  status.value.stopwatch += time;
  status.value.stopwatch %= 600;
}

// Bout controls
function card(card: typeof Lcard) {
  card.value += 1;
  card.value %= 3;
}
function color(card: typeof Lcard) {
  switch (card.value) {
    case 0:
      return "white"; //"transparent"
    case 1:
      return "yellow";
    case 2:
      return "red";
  }
}
function changeScore(fencer: CorrectFencerStatus, value: number) {
  let val = fencer.score + value;
  if (status.value.priority === "N") {
    if (!(value > 0 && fencer.score >= settings.value.maxScore) && val >= 0) {
      fencer.score = val;
    }
  } else {
    fencer.score = val;
    status.value.stopwatch = 0;
  }
}
function choosePriority(state: "N" | "L" | "R") {
  if (state === "N") {
    if (Math.random() >= 0.5) {
      status.value.priority = "R";
    } else {
      status.value.priority = "L";
    }
  } else {
    status.value.priority = state;
  }
  priorityPicker.value = false;
}

// Cyrano
async function startCyrano() {
  socket = new UDPSocket({
    // remoteAddress: "192.168.2.11",
    // remotePort: cyranoOptions.value.port,
    localAddress: "0.0.0.0",
    localPort: cyranoOptions.value.port,
  });
  if (!socket) {
    cyranoLog("Socket not connected");
    return;
  }
  matches.value = {
    "": [defaultFencerStatus(), defaultFencerStatus()],
  };
  status.value = {
    poultab: "",
    match: "",
    round: 1,
    time: "",
    stopwatch: "",
    type: "",
    weapon: "F",
    priority: "N",
    state: "",
  };
  cyrano.value = true;

  const { readable, writable } = await socket.opened;
  reader = readable.getReader();
  writer = writable.getWriter();

  await write("NEXT");
  await cyranoRun();
}
function stopCyrano() {
  writer.releaseLock();
  reader.releaseLock();
  socket.close();
  settings.value.rounds = 1;
  settings.value.maxScore = 5;
  matches.value[""] = [defaultFencerStatus(), defaultFencerStatus()];
  status.value.match = "";
  reset();
  menu.value = true;
  cyrano.value = false;
  sendingData.value = false;
  cyranoLog("finished");
}
async function cyranoRun() {
  console.log("startCyrano");
  await new Promise((res, rej) => runner(res, rej));
  await bout();
}
async function runner(
  resolve: (value?: unknown) => void,
  reject: (reason?: any) => void,
) {
  cyranoLog("waiting for bout");
  const cyranoMsg = await read();
  if (cyranoMsg === true) {
    return reject();
  }
  console.log(cyranoMsg);
  cyranoProtocol = cyranoMsg.protocol;
  if (
    cyranoMsg.com === "DISP" &&
    cyranoMsg.status.poultab !== "X" &&
    cyranoMsg.status.poultab !== "" &&
    cyranoMsg.status.state !== "E" &&
    cyranoMsg.leftfencer.status === "U" &&
    cyranoMsg.rightfencer.status === "U"
  ) {
    set(cyranoMsg);
    status.value.stopwatch = settings.value.maxTime;
    page.value = "bout";
    menu.value = true;
    return resolve();
  } else if (
    (cyranoMsg.com === "HELLO" ||
      cyranoMsg.leftfencer.status !== "U" ||
      cyranoMsg.rightfencer.status !== "U") &&
    cyranoMsg.status.poultab !== "X"
  ) {
    await write("NEXT");
  }
  await runner(resolve, reject);
}
async function bout() {
  sendingData.value = true;
  console.log("sendTrue");
  await new Promise((res, rej) => writeRepeat(res, rej));
}
async function writeRepeat(
  resolve: (value?: unknown) => void,
  reject: (reason?: any) => void,
) {
  await write("INFO");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(status.value.state);
  if (status.value.state === "E") {
    console.log("sendFalse");
    sendingData.value = false;
    return resolve();
  } else {
    await writeRepeat(resolve, reject);
  }
}
function set(cyr: Cyrano) {
  settings.value.piste = cyr.piste;
  settings.value.compe = cyr.compe;
  settings.value.phase = cyr.phase === "" ? 0 : cyr.phase;
  status.value = cyr.status as CorrectStatus;
  matches.value[status.value.match] = [
    defaultFencerStatus(),
    defaultFencerStatus(),
  ];
  match.value[0] = cyr.leftfencer as CorrectFencerStatus;
  match.value[1] = cyr.rightfencer as CorrectFencerStatus;
  settings.value.maxTime = 180;
  switch (status.value.poultab[0]) {
    case "P":
      settings.value.rounds = status.value.round;
      break;
    default:
      settings.value.rounds = 3;
  }
  settings.value.maxScore =
    (settings.value.rounds - status.value.round + 1) *
    cyranoOptions.value.pointsPerPeriod;
  settings.value.allowTies = false;
}
async function read() {
  const { value, done } = await reader.read();
  cyranoLog("done reading");
  if (done) {
    stopCyrano();
    cyranoLog("done");
    return true;
  }
  cyranoLog("message got");

  const { data, remoteAddress, remotePort } = value;
  cyranoOptions.value.remoteAddress = remoteAddress;
  const decoded = decoder.decode(data);
  cyranoLog("received ", decoded, " from ", remoteAddress, ":", remotePort);
  return new Cyrano(decoded);
}
async function write(com: "NEXT" | "PREV" | "INFO" = "INFO") {
  const cyranoStart = new Cyrano(
    cyranoProtocol,
    com,
    settings.value.piste,
    settings.value.compe,
    settings.value.phase,
    status.value,
    emptyFencer,
    match.value[1],
    match.value[0],
  );
  console.log(cyranoStart);
  let message = cyranoStart.toString();
  await writer.ready;
  await writer.write({
    data: encoder.encode(message),
    remoteAddress: cyranoOptions.value.remoteAddress,
    remotePort: cyranoOptions.value.port,
  });
  cyranoLog(
    "sent ",
    message,
    " on port ",
    cyranoOptions.value.port,
    " to ",
    cyranoOptions.value.remoteAddress,
  );
}
function cyranoLog(...args: any) {
  console.log(...args);
  cyranoOut.value = args.join("");
}

// Data storage
function getCookies() {
  // TODO
}
function setCookies() {
  // TODO
}

// Match controls
function reset() {
  status.value.stopwatch = settings.value.maxTime;
  status.value.priority = "N";
  status.value.state = "H";
  match.value[0].score = 0;
  match.value[0].status = "U";
  match.value[0].ycard = false;
  match.value[0].rcard = 0;
  match.value[0].light = false;
  match.value[0].wlight = false;
  match.value[0].medical = 0;
  match.value[0].reserve = "N";
  match.value[1].score = 0;
  match.value[1].status = "U";
  match.value[1].ycard = false;
  match.value[1].rcard = 0;
  match.value[1].light = false;
  match.value[1].wlight = false;
  match.value[1].medical = 0;
  match.value[1].reserve = "N";
  winner.value = false;
  menu.value = false;
  Lcard.value = 0;
  Rcard.value = 0;
}

async function update() {
  const cyr = new Cyrano(
    cyranoProtocol,
    "INFO",
    settings.value.piste,
    settings.value.compe,
    settings.value.phase,
    status.value,
    emptyFencer,
    match.value[0],
    match.value[1],
  );
  while (sendingData.value) {
    console.log("not ended");
    console.log(status.value.state);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  while (true) {
    console.log("ended");
    let message = cyr.toString();
    await writer.ready;
    await writer.write({
      data: encoder.encode(message),
      remoteAddress: cyranoOptions.value.remoteAddress,
      remotePort: cyranoOptions.value.port,
    });
    cyranoLog("sent ", message);
    const cyranoMsg = await read();
    if (cyranoMsg === true) {
      return;
    }
    if (cyranoMsg.com === "ACK") {
      matches.value = {
        "": [defaultFencerStatus(), defaultFencerStatus()],
      };
      status.value = {
        poultab: "",
        match: "",
        round: 1,
        time: "",
        stopwatch: "",
        type: "",
        weapon: "F",
        priority: "N",
        state: "",
      };
      menu.value = true;
      await write("NEXT");
      await cyranoRun();
      return;
    } else if (cyranoMsg.com === "NAK") {
      menu.value = true;
      page.value = "cyrano";
      return;
    }
  }
}

async function finishMatch() {
  status.value.state = "E";
  page.value = "bout";
  menu.value = true;
  if (cyrano.value) {
    await update();
  } else {
    reset();
  }
}
function end() {
  if (match.value[0].score > match.value[1].score) {
    match.value[0].status = "V";
    match.value[1].status = "D";
  } else if (match.value[0].score < match.value[1].score) {
    match.value[0].status = "D";
    match.value[1].status = "V";
  } else {
    if (settings.value.allowTies) {
      match.value[0].status = "D";
      match.value[1].status = "D";
    } else if (status.value.priority === "L") {
      match.value[0].status = "V";
      match.value[1].status = "D";
    } else if (status.value.priority === "R") {
      match.value[0].status = "D";
      match.value[1].status = "V";
    } else {
      status.value.state = "H";
      priorityPicker.value = true;
      status.value.stopwatch = 60;
      return;
    }
  }
  winner.value = true;
}
function click() {
  if (!cyrano.value || sendingData.value) {
    if (status.value.state === "F") {
      stopTimer("H");
    } else if (winner.value) {
      finishMatch();
    } else if (matchOver.value) {
      end();
    } else if (status.value.state === "H") {
      startTimer("F");
    }
  }
}

// Key handler
function keyHandler(e: KeyboardEvent) {
  let key = e.key;
  console.log(key);
  if (started.value) {
    if (key === config.value.keymap.Menu) {
      menu.value = !menu.value;
      setCookies();
    }
    if (change.value != false) {
      config.value.keymap[change.value] = key;
      setCookies();
      change.value = false;
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
    } else if (
      menu.value &&
      (page.value === "bout" || page.value === "cyrano")
    ) {
      if (
        key === config.value.keymap.Timer &&
        (!cyrano.value || sendingData.value)
      ) {
        reset();
      }
    } else if (!menu.value) {
      console.log("not menu");
      switch (key) {
        case config.value.keymap.LeftAdd1:
          changeScore(match.value[0], 1);
          break;
        case config.value.keymap.RightAdd1:
          changeScore(match.value[1], 1);
          break;
        case config.value.keymap.LeftAdd2:
          changeScore(match.value[0], 2);
          break;
        case config.value.keymap.RightAdd2:
          changeScore(match.value[1], 2);
          break;
        case config.value.keymap.LeftAdd3:
          changeScore(match.value[0], 3);
          break;
        case config.value.keymap.RightAdd3:
          changeScore(match.value[1], 3);
          break;
        case config.value.keymap.LeftMinus1:
          changeScore(match.value[0], -1);
          break;
        case config.value.keymap.RightMinus1:
          changeScore(match.value[1], -1);
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
        case config.value.keymap.MinusMin:
          addTime(-60);
          break;
        case config.value.keymap.MinusSec:
          addTime(-1);
          break;
        case config.value.keymap.ResetTime:
          status.value.stopwatch = settings.value.maxTime;
          break;
        case config.value.keymap.Period:
          status.value.round = (status.value.round % settings.value.rounds) + 1;
          break;
        case config.value.keymap.Flip:
          let f1 = match.value[0];
          match.value[0] = match.value[1];
          match.value[1] = f1;
          let c1 = Lcard.value;
          Lcard.value = Rcard.value;
          Rcard.value = c1;
          break;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", keyHandler);
  getCookies();
});
onUnmounted(() => {
  window.removeEventListener("keydown", keyHandler);
  setCookies();
  stopCyrano();
});
</script>

<template>
  <Init
    @started="
      (start) => {
        started = start;
        menu = start;
      }
    "
    v-if="!started"
  />
  <div
    class="container"
    v-else
  >
    <div id="fencer-display">
      <div
        class="name fencer-1"
        :style="{ backgroundColor: config.leftColor }"
      >
        <h1>
          {{
            match[0].fencer.name.toString(
              config.lastNameFirst,
              config.shortenFirst,
              config.shortenSecond,
              config.separator,
              config.ending,
            )
          }}
        </h1>
        <h2>{{ match[0].fencer.club }}</h2>
      </div>
      <div
        class="name fencer-2"
        :style="{ backgroundColor: config.rightColor }"
      >
        <h1>
          {{
            match[1].fencer.name.toString(
              config.lastNameFirst,
              config.shortenFirst,
              config.shortenSecond,
              config.separator,
              config.ending,
            )
          }}
        </h1>
        <h2>{{ match[1].fencer.club }}</h2>
      </div>
    </div>
    <div id="scoring-display">
      <div>
        <div
          id="fencer1-score"
          class="scoring fencer-1"
          :style="{
            borderColor: Lcolor,
            backgroundColor:
              status.priority === 'L' ? config.leftColor : 'gray',
          }"
        >
          {{ match[0].score }}
        </div>
      </div>
      <div id="center">
        <div id="nav">
          <!--          <button :class="{ next:matchOver }" @click="click">{{button}}</button>-->
        </div>
        <div
          id="timer"
          :class="status.state"
        >
          <div
            id="short"
            v-if="short"
          >
            <span>{{ stopwatch.toFixed(2) }}</span>
          </div>
          <div
            id="long"
            v-else
          >
            <span>
              {{ Math.floor(stopwatch / 60) }}:{{
                (Math.floor(stopwatch) % 60).toString().padStart(2, "0")
              }}
            </span>
          </div>
        </div>
        <div id="rounds">
          <span>{{ status.round }}</span
          >/<span>{{ settings.rounds }}</span>
        </div>
      </div>
      <div :style="{}">
        <div
          id="fencer2-score"
          class="scoring fencer-2"
          :style="{
            borderColor: Rcolor,
            backgroundColor:
              status.priority === 'R' ? config.rightColor : 'gray',
          }"
        >
          {{ match[1].score }}
        </div>
      </div>
    </div>
  </div>
  <div
    class="menu"
    v-if="menu && started"
  >
    <nav>
      <a
        :class="{ selected: page === 'bout' }"
        @click="page = 'bout'"
        >Bout</a
      >
      <a
        :class="{ selected: page === 'cyrano' }"
        @click="page = 'cyrano'"
        >Cyrano</a
      >
      <a
        :class="{ selected: page === 'display' }"
        @click="page = 'display'"
        >Display</a
      >
      <a
        :class="{ selected: page === 'controls' }"
        @click="page = 'controls'"
        >Controls</a
      >
    </nav>
    <div
      id="bout"
      v-if="page === 'bout'"
    >
      <h3>Bout Settings</h3>
      <h4 v-if="sendingData">Tournament Running</h4>
      <h4 v-else>Tournament not Running</h4>
      <menu>
        <li>
          <div>Left fencer name</div>
          <div>
            <input
              v-model.number="match[0].fencer.name.firstName"
              placeholder="first name"
            />
            <input
              v-model.number="match[0].fencer.name.lastName"
              placeholder="surname"
            />
          </div>
        </li>
        <li>
          <div>Right fencer name</div>
          <div>
            <input
              v-model.number="match[1].fencer.name.firstName"
              placeholder="first name"
            />
            <input
              v-model.number="match[1].fencer.name.lastName"
              placeholder="surname"
            />
          </div>
        </li>
        <li>
          <div>Max time(in seconds)</div>
          <input v-model.number="settings.maxTime" />
        </li>
        <li>
          <div>Max score</div>
          <input v-model.number="settings.maxScore" />
        </li>
        <li>
          <div>Rounds</div>
          <input v-model.number="settings.rounds" />
        </li>
        <li>
          <div>Allow ties</div>
          <input
            type="checkbox"
            v-model="settings.allowTies"
          />
        </li>
      </menu>
      <button @click="reset">Reset Bout</button>
    </div>
    <div
      id="cyrano"
      v-if="page === 'cyrano'"
    >
      <h4 v-if="sendingData">Tournament Running</h4>
      <h4 v-else>Tournament not Running</h4>
      <menu>
        <li>
          <div>Piste</div>
          <input v-model="settings.piste" />
        </li>
        <li>
          <div>Remote Address</div>
          <input v-model.number="cyranoOptions.remoteAddress" />
        </li>
        <li>
          <div>Port</div>
          <input v-model.number="cyranoOptions.port" />
        </li>
        <li>
          <div>Points per Period</div>
          <input v-model.number="cyranoOptions.pointsPerPeriod" />
        </li>
      </menu>
      <div>
        <code>{{ cyranoOut }}</code>
      </div>
      <button
        @click="startCyrano"
        v-if="!cyrano"
      >
        Start Cyrano
      </button>
      <button
        @click="stopCyrano"
        v-if="cyrano"
      >
        Stop Cyrano
      </button>
    </div>
    <div
      id="display"
      v-if="page === 'display'"
    >
      <h3>Display Settings</h3>
      <menu>
        <li>
          <div>Left fencer colour</div>
          <input
            type="color"
            v-model="config.leftColor"
          />
        </li>
        <li>
          <div>Right fencer colour</div>
          <input
            type="color"
            v-model="config.rightColor"
          />
        </li>
        <li>
          <div>Surnames in front</div>
          <input
            type="checkbox"
            v-model="config.lastNameFirst"
          />
        </li>
        <li>
          <div>Shorten the first part of the name</div>
          <input
            type="checkbox"
            v-model="config.shortenFirst"
          />
        </li>
        <li>
          <div>Shorten the second part of the name</div>
          <input
            type="checkbox"
            v-model="config.shortenSecond"
          />
        </li>
        <li>
          <div>Separator between the parts of the name</div>
          <input v-model="config.separator" />
        </li>
        <li>
          <div>Ending of the name</div>
          <input v-model="config.ending" />
        </li>
      </menu>
    </div>
    <div
      id="keymap"
      v-if="page === 'controls'"
    >
      <menu>
        <li>
          <div>Keymap</div>
          <select v-model="keymap">
            <option
              v-for="(_, index) in defaultKeymaps"
              :value="index"
            >
              {{ index }}
            </option>
          </select>
        </li>
        <li
          v-for="(item, index) in config.keymap"
          :key="index"
        >
          <div>{{ index }}</div>
          <button
            @click="change = index"
            class="bind keys"
            :class="{ selected: change === index }"
          >
            {{ item }}
          </button>
        </li>
      </menu>
    </div>
  </div>
  <div
    class="blurred background"
    @click="menu = false"
    v-if="menu"
  ></div>
  <div
    class="priority"
    v-if="priorityPicker"
  >
    <h2>Choose Priority</h2>
    <div>
      <button
        @click="choosePriority('L')"
        class="half"
      >
        Left
      </button>
      <button
        @click="choosePriority('R')"
        class="half"
      >
        Right
      </button>
    </div>
    <div>
      <button @click="choosePriority('N')">Random</button>
    </div>
  </div>
  <div
    class="blurred"
    v-if="priorityPicker"
  ></div>
  <div
    class="blurred"
    v-if="matchOver && !winner"
  >
    <h1>Match</h1>
  </div>
  <div
    class="blurred"
    v-if="winner"
  >
    <h1>
      Match
      {{
        match[0].status === "V"
          ? "Left"
          : match[1].status === "V"
            ? "Right"
            : "Tie"
      }}
    </h1>
    <h2>{{ match[0].score }}-{{ match[1].score }}</h2>
  </div>
  <div
    class="blurred"
    v-if="status.state === 'P'"
  >
    <h1>1-min break</h1>
    <h2 style="color: blue">
      {{ Math.floor(stopwatch / 60) }}:{{
        (Math.floor(stopwatch) % 60).toString().padStart(2, "0")
      }}
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
  width: 25rem;
  height: 20rem;
  //padding: 20% 10%;
  border: solid 40px;
  border-radius: 20px;
  corner-shape: squircle;
  font-size: 10rem;
}
#center {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 20% 50% 30%;
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
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
}
.blurred.background {
  background-color: rgba(0, 0, 0, 0.5);
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
  cursor: pointer;
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
