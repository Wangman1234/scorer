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
import { computed, onMounted, onUnmounted, ref } from "vue";
import Init from "@/Components/Init.vue";
import { type map } from "@/scripts/Types.ts";
import { omit } from "underscore";
import Poule from "@/Components/Poule.vue";
import { useMatchStore } from "@/stores/match.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import Scoreboard from "@/Components/Scoreboard.vue";
import { Timer } from "@/scripts/Timer.ts";
import { Cyrano } from "@/scripts/Cyrano.ts";
import { useNavStore } from "@/stores/nav.ts";
import { toTime } from "@/scripts/Functions.ts";
import BoutProgress from "@/Components/BoutProgress.vue";

const settings = useSettingsStore();
const match = useMatchStore();
const nav = useNavStore();

// Flags
const started = ref(false);
const priorityPicker = ref(false);
const choices = ref(false);
const inputTime = ref(false);
const change = ref<false | keyof map<string>>(false);
ref(false);

// Reactive data
const matchOver = computed(() => {
  return (
    ((match.stopwatch ?? 0) <= 0 &&
      (match.status.round === settings.settings.rounds ||
        match.status.priority !== "N")) ||
    ((match.match[0].score >= settings.settings.maxScore ||
      match.match[1].score >= settings.settings.maxScore) &&
      match.status.priority === "N") ||
    (settings.settings.maxDoubles <= match.status.doubles &&
      settings.settings.maxDoubles > 0)
  );
});
const winner = computed(() => {
  return match.match[0].status === "D" || match.match[1].status === "D";
});

// Timer
const timer = new Timer();

// Bout controls
let interval: [number, number] = [0, 0];
let changeTimes: [number, number] = [0, 0];
const black = ref<[boolean, boolean]>([false, false]);
function changeScore(fencer: 0 | 1, value: number) {
  if (value !== 0) {
    let val = match.match[fencer].score + value;
    if (
      val >= 0 &&
      (match.status.priority !== "N" ||
        value <= 0 ||
        match.match[fencer].score < settings.settings.maxScore)
    ) {
      match.match[fencer].score = val;

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
}
async function choosePriority(state: "N" | "L" | "R") {
  priorityPicker.value = false;
  if (state === "N") {
    for (let i = 0; i < 20; i++) {
      if (Math.random() >= 0.5) {
        match.status.priority = "R";
      } else {
        match.status.priority = "L";
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } else {
    match.status.priority = state;
  }
}
function push() {
  Array.prototype.push.call(match.matchData, {
    stopwatch:
      (match.status.priority === "N"
        ? match.status.round.toString() + "-"
        : "P-") + toTime(match.status.stopwatch),
    leftFencerStatus: JSON.parse(JSON.stringify(match.match[0])),
    rightFencerStatus: JSON.parse(JSON.stringify(match.match[1])),
    doubles: match.status.doubles,
  });
  match.matchData = Array.from(match.matchData);
}

// Cyrano
const cyrano = ref<Cyrano>();
async function startCyrano() {
  cyrano.value = new Cyrano();
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

// Match controls
function reset() {
  match.status.stopwatch = settings.settings.maxTime;
  match.status.priority = "N";
  match.status.state = "";
  match.status.doubles = 0;
  if (match.status.poultab[0] === "P")
    match.status.round = settings.settings.rounds;
  else match.status.round = 1;
  match.match[0].score = 0;
  match.match[0].status = "U";
  match.match[0].ycard = false;
  match.match[0].rcard = 0;
  match.match[0].light = false;
  match.match[0].wlight = false;
  match.match[0].medical = 0;
  match.match[0].reserve = "N";
  match.match[1].score = 0;
  match.match[1].status = "U";
  match.match[1].ycard = false;
  match.match[1].rcard = 0;
  match.match[1].light = false;
  match.match[1].wlight = false;
  match.match[1].medical = 0;
  match.match[1].reserve = "N";
  match.matchData = [];
  nav.menu = false;
  match.passivityStart = match.status.stopwatch ?? 0;
}

async function update() {
  while (cyrano.value?.sendingData) {
    console.log("not ended");
    console.log(match.status.state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const cs = cyrano.value ?? { cyranoState: "" };
  cs.cyranoState = "Ending";
  console.log("ended");
}

async function finishMatch() {
  match.status.state = "E";
  if (cyrano.value && !settings.cyranoOptions.replayMode) {
    await update();
    match.matchData = [];
  } else {
    nav.page = "bout";
    nav.menu = true;
    reset();
  }
}
function end() {
  if (
    settings.settings.maxDoubles <= match.status.doubles &&
    settings.settings.maxDoubles > 0
  ) {
    if (settings.settings.allowTies) {
      match.match[0].status = "D";
      match.match[1].status = "D";
      push();
      return;
    }
  }
  if (match.match[0].score > match.match[1].score) {
    match.match[0].status = "V";
    match.match[1].status = "D";
  } else if (match.match[0].score < match.match[1].score) {
    match.match[0].status = "D";
    match.match[1].status = "V";
  } else {
    if (settings.settings.allowTies) {
      match.match[0].status = "D";
      match.match[1].status = "D";
    } else if (match.status.priority === "L") {
      match.match[0].status = "V";
      match.match[1].status = "D";
    } else if (match.status.priority === "R") {
      match.match[0].status = "D";
      match.match[1].status = "V";
    } else {
      match.status.state = "H";
      priorityPicker.value = true;
      match.status.stopwatch = settings.settings.priority;
      match.status.doubles = 0;
      return;
    }
  }
  if (!settings.settings.allowOver) {
    if (match.match[0].score > settings.settings.maxScore) {
      match.match[0].score = settings.settings.maxScore;
    }
    if (match.match[1].score > settings.settings.maxScore) {
      match.match[1].score = settings.settings.maxScore;
    }
    if (
      !settings.settings.allowTies &&
      match.match[0].score === match.match[1].score
    ) {
      if (match.match[0].status === "V") {
        match.status.priority = "L";
      } else if (match.match[1].status === "V") {
        match.status.priority = "R";
      } else {
        throw Error("Both fencers can't lose when allowTies === false");
      }
    }
  }
  push();
}
function click() {
  if (!cyrano.value || cyrano.value.sendingData || match.status.state !== "E") {
    if (match.status.state === "F") {
      timer.stopTimer("H");
    } else if (winner.value) {
      finishMatch();
    } else if (matchOver.value) {
      end();
    } else if (match.status.state === "H" || match.status.state === "") {
      if (
        match.status.priority !== "N" &&
        (match.match[0].score !== match.match[1].score ||
          match.status.doubles !== 0)
      ) {
        end();
      } else {
        push();
        timer.startTimer("F");
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
          choosePriority("L");
          break;
        case keymap.value.LeftCard:
          choosePriority("L");
          break;
        case keymap.value.RightAdd1:
          choosePriority("R");
          break;
        case keymap.value.RightCard:
          choosePriority("R");
          break;
        case keymap.value.Timer:
          choosePriority("N");
          break;
        case keymap.value.PriorityLeft:
          choosePriority("L");
          break;
        case keymap.value.PriorityRight:
          choosePriority("R");
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
      // TODO
    } else if (inputTime.value) {
      if (key === keymap.value.Timer) {
        inputTime.value = false;
        match.passivityStart = match.status.stopwatch ?? 0;
      }
    } else if (
      !cyrano.value ||
      cyrano.value.sendingData ||
      match.status.state !== "E"
    ) {
      e.preventDefault();
      if (key === " ") key = keymap.value.Timer;
      const index =
        Object.keys(keymap.value).find(
          (index) => keymap.value[index] === key,
        ) ?? "";
      const func = functions[index] ?? function () {};
      func();
      match.passivityStart = match.status.stopwatch ?? 0;
      if (cyrano.value?.sendingData && match.status.state !== "E")
        cyrano.value.forceWrite();
    }
  }
  repeat.value = false;
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

const functions: map<() => void> = {
  Menu: () => {},
  Choices: () => {
    choices.value = true;
  },
  LeftAdd1: () => changeScore(0, 1),
  RightAdd1: () => changeScore(1, 1),
  LeftAdd2: () => changeScore(0, 2),
  RightAdd2: () => changeScore(1, 2),
  LeftAdd3: () => changeScore(0, 3),
  RightAdd3: () => changeScore(1, 3),
  LeftMinus1: () => changeScore(0, -1),
  RightMinus1: () => changeScore(1, -1),
  Double: () => {
    if (
      match.status.doubles < settings.settings.maxDoubles ||
      settings.settings.maxDoubles === 0
    ) {
      match.status.doubles++;
      changeScore(0, settings.settings.doublesAddPoints);
      changeScore(1, settings.settings.doublesAddPoints);
    }
  },
  MinusDouble: () => {
    if (match.status.doubles > 0 || settings.settings.maxDoubles === 0) {
      match.status.doubles--;
      changeScore(0, -settings.settings.doublesAddPoints);
      changeScore(1, -settings.settings.doublesAddPoints);
    }
  },
  LeftCard: () => {
    if (match.match[0].ycard) {
      if (match.match[0].rcard === 0) {
        match.match[0].rcard = 1;
        return;
      }
      match.match[0].rcard = 0;
    }
    match.match[0].ycard = !match.match[0].ycard;
  },
  RightCard: () => {
    if (match.match[1].ycard) {
      if (match.match[1].rcard === 0) {
        match.match[1].rcard = 1;
        return;
      }
      match.match[1].rcard = 0;
    }
    match.match[1].ycard = !match.match[1].ycard;
  },
  LeftRCard: () => {
    match.match[0].rcard++;
    match.match[0].rcard %= 10;
  },
  RightRCard: () => {
    match.match[1].rcard++;
    match.match[1].rcard %= 10;
  },
  LeftMinusRCard: () => {
    if (match.match[0].rcard > 0) match.match[0].rcard--;
  },
  RightMinusRCard: () => {
    if (match.match[1].rcard > 0) match.match[1].rcard--;
  },
  Timer: () => click(),
  SetTime: () => {
    inputTime.value = true;
  },
  AddMin: () => timer.addTime(60),
  AddSec: () => timer.addTime(1),
  MinusMin: () => timer.addTime(-60),
  MinusSec: () => timer.addTime(-1),
  Rest: () => {
    const P = match.status.state === "P";
    timer.stopTimer("H");
    if (P) {
      match.status.stopwatch = settings.settings.maxTime;
      match.period();
    } else {
      timer.startTimer("P");
    }
  },
  Break: () => {
    const P = match.status.state === "P";
    timer.stopTimer("H");
    if (P) {
      match.status.stopwatch = timer.breakTime;
    } else {
      timer.startTimer("P", true);
    }
  },
  ResetTime: () => (match.status.stopwatch = settings.settings.maxTime),
  ResetBout: () => reset(),
  PrioritySelector: () => (priorityPicker.value = true),
  PriorityLeft: () => choosePriority("L"),
  PriorityRight: () => choosePriority("R"),
  ResetPriority: () => (match.status.priority = "N"),
  EndMatch: () => end(),
  Period: () => match.period(),
  Flip: () => {
    let f1 = match.match[0];
    match.match[0] = match.match[1];
    match.match[1] = f1;
  },
};
const names: map<string> = {
  Menu: "Menu",
  Choices: "Open all functions dialog(WIP)",
  LeftAdd1: "Add 1 point to FotL",
  RightAdd1: "Add 1 point to FotR",
  LeftAdd2: "Add 2 point to FotL",
  RightAdd2: "Add 2 point to FotR",
  LeftAdd3: "Add 3 point to FotL",
  RightAdd3: "Add 3 point to FotR",
  LeftMinus1: "Subtract 1 point from FotL",
  RightMinus1: "Subtract 1 point from FotR",
  Double: "Add 1 double",
  MinusDouble: "Subtract 1 double",
  LeftCard: "Card FotL",
  RightCard: "Card FotR",
  LeftRCard: "Red card FotL",
  RightRCard: "Red card FotR",
  LeftMinusRCard: "Subtract red card from FotL",
  RightMinusRCard: "Subtract red card from FotR",
  Timer: "Timer/Next",
  ResetTime: "Reset time",
  Rest: "Rest and next round",
  Break: "Break and rest",
  SetTime: "Manually set time",
  AddMin: "Add 1 minute to timer",
  AddSec: "Add 1 second to timer",
  MinusMin: "Subtract 1 minute from timer",
  MinusSec: "Subtract 1 second from the timer",
  ResetBout: "Reset bout",
  PrioritySelector: "Open priority selector",
  PriorityLeft: "Give FotL priority",
  PriorityRight: "Give FotR priority",
  ResetPriority: "Reset priority",
  EndMatch: "End match",
  Period: "Next period",
  Flip: "Flip fencer sides",
};

onMounted(() => {
  match.$reset();
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
  match.$reset();
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
    :cyrano="!!cyrano"
    :leftChange="black[0]"
    :rightChange="black[1]"
  />
  <Dialog
    v-model:visible="choices"
    :draggable="false"
    :style="{ width: '30rem', height: '50rem' }"
    dismissableMask
    header="Select"
    modal
  >
    <menu style="width: 100%">
      <li
        v-for="(item, index) in functions"
        :key="index"
        style="width: 100%"
      >
        <Button
          :style="{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }"
          variant="text"
          @click="
            () => {
              item();
              choices = false;
            }
          "
        >
          <span>{{ names[index] }}</span>
          <span>{{ keymap[index] }}</span>
        </Button>
      </li>
    </menu>
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
      v-model="match.status.stopwatch"
      class="number"
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
        <Tab value="bout">Bout</Tab>
        <Tab
          :disabled="!cyrano?.nak"
          value="nak"
          >Corrections</Tab
        >
        <Tab
          :disabled="!cyrano || settings.cyranoOptions.replayMode"
          value="tournament"
          >Tournament</Tab
        >
        <Tab value="cyrano">Cyrano</Tab>
        <Tab value="display">Display</Tab>
        <Tab value="controls">Controls</Tab>
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
              <li>
                <div>Left fencer name</div>
                <div>
                  <InputGroup>
                    <InputText
                      v-model="match.match[0].fencer.name.firstName"
                      placeholder="Firstname"
                      size="small"
                    />
                    <InputText
                      v-model="match.match[0].fencer.name.lastName"
                      placeholder="Surname"
                      size="small"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>Left fencer club</div>
                <InputText
                  v-model="match.match[0].fencer.club"
                  placeholder="Club"
                  size="small"
                />
              </li>
              <li>
                <div>Right fencer name</div>
                <div>
                  <InputGroup>
                    <InputText
                      v-model="match.match[1].fencer.name.firstName"
                      placeholder="Firstname"
                      size="small"
                    />
                    <InputText
                      v-model="match.match[1].fencer.name.lastName"
                      placeholder="Surname"
                      size="small"
                    />
                  </InputGroup>
                </div>
              </li>
              <li>
                <div>Right fencer club</div>
                <InputText
                  v-model="match.match[1].fencer.club"
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
                  v-model="match.status.stopwatch"
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
                <Checkbox
                  v-model="settings.settings.allowTies"
                  binary
                />
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
                <Checkbox
                  v-model="settings.settings.allowOver"
                  binary
                />
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
                <Checkbox
                  v-model="settings.settings.passivityStops"
                  binary
                />
              </li>
            </menu>
            <BoutProgress />
          </div>
          <div class="button">
            <Button
              autofocus
              @click="reset"
              >Reset Bout</Button
            >
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
              sending: <code>{{ match.cyranoMatch.toString() }}</code>
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
              <li v-for="(_item, index) in match.status">
                <div>{{ index }}</div>
                <input v-model="match.status[index]" />
              </li>
            </menu>
            <div class="table">
              <menu>
                <li><h4>Left Fencer</h4></li>
                <li>
                  <div>id</div>
                  <input v-model="match.match[0].fencer.id" />
                </li>
                <li>
                  <div>name</div>
                  <div>
                    <input
                      v-model.number="match.match[0].fencer.name.firstName"
                      placeholder="first name"
                    />
                    <input
                      v-model.number="match.match[0].fencer.name.lastName"
                      placeholder="surname"
                    />
                  </div>
                </li>
                <li>
                  <div>country</div>
                  <input v-model="match.match[0].fencer.country" />
                </li>
                <li v-for="(_item, index) in omit(match.match[0], 'fencer')">
                  <div>{{ index }}</div>
                  <input v-model="match.match[0][index]" />
                </li>
              </menu>
              <menu>
                <li><h4>Right Fencer</h4></li>
                <li>
                  <div>id</div>
                  <input v-model="match.match[1].fencer.id" />
                </li>
                <li>
                  <div>name</div>
                  <div>
                    <input
                      v-model.number="match.match[1].fencer.name.firstName"
                      placeholder="first name"
                    />
                    <input
                      v-model.number="match.match[1].fencer.name.lastName"
                      placeholder="surname"
                    />
                  </div>
                </li>
                <li>
                  <div>country</div>
                  <input v-model="match.match[1].fencer.country" />
                </li>
                <li v-for="(_item, index) in omit(match.match[1], 'fencer')">
                  <div>{{ index }}</div>
                  <input v-model="match.match[1][index]" />
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
            <Poule :matches="omit(match.matches, '')" />
            <table>
              <thead>
                <tr>
                  <th scope="col">Bout</th>
                  <th scope="col">Left fencer</th>
                  <th colspan="5"></th>
                  <th scope="col">Right fencer</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in omit(match.matches, '')"
                  :key="index"
                  :class="index == match.status.match ? 'running' : 'not'"
                >
                  <th scope="row">{{ index }}.</th>
                  <td>
                    {{ item[0].fencer.id }}
                    {{
                      item[0].fencer.name.toString(
                        settings.config.lastNameFirst,
                        false,
                        false,
                        settings.config.separator,
                        "",
                      )
                    }}
                  </td>
                  <td class="score">{{ item[0].status }}</td>
                  <td class="score">{{ item[0].score }}</td>
                  <td>vs.</td>
                  <td class="score">{{ item[1].score }}</td>
                  <td class="score">{{ item[1].status }}</td>
                  <td>
                    {{ item[1].fencer.id }}
                    {{
                      item[1].fencer.name.toString(
                        settings.config.lastNameFirst,
                        false,
                        false,
                        settings.config.separator,
                        "",
                      )
                    }}
                  </td>
                </tr>
              </tbody>
            </table>
            <h4 v-if="cyrano?.cyranoState === 'No Bouts'">No more bouts</h4>
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
                <Checkbox
                  v-model="settings.cyranoOptions.replayMode"
                  :disabled="!!cyrano"
                  binary
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
                <Checkbox
                  v-model="settings.settings.allowOver"
                  binary
                />
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
                <div>Left fencer colour</div>
                <div :style="{ display: 'block', alignItems: 'right' }">
                  <InputText
                    v-model="settings.config.leftColor"
                    size="small"
                  />
                  <ColorPicker v-model="settings.config.leftColor" />
                </div>
              </li>
              <li>
                <div>Right fencer colour</div>
                <div :style="{ display: 'block', alignItems: 'right' }">
                  <InputText
                    v-model="settings.config.rightColor"
                    size="small"
                  />
                  <ColorPicker v-model="settings.config.rightColor" />
                </div>
              </li>
              <li>
                <div>Surnames in front</div>
                <Checkbox
                  v-model="settings.config.lastNameFirst"
                  binary
                />
              </li>
              <li>
                <div>Shorten the first part of the name</div>
                <Checkbox
                  v-model="settings.config.shortenFirst"
                  binary
                />
              </li>
              <li>
                <div>Shorten the second part of the name</div>
                <Checkbox
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
                <div>Show doubles</div>
                <Checkbox
                  v-model="settings.config.showDoubles"
                  binary
                />
              </li>
              <li>
                <div>Always show subsecond</div>
                <Checkbox
                  v-model="settings.config.showSubSec"
                  binary
                />
              </li>
            </menu>
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
              <li
                v-for="index in Object.keys(functions)"
                :key="index"
              >
                <div>{{ names[index] ?? index }}</div>
                <Button
                  :class="{ selected: change === index }"
                  class="bind keys"
                  size="small"
                  :disabled="settings.config.keymap.split(' ')[0] === 'default'"
                  :severity="
                    Object.values(keymap).filter(
                      (item) => item === keymap[index],
                    ).length > 1
                      ? 'danger'
                      : 'primary'
                  "
                  @click="change = index"
                >
                  {{ keymap[index] }}
                </Button>
              </li>
            </menu>
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>
    <!--    <div-->
    <!--      class="blurred background"-->
    <!--      @click="nav.menu = false"-->
    <!--    ></div>-->
  </Dialog>
  <div v-if="priorityPicker">
    <div
      v-if="priorityPicker"
      class="priority"
    >
      <h2>Choose Priority</h2>
      <div class="lr">
        <Button
          class="half"
          @click="choosePriority('L')"
        >
          Left
        </Button>
        <Button
          class="half"
          @click="choosePriority('R')"
        >
          Right
        </Button>
      </div>
      <div>
        <Button @click="choosePriority('N')">Random</Button>
      </div>
    </div>
    <div
      v-if="priorityPicker"
      class="blurred"
    ></div>
  </div>
  <div
    class="blurred"
    v-if="
      match.status.state === 'E' ||
      ((cyrano?.cyranoState === 'Waiting' ||
        cyrano?.cyranoState === 'No Bouts') &&
        cyrano)
    "
  >
    <h1>{{ cyrano?.cyranoState }}</h1>
  </div>
  <div
    class="blurred"
    v-else-if="winner"
  >
    <h1>
      Match
      {{
        match.match[0].status === "V"
          ? "Left"
          : match.match[1].status === "V"
            ? "Right"
            : "Tie"
      }}
    </h1>
    <h2>{{ match.match[0].score }}-{{ match.match[1].score }}</h2>
  </div>
  <div
    class="blurred"
    v-else-if="matchOver"
  >
    <h1>{{ match.stopwatch <= 0 ? "Time" : "Match" }}</h1>
  </div>
  <div
    v-else-if="
      settings.settings.passivity != 0 &&
      settings.settings.passivityStops &&
      match.passivity <= 0
    "
    class="blurred"
  >
    <h1>Passivity</h1>
  </div>
  <div
    class="blurred"
    v-if="match.status.state === 'P'"
  >
    <h1>1-min break</h1>
    <h2 style="color: blue">
      {{ Math.floor((match.stopwatch ?? 0) / 60) }}:{{
        (Math.floor(match.stopwatch ?? 0) % 60).toString().padStart(2, "0")
      }}
    </h2>
  </div>
  <Dialog
    :contentStyle="{ fontSize: '2rem' }"
    :showHeader="false"
    :visible="repeat"
    modal
    position="bottom"
  >
    Hold
  </Dialog>
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
.number {
  background: var(--p-form-field-background);
  border-color: var(--p-form-field-border-color);
  color: var(--p-surface-400);
  padding: var(--p-form-field-lg-padding-y) var(--p-form-field-lg-padding-x);
  border-radius: var(--p-form-field-border-radius);
  font-size: 8rem;
  border-style: solid;
  border-width: 1px;
}
.number:hover {
  background: var(--p-surface-800);
  color: var(--p-surface-300);
}
.number:active {
  background-color: var(--p-surface-700);
  color: var(--p-surface-200);
}
.body {
  height: 48rem;
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
li div {
  align-self: center;
}
.table {
  display: flex;
  flex-direction: row;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0 0.5rem;
}
tr.running {
  border: 1px solid gold;
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
  border-bottom: 1px solid var(--p-surface-600);
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
}
.priority div {
  align-items: center;
  align-self: center;
  height: 100%;
}
.lr {
  display: flex;
}
.priority button {
  width: 100%;
  height: 100%;
}
.selected {
  background-color: darkslategray;
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
