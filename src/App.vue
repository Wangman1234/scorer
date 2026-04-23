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
  Fencer,
  FencerList,
  type map,
  Name,
} from "@/scripts/Types.ts";
import { isEmpty, omit } from "underscore";
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
import {
  Form,
  type FormResolverOptions,
  type FormSubmitEvent,
} from "@primevue/forms";
import { Round } from "@/scripts/Round.ts";
import MatchesTable from "@/Components/MatchesTable.vue";
import ListFencers from "@/ListFencers.vue";
import { Outputter } from "@/scripts/Outputter.ts";
import Poule from "@/Components/Poule.vue";
import { Howl } from "howler";

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
const click = computed(() => {
  return settings.config.playSounds
    ? new Howl({
        src: "/sounds/menu.flac",
      })
    : undefined;
});
const timeHalt = computed(() => {
  return settings.config.playSounds
    ? new Howl({
        src: "/sounds/time.wav",
      })
    : undefined;
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
const timer = new Timer(status, passivity, timeHalt);

// Bout controls
let interval: [NodeJS.Timeout | number, NodeJS.Timeout | number] = [0, 0];
let changeTimes: [number, number] = [0, 0];
const black = ref<[boolean, boolean]>([false, false]);
function changeScore(fencer: 0 | 1, value: number, double: boolean = false) {
  if (value !== 0) {
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
      return true;
    }
  }
  return false;
}
async function choosePriority(state: "N" | "L" | "R") {
  priorityPicker.value = false;
  if (state === "N") {
    for (let i = 0; i < 20; i++) {
      if (Math.random() >= 0.5) {
        if (status.value[0].priority !== "R") click.value?.play();
        status.value[0].priority = "R";
      } else {
        if (status.value[0].priority !== "L") click.value?.play();
        status.value[0].priority = "L";
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  } else {
    if (settings.config.click) {
      click.value?.play();
    }
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
  if (outputter.value && settings.mockOptions.useSelf)
    rounds.value[rounds.value.length - 1]?.update();
});
watch(passivityHalted, (value) => {
  if (value) {
    timeHalt.value?.play();
    if (cyrano.value?.sendingData && status.value[0].state !== "E")
      cyrano.value.forceWrite();
    if (outputter.value && settings.mockOptions.useSelf)
      rounds.value[rounds.value.length - 1]?.update();
  }
});

// Mock Tournament
const mockTab = ref("device");
const mockFinished = ref(false);
const fencers = ref(new FencerList([]));
const rounds = ref<Round[]>([]);
const skipped = ref<[string, string][]>([]);
type RoundType = (typeof rounds.value)[0];
const outputter = ref<Outputter>();

function resolver(e: FormResolverOptions) {
  const errors: {
    id?: any;
  } = {};
  return {
    values: e.values,
    errors,
  };
}
function onSubmit(e: FormSubmitEvent) {
  if (e.valid) {
    fencers.value.push({
      fencer: new Fencer(
        e.values.id || (fencers.value.length() + 1).toString(),
        [e.values.lastName, e.values.firstName],
        new Country(""),
        e.values.club,
      ),
      seed: { 0: e.values.seed },
      leftHanded: e.values.leftHanded,
      fencedFencers: [],
      receivedBye: false,
      victory: {},
      pointsScored: {},
      pointsAgainst: {},
    });
    e.reset();
  }
}

function startMock() {
  outputter.value = new Outputter(matches, status, match, $reset);
}
function stopMock() {
  outputter.value?.stopOutputter();
  delete outputter.value;
  outputter.value = undefined;
  resetMock();
  if (settings.mockOptions.useSelf) reset();
}
function newRound() {
  fencers.value.update(rounds.value.length);
  const newID = rounds.value.length + 1;
  rounds.value.push(
    new Round(newID, fencers, rounds.value.length) as unknown as RoundType,
  );
  mockTab.value = newID.toString();
  if (settings.mockOptions.useSelf) {
    outputter.value?.assignMatches(
      rounds.value[newID - 1]?.matches ?? {},
      newID,
    );
  }
}

function mockFinish() {
  fencers.value.update(rounds.value.length);
  mockFinished.value = true;
  mockTab.value = "final";
  outputter.value = undefined;
}
function resetMock() {
  outputter.value?.reset();
  fencers.value = new FencerList([]);
  rounds.value = [];
  mockTab.value = "fencers";
  mockFinished.value = false;
  matchData.value = [];
}
const runningMock = computed(() => {
  return !isEmpty(rounds.value);
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
  return false;
}

async function cyranoUpdate() {
  while (cyrano.value?.sendingData) {
    console.log("not ended");
    console.log(status.value[0].state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const cs = cyrano.value ?? { cyranoState: "" };
  cs.cyranoState = "Ending";
  console.log("ended");
}
function mockUpdate() {
  rounds.value[rounds.value.length - 1]?.update();
  timer.stopTimer("H");
  status.value[0].stopwatch = settings.settings.maxTime;
  status.value[0].priority = "N";
  status.value[0].state = "H";
  status.value[0].doubles = 0;
  status.value[0].type = "I";
  status.value[0].weapon = "F";
  for (const i in omit(matches.value, "")) {
    const index = +i;
    const matchTemp = matches.value[index] ?? [
      defaultFencerStatus(),
      defaultFencerStatus(),
    ];
    let cont = true;
    for (const m of skipped.value) {
      if (
        m.includes(matchTemp[0].fencer.id) &&
        m.includes(matchTemp[1].fencer.id)
      ) {
        cont = false;
        break;
      }
    }
    if (cont) {
      if (matchTemp[0].status !== "V" && matchTemp[1].status !== "V") {
        status.value[0].match = index;
        status.value[0].round = status.value[0].match || 0;
        nav.page = "bout";
        nav.menu = true;
        return;
      }
    }
  }
  if (!isEmpty(skipped.value)) {
    skipped.value = [];
    mockUpdate();
    return;
  }
  outputter.value?.noBout();
  nav.page = "mock";
  nav.menu = true;
  status.value[0].match = "";
  status.value[0].round = 1;
}

async function skip() {
  timer.stopTimer("H");
  if (cyrano.value && !settings.cyranoOptions.replayMode) {
    const cs = cyrano.value ?? { cyranoState: "", skipped: [["", ""]] };
    cs.skipped.push([match.value[0].fencer.id, match.value[1].fencer.id]);
    cs.cyranoState = "Skipping";
    while (cyrano.value?.sendingData) {
      console.log("not ended");
      console.log(status.value[0].state);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    cs.cyranoState = "Skipping";
  } else if (outputter.value && settings.mockOptions.useSelf) {
    skipped.value.push([match.value[0].fencer.id, match.value[1].fencer.id]);
    mockUpdate();
  }
  console.log("skipping");
}

async function finishMatch() {
  status.value[0].state = "E";
  if (cyrano.value && !settings.cyranoOptions.replayMode) {
    await cyranoUpdate();
    matchData.value = [];
  } else if (outputter.value && settings.mockOptions.useSelf) {
    mockUpdate();
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
    return false;
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
  return false;
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
      if (settings.config.click) {
        click.value?.play();
      }
    } else if (key === keymap.value.Menu || key === "Escape") {
      nav.menu = !nav.menu;
      if (settings.config.click) {
        click.value?.play();
      }
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
        ((nav.page === "bout" ||
          nav.page === "cyrano" ||
          nav.page === "tournament") &&
          key === keymap.value.Timer &&
          (!cyrano.value || cyrano.value.sendingData) &&
          !(outputter.value && outputter.value?.selfState === "No Bouts")) ||
        (nav.page === "mock" &&
          outputter.value &&
          outputter.value?.selfState !== "No Bouts")
      ) {
        nav.menu = false;
        if (settings.config.click) {
          click.value?.play();
        }
      }
    } else if (choices.value) {
      switch (key) {
        case keymap.value.Menu:
        case keymap.value.Choices:
        case keymap.value.Timer:
          choices.value = false;
          if (settings.config.click) {
            click.value?.play();
          }
      }
    } else if (inputTime.value) {
      if (key === keymap.value.Timer) {
        inputTime.value = false;
        passivityStart.value = status.value[0].stopwatch ?? 0;
        if (settings.config.click) {
          click.value?.play();
        }
      }
    } else if (
      !cyrano.value ||
      ((cyrano.value.sendingData || status.value[0].state !== "E") &&
        !(
          cyrano.value.cyranoState === "Skipping" ||
          cyrano.value.cyranoState === "Ending"
        ))
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
  const playSound = func.func();
  passivityStart.value = status.value[0].stopwatch ?? 0;
  if (cyrano.value?.sendingData && status.value[0].state !== "E")
    cyrano.value.forceWrite();
  if (outputter.value && settings.mockOptions.useSelf)
    rounds.value[rounds.value.length - 1]?.update();
  if (settings.config.playSounds && playSound && func.sound) {
    const howl = new Howl({
      src: "/sounds/" + func.sound,
    });
    howl.play();
  } else if (settings.config.click && playSound === false) {
    click.value?.play();
  }
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

const functions: map<{
  name?: string;
  func: () => void | Boolean;
  sound?: string;
}> = {
  Menu: { func: () => false },
  Choices: {
    name: "Open all functions dialog(WIP)",
    func: () => {
      choices.value = true;
      return false;
    },
  },
  LeftAdd1: {
    name: "Add 1 point to FotL",
    func: () => changeScore(0, 1),
    sound: "add.wav",
  },
  RightAdd1: {
    name: "Add 1 point to FotR",
    func: () => changeScore(1, 1),
    sound: "add.wav",
  },
  LeftAdd2: {
    name: "Add 2 point to FotL",
    func: () => changeScore(0, 2),
    sound: "add.wav",
  },
  RightAdd2: {
    name: "Add 2 point to FotR",
    func: () => changeScore(1, 2),
    sound: "add.wav",
  },
  LeftAdd3: {
    name: "Add 3 point to FotL",
    func: () => changeScore(0, 3),
    sound: "add.wav",
  },
  RightAdd3: {
    name: "Add 3 point to FotR",
    func: () => changeScore(1, 3),
    sound: "add.wav",
  },
  LeftMinus1: {
    name: "Subtract 1 point to FotL",
    func: () => changeScore(0, -1),
    sound: "minus.wav",
  },
  RightMinus1: {
    name: "Subtract 1 point to FotR",
    func: () => changeScore(1, -1),
    sound: "minus.wav",
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
        return true;
      }
      return false;
    },
    sound: "add.wav",
  },
  Double1: {
    name: "Add 1 type 2 double",
    func: () => {
      if (
        status.value[0].doubles < settings.settings.maxDoubles ||
        settings.settings.maxDoubles === 0
      ) {
        status.value[0].doubles++;
        changeScore(0, settings.settings.doublesAddPoints1, true);
        changeScore(1, settings.settings.doublesAddPoints1, true);
        return true;
      }
      return false;
    },
    sound: "add.wav",
  },
  MinusDouble: {
    name: "Subtract 1 double",
    func: () => {
      if (status.value[0].doubles > 0) {
        status.value[0].doubles--;
        changeScore(0, -settings.settings.doublesAddPoints, true);
        changeScore(1, -settings.settings.doublesAddPoints, true);
        return true;
      }
      return false;
    },
    sound: "minus.wav",
  },
  MinusDouble1: {
    name: "Subtract 1 type 2 double",
    func: () => {
      if (status.value[0].doubles > 0) {
        status.value[0].doubles--;
        changeScore(0, -settings.settings.doublesAddPoints1, true);
        changeScore(1, -settings.settings.doublesAddPoints1, true);
        return true;
      }
      return false;
    },
    sound: "minus.wav",
  },
  LeftCard: {
    name: "Card FotL",
    func: () => {
      if (match.value[0].ycard) {
        if (match.value[0].rcard === 0) {
          match.value[0].rcard = 1;
          return false;
        }
        match.value[0].rcard = 0;
      }
      match.value[0].ycard = !match.value[0].ycard;
      return false;
    },
  },
  RightCard: {
    name: "Card FotR",
    func: () => {
      if (match.value[1].ycard) {
        if (match.value[1].rcard === 0) {
          match.value[1].rcard = 1;
          return false;
        }
        match.value[1].rcard = 0;
      }
      match.value[1].ycard = !match.value[1].ycard;
      return false;
    },
  },
  LeftRCard: {
    name: "Red card FotL",
    func: () => {
      match.value[0].rcard++;
      match.value[0].rcard %= 10;
      return false;
    },
  },
  RightRCard: {
    name: "Red card FotR",
    func: () => {
      match.value[1].rcard++;
      match.value[1].rcard %= 10;
      return false;
    },
  },
  LeftMinusRCard: {
    name: "Remove 1 red card from FotL",
    func: () => {
      if (match.value[0].rcard > 0) match.value[0].rcard--;
      return false;
    },
  },
  RightMinusRCard: {
    name: "Remove 1 red card from FotR",
    func: () => {
      if (match.value[1].rcard > 0) match.value[1].rcard--;
      return false;
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
        return false;
      if (status.value[0].state === "F") {
        timer.stopTimer("H");
        return true;
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
        } else end();
      }
      return false;
    },
    sound: "timer.flac",
  },
  SetTime: {
    name: "Manually set time",
    func: () => {
      inputTime.value = true;
      return false;
    },
  },
  AddMin: {
    name: "Add 1 min to time",
    func: () => {
      timer.addTime(60);
      return false;
    },
  },
  AddSec: {
    name: "Add 1 sec from time",
    func: () => {
      timer.addTime(1);
      return false;
    },
  },
  MinusMin: {
    name: "Subtract 1 min from time",
    func: () => {
      timer.addTime(-60);
      return false;
    },
  },
  MinusSec: {
    name: "Subtract 1 sec from time",
    func: () => {
      timer.addTime(-1);
      return false;
    },
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
      return false;
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
      return false;
    },
  },
  ResetTime: {
    name: "Reset time",
    func: () => {
      status.value[0].stopwatch = settings.settings.maxTime;
      return false;
    },
  },
  ResetBout: { name: "Reset bout", func: reset },
  SkipBout: {
    name: "Skip bout",
    func: () => {
      skip();
      return false;
    },
  },
  PrioritySelector: {
    name: "Open priority selector",
    func: () => {
      priorityPicker.value = true;
      return false;
    },
  },
  PriorityLeft: {
    name: "Give FotL priority",
    func: () => {
      choosePriority("L");
      return false;
    },
  },
  PriorityRight: {
    name: "Give FotR priority",
    func: () => {
      choosePriority("R");
      return false;
    },
  },
  ResetPriority: {
    name: "Reset priority",
    func: () => {
      status.value[0].priority = "N";
      return false;
    },
  },
  EndMatch: { name: "End match", func: end },
  Period: {
    name: "Next period",
    func: () => {
      if (status.value[0].poultab[0] !== "P") {
        status.value[0].round =
          (status.value[0].round % settings.settings.rounds) + 1;
      }
      return false;
    },
  },
  Flip: {
    name: "Flip fencer sides",
    func: () => {
      let f1 = match.value[0].fencer;
      match.value[0].fencer = match.value[1].fencer;
      match.value[1].fencer = f1;
      return false;
    },
  },
  Mute: {
    name: "Mute",
    func: () => {
      settings.config.playSounds = !settings.config.playSounds;
      return false;
    },
  },
};

function keyDownListener(e: {
  repeat: boolean;
  key: string;
  preventDefault: () => void;
}) {
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
}
function fullScreen() {
  if (!document.fullscreenElement) {
    started.value = false;
  }
}
onMounted(() => {
  $reset();
  window.addEventListener("keydown", keyDownListener);
  window.addEventListener("keyup", keyHandler);
  document.addEventListener("fullscreenchange", fullScreen);
});
onUnmounted(() => {
  document.removeEventListener("fullscreenchange", fullScreen);
  window.removeEventListener("keyup", keyHandler);
  window.removeEventListener("keydown", keyDownListener);
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
    :flip="settings.config.flip"
    :cyrano
    :outputter
    :lChange="black[0]"
    :matchOver
    :matches
    :passivity
    :lFencer="match[0]"
    :status
    :stopwatch
    :winner
    :rChange="black[1]"
    :rFencer="match[1]"
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
          :disabled="
            (!cyrano || settings.cyranoOptions.replayMode) &&
            !(outputter && settings.mockOptions.useSelf)
          "
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
          value="sounds"
          @click="nav.page = 'sounds'"
        >
          Sounds
        </Tab>
        <Tab
          value="restore"
          @click="nav.page = 'restore'"
        >
          Restore
        </Tab>
        <Tab
          value="mock"
          @click="nav.page = 'mock'"
        >
          Mock Tournament
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel
          class="body"
          value="bout"
        >
          <div class="header">
            <h3>Bout Settings</h3>
            <h4
              v-if="
                cyrano?.sendingData ||
                (outputter &&
                  settings.mockOptions.useSelf &&
                  outputter.selfState !== 'No Bouts')
              "
            >
              Tournament Running
            </h4>
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
                <div>Type 2 doubles add points</div>
                <InputNumber
                  v-model="settings.settings.doublesAddPoints1"
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
            <h4
              v-if="
                cyrano?.sendingData ||
                (outputter &&
                  settings.mockOptions.useSelf &&
                  outputter.selfState !== 'No Bouts')
              "
            >
              Tournament Running
            </h4>
            <h4 v-else>Tournament not Running</h4>
          </div>
          <div class="scrollable">
            <Tournament
              :match="status[0].match"
              :matches="omit(matches, '')"
            />
            <h4
              v-if="
                cyrano?.cyranoState === 'No Bouts' ||
                (outputter?.selfState === 'No Bouts' &&
                  settings.mockOptions.useSelf)
              "
            >
              No more bouts
            </h4>
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
            <h4
              v-if="
                cyrano?.sendingData ||
                (outputter &&
                  settings.mockOptions.useSelf &&
                  outputter.selfState !== 'No Bouts')
              "
            >
              Tournament Running
            </h4>
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
                <div>Flip display</div>
                <ToggleSwitch v-model="settings.config.flip" />
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
              :disabled="!!outputter"
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
                <div>Flip display</div>
                <ToggleSwitch v-model="settings.config.flip" />
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
          value="sounds"
        >
          <div class="header">
            <h3>Sounds</h3>
          </div>
          <div class="scrollable">
            <menu>
              <li>
                <div>Play sounds</div>
                <div>
                  <ToggleSwitch v-model="settings.config.playSounds" />
                </div>
              </li>
              <li>
                <div>Click sounds</div>
                <div>
                  <ToggleSwitch
                    v-model="settings.config.click"
                    :disabled="!settings.config.playSounds"
                  />
                </div>
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
        <TabPanel
          class="body"
          value="mock"
        >
          <div class="header">
            <h3>Mock Tournament</h3>
            <h4
              v-if="
                cyrano?.sendingData ||
                (outputter &&
                  settings.mockOptions.useSelf &&
                  outputter.selfState !== 'No Bouts')
              "
            >
              Tournament Running
            </h4>
            <h4 v-else>Tournament not Running</h4>
          </div>
          <div class="scrollable">
            <Tabs
              :value="mockTab"
              lazy
              scrollable
            >
              <TabList>
                <Tab
                  value="device"
                  @click="mockTab = 'device'"
                >
                  Devices
                </Tab>
                <Tab
                  value="fencers"
                  @click="mockTab = 'fencers'"
                >
                  Fencers
                </Tab>
                <Tab
                  v-for="round in rounds"
                  :id="round.id"
                  :value="round.id.toString()"
                  @click="mockTab = round.id.toString()"
                >
                  Round {{ round.id }}
                </Tab>
                <Tab
                  v-if="mockFinished"
                  value="final"
                  @click="mockTab = 'final'"
                >
                  Final
                </Tab>
                <Tab
                  value="reset"
                  @click="mockTab = 'reset'"
                >
                  Reset
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel
                  class="body"
                  value="device"
                >
                  <div class="scrollable">
                    <menu>
                      <li>
                        <div>Use self</div>
                        <ToggleSwitch
                          v-model="settings.mockOptions.useSelf"
                          :disabled="!!outputter"
                        />
                      </li>
                    </menu>
                  </div>
                  <div class="button">
                    <Button
                      v-if="!outputter"
                      :disabled="!!cyrano"
                      @click="startMock"
                    >
                      Start Mock Tournament
                    </Button>
                    <Button
                      v-if="outputter"
                      @click="stopMock"
                    >
                      Stop Mock Tournament
                    </Button>
                  </div>
                </TabPanel>
                <TabPanel
                  class="body"
                  value="fencers"
                >
                  <div class="scrollable">
                    <Form
                      v-slot=""
                      :initialValues="{
                        id: '',
                        firstName: '',
                        lastName: '',
                        club: 'THC',
                      }"
                      :resolver
                      @submit="onSubmit"
                    >
                      <table>
                        <thead>
                          <tr>
                            <th scope="col">id</th>
                            <th scope="col">First Name</th>
                            <th scope="col">Last Name</th>
                            <th scope="col">Left Handed</th>
                            <th scope="col">Club</th>
                            <th scope="col">Seed</th>
                            <th scope="col"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="fencer in fencers.sort(0)"
                            :id="fencers.place(fencer.fencer.id).toString()"
                          >
                            <td>{{ fencer.fencer.id }}</td>
                            <td>{{ fencer.fencer.name.firstName }}</td>
                            <td>{{ fencer.fencer.name.lastName }}</td>
                            <td>
                              <Checkbox
                                v-model="fencer.leftHanded"
                                :disabled="runningMock"
                                binary
                              />
                            </td>
                            <td>{{ fencer.fencer.club }}</td>
                            <td v-if="!runningMock">
                              <InputNumber
                                v-model="fencer.seed[0]"
                                fluid
                              />
                            </td>
                            <td v-if="runningMock">{{ fencer.seed[0] }}</td>
                            <td v-if="!runningMock">
                              <Button @click="fencers.remove(fencer.fencer.id)">
                                Remove
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>
                              <InputText
                                :disabled="runningMock"
                                autofocus
                                fluid
                                name="id"
                                placeholder="id"
                                type="text"
                              />
                            </td>
                            <td>
                              <InputText
                                :disabled="runningMock"
                                fluid
                                name="firstName"
                                placeholder="First name"
                                type="text"
                              />
                            </td>
                            <td>
                              <InputText
                                :disabled="runningMock"
                                fluid
                                name="lastName"
                                placeholder="Last name"
                                type="text"
                              />
                            </td>
                            <td>
                              <Checkbox
                                :disabled="runningMock"
                                binary
                                name="leftHanded"
                              />
                            </td>
                            <td>
                              <InputText
                                :disabled="runningMock"
                                fluid
                                name="club"
                                placeholder="Club"
                                type="text"
                              />
                            </td>
                            <td>
                              <InputNumber
                                :disabled="runningMock"
                                fluid
                                name="seed"
                                placeholder="Seed"
                              />
                            </td>
                            <td>
                              <Button
                                :disabled="runningMock"
                                label="Submit"
                                type="submit"
                              />
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </Form>
                  </div>
                  <div
                    v-if="!runningMock"
                    class="button"
                  >
                    <Button
                      :disabled="fencers.length() < 2 || !outputter"
                      @click="newRound"
                    >
                      New Round
                    </Button>
                  </div>
                </TabPanel>
                <TabPanel
                  v-for="round in rounds"
                  :id="round.id"
                  :value="round.id.toString()"
                >
                  <div class="scrollable">
                    <Poule
                      :matches="
                        rounds
                          .filter((value) => value.id <= round.id)
                          .map((value) => Object.values(value.matches))
                          .flat()
                      "
                      match=""
                    />
                    <MatchesTable
                      :matches="round.matches"
                      match=""
                    />
                    <menu v-if="round.bye">
                      <li>
                        <div>
                          Bye: {{ round.bye?.fencer.id }} -
                          {{
                            round.bye?.fencer.name.toString(
                              settings.config.lastNameFirst,
                              false,
                              false,
                              settings.config.separator,
                              "",
                            )
                          }}
                        </div>
                      </li>
                    </menu>
                    <ListFencers
                      :fencers="fencers"
                      :roundId="round.id"
                    />
                  </div>
                  <div
                    v-if="
                      !mockFinished &&
                      rounds.length <= round.id &&
                      rounds.length < 2 * Math.ceil(fencers.length() / 2) - 1
                    "
                    class="button"
                  >
                    <Button
                      :disabled="!round.finished()"
                      @click="newRound"
                    >
                      New Round{{
                        round.id < Math.ceil(Math.log2(fencers.length()))
                          ? "(Recommended)"
                          : ""
                      }}
                    </Button>
                  </div>
                  <div
                    v-if="!mockFinished && rounds.length <= round.id"
                    class="button"
                  >
                    <Button
                      :disabled="!round.finished()"
                      severity="warn"
                      @click="mockFinish"
                    >
                      Make Final{{
                        round.id === Math.ceil(Math.log2(fencers.length()))
                          ? "(Recommended)"
                          : ""
                      }}
                    </Button>
                  </div>
                </TabPanel>
                <TabPanel value="final">
                  <div class="scrollable">
                    <Poule
                      :matches="
                        rounds
                          .map((value) => Object.values(value.matches))
                          .flat()
                      "
                      match=""
                    />
                    <ListFencers
                      :fencers="fencers"
                      :roundId="rounds.length"
                    />
                  </div>
                </TabPanel>
                <TabPanel value="reset">
                  <div class="header">
                    <h3>Reset</h3>
                    <h4>Are you sure you want to reset?</h4>
                  </div>
                  <div class="button">
                    <Button
                      severity="danger"
                      @click="resetMock"
                    >
                      Reset
                    </Button>
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
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

.poule tr {
  height: 1.5rem;
  border-bottom: 1px solid var(--p-surface-600);
  border-top: 1px solid var(--p-surface-600);
}
.poule th,
.poule td {
  background-clip: border-box;
  padding: 0.25rem;
  border-left: 1px solid var(--p-surface-600);
  border-right: 1px solid var(--p-surface-600);
  text-align: center;
}
.poule td,
.poule th[scope="col"] {
  width: 2rem;
}
.poule th[scope="row"] {
  width: 1.5rem;
}
</style>
