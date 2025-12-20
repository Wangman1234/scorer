<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Init from "./scripts/Init.vue";
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  emptyFencer,
  Fencer,
  type keyMap,
} from "./scripts/Types.ts";
import { Cyrano } from "./scripts/Cyrano.ts";
import { keys, min, omit } from "underscore";
import { fencerEqual } from "./scripts/Functions.ts";
import NextFencer from "./scripts/NextFencer.vue";

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
    Double: "",
    MinusDouble: "",
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
    Double: "",
    MinusDouble: "",
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
const knowList = ref(1);
const prev = ref(0);
const cyranoState = ref("Waiting");
const change = ref<false | keyof keyMap>(false);
const keymap = ref("remoteKeymap1");
ref(false);

// async
let socket: UDPSocket;
let readab: ReadableStream;
let writeab: WritableStream;
let reader: ReadableStreamDefaultReader;
let writer: WritableStreamDefaultWriter;

// Event data
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
  doublesAddPoints: 0,
  maxDoubles: 0,
});
const cyranoOptions = ref({
  port: 50100,
  remoteAddress: "192.168.2.11",
  pointsPerPeriod: 5,
  roundsPerTableMatch: 3,
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
  state: "",
  doubles: 0,
});
const showDoubles = ref(false);
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
      status.value.priority === "N") ||
    (settings.value.maxDoubles <= status.value.doubles &&
      settings.value.maxDoubles > 0)
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
    status.value.stopwatch =
      Math.round((status.value.stopwatch - 0.01 + Number.EPSILON) * 100) / 100;
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
  if (status.value.stopwatch < 0) {
    status.value.stopwatch += settings.value.maxTime;
  }
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
    cyranoLog("startCyrano", "Socket not connected");
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
    doubles: 0,
  };
  cyrano.value = true;

  const { readable, writable } = await socket.opened;
  readab = readable;
  writeab = writable;
  reader = readab.getReader();
  writer = writeab.getWriter();

  console.log("startCyrano");
  new Promise((res, rej) => runner(res, rej, "NEXT"));
}
function stopCyrano() {
  writer.releaseLock();
  reader.releaseLock();
  socket.close();
  cyrano.value = false;
  sendingData.value = false;
  cyranoState.value = "Waiting";
  settings.value.rounds = 1;
  settings.value.maxScore = 5;
  matches.value[""] = [defaultFencerStatus(), defaultFencerStatus()];
  status.value.match = "";
  reset();
  page.value = "bout";
  menu.value = true;
  cyranoLog("stopCyrano", "finished");
}
async function runner(
  resolve: (value?: any) => void,
  reject: (reason?: any) => void,
  msg: "NEXT" | "PREV" | "INFO" | "" = "",
) {
  if (cyrano.value === false) {
    return resolve();
  }
  try {
    if (msg !== "") {
      await write(msg, "runner");
    }
    cyranoLog(String(knowList.value), "waiting for message");
    const cyranoMsg = await read(cyranoState.value);
    if (cyranoMsg === true) {
      return reject();
    }
    console.log(cyranoMsg);
    cyranoProtocol = cyranoMsg.protocol;
    msg = tester(reject, cyranoMsg);
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 100, ""));
    if (status.value.state === "E") {
      msg = "INFO";
    } else {
      msg = "";
    }
  }
  await runner(resolve, reject, msg);
}
function tester(
  reject: (reason?: any) => void,
  cyranoMsg: Cyrano,
): "NEXT" | "PREV" | "INFO" | "" {
  switch (cyranoState.value) {
    case "Waiting":
    case "No Bouts":
      if (cyranoMsg.com === "DISP" && cyranoMsg.status.poultab !== "") {
        if (knowList.value === 0) {
          if (cyranoMsg.status.poultab === "X") {
            if (cyranoState.value !== "No Bouts") {
              cyranoState.value = "No Bouts";
              page.value = "tournament";
              menu.value = false;
              return "PREV";
            } else {
              // reset()
            }
          } else if (
            cyranoMsg.status.state === "E" ||
            cyranoMsg.leftfencer.status !== "U" ||
            cyranoMsg.rightfencer.status !== "U"
          ) {
            if (typeof matches.value[cyranoMsg.status.match] === "undefined") {
              matches.value[cyranoMsg.status.match] = [
                defaultFencerStatus(),
                defaultFencerStatus(),
              ];
            }
            const mat = matches.value[cyranoMsg.status.match] ?? [
              defaultFencerStatus(),
              defaultFencerStatus(),
            ];
            if (
              !(
                fencerEqual(mat[0], cyranoMsg.leftfencer) &&
                fencerEqual(mat[1], cyranoMsg.rightfencer)
              )
            ) {
              mat[0] = cyranoMsg.leftfencer as CorrectFencerStatus;
              mat[1] = cyranoMsg.rightfencer as CorrectFencerStatus;
            }
            return "NEXT";
          } else {
            set(cyranoMsg);
            if (
              !(
                fencerEqual(match.value[0], cyranoMsg.leftfencer) &&
                fencerEqual(match.value[1], cyranoMsg.rightfencer)
              )
            ) {
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
                doubles: 0,
              };
              winner.value = false;
              cyranoState.value = "Waiting";
              knowList.value = 1;
              return "PREV";
            }
            status.value.stopwatch = settings.value.maxTime;
            page.value = "bout";
            menu.value = true;
            cyranoState.value = "Bout";
            new Promise(() => {
              bout();
            });
          }
        } else {
          if (cyranoMsg.status.poultab === "X") {
            knowList.value = -1;
          } else {
            if (typeof matches.value[cyranoMsg.status.match] === "undefined") {
              matches.value[cyranoMsg.status.match] = [
                defaultFencerStatus(),
                defaultFencerStatus(),
              ];
            }
            const mat = matches.value[cyranoMsg.status.match] ?? [
              defaultFencerStatus(),
              defaultFencerStatus(),
            ];
            if (
              !(
                fencerEqual(mat[0], cyranoMsg.leftfencer) &&
                fencerEqual(mat[1], cyranoMsg.rightfencer)
              )
            ) {
              console.log("not equal");
              console.log(mat[0], mat[1]);
              mat[0] = cyranoMsg.leftfencer as CorrectFencerStatus;
              mat[1] = cyranoMsg.rightfencer as CorrectFencerStatus;
            } else if (
              cyranoMsg.status.match ===
              Number(min(keys(omit(matches.value, ""))))
            ) {
              if (cyranoMsg.status.match === prev.value) {
                knowList.value = 0;
                prev.value = 0;
              } else {
                prev.value = cyranoMsg.status.match;
              }
            }
          }
          if (knowList.value > 0) {
            return "NEXT";
          } else {
            return "PREV";
          }
        }
      } else if (
        (cyranoMsg.com === "HELLO" ||
          cyranoMsg.leftfencer.status !== "U" ||
          cyranoMsg.rightfencer.status !== "U") &&
        cyranoMsg.status.poultab !== "X"
      ) {
        return "NEXT";
      }
      break;
    case "Bout":
      if (cyranoMsg.com === "HELLO") {
        return "INFO";
      }
      break;
    case "Ending":
      if (cyranoMsg.com === "ACK") {
        console.log("ACK");
        matches.value[""] = [defaultFencerStatus(), defaultFencerStatus()];
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
          doubles: 0,
        };
        Lcard.value = 0;
        Rcard.value = 0;
        winner.value = false;
        cyranoState.value = "Waiting";
        return "NEXT";
      } else if (cyranoMsg.com === "NAK") {
        menu.value = true;
        page.value = "cyrano";
        reject();
      }
      return "INFO";
  }
  return "";
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
  if (check()) return resolve();
  reader.releaseLock();
  writer.releaseLock();
  writer = writeab.getWriter();
  await write("INFO", "writeRepeat");
  reader = readab.getReader();
  for (let i = 0; i < 10; i++) {
    if (check()) return resolve();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log(status.value.state);
  await writeRepeat(resolve, reject);
}
function check(): boolean {
  if (status.value.state === "E") {
    reader.releaseLock();
    writer.releaseLock();
    writer = writeab.getWriter();
    reader = readab.getReader();
    console.log("sendFalse");
    sendingData.value = false;
    return true;
  }
  return false;
}
function set(cyr: Cyrano) {
  settings.value.piste = cyr.piste;
  settings.value.compe = cyr.compe;
  settings.value.phase = cyr.phase === "" ? 0 : cyr.phase;
  status.value = cyr.status as CorrectStatus;
  settings.value.maxTime = 180;
  switch (status.value.poultab[0]) {
    case "P":
      settings.value.rounds = status.value.round;
      break;
    default:
      settings.value.rounds = cyranoOptions.value.roundsPerTableMatch;
  }
  settings.value.maxScore =
    (settings.value.rounds - status.value.round + 1) *
    cyranoOptions.value.pointsPerPeriod;
  settings.value.allowTies = false;
}
async function read(process: string = "read") {
  const { value, done } = await reader.read();
  cyranoLog(process, "done reading");
  if (done) {
    stopCyrano();
    cyranoLog(process, "done");
    return true;
  }
  cyranoLog(process, "message got");

  const { data, remoteAddress, remotePort } = value;
  cyranoOptions.value.remoteAddress = remoteAddress;
  const decoded = decoder.decode(data);
  cyranoLog(
    "process",
    process,
    ": received ",
    decoded,
    " from ",
    remoteAddress,
    ":",
    remotePort,
  );
  return new Cyrano(decoded);
}
async function write(
  com: "NEXT" | "PREV" | "INFO" = "INFO",
  process: string = "write",
) {
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
  console.log(process, cyranoStart);
  let message = cyranoStart.toString();
  await writer.ready;
  await writer.write({
    data: encoder.encode(message),
    remoteAddress: cyranoOptions.value.remoteAddress,
    remotePort: cyranoOptions.value.port,
  });
  cyranoLog(
    process,
    "sent",
    message,
    "on port",
    cyranoOptions.value.port,
    "to",
    cyranoOptions.value.remoteAddress,
  );
}
function cyranoLog(process: string, ...args: any) {
  console.log("process", process, ":", ...args);
  cyranoOut.value = args.join(" ");
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
  status.value.state = "";
  status.value.doubles = 0;
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
  while (sendingData.value) {
    console.log("not ended");
    console.log(status.value.state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  cyranoState.value = "Ending";
  console.log("ended");
}

async function finishMatch() {
  status.value.state = "E";
  if (cyrano.value) {
    await update();
  } else {
    page.value = "bout";
    menu.value = true;
    reset();
  }
}
function end() {
  if (
    settings.value.maxDoubles <= status.value.doubles &&
    settings.value.maxDoubles > 0
  ) {
    if (settings.value.allowTies) {
      match.value[0].status = "D";
      match.value[1].status = "D";
      winner.value = true;
      return;
    }
  }
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
      status.value.doubles = 0;
      return;
    }
  }
  winner.value = true;
}
function click() {
  if (!cyrano.value || sendingData.value || status.value.state !== "E") {
    if (status.value.state === "F") {
      stopTimer("H");
    } else if (winner.value) {
      finishMatch();
    } else if (matchOver.value) {
      end();
    } else if (status.value.state === "H" || status.value.state === "") {
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
      (page.value === "bout" ||
        page.value === "cyrano" ||
        page.value === "tournament")
    ) {
      if (
        key === config.value.keymap.Timer &&
        (!cyrano.value || sendingData.value)
      ) {
        if (cyrano.value) {
          menu.value = false;
        } else {
          reset();
        }
      }
    } else if (
      !menu.value &&
      (!cyrano.value || sendingData.value || status.value.state !== "E")
    ) {
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
        case config.value.keymap.Double:
          status.value.doubles++;
          changeScore(match.value[0], settings.value.doublesAddPoints);
          changeScore(match.value[1], settings.value.doublesAddPoints);
          break;
        case config.value.keymap.MinusDouble:
          status.value.doubles--;
          changeScore(match.value[0], -settings.value.doublesAddPoints);
          changeScore(match.value[1], -settings.value.doublesAddPoints);
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
          if (status.value.poultab[0] !== "P") {
            status.value.round =
              (status.value.round % settings.value.rounds) + 1;
          }
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
          <NextFencer
            v-if="
              (match[0].score >= (3 / 5) * settings.maxScore ||
                match[1].score >= (3 / 5) * settings.maxScore) &&
              cyrano
            "
            :matches="omit(matches, '')"
            :match="status.match === '' ? 0 : status.match"
          />
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
        <div
          id="doubles"
          v-if="showDoubles"
        >
          {{ status.doubles }} Doubles
        </div>
        <div id="rounds">
          <span>{{ status.round }}</span
          >/<span>{{
            status.poultab[0] === "P"
              ? Object.keys(omit(matches, "")).length
              : settings.rounds
          }}</span>
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
        :class="{ selected: page === 'tournament' }"
        @click="page = 'tournament'"
        v-if="cyrano"
        >Tournament</a
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
          <div>Max time(in seconds), requires restart</div>
          <input v-model.number="settings.maxTime" />
        </li>
        <li>
          <div>Current time(in seconds)</div>
          <input v-model.number="status.stopwatch" />
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
        <li>
          <div>Show doubles</div>
          <input
            type="checkbox"
            v-model="showDoubles"
          />
        </li>
        <li>
          <div>Doubles add points</div>
          <input v-model.number="settings.doublesAddPoints" />
        </li>
        <li>
          <div>Maximum doubles</div>
          <input v-model.number="settings.maxDoubles" />
        </li>
      </menu>
      <button @click="reset">Reset Bout</button>
    </div>
    <div
      id="tournament"
      v-if="page === 'tournament'"
    >
      <h3>Bout Settings</h3>
      <h4 v-if="sendingData">Tournament Running</h4>
      <h4 v-else>Tournament not Running</h4>
      <ul>
        <li
          v-for="(item, index) in omit(matches, '')"
          :key="index"
        >
          {{ index }}. {{ item[0].fencer.name.toString() }} {{ item[0].score
          }}{{ item[0].status === "U" ? "" : item[0].status }} vs.
          {{ item[1].fencer.name.toString() }} {{ item[1].score
          }}{{ item[1].status === "U" ? "" : item[1].status }}
        </li>
      </ul>
      <h4 v-if="cyranoState === 'No Bouts'">No more bouts</h4>
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
        <li>
          <div>Periods per Table Match</div>
          <input v-model.number="cyranoOptions.roundsPerTableMatch" />
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
    class="blurred background"
    @click="menu = false"
    v-if="menu"
  ></div>
  <div
    class="blurred"
    v-else-if="priorityPicker"
  ></div>
  <div
    class="blurred"
    v-else-if="
      status.state === 'E' ||
      ((cyranoState === 'Waiting' || cyranoState === 'No Bouts') && cyrano)
    "
  >
    <h1>{{ cyranoState }}</h1>
  </div>
  <div
    class="blurred"
    v-else-if="winner"
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
    v-else-if="matchOver"
  >
    <h1>Match</h1>
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
  grid-template-rows: 20% 40% 20% 20%;
  height: 100%;
  //background-color: dodgerblue;
}
#doubles {
  font-size: 3rem;
}
#timer {
  z-index: 990;
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
  align-self: center;
  align-items: center;
  align-content: center;
  color: white;
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
  overflow: auto;
  white-space: nowrap;
}
nav::-webkit-scrollbar {
  display: none;
}
nav a {
  background-clip: border-box;
  display: inline-block;
  font-size: 1.5rem;
  width: fit-content;
  padding: 0 1rem;
  //float: left;
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
