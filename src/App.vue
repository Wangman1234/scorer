<!--
  - Copyright 2025 Scorer
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  -     http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Init from "@/Components/Init.vue";
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  emptyFencer,
  type map,
  Name,
} from "@/scripts/Types.ts";
import { omit } from "underscore";
import { useSettingsStore } from "@/stores/settings.ts";
import Scoreboard from "@/Components/Scoreboard.vue";
import { Timer } from "@/scripts/Timer.ts";
import { Cyrano } from "@/scripts/Cyrano.ts";
import { useNavStore } from "@/stores/nav.ts";
import { defaultFencerStatus, toTime } from "@/scripts/Functions.ts";
import BoutProgress from "@/Components/BoutProgress.vue";
import { Country, CountryNameList } from "@/scripts/Country.ts";
import { CyranoMessage } from "@/scripts/CyranoMessage.ts";
import Priority from "@/Components/Priority.vue";
import Tournament from "@/Components/Tournament.vue";
import Window from "@/Pages/Window.vue";

const settings = useSettingsStore();
const nav = useNavStore();

// Flags
const started = ref(false);
const priorityPicker = ref(false);
const choices = ref(false);
const inputTime = ref(false);
const tournamentWindow = ref(false);
const change = ref<false | keyof map<string>>(false);
ref(false);

// Match
const matches = ref<
  Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
>({
  "": [defaultFencerStatus(), defaultFencerStatus()],
});
const status = ref<[CorrectStatus]>([
  {
    poultab: "",
    match: "",
    round: 1,
    time: "",
    stopwatch: settings.settings.maxTime,
    type: "",
    weapon: "F",
    priority: "N",
    state: "",
    doubles: 0,
  },
]);
const matchData = ref<
  Array<{
    stopwatch: string;
    leftFencerStatus: CorrectFencerStatus;
    rightFencerStatus: CorrectFencerStatus;
    doubles: number;
  }>
>([]);
const passivityStart = ref(settings.settings.maxTime * 1);
const match = computed<[CorrectFencerStatus, CorrectFencerStatus]>(() => {
  return (
    matches.value[status.value[0].match] ?? [
      defaultFencerStatus(),
      defaultFencerStatus(),
    ]
  );
});
const stopwatch = computed(() => {
  if (typeof status.value[0].stopwatch === "undefined") {
    return 0;
  } else {
    return status.value[0].stopwatch;
  }
});
const cyranoMatch = computed(() => {
  console.log("cyrano changed");
  return new CyranoMessage(
    settings.cyranoOptions.protocol,
    settings.cyranoOptions.ret,
    settings.settings.piste,
    settings.settings.compe,
    settings.settings.phase,
    status.value[0],
    emptyFencer,
    match.value[1],
    match.value[0],
  );
});
const passivity = computed(() => {
  return settings.settings.passivity + stopwatch.value - passivityStart.value;
});
const Lcolor = computed(() => {
  return match.value[0].rcard > 0
    ? "red"
    : match.value[0].ycard
      ? "yellow"
      : "white";
});
const Rcolor = computed(() => {
  return match.value[1].rcard > 0
    ? "red"
    : match.value[1].ycard
      ? "yellow"
      : "white";
});
const matchOver = computed(() => {
  return (
    ((stopwatch.value ?? 0) <= 0 &&
      (status.value[0].round === settings.settings.rounds ||
        status.value[0].priority !== "N")) ||
    ((match.value[0].score >= settings.settings.maxScore ||
      match.value[1].score >= settings.settings.maxScore) &&
      status.value[0].priority === "N") ||
    (settings.settings.maxDoubles <= status.value[0].doubles &&
      settings.settings.maxDoubles > 0)
  );
});
const winner = computed(() => {
  return match.value[0].status === "D" || match.value[1].status === "D";
});

function $reset() {
  matches.value = {
    "": [defaultFencerStatus(), defaultFencerStatus()],
  };
  status.value[0] = {
    poultab: "",
    match: "",
    round: 1,
    time: "",
    stopwatch: settings.settings.maxTime,
    type: "",
    weapon: "F",
    priority: "N",
    state: "",
    doubles: 0,
  };
  matchData.value = [];
  passivityStart.value = settings.settings.maxTime;
}

function download() {
  const text = JSON.stringify({
    keymaps: settings.keymaps,
    config: settings.config,
    settings: settings.settings,
    cyranoOptions: settings.cyranoOptions,
  });
  const filename = "settings.json";
  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:application/json;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();
  document.body.removeChild(element);
}
function restore(event: { files: any[] }) {
  const file = event.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    settings.$state = JSON.parse(e.target?.result as string);
  };

  reader.readAsText(file);
}

// Timer
const timer = new Timer(status, passivity);

// Bout controls
let interval: [NodeJS.Timeout | number, NodeJS.Timeout | number] = [0, 0];
let changeTimes: [number, number] = [0, 0];
const black = ref<[boolean, boolean]>([false, false]);
function changeScore(fencer: 0 | 1, value: number, double: boolean = false) {
  if (value === 0) return;
  let val = match.value[fencer].score + value;
  if (
    (val >= 0 &&
      (status.value[0].priority !== "N" ||
        value <= 0 ||
        match.value[fencer].score < settings.settings.maxScore)) ||
    double
  ) {
    match.value[fencer].score = val;

    clearInterval(interval[fencer]);
    changeTimes[fencer] = 0;
    black.value[fencer] = false;
    interval[fencer] = setInterval(() => {
      black.value[fencer] = !black.value[fencer];
      changeTimes[fencer]++;
      if (changeTimes[fencer] >= 10) {
        clearInterval(interval[fencer]);
        black.value[fencer] = false;
      }
    }, 200);
  }
}
async function choosePriority(state: "N" | "L" | "R") {
  priorityPicker.value = false;
  if (state === "N") {
    for (let i = 0; i < 20; i++) {
      if (Math.random() >= 0.5) {
        status.value[0].priority = "R";
      } else {
        status.value[0].priority = "L";
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } else {
    status.value[0].priority = state;
  }
}
function push() {
  Array.prototype.push.call(matchData.value, {
    stopwatch:
      (status.value[0].priority === "N"
        ? status.value[0].round.toString() + "-"
        : "P-") + toTime(status.value[0].stopwatch),
    leftFencerStatus: JSON.parse(JSON.stringify(match.value[0])),
    rightFencerStatus: JSON.parse(JSON.stringify(match.value[1])),
    doubles: status.value[0].doubles,
  });
  matchData.value = Array.from(matchData.value);
}

// Cyrano
const cyrano = ref<Cyrano>();
async function startCyrano() {
  cyrano.value = new Cyrano(matches, status, match, cyranoMatch, $reset);
  await cyrano.value.startCyrano();
  console.log("cyrano started");
}
async function stopCyrano() {
  console.log(cyrano.value);
  await new Promise((res) => cyrano.value?.stopCyrano(res));
  delete cyrano.value;
  cyrano.value = undefined;
  if (!settings.cyranoOptions.replayMode) reset();
  nav.page = "bout";
  nav.menu = true;
}
const seconds = computed(() => {
  return Math.floor(stopwatch.value);
});
const passivityHalted = computed(
  () =>
    (settings.settings.passivity != 0 &&
      settings.settings.passivityStops &&
      passivity.value <= 0) ||
    stopwatch.value <= 0,
);
watch(seconds, () => {
  if (cyrano.value?.sendingData && status.value[0].state !== "E")
    cyrano.value.forceWrite();
});
watch(passivityHalted, (value) => {
  if (value && cyrano.value?.sendingData && status.value[0].state !== "E")
    cyrano.value.forceWrite();
});

// Match controls
function reset() {
  timer.stopTimer("H");
  status.value[0].stopwatch = settings.settings.maxTime;
  status.value[0].priority = "N";
  status.value[0].state = "";
  status.value[0].doubles = 0;
  if (status.value[0].poultab[0] === "P")
    status.value[0].round = settings.settings.rounds;
  else status.value[0].round = 1;
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
  matchData.value = [];
  nav.menu = false;
  passivityStart.value = status.value[0].stopwatch ?? 0;
}

async function update() {
  while (cyrano.value?.sendingData) {
    console.log("not ended");
    console.log(status.value[0].state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const cs = cyrano.value ?? { cyranoState: "" };
  cs.cyranoState = "Ending";
  console.log("ended");
}

async function finishMatch() {
  status.value[0].state = "E";
  if (cyrano.value && !settings.cyranoOptions.replayMode) {
    await update();
    matchData.value = [];
  } else {
    nav.page = "bout";
    nav.menu = true;
    reset();
  }
}
function end() {
  timer.stopTimer("H");
  if (
    status.value[0].doubles >= settings.settings.maxDoubles &&
    settings.settings.maxDoubles > 0 &&
    settings.settings.allowTies
  ) {
    match.value[0].status = "D";
    match.value[1].status = "D";
  } else if (match.value[0].score > match.value[1].score) {
    match.value[0].status = "V";
    match.value[1].status = "D";
  } else if (match.value[0].score < match.value[1].score) {
    match.value[0].status = "D";
    match.value[1].status = "V";
  } else if (settings.settings.allowTies) {
    match.value[0].status = "D";
    match.value[1].status = "D";
  } else if (status.value[0].priority === "L") {
    match.value[0].status = "V";
    match.value[1].status = "D";
  } else if (status.value[0].priority === "R") {
    match.value[0].status = "D";
    match.value[1].status = "V";
  } else {
    push();
    priorityPicker.value = true;
    status.value[0].stopwatch = settings.settings.priority;
    status.value[0].doubles = 0;
    return;
  }
  push();
  if (!settings.settings.allowOver) {
    if (match.value[0].score > settings.settings.maxScore) {
      match.value[0].score = settings.settings.maxScore;
    }
    if (match.value[1].score > settings.settings.maxScore) {
      match.value[1].score = settings.settings.maxScore;
    }
    if (
      !settings.settings.allowTies &&
      match.value[0].score === match.value[1].score
    ) {
      if (match.value[0].status === "V") {
        status.value[0].priority = "L";
      } else {
        status.value[0].priority = "R";
      }
    }
  }
}

// Key handler
const keymap = computed(() => {
  return (
    settings.keymaps[settings.config.keymap] ?? {
      Menu: "",
      AddMin: "",
      AddSec: "",
      MinusMin: "",
      MinusSec: "",
      LeftAdd1: "",
      RightAdd1: "",
      LeftMinus1: "",
      RightMinus1: "",
      LeftCard: "",
      RightCard: "",
      Timer: "",
      ResetTime: "",
      ResetBout: "",
      Period: "",
      Flip: "",
    }
  );
});
const repeat = ref(false);
function keyHandler(e: KeyboardEvent) {
  let key = (repeat.value ? "hold" : "") + e.key;
  console.log(key);
  if (started.value) {
    if (change.value != false) {
      e.preventDefault();
      if (key === " ") delete keymap.value[change.value];
      else keymap.value[change.value] = key;
      change.value = false;
    } else if (key === keymap.value.Menu || key === "Escape") {
      nav.menu = !nav.menu;
    } else if (priorityPicker.value) {
      switch (key) {
        case keymap.value.LeftAdd1:
        case keymap.value.LeftCard:
        case keymap.value.PriorityLeft:
          choosePriority("L");
          break;
        case keymap.value.RightAdd1:
        case keymap.value.RightCard:
        case keymap.value.PriorityRight:
          choosePriority("R");
          break;
        case keymap.value.Timer:
        case keymap.value.PrioritySelector:
        case keymap.value.Double:
          choosePriority("N");
          break;
        case keymap.value.MinusDouble:
        // @ts-expect-error
        case keymap.value.ResetPriority:
          status.value[0].priority = "N";
        // Falls through
        case keymap.value.Menu:
          priorityPicker.value = false;
          break;
      }
    } else if (nav.menu) {
      if (
        (nav.page === "bout" ||
          nav.page === "cyrano" ||
          nav.page === "tournament") &&
        key === keymap.value.Timer &&
        (!cyrano.value || cyrano.value.sendingData)
      ) {
        nav.menu = false;
      }
    } else if (choices.value) {
      switch (key) {
        case keymap.value.Menu:
        case keymap.value.Choices:
        case keymap.value.Timer:
          choices.value = false;
      }
    } else if (inputTime.value) {
      if (key === keymap.value.Timer) {
        inputTime.value = false;
        passivityStart.value = status.value[0].stopwatch ?? 0;
      }
    } else if (
      !cyrano.value ||
      cyrano.value.sendingData ||
      status.value[0].state !== "E"
    ) {
      e.preventDefault();
      if (key === " ") key = keymap.value.Timer;
      const index =
        Object.keys(keymap.value).find(
          (index) => keymap.value[index] === key,
        ) ?? "";
      doFunc(index);
    }
  }
  repeat.value = false;
}

function doFunc(index?: string) {
  const func = functions[index ?? ""] ?? { func: function () {} };
  func.func();
  passivityStart.value = status.value[0].stopwatch ?? 0;
  if (cyrano.value?.sendingData && status.value[0].state !== "E")
    cyrano.value.forceWrite();
}

const newKeymap = ref("custom");
function newKeymapSubmit() {
  settings.keymaps[newKeymap.value] = Object.assign({}, keymap.value);
  settings.config.keymap = newKeymap.value;
  newKeymap.value = "custom";
}
function removeKeymap() {
  const toRemove = settings.config.keymap;
  settings.config.keymap = "default remote";
  delete settings.keymaps[toRemove];
}
function resetKeymaps() {
  settings.config.keymap = "default remote";
  settings.keymaps = {
    "default remote": {
      Menu: "Escape",
      AddMin: "ArrowUp",
      AddSec: "w",
      MinusMin: "ArrowDown",
      MinusSec: "s",
      LeftAdd1: "AudioVolumeUp",
      RightAdd1: "PageUp",
      LeftMinus1: "AudioVolumeDown",
      RightMinus1: "PageDown",
      LeftCard: "ArrowLeft",
      RightCard: "ArrowRight",
      Timer: "Enter",
      ResetTime: "t",
      ResetBout: "g",
      Period: "p",
      Flip: "f",
    },
    "default keyboard": {
      Menu: "Escape",
      AddMin: "ArrowUp",
      AddSec: "2",
      MinusMin: "ArrowDown",
      MinusSec: "1",
      LeftAdd1: "ArrowLeft",
      RightAdd1: "ArrowRight",
      LeftMinus1: ",",
      RightMinus1: ".",
      LeftCard: "j",
      RightCard: "k",
      Timer: "Enter",
      ResetTime: "t",
      ResetBout: "g",
      Period: "p",
      Flip: "f",
    },
  };
}
function isDefault() {
  return (
    JSON.stringify(settings.keymaps) ===
    JSON.stringify({
      "default remote": {
        Menu: "Escape",
        AddMin: "ArrowUp",
        AddSec: "w",
        MinusMin: "ArrowDown",
        MinusSec: "s",
        LeftAdd1: "AudioVolumeUp",
        RightAdd1: "PageUp",
        LeftMinus1: "AudioVolumeDown",
        RightMinus1: "PageDown",
        LeftCard: "ArrowLeft",
        RightCard: "ArrowRight",
        Timer: "Enter",
        ResetTime: "t",
        ResetBout: "g",
        Period: "p",
        Flip: "f",
      },
      "default keyboard": {
        Menu: "Escape",
        AddMin: "ArrowUp",
        AddSec: "2",
        MinusMin: "ArrowDown",
        MinusSec: "1",
        LeftAdd1: "ArrowLeft",
        RightAdd1: "ArrowRight",
        LeftMinus1: ",",
        RightMinus1: ".",
        LeftCard: "j",
        RightCard: "k",
        Timer: "Enter",
        ResetTime: "t",
        ResetBout: "g",
        Period: "p",
        Flip: "f",
      },
    })
  );
}

const functions: map<{ name?: string; func: () => void }> = {
  Menu: { func: () => {} },
  Choices: {
    name: "Open all functions dialog(WIP)",
    func: () => {
      choices.value = true;
    },
  },
  LeftAdd1: { name: "Add 1 point to FotL", func: () => changeScore(0, 1) },
  RightAdd1: { name: "Add 1 point to FotR", func: () => changeScore(1, 1) },
  LeftAdd2: { name: "Add 2 point to FotL", func: () => changeScore(0, 2) },
  RightAdd2: { name: "Add 2 point to FotR", func: () => changeScore(1, 2) },
  LeftAdd3: { name: "Add 3 point to FotL", func: () => changeScore(0, 3) },
  RightAdd3: { name: "Add 3 point to FotR", func: () => changeScore(1, 3) },
  LeftMinus1: {
    name: "Subtract 1 point to FotL",
    func: () => changeScore(0, -1),
  },
  RightMinus1: {
    name: "Subtract 1 point to FotR",
    func: () => changeScore(1, -1),
  },
  Double: {
    name: "Add 1 double",
    func: () => {
      if (
        status.value[0].doubles < settings.settings.maxDoubles ||
        settings.settings.maxDoubles === 0
      ) {
        status.value[0].doubles++;
        changeScore(0, settings.settings.doublesAddPoints, true);
        changeScore(1, settings.settings.doublesAddPoints, true);
      }
    },
  },
  Double1: {
    name: "Add 1 double plus 1 point",
    func: () => {
      if (
        status.value[0].doubles < settings.settings.maxDoubles ||
        settings.settings.maxDoubles === 0
      ) {
        status.value[0].doubles++;
        changeScore(0, settings.settings.doublesAddPoints + 1, true);
        changeScore(1, settings.settings.doublesAddPoints + 1, true);
      }
    },
  },
  MinusDouble: {
    name: "Subtract 1 double",
    func: () => {
      if (status.value[0].doubles > 0) {
        status.value[0].doubles--;
        changeScore(0, -settings.settings.doublesAddPoints, true);
        changeScore(1, -settings.settings.doublesAddPoints, true);
      }
    },
  },
  MinusDouble1: {
    name: "Subtract 1 double and 1 point",
    func: () => {
      if (status.value[0].doubles > 0) {
        status.value[0].doubles--;
        changeScore(0, -settings.settings.doublesAddPoints - 1, true);
        changeScore(1, -settings.settings.doublesAddPoints - 1, true);
      }
    },
  },
  LeftCard: {
    name: "Card FotL",
    func: () => {
      if (match.value[0].ycard) {
        if (match.value[0].rcard === 0) {
          match.value[0].rcard = 1;
          return;
        }
        match.value[0].rcard = 0;
      }
      match.value[0].ycard = !match.value[0].ycard;
    },
  },
  RightCard: {
    name: "Card FotR",
    func: () => {
      if (match.value[1].ycard) {
        if (match.value[1].rcard === 0) {
          match.value[1].rcard = 1;
          return;
        }
        match.value[1].rcard = 0;
      }
      match.value[1].ycard = !match.value[1].ycard;
    },
  },
  LeftRCard: {
    name: "Red card FotL",
    func: () => {
      match.value[0].rcard++;
      match.value[0].rcard %= 10;
    },
  },
  RightRCard: {
    name: "Red card FotR",
    func: () => {
      match.value[1].rcard++;
      match.value[1].rcard %= 10;
    },
  },
  LeftMinusRCard: {
    name: "Remove 1 red card from FotL",
    func: () => {
      if (match.value[0].rcard > 0) match.value[0].rcard--;
    },
  },
  RightMinusRCard: {
    name: "Remove 1 red card from FotR",
    func: () => {
      if (match.value[1].rcard > 0) match.value[1].rcard--;
    },
  },
  Timer: {
    name: "Timer/Next",
    func: () => {
      if (
        cyrano.value &&
        cyrano.value.sendingData &&
        status.value[0].state === "E"
      )
        return;
      if (status.value[0].state === "F") {
        timer.stopTimer("H");
      } else if (winner.value) {
        finishMatch();
      } else if (matchOver.value) {
        if (settings.config.timerEndsMatch) end();
      } else if (
        status.value[0].state === "H" ||
        status.value[0].state === "W" ||
        status.value[0].state === ""
      ) {
        if (
          status.value[0].priority === "N" ||
          (match.value[0].score === match.value[1].score &&
            status.value[0].doubles === 0)
        ) {
          push();
          timer.startTimer("F");
        } else {
          end();
        }
      }
    },
  },
  SetTime: {
    name: "Manually set time",
    func: () => {
      inputTime.value = true;
    },
  },
  AddMin: {
    name: "Add 1 min to time",
    func: () => timer.addTime(60),
  },
  AddSec: {
    name: "Add 1 sec from time",
    func: () => timer.addTime(1),
  },
  MinusMin: {
    name: "Subtract 1 min from time",
    func: () => timer.addTime(-60),
  },
  MinusSec: {
    name: "Subtract 1 sec from time",
    func: () => timer.addTime(-1),
  },
  Rest: {
    name: "Rest and next round",
    func: () => {
      const P = status.value[0].state === "P";
      timer.stopTimer("H");
      if (P) {
        status.value[0].stopwatch = settings.settings.maxTime;
        if (status.value[0].poultab[0] !== "P") {
          status.value[0].round =
            (status.value[0].round % settings.settings.rounds) + 1;
        }
      } else {
        timer.startTimer("P");
      }
    },
  },
  Break: {
    name: "Break and rest",
    func: () => {
      const P = status.value[0].state === "P";
      timer.stopTimer("H");
      if (P) {
        status.value[0].stopwatch = timer.breakTime;
      } else {
        timer.startTimer("P", true);
      }
    },
  },
  ResetTime: {
    name: "Reset time",
    func: () => (status.value[0].stopwatch = settings.settings.maxTime),
  },
  ResetBout: { name: "Reset bout", func: reset },
  PrioritySelector: {
    name: "Open priority selector",
    func: () => (priorityPicker.value = true),
  },
  PriorityLeft: { name: "Give FotL priority", func: () => choosePriority("L") },
  PriorityRight: {
    name: "Give FotR priority",
    func: () => choosePriority("R"),
  },
  ResetPriority: {
    name: "Reset priority",
    func: () => (status.value[0].priority = "N"),
  },
  EndMatch: { name: "End match", func: end },
  Period: {
    name: "Next period",
    func: () => {
      if (status.value[0].poultab[0] !== "P") {
        status.value[0].round =
          (status.value[0].round % settings.settings.rounds) + 1;
      }
    },
  },
  Flip: {
    name: "Flip fencer sides",
    func: () => {
      let f1 = match.value[0].fencer;
      match.value[0].fencer = match.value[1].fencer;
      match.value[1].fencer = f1;
    },
  },
};

onMounted(() => {
  $reset();
  window.addEventListener("keydown", (e) => {
    repeat.value = e.repeat;
    if (
      (!(nav.menu || choices.value || inputTime.value) ||
        e.key === "Enter" ||
        e.key === "ContextMenu" ||
        change.value != false) &&
      started.value
    ) {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", keyHandler);
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      started.value = false;
    }
  });
});
onUnmounted(() => {
  document.removeEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      started.value = false;
    }
  });
  window.removeEventListener("keyup", keyHandler);
  window.removeEventListener("keydown", (e) => {
    repeat.value = e.repeat;
    if (
      (!(nav.menu || choices.value || inputTime.value) ||
        e.key === "Enter" ||
        e.key === "ContextMenu" ||
        change.value != false) &&
      started.value
    ) {
      e.preventDefault();
    }
  });
  stopCyrano();
  timer.stopTimer("H");
  $reset();
});
</script>

<template>
  <Init
    class="init"
    @started="
      (start) => {
        started = start;
        nav.menu = start;
      }
    "
    v-if="!started"
  />
  <Scoreboard
    :cyrano
    :leftFencer="match[0]"
    :matchOver
    :matches
    :passivity
    :rightFencer="match[1]"
    :status
    :stopwatch
    :winner
    :leftChange="black[0]"
    :rightChange="black[1]"
    @index="(index) => doFunc(index)"
  />
  <Dialog
    v-model:visible="choices"
    :draggable="false"
    :style="{ width: '30rem', height: '50rem' }"
    dismissableMask
    header="Select"
    modal
  >
    <Menu
      :model="Object.values(functions)"
      autofocus
    >
      <template #item="{ item, props }">
        <a
          :style="{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }"
          v-bind="props.action"
          @click="
            () => {
              doFunc(
                Object.keys(functions)[
                  Object.values(functions).findIndex((x) => x.name == item.name)
                ],
              );
            }
          "
        >
          <span>{{ item.name }}</span>
          <span>{{
            keymap[
              Object.keys(functions)[
                Object.values(functions).findIndex((x) => x.name == item.name)
              ] as keyof typeof keymap
            ]
          }}</span>
        </a>
      </template>
    </Menu>
  </Dialog>
  <Dialog
    v-model:visible="inputTime"
    :draggable="false"
    dismissableMask
    header="Time(s)"
    modal
  >
    <input
      ref="stopwatchRef"
      autofocus
      v-model="status[0].stopwatch"
      :max="settings.settings.maxTime"
      min="0"
      step="0.01"
      type="number"
    />
  </Dialog>
  <Dialog
    v-model:visible="nav.menu"
    :closeOnEscape="false"
    :closable="false"
    :maximizable="true"
    :draggable="false"
    :style="{ width: '50rem', height: '50rem' }"
    header="Settings"
    dismissableMask
    modal
  >
    <Tabs
      :showNavigators="false"
      :value="nav.page"
      lazy
      scrollable
    >
      <TabList>
        <Tab
          value="bout"
          @click="nav.page = 'bout'"
        >
          Bout
        </Tab>
        <Tab
          :disabled="!cyrano?.nak"
          value="nak"
          @click="nav.page = 'nak'"
        >
          Corrections
        </Tab>
        <Tab
          value="tournament"
          :disabled="!cyrano || settings.cyranoOptions.replayMode"
          @click="nav.page = 'tournament'"
        >
          Tournament
        </Tab>
        <Tab
          value="cyrano"
          @click="nav.page = 'cyrano'"
        >
          Cyrano
        </Tab>
        <Tab
          value="display"
          @click="nav.page = 'display'"
        >
          Display
        </Tab>
        <Tab
          value="controls"
          @click="nav.page = 'controls'"
        >
          Controls
        </Tab>
        <Tab
          value="restore"
          @click="nav.page = 'restore'"
        >
          Restore
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel
          class="body"
          value="bout"
        >
          <div class="header">
            <h3>Bout Settings</h3>
            <h4 v-if="cyrano?.sendingData">Tournament Running</h4>
            <h4 v-else>Tournament not Running</h4>
          </div>
          <div class="scrollable">
            <menu>
              <li v-if="settings.config.showFlags">
                <div>Left fencer country</div>
                <Select
                  v-model="match[0].fencer.country.countryCode"
                  :options="Object.keys(CountryNameList)"
                  :style="{ width: '25rem' }"
                  filter
                  filter-placeholder="Country code"
                  optionLabel="name"
                  placeholder="Unaffiliated"
                  size="small"
                >
                  <template #value="slotProps">
                    <div class="country-selector">
                      <div
                        :class="`fi fi-${new Country(slotProps.value).alphaTwo()}`"
                      />
                      <div>
                        {{ new Country(slotProps.value) }}
                      </div>
                    </div>
                  </template>
                  <template #option="slotProps">
                    <div class="country-selector">
                      <div
                        :class="`fi fi-${new Country(slotProps.option).alphaTwo()}`"
                      />
                      <div>
                        {{ new Country(slotProps.option) }}
                      </div>
                    </div>
                  </template>
                </Select>
              </li>
              <li>
                <div>Left fencer name</div>
                <div>
                  <InputGroup>
                    <InputText
                      v-model="match[0].fencer.name.firstName"
                      placeholder="Firstname"
                      size="small"
                    />
                    <InputText
                      v-model="match[0].fencer.name.lastName"
                      placeholder="Surname"
                      size="small"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>Left fencer club</div>
                <InputText
                  v-model="match[0].fencer.club"
                  placeholder="Club"
                  size="small"
                />
              </li>
              <li v-if="settings.config.showFlags">
                <div>Right fencer country</div>
                <Select
                  v-model="match[1].fencer.country.countryCode"
                  :options="Object.keys(CountryNameList)"
                  :style="{ width: '25rem' }"
                  filter
                  optionLabel="name"
                  placeholder="Unaffiliated"
                  size="small"
                >
                  <template #value="slotProps">
                    <div class="country-selector">
                      <div
                        :class="`fi fi-${new Country(slotProps.value).alphaTwo()}`"
                      />
                      <div>{{ new Country(slotProps.value) }}</div>
                    </div>
                  </template>
                  <template #option="slotProps">
                    <div class="country-selector">
                      <div
                        :class="`fi fi-${new Country(slotProps.option).alphaTwo()}`"
                      />
                      <div>{{ new Country(slotProps.option) }}</div>
                    </div>
                  </template>
                </Select>
              </li>
              <li>
                <div>Right fencer name</div>
                <div>
                  <InputGroup>
                    <InputText
                      v-model="match[1].fencer.name.firstName"
                      placeholder="Firstname"
                      size="small"
                    />
                    <InputText
                      v-model="match[1].fencer.name.lastName"
                      placeholder="Surname"
                      size="small"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>Right fencer club</div>
                <InputText
                  v-model="match[1].fencer.club"
                  placeholder="Club"
                  size="small"
                />
              </li>
              <li>
                <div>Max time(in seconds), requires reset</div>
                <InputNumber
                  v-model="settings.settings.maxTime"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Current time(in seconds)</div>
                <InputNumber
                  v-model="status[0].stopwatch"
                  :max="settings.settings.maxTime"
                  :maxFractionDigits="2"
                  :min="0"
                  :minFractionDigits="2"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Max score</div>
                <InputNumber
                  v-model="settings.settings.maxScore"
                  :min="1"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>Rounds</div>
                <InputNumber
                  v-model="settings.settings.rounds"
                  :min="1"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>Rest timer</div>
                <InputNumber
                  v-model="settings.settings.rest"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Allow ties</div>
                <ToggleSwitch v-model="settings.settings.allowTies" />
              </li>
              <li>
                <div>Priority timer</div>
                <InputNumber
                  v-model="settings.settings.priority"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Allow point overflow</div>
                <ToggleSwitch v-model="settings.settings.allowOver" />
              </li>
              <li>
                <div>Doubles add points</div>
                <InputNumber
                  v-model="settings.settings.doublesAddPoints"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>Maximum doubles</div>
                <InputNumber
                  v-model="settings.settings.maxDoubles"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>Passivity timer</div>
                <InputNumber
                  v-model="settings.settings.passivity"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Passivity auto halt</div>
                <ToggleSwitch v-model="settings.settings.passivityStops" />
              </li>
            </menu>
            <BoutProgress
              :Lcolor="Lcolor"
              :Rcolor="Rcolor"
              :leftFencer="match[0]"
              :matchData
              :rightFencer="match[1]"
              :status
            />
          </div>
          <div class="button">
            <Button @click="reset">Reset Bout</Button>
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="nak"
        >
          <div class="header">
            <h3>Correction Menu</h3>
            <h4>
              NAK received on Cyrano connection,<br />
              please check match data and resend.
            </h4>
            <div>
              last DISP message: <code>{{ cyrano?.prevDisp.toString() }}</code>
            </div>
            <div>
              sending: <code>{{ cyranoMatch.toString() }}</code>
            </div>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <div>piste</div>
                <input v-model="settings.settings.piste" />
              </li>
              <li>
                <div>compe</div>
                <input v-model="settings.settings.compe" />
              </li>
              <li>
                <div>phase</div>
                <input v-model.number="settings.settings.phase" />
              </li>
              <li v-for="(_, index) in status[0]">
                <div>{{ index }}</div>
                <input v-model="status[0][index]" />
              </li>
            </menu>
            <div class="table">
              <menu>
                <li><strong>Left Fencer</strong></li>
                <li>
                  <div>id</div>
                  <input v-model="match[0].fencer.id" />
                </li>
                <li>
                  <div>name</div>
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
                  <div>country</div>
                  <input v-model="match[0].fencer.country" />
                </li>
                <li v-for="(_, index) in omit(match[0], 'fencer')">
                  <div>{{ index }}</div>
                  <input v-model="match[0][index]" />
                </li>
              </menu>
              <menu>
                <li><strong>Right Fencer</strong></li>
                <li>
                  <div>id</div>
                  <input v-model="match[1].fencer.id" />
                </li>
                <li>
                  <div>name</div>
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
                  <div>country</div>
                  <input v-model="match[1].fencer.country" />
                </li>
                <li v-for="(_, index) in omit(match[1], 'fencer')">
                  <div>{{ index }}</div>
                  <input v-model="match[1][index]" />
                </li>
              </menu>
            </div>
          </div>
          <div class="button">
            <Button @click="cyrano?.unNak()">Resend Data</Button>
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="tournament"
        >
          <div class="header">
            <h3>Tournament Bouts</h3>
            <h4 v-if="cyrano?.sendingData">Tournament Running</h4>
            <h4 v-else>Tournament not Running</h4>
          </div>
          <div class="scrollable">
            <Tournament
              :match="status[0].match"
              :matches="omit(matches, '')"
            />
            <h4 v-if="cyrano?.cyranoState === 'No Bouts'">No more bouts</h4>
          </div>
          <div class="button">
            <Button @click="tournamentWindow = !tournamentWindow"
              >Open in New Window({{ tournamentWindow }})</Button
            >
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="cyrano"
        >
          <div class="header">
            <h4 v-if="cyrano?.sendingData">Tournament Running</h4>
            <h4 v-else>Tournament not Running</h4>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <div>Piste</div>
                <InputText
                  v-model="settings.settings.piste"
                  size="small"
                />
              </li>
              <li>
                <div>Remote Address</div>
                <InputText
                  v-model="settings.cyranoOptions.remoteAddress"
                  :disabled="!!cyrano"
                  size="small"
                />
              </li>
              <li>
                <div>Port</div>
                <InputNumber
                  v-model.number="settings.cyranoOptions.port"
                  :useGrouping="false"
                  :disabled="!!cyrano"
                  size="small"
                />
              </li>
              <li>
                <div>Send Interval</div>
                <InputNumber
                  v-model.number="settings.cyranoOptions.interval"
                  :useGrouping="false"
                  size="small"
                  suffix="×10⁻¹ s"
                />
              </li>
              <li>
                <div>Replay mode</div>
                <ToggleSwitch
                  v-model="settings.cyranoOptions.replayMode"
                  :disabled="!!cyrano"
                />
              </li>
              <li>
                <div>Max time per period</div>
                <InputNumber
                  v-model="settings.settings.maxTime"
                  :min="0"
                  :step="1"
                  showButtons
                  size="small"
                  suffix=" s"
                />
              </li>
              <li>
                <div>Points per Period</div>
                <InputNumber
                  v-model.number="settings.cyranoOptions.pointsPerPeriod"
                  :min="1"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>Periods per Table Match</div>
                <InputNumber
                  v-model.number="settings.cyranoOptions.roundsPerTableMatch"
                  :min="1"
                  :step="1"
                  showButtons
                  size="small"
                />
              </li>
              <li>
                <div>
                  Allow point overflow(if true, ensure max points + max overflow
                  = max points in FT)
                </div>
                <ToggleSwitch v-model="settings.settings.allowOver" />
              </li>
            </menu>
            <div>
              <code>{{ cyrano?.cyranoOut }}</code>
            </div>
          </div>
          <div class="button">
            <Button
              v-if="!cyrano"
              @click="startCyrano"
            >
              Start Cyrano
            </Button>
            <Button
              v-if="cyrano"
              @click="stopCyrano"
            >
              Stop Cyrano
            </Button>
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="display"
        >
          <div class="header">
            <h3>Display Settings</h3>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <label for="l-color">Left fencer colour</label>
                <input
                  id="l-color"
                  v-model="settings.config.leftColor"
                  class="color"
                  list="presetColors"
                  type="color"
                />
              </li>
              <li>
                <label for="r-color">Right fencer colour</label>
                <input
                  id="r-color"
                  v-model="settings.config.rightColor"
                  class="color"
                  list="presetColors"
                  type="color"
                />
              </li>
              <li>
                <div><strong>Example Name</strong></div>
                <div>
                  <strong>
                    {{
                      new Name("Smith", "John").toString(
                        settings.config.lastNameFirst,
                        settings.config.shortenFirst,
                        settings.config.shortenSecond,
                        settings.config.separator,
                        settings.config.ending,
                      )
                    }}
                  </strong>
                </div>
              </li>
              <li>
                <div>Surnames in front</div>
                <ToggleSwitch v-model="settings.config.lastNameFirst" />
              </li>
              <li>
                <div>Shorten the first part of the name</div>
                <ToggleSwitch v-model="settings.config.shortenFirst" />
              </li>
              <li>
                <div>Shorten the second part of the name</div>
                <ToggleSwitch
                  v-model="settings.config.shortenSecond"
                  binary
                />
              </li>
              <li>
                <div>Separator between the parts of the name</div>
                <InputText
                  v-model="settings.config.separator"
                  size="small"
                />
              </li>
              <li>
                <div>Ending of the name</div>
                <InputText
                  v-model="settings.config.ending"
                  size="small"
                />
              </li>
              <li>
                <div><strong>Match display</strong></div>
              </li>
              <li>
                <div>Show doubles</div>
                <ToggleSwitch v-model="settings.config.showDoubles" />
              </li>
              <li>
                <div>Show country flags</div>
                <ToggleSwitch v-model="settings.config.showFlags" />
              </li>
              <li>
                <div>Always show subsecond</div>
                <ToggleSwitch v-model="settings.config.showSubSec" />
              </li>
              <li>
                <div>Blur background</div>
                <ToggleSwitch v-model="settings.config.blurred" />
              </li>
            </menu>
            <datalist id="presetColors">
              <option>#ff0000</option>
              <option>#ff7f00</option>
              <option>#ffff00</option>
              <option>#00ff00</option>
              <option>#00ffff</option>
              <option>#0000ff</option>
              <option>#ff00ff</option>
              <option>#8300ca</option>
            </datalist>
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="controls"
        >
          <div class="header">
            <h3>Keymap</h3>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <div>Keymap</div>
                <div>
                  <InputGroup>
                    <Select
                      v-model="settings.config.keymap"
                      :options="Object.keys(settings.keymaps)"
                      size="small"
                    />
                    <Button
                      :disabled="
                        settings.config.keymap.split(' ')[0] === 'default'
                      "
                      aria-label="Delete"
                      icon="pi pi-times"
                      severity="danger"
                      size="small"
                      @click="removeKeymap()"
                    />
                    <Button
                      :disabled="isDefault()"
                      aria-label="Reset"
                      icon="pi pi-refresh"
                      severity="danger"
                      size="small"
                      @click="resetKeymaps()"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>New Keymap</div>
                <div>
                  <InputGroup>
                    <InputText
                      v-model="newKeymap"
                      :invalid="
                        newKeymap in settings.keymaps ||
                        newKeymap.split(' ')[0] === 'default'
                      "
                      placeholder="New keymap"
                      size="small"
                      type="text"
                    />
                    <Button
                      :disabled="
                        newKeymap in settings.keymaps ||
                        newKeymap.split(' ')[0] === 'default'
                      "
                      aria-label="Submit"
                      icon="pi pi-check"
                      severity="primary"
                      size="small"
                      @click="newKeymapSubmit()"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>Timer Key Ends Match</div>
                <div>
                  <ToggleSwitch v-model="settings.config.timerEndsMatch" />
                </div>
              </li>
              <li
                v-for="(item, index) in functions"
                :key="index"
              >
                <div>{{ item.name ?? index }}</div>
                <ToggleButton
                  :dt="{
                    colorScheme: {
                      dark: {
                        root: {
                          focusRing: {
                            width: '0',
                            style: 'none',
                            color: 'transparent',
                            offset: '0',
                            shadow: '0',
                          },
                        },
                      },
                    },
                  }"
                  :invalid="
                    Object.values(keymap).filter((it) => it === keymap[index])
                      .length > 1
                  "
                  class="bind keys"
                  size="small"
                  :disabled="settings.config.keymap.split(' ')[0] === 'default'"
                  :modelValue="change === index"
                  @update:modelValue="change = index"
                >
                  {{ keymap[index] }}
                </ToggleButton>
              </li>
            </menu>
          </div>
        </TabPanel>
        <TabPanel
          class="body"
          value="restore"
        >
          <div class="header">
            <h3>Restore and Export Settings</h3>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <div>Export Current Settings</div>
                <Button @click="download">Export</Button>
              </li>
              <li>
                <div>Restore Settings</div>
                <FileUpload
                  :auto="true"
                  :chooseButtonProps="{ size: 'small' }"
                  :maxFileSize="1000000"
                  accept=".json"
                  chooseLabel="Restore"
                  customUpload
                  mode="basic"
                  name="restore"
                  @select="restore"
                />
              </li>
            </menu>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </Dialog>
  <Priority
    v-if="priorityPicker"
    @priority="(side) => choosePriority(side)"
  />
  <Dialog
    :contentStyle="{ fontSize: '2rem' }"
    :showHeader="false"
    :visible="repeat"
    modal
    position="bottom"
  >
    Hold
  </Dialog>
  <Window
    :match="status[0].match"
    :matches="omit(matches, '')"
    :tournamentWindow
    @close="tournamentWindow = false"
  />
</template>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
.init {
  z-index: 100000;
  position: absolute;
  height: 100vh;
  width: 100vw;
  float: none;
  display: block;
  top: 0;
  left: 0;
  background-color: black;
}
select,
::picker(select) {
  appearance: base-select;
}
input[type="number"] {
  background: var(--p-form-field-background);
  border-color: var(--p-form-field-border-color);
  color: var(--p-surface-400);
  padding: var(--p-form-field-lg-padding-y) var(--p-form-field-lg-padding-x);
  border-radius: var(--p-form-field-border-radius);
  font-size: 8rem;
  border-style: solid;
  border-width: 1px;
}
input[type="number"]:hover {
  background: var(--p-surface-800);
  color: var(--p-surface-300);
}
input[type="number"]:active {
  background-color: var(--p-surface-700);
  color: var(--p-surface-200);
}
input:focus {
  border-width: var(--p-focus-ring-width);
  border-style: var(--p-focus-ring-style);
  border-color: var(--p-focus-ring-color);
}
.body {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  border-color: var(--p-surface-400);
  border-style: solid;
  border-width: 0 0 2px 0;
  padding: 0.5rem;
}
.scrollable {
  padding: 1rem 0.5rem;
  overflow: auto;
  height: 100%;
  width: 100%;
  align-self: center;
}
.button button {
  width: 100%;
  height: 4rem;
  border-width: 2px 0 0 0;
}
input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}
input[type="color"] {
  border-style: solid;
  border-color: var(--p-form-field-border-color);
  border-radius: var(--p-form-field-border-radius);
  background-clip: border-box;
  padding: 0;
}
input[type="color"]:active {
  border-width: var(--p-focus-ring-width);
  border-style: var(--p-focus-ring-style);
  border-color: var(--p-focus-ring-color);
}
li div {
  align-self: center;
}
.country-selector {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.table {
  display: flex;
  flex-direction: row;
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
  height: 2rem;
  justify-content: space-between;
  padding: 0.1rem 1rem;
  border-bottom: 1px solid var(--p-surface-600);
}
</style>
