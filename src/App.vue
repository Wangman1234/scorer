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
import Init from "./Components/Init.vue";
import { type CorrectFencerStatus, type keyMap } from "./scripts/Types.ts";
import { keys, omit } from "underscore";
import Poule from "./Components/Poule.vue";
import { defaultKeymaps } from "./scripts/keyMaps.ts";
import { useMatchStore } from "./stores/match.ts";
import { useSettingsStore } from "./stores/settings.ts";
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
const change = ref<false | keyof keyMap>(false);
const keymap = ref("remoteKeymap1");
ref(false);

// Reactive data
const matchOver = computed(() => {
  return (
    ((match.stopwatch ?? 0) <= 0 &&
      match.status.round == settings.settings.rounds) ||
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
watch(keymap, (value) => {
  settings.config.keymap = Object.assign({}, defaultKeymaps[value]);
});

// Timer
const timer = new Timer();

// Bout controls

function changeScore(fencer: CorrectFencerStatus, value: number) {
  let val = fencer.score + value;
  if (match.status.priority === "N") {
    if (
      !(value > 0 && fencer.score >= settings.settings.maxScore) &&
      val >= 0
    ) {
      fencer.score = val;
    }
  } else {
    if (val >= 0) fencer.score = val;
  }
}
function choosePriority(state: "N" | "L" | "R") {
  if (state === "N") {
    if (Math.random() >= 0.5) {
      match.status.priority = "R";
    } else {
      match.status.priority = "L";
    }
  } else {
    match.status.priority = state;
  }
  priorityPicker.value = false;
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
  reset();
  nav.page = "bout";
  nav.menu = true;
}

// Match controls
function reset() {
  match.status.stopwatch = settings.settings.maxTime;
  match.status.priority = "N";
  match.status.state = "";
  match.status.doubles = 0;
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
  match.Lcard = 0;
  match.Rcard = 0;
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
  if (cyrano.value) {
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
      match.status.stopwatch = 60;
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
}
function click() {
  if (match.status.state !== "F") {
    Array.prototype.push.call(match.matchData, {
      stopwatch:
        toTime(match.status.stopwatch) +
        (match.status.priority === "N" ? "" : "P"),
      leftFencerStatus: JSON.parse(JSON.stringify(match.match[0])),
      rightFencerStatus: JSON.parse(JSON.stringify(match.match[1])),
      doubles: match.status.doubles,
    });
    match.matchData = Array.from(match.matchData);
  }
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
      } else timer.startTimer("F");
    }
  }
}

// Key handler
function keyHandler(e: KeyboardEvent) {
  let key = e.key;
  console.log(key);
  if (started.value) {
    if (key === settings.config.keymap.Menu) {
      nav.menu = !nav.menu;
    }
    if (change.value != false) {
      settings.config.keymap[change.value] = key;
      change.value = false;
    } else if (priorityPicker.value) {
      switch (key) {
        case settings.config.keymap.LeftAdd1:
          choosePriority("L");
          break;
        case settings.config.keymap.LeftCard:
          choosePriority("L");
          break;
        case settings.config.keymap.RightAdd1:
          choosePriority("R");
          break;
        case settings.config.keymap.RightCard:
          choosePriority("R");
          break;
        case settings.config.keymap.Timer:
          choosePriority("N");
          break;
      }
    } else if (nav.menu) {
      if (
        (nav.page === "bout" ||
          nav.page === "cyrano" ||
          nav.page === "tournament") &&
        key === settings.config.keymap.Timer &&
        (!cyrano.value || cyrano.value.sendingData)
      ) {
        nav.menu = false;
      }
    } else if (
      !nav.menu &&
      (!cyrano.value || cyrano.value.sendingData || match.status.state !== "E")
    ) {
      console.log("not menu");
      switch (key) {
        case settings.config.keymap.LeftAdd1:
          changeScore(match.match[0], 1);
          break;
        case settings.config.keymap.RightAdd1:
          changeScore(match.match[1], 1);
          break;
        case settings.config.keymap.LeftAdd2:
          changeScore(match.match[0], 2);
          break;
        case settings.config.keymap.RightAdd2:
          changeScore(match.match[1], 2);
          break;
        case settings.config.keymap.LeftAdd3:
          changeScore(match.match[0], 3);
          break;
        case settings.config.keymap.RightAdd3:
          changeScore(match.match[1], 3);
          break;
        case settings.config.keymap.Double:
          if (
            match.status.doubles < settings.settings.maxDoubles ||
            settings.settings.maxDoubles === 0
          ) {
            match.status.doubles++;
            changeScore(match.match[0], settings.settings.doublesAddPoints);
            changeScore(match.match[1], settings.settings.doublesAddPoints);
          }
          break;
        case settings.config.keymap.MinusDouble:
          if (match.status.doubles > 0 || settings.settings.maxDoubles === 0) {
            match.status.doubles--;
            changeScore(match.match[0], -settings.settings.doublesAddPoints);
            changeScore(match.match[1], -settings.settings.doublesAddPoints);
          }
          break;
        case settings.config.keymap.LeftMinus1:
          changeScore(match.match[0], -1);
          break;
        case settings.config.keymap.RightMinus1:
          changeScore(match.match[1], -1);
          break;
        case settings.config.keymap.LeftCard:
          match.LcardAdd();
          break;
        case settings.config.keymap.RightCard:
          match.RcardAdd();
          break;
        case settings.config.keymap.Timer:
          click();
          break;
        case settings.config.keymap.AddMin:
          timer.addTime(60);
          break;
        case settings.config.keymap.AddSec:
          timer.addTime(1);
          break;
        case settings.config.keymap.MinusMin:
          timer.addTime(-60);
          break;
        case settings.config.keymap.MinusSec:
          timer.addTime(-1);
          break;
        case settings.config.keymap.ResetTime:
          match.status.stopwatch = settings.settings.maxTime;
          break;
        case settings.config.keymap.ResetBout:
          reset();
          break;
        case settings.config.keymap.Period:
          if (match.status.poultab[0] !== "P") {
            match.status.round =
              (match.status.round % settings.settings.rounds) + 1;
          }
          break;
        case settings.config.keymap.Flip:
          let f1 = match.match[0];
          match.match[0] = match.match[1];
          match.match[1] = f1;
          let c1 = match.Lcard;
          match.Lcard = match.Rcard;
          match.Rcard = c1;
          break;
      }
    }
  }
}

onMounted(() => {
  match.$reset();
  window.addEventListener("keydown", keyHandler);
  window.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      started.value = false;
    }
  });
});
onUnmounted(() => {
  window.removeEventListener("contextmenu", (event) => event.preventDefault());
  window.removeEventListener("keydown", keyHandler);
  match.$reset();
  stopCyrano();
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
  <Scoreboard :cyrano="!!cyrano" />
  <Dialog
    v-model:visible="nav.menu"
    :closeOnEscape="false"
    :style="{ width: '50rem', height: '50rem' }"
    header="Settings"
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
          :disabled="!cyrano"
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
                <div>Max time(in seconds), requires restart</div>
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
                <div>Allow ties</div>
                <Checkbox
                  v-model="settings.settings.allowTies"
                  binary
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
            </menu>
            <BoutProgress />
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
                        " ",
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
                        " ",
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
                  v-model.number="settings.cyranoOptions.remoteAddress"
                  size="small"
                />
              </li>
              <li>
                <div>Port</div>
                <InputNumber
                  v-model.number="settings.cyranoOptions.port"
                  :useGrouping="false"
                  size="small"
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
                <ColorPicker v-model="settings.config.leftColor" />
              </li>
              <li>
                <div>Right fencer colour</div>
                <ColorPicker v-model="settings.config.rightColor" />
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
                <Select
                  v-model="keymap"
                  :options="keys(defaultKeymaps)"
                  size="small"
                />
              </li>
              <li
                v-for="(item, index) in settings.config.keymap"
                :key="index"
              >
                <div>{{ index }}</div>
                <Button
                  :class="{ selected: change === index }"
                  class="bind keys"
                  size="small"
                  @click="change = index"
                >
                  {{ item }}
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
    <h1>Match</h1>
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
</template>

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
.body {
  height: 48rem;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  border-color: grey;
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
