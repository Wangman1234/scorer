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
import { omit } from "underscore";
import Poule from "./Components/Poule.vue";
import { defaultKeymaps } from "./scripts/keyMaps.ts";
import { useMatchStore } from "./stores/match.ts";
import { useSettingsStore } from "./stores/settings.ts";
import Scoreboard from "@/Components/Scoreboard.vue";
import { Timer } from "@/scripts/Timer.ts";
import { Cyrano } from "@/scripts/Cyrano.ts";
import { useNavStore } from "@/stores/nav.ts";

const settingsStore = useSettingsStore();
const matchStore = useMatchStore();
const navStore = useNavStore();

// Flags
const started = ref(false);
const priorityPicker = ref(false);
const change = ref<false | keyof keyMap>(false);
const keymap = ref("remoteKeymap1");
ref(false);

// Reactive data
const matchOver = computed(() => {
  return (
    (matchStore.stopwatch <= 0 &&
      matchStore.status.round == settingsStore.settings.rounds) ||
    ((matchStore.match[0].score >= settingsStore.settings.maxScore ||
      matchStore.match[1].score >= settingsStore.settings.maxScore) &&
      matchStore.status.priority === "N") ||
    (settingsStore.settings.maxDoubles <= matchStore.status.doubles &&
      settingsStore.settings.maxDoubles > 0)
  );
});
const winner = computed(() => {
  return (
    matchStore.match[0].status === "D" || matchStore.match[1].status === "D"
  );
});
watch(keymap, (value) => {
  settingsStore.config.keymap = Object.assign({}, defaultKeymaps[value]);
});

// Timer
const timer = new Timer();

// Bout controls
function card(card: number) {
  card += 1;
  card %= 3;
  return card;
}
function changeScore(fencer: CorrectFencerStatus, value: number) {
  let val = fencer.score + value;
  if (matchStore.status.priority === "N") {
    if (
      !(value > 0 && fencer.score >= settingsStore.settings.maxScore) &&
      val >= 0
    ) {
      fencer.score = val;
    }
  } else {
    fencer.score = val;
    matchStore.status.stopwatch = 0;
  }
}
function choosePriority(state: "N" | "L" | "R") {
  if (state === "N") {
    if (Math.random() >= 0.5) {
      matchStore.status.priority = "R";
    } else {
      matchStore.status.priority = "L";
    }
  } else {
    matchStore.status.priority = state;
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
  navStore.page = "bout";
  navStore.menu = true;
}

// Match controls
function reset() {
  matchStore.status.stopwatch = settingsStore.settings.maxTime;
  matchStore.status.priority = "N";
  matchStore.status.state = "";
  matchStore.status.doubles = 0;
  matchStore.match[0].score = 0;
  matchStore.match[0].status = "U";
  matchStore.match[0].ycard = false;
  matchStore.match[0].rcard = 0;
  matchStore.match[0].light = false;
  matchStore.match[0].wlight = false;
  matchStore.match[0].medical = 0;
  matchStore.match[0].reserve = "N";
  matchStore.match[1].score = 0;
  matchStore.match[1].status = "U";
  matchStore.match[1].ycard = false;
  matchStore.match[1].rcard = 0;
  matchStore.match[1].light = false;
  matchStore.match[1].wlight = false;
  matchStore.match[1].medical = 0;
  matchStore.match[1].reserve = "N";
  navStore.menu = false;
  matchStore.Lcard = 0;
  matchStore.Rcard = 0;
}

async function update() {
  while (cyrano.value?.sendingData) {
    console.log("not ended");
    console.log(matchStore.status.state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const cs = cyrano.value ?? { cyranoState: "" };
  cs.cyranoState = "Ending";
  console.log("ended");
}

async function finishMatch() {
  matchStore.status.state = "E";
  if (cyrano.value) {
    await update();
  } else {
    navStore.page = "bout";
    navStore.menu = true;
    reset();
  }
}
function end() {
  if (
    settingsStore.settings.maxDoubles <= matchStore.status.doubles &&
    settingsStore.settings.maxDoubles > 0
  ) {
    if (settingsStore.settings.allowTies) {
      matchStore.match[0].status = "D";
      matchStore.match[1].status = "D";
      return;
    }
  }
  if (matchStore.match[0].score > matchStore.match[1].score) {
    matchStore.match[0].status = "V";
    matchStore.match[1].status = "D";
  } else if (matchStore.match[0].score < matchStore.match[1].score) {
    matchStore.match[0].status = "D";
    matchStore.match[1].status = "V";
  } else {
    if (settingsStore.settings.allowTies) {
      matchStore.match[0].status = "D";
      matchStore.match[1].status = "D";
    } else if (matchStore.status.priority === "L") {
      matchStore.match[0].status = "V";
      matchStore.match[1].status = "D";
    } else if (matchStore.status.priority === "R") {
      matchStore.match[0].status = "D";
      matchStore.match[1].status = "V";
    } else {
      matchStore.status.state = "H";
      priorityPicker.value = true;
      matchStore.status.stopwatch = 60;
      matchStore.status.doubles = 0;
      return;
    }
  }
  if (!settingsStore.settings.allowOver) {
    if (matchStore.match[0].score > settingsStore.settings.maxScore) {
      matchStore.match[0].score = settingsStore.settings.maxScore;
    }
    if (matchStore.match[1].score > settingsStore.settings.maxScore) {
      matchStore.match[1].score = settingsStore.settings.maxScore;
    }
    if (
      !settingsStore.settings.allowTies &&
      matchStore.match[0].score === matchStore.match[1].score
    ) {
      if (matchStore.match[0].status === "V") {
        matchStore.status.priority = "L";
      } else if (matchStore.match[1].status === "V") {
        matchStore.status.priority = "R";
      } else {
        throw Error("Both fencers can't lose when allowTies === false");
      }
    }
  }
}
function click() {
  if (
    !cyrano.value ||
    cyrano.value.sendingData ||
    matchStore.status.state !== "E"
  ) {
    if (matchStore.status.state === "F") {
      timer.stopTimer("H");
    } else if (winner.value) {
      finishMatch();
    } else if (matchOver.value) {
      end();
    } else if (
      matchStore.status.state === "H" ||
      matchStore.status.state === ""
    ) {
      timer.startTimer("F");
    }
  }
}

// Key handler
function keyHandler(e: KeyboardEvent) {
  let key = e.key;
  console.log(key);
  if (started.value) {
    if (key === settingsStore.config.keymap.Menu) {
      navStore.menu = !navStore.menu;
    }
    if (change.value != false) {
      settingsStore.config.keymap[change.value] = key;
      change.value = false;
    } else if (priorityPicker.value) {
      switch (key) {
        case settingsStore.config.keymap.LeftAdd1:
          choosePriority("L");
          break;
        case settingsStore.config.keymap.LeftCard:
          choosePriority("L");
          break;
        case settingsStore.config.keymap.RightAdd1:
          choosePriority("R");
          break;
        case settingsStore.config.keymap.RightCard:
          choosePriority("R");
          break;
        case settingsStore.config.keymap.Timer:
          choosePriority("N");
          break;
      }
    } else if (
      navStore.menu &&
      (navStore.page === "bout" ||
        navStore.page === "cyrano" ||
        navStore.page === "tournament")
    ) {
      if (
        key === settingsStore.config.keymap.Timer &&
        (!cyrano.value || cyrano.value.sendingData)
      ) {
        if (cyrano.value) {
          navStore.menu = false;
        } else {
          reset();
        }
      }
    } else if (
      !navStore.menu &&
      (!cyrano.value ||
        cyrano.value.sendingData ||
        matchStore.status.state !== "E")
    ) {
      console.log("not menu");
      switch (key) {
        case settingsStore.config.keymap.LeftAdd1:
          changeScore(matchStore.match[0], 1);
          break;
        case settingsStore.config.keymap.RightAdd1:
          changeScore(matchStore.match[1], 1);
          break;
        case settingsStore.config.keymap.LeftAdd2:
          changeScore(matchStore.match[0], 2);
          break;
        case settingsStore.config.keymap.RightAdd2:
          changeScore(matchStore.match[1], 2);
          break;
        case settingsStore.config.keymap.LeftAdd3:
          changeScore(matchStore.match[0], 3);
          break;
        case settingsStore.config.keymap.RightAdd3:
          changeScore(matchStore.match[1], 3);
          break;
        case settingsStore.config.keymap.Double:
          if (
            matchStore.status.doubles < settingsStore.settings.maxDoubles ||
            settingsStore.settings.maxDoubles === 0
          ) {
            matchStore.status.doubles++;
            changeScore(
              matchStore.match[0],
              settingsStore.settings.doublesAddPoints,
            );
            changeScore(
              matchStore.match[1],
              settingsStore.settings.doublesAddPoints,
            );
          }
          break;
        case settingsStore.config.keymap.MinusDouble:
          if (
            matchStore.status.doubles > 0 ||
            settingsStore.settings.maxDoubles === 0
          ) {
            matchStore.status.doubles--;
            changeScore(
              matchStore.match[0],
              -settingsStore.settings.doublesAddPoints,
            );
            changeScore(
              matchStore.match[1],
              -settingsStore.settings.doublesAddPoints,
            );
          }
          break;
        case settingsStore.config.keymap.LeftMinus1:
          changeScore(matchStore.match[0], -1);
          break;
        case settingsStore.config.keymap.RightMinus1:
          changeScore(matchStore.match[1], -1);
          break;
        case settingsStore.config.keymap.LeftCard:
          matchStore.Lcard = card(matchStore.Lcard);
          break;
        case settingsStore.config.keymap.RightCard:
          matchStore.Rcard = card(matchStore.Rcard);
          break;
        case settingsStore.config.keymap.Timer:
          click();
          break;
        case settingsStore.config.keymap.AddMin:
          timer.addTime(60);
          break;
        case settingsStore.config.keymap.AddSec:
          timer.addTime(1);
          break;
        case settingsStore.config.keymap.MinusMin:
          timer.addTime(-60);
          break;
        case settingsStore.config.keymap.MinusSec:
          timer.addTime(-1);
          break;
        case settingsStore.config.keymap.ResetTime:
          matchStore.status.stopwatch = settingsStore.settings.maxTime;
          break;
        case settingsStore.config.keymap.Period:
          if (matchStore.status.poultab[0] !== "P") {
            matchStore.status.round =
              (matchStore.status.round % settingsStore.settings.rounds) + 1;
          }
          break;
        case settingsStore.config.keymap.Flip:
          let f1 = matchStore.match[0];
          matchStore.match[0] = matchStore.match[1];
          matchStore.match[1] = f1;
          let c1 = matchStore.Lcard;
          matchStore.Lcard = matchStore.Rcard;
          matchStore.Rcard = c1;
          break;
      }
    }
  }
}

onMounted(() => {
  window.addEventListener("keydown", keyHandler);
  window.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      started.value = false;
    }
  });
});
onUnmounted(() => {
  window.removeEventListener("keydown", keyHandler);
  window.removeEventListener("contextmenu", (event) => event.preventDefault());
  stopCyrano();
});
</script>

<template>
  <Init
    class="init"
    @started="
      (start) => {
        started = start;
        navStore.menu = start;
      }
    "
    v-if="!started"
  />
  <Scoreboard :cyrano="!!cyrano" />
  <div v-if="navStore.menu">
    <div class="menu">
      <nav>
        <a
          :class="{ selected: navStore.page === 'bout' }"
          @click="navStore.page = 'bout'"
          >Bout</a
        >
        <a
          v-if="cyrano?.nak"
          :class="{ selected: navStore.page === 'nak' }"
          @click="navStore.page = 'nak'"
          >Tournament</a
        >
        <a
          v-if="cyrano"
          :class="{ selected: navStore.page === 'tournament' }"
          @click="navStore.page = 'tournament'"
          >Tournament</a
        >
        <a
          :class="{ selected: navStore.page === 'cyrano' }"
          @click="navStore.page = 'cyrano'"
          >Cyrano</a
        >
        <a
          :class="{ selected: navStore.page === 'display' }"
          @click="navStore.page = 'display'"
          >Display</a
        >
        <a
          :class="{ selected: navStore.page === 'controls' }"
          @click="navStore.page = 'controls'"
          >Controls</a
        >
      </nav>
      <div
        v-if="navStore.page === 'bout'"
        id="bout"
        class="body"
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
                <input
                  v-model.number="matchStore.match[0].fencer.name.firstName"
                  placeholder="first name"
                />
                <input
                  v-model.number="matchStore.match[0].fencer.name.lastName"
                  placeholder="surname"
                />
              </div>
            </li>
            <li>
              <div>Left fencer club</div>
              <input v-model="matchStore.match[0].fencer.club" />
            </li>
            <li>
              <div>Right fencer name</div>
              <div>
                <input
                  v-model.number="matchStore.match[1].fencer.name.firstName"
                  placeholder="first name"
                />
                <input
                  v-model.number="matchStore.match[1].fencer.name.lastName"
                  placeholder="surname"
                />
              </div>
            </li>
            <li>
              <div>Right fencer club</div>
              <input v-model="matchStore.match[1].fencer.club" />
            </li>
            <li>
              <div>Max time(in seconds), requires restart</div>
              <input v-model.number="settingsStore.settings.maxTime" />
            </li>
            <li>
              <div>Current time(in seconds)</div>
              <input v-model.number="matchStore.status.stopwatch" />
            </li>
            <li>
              <div>Max score</div>
              <input v-model.number="settingsStore.settings.maxScore" />
            </li>
            <li>
              <div>Rounds</div>
              <input v-model.number="settingsStore.settings.rounds" />
            </li>
            <li>
              <div>Allow ties</div>
              <input
                v-model="settingsStore.settings.allowTies"
                type="checkbox"
              />
            </li>
            <li>
              <div>Allow point overflow</div>
              <input
                v-model="settingsStore.settings.allowOver"
                type="checkbox"
              />
            </li>
            <li>
              <div>Doubles add points</div>
              <input v-model.number="settingsStore.settings.doublesAddPoints" />
            </li>
            <li>
              <div>Maximum doubles</div>
              <input v-model.number="settingsStore.settings.maxDoubles" />
            </li>
          </menu>
        </div>
        <div class="button">
          <button @click="reset">Reset Bout</button>
        </div>
      </div>
      <div
        v-if="navStore.page === 'nak'"
        class="body"
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
            sending: <code>{{ matchStore.cyranoMatch.toString() }}</code>
          </div>
        </div>
        <div class="scrollable">
          <menu>
            <li>
              <div>piste</div>
              <input v-model="settingsStore.settings.piste" />
            </li>
            <li>
              <div>compe</div>
              <input v-model="settingsStore.settings.compe" />
            </li>
            <li>
              <div>phase</div>
              <input v-model.number="settingsStore.settings.phase" />
            </li>
            <li v-for="(_item, index) in matchStore.status">
              <div>{{ index }}</div>
              <input v-model="matchStore.status[index]" />
            </li>
          </menu>
          <div class="table">
            <menu>
              <li><h4>Left Fencer</h4></li>
              <li>
                <div>id</div>
                <input v-model="matchStore.match[0].fencer.id" />
              </li>
              <li>
                <div>name</div>
                <div>
                  <input
                    v-model.number="matchStore.match[0].fencer.name.firstName"
                    placeholder="first name"
                  />
                  <input
                    v-model.number="matchStore.match[0].fencer.name.lastName"
                    placeholder="surname"
                  />
                </div>
              </li>
              <li>
                <div>country</div>
                <input v-model="matchStore.match[0].fencer.country" />
              </li>
              <li v-for="(_item, index) in omit(matchStore.match[0], 'fencer')">
                <div>{{ index }}</div>
                <input v-model="matchStore.match[0][index]" />
              </li>
            </menu>
            <menu>
              <li><h4>Right Fencer</h4></li>
              <li>
                <div>id</div>
                <input v-model="matchStore.match[1].fencer.id" />
              </li>
              <li>
                <div>name</div>
                <div>
                  <input
                    v-model.number="matchStore.match[1].fencer.name.firstName"
                    placeholder="first name"
                  />
                  <input
                    v-model.number="matchStore.match[1].fencer.name.lastName"
                    placeholder="surname"
                  />
                </div>
              </li>
              <li>
                <div>country</div>
                <input v-model="matchStore.match[1].fencer.country" />
              </li>
              <li v-for="(_item, index) in omit(matchStore.match[1], 'fencer')">
                <div>{{ index }}</div>
                <input v-model="matchStore.match[1][index]" />
              </li>
            </menu>
          </div>
        </div>
        <div class="button">
          <button @click="cyrano?.unNak()">Resend Data</button>
        </div>
      </div>
      <div
        v-if="navStore.page === 'tournament'"
        id="tournament"
        class="body"
      >
        <div class="header">
          <h3>Tournament Bouts</h3>
          <h4 v-if="cyrano?.sendingData">Tournament Running</h4>
          <h4 v-else>Tournament not Running</h4>
        </div>
        <div class="scrollable">
          <Poule :matches="omit(matchStore.matches, '')" />
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
                v-for="(item, index) in omit(matchStore.matches, '')"
                :key="index"
                :class="index == matchStore.status.match ? 'running' : 'not'"
              >
                <th scope="row">{{ index }}.</th>
                <td>
                  {{ item[0].fencer.id }}
                  {{
                    item[0].fencer.name.toString(
                      settingsStore.config.lastNameFirst,
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
                      settingsStore.config.lastNameFirst,
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
      </div>
      <div
        v-if="navStore.page === 'cyrano'"
        id="cyrano"
        class="body"
      >
        <div class="header">
          <h4 v-if="cyrano?.sendingData">Tournament Running</h4>
          <h4 v-else>Tournament not Running</h4>
        </div>
        <div class="scrollable">
          <menu>
            <li>
              <div>Piste</div>
              <input v-model="settingsStore.settings.piste" />
            </li>
            <li>
              <div>Remote Address</div>
              <input
                v-model.number="settingsStore.cyranoOptions.remoteAddress"
              />
            </li>
            <li>
              <div>Port</div>
              <input v-model.number="settingsStore.cyranoOptions.port" />
            </li>
            <li>
              <div>Points per Period</div>
              <input
                v-model.number="settingsStore.cyranoOptions.pointsPerPeriod"
              />
            </li>
            <li>
              <div>Periods per Table Match</div>
              <input
                v-model.number="settingsStore.cyranoOptions.roundsPerTableMatch"
              />
            </li>
            <li>
              <div>
                Allow point overflow(if true, ensure max points + max overflow =
                max points in FT)
              </div>
              <input
                v-model="settingsStore.settings.allowOver"
                type="checkbox"
              />
            </li>
          </menu>
          <div>
            <code>{{ cyrano?.cyranoOut }}</code>
          </div>
        </div>
        <div class="button">
          <button
            v-if="!cyrano"
            @click="startCyrano"
          >
            Start Cyrano
          </button>
          <button
            v-if="cyrano"
            @click="stopCyrano"
          >
            Stop Cyrano
          </button>
        </div>
      </div>
      <div
        v-if="navStore.page === 'display'"
        id="display"
        class="body"
      >
        <div class="header">
          <h3>Display Settings</h3>
        </div>
        <div class="scrollable">
          <menu>
            <li>
              <div>Left fencer colour</div>
              <input
                v-model="settingsStore.config.leftColor"
                type="color"
              />
            </li>
            <li>
              <div>Right fencer colour</div>
              <input
                v-model="settingsStore.config.rightColor"
                type="color"
              />
            </li>
            <li>
              <div>Surnames in front</div>
              <input
                v-model="settingsStore.config.lastNameFirst"
                type="checkbox"
              />
            </li>
            <li>
              <div>Shorten the first part of the name</div>
              <input
                v-model="settingsStore.config.shortenFirst"
                type="checkbox"
              />
            </li>
            <li>
              <div>Shorten the second part of the name</div>
              <input
                v-model="settingsStore.config.shortenSecond"
                type="checkbox"
              />
            </li>
            <li>
              <div>Separator between the parts of the name</div>
              <input v-model="settingsStore.config.separator" />
            </li>
            <li>
              <div>Ending of the name</div>
              <input v-model="settingsStore.config.ending" />
            </li>
            <li>
              <div>Show doubles</div>
              <input
                v-model="settingsStore.config.showDoubles"
                type="checkbox"
              />
            </li>
            <li>
              <div>Always show subsecond</div>
              <input
                v-model="settingsStore.config.showSubSec"
                type="checkbox"
              />
            </li>
          </menu>
        </div>
      </div>
      <div
        v-if="navStore.page === 'controls'"
        id="keymap"
        class="body"
      >
        <div class="header">
          <h3>Keymap</h3>
        </div>
        <div class="scrollable">
          <menu>
            <li>
              <div>Keymap</div>
              <select v-model="keymap">
                <option
                  v-for="(_item, index) in defaultKeymaps"
                  :value="index"
                >
                  {{ index }}
                </option>
              </select>
            </li>
            <li
              v-for="(item, index) in settingsStore.config.keymap"
              :key="index"
            >
              <div>{{ index }}</div>
              <button
                :class="{ selected: change === index }"
                class="bind keys"
                @click="change = index"
              >
                {{ item }}
              </button>
            </li>
          </menu>
        </div>
      </div>
    </div>
    <div
      class="blurred background"
      @click="navStore.menu = false"
    ></div>
  </div>
  <div v-if="priorityPicker">
    <div
      v-if="priorityPicker"
      class="priority"
    >
      <h2>Choose Priority</h2>
      <div>
        <button
          class="half"
          @click="choosePriority('L')"
        >
          Left
        </button>
        <button
          class="half"
          @click="choosePriority('R')"
        >
          Right
        </button>
      </div>
      <div>
        <button @click="choosePriority('N')">Random</button>
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
      matchStore.status.state === 'E' ||
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
        matchStore.match[0].status === "V"
          ? "Left"
          : matchStore.match[1].status === "V"
            ? "Right"
            : "Tie"
      }}
    </h1>
    <h2>{{ matchStore.match[0].score }}-{{ matchStore.match[1].score }}</h2>
  </div>
  <div
    class="blurred"
    v-else-if="matchOver"
  >
    <h1>Match</h1>
  </div>
  <div
    class="blurred"
    v-if="matchStore.status.state === 'P'"
  >
    <h1>1-min break</h1>
    <h2 style="color: blue">
      {{ Math.floor(matchStore.stopwatch / 60) }}:{{
        (Math.floor(matchStore.stopwatch) % 60).toString().padStart(2, "0")
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
.menu {
  z-index: 999;
  float: none;
  position: fixed;
  display: block;
  width: 50rem;
  height: 50rem;
  top: 50%;
  left: 50%;
  margin-top: -25rem;
  margin-left: -25rem;
  align-self: flex-end;
  background-color: darkslategrey;
}
.body {
  height: 48rem;
  width: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  border-color: black;
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
.selected {
  background-color: darkslategray;
}
button:hover {
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
