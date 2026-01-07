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

<script lang="ts" setup>
import tinycolor from "tinycolor2";
import { omit } from "underscore";
import NextFencer from "./NextFencer.vue";
import { useSettingsStore } from "@/stores/settings.ts";
import { computed } from "vue";
import { Country } from "@/scripts/Country.ts";
import Blur from "@/Components/Blur.vue";
import type { Cyrano } from "@/scripts/Cyrano.ts";
import type { CorrectFencerStatus, CorrectStatus } from "@/scripts/Types.ts";

const settings = useSettingsStore();

const props = defineProps<{
  leftFencer: CorrectFencerStatus;
  rightFencer: CorrectFencerStatus;
  status: [CorrectStatus];
  stopwatch: number;
  passivity: number;
  matches: Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>;
  cyrano?: Cyrano;
  winner: boolean;
  matchOver: boolean;
  leftChange: boolean;
  rightChange: boolean;
}>();
defineEmits<{
  index: [func: string];
}>();

const short = computed(() => {
  return props.stopwatch < 10;
});
</script>

<template>
  <div class="container">
    <div id="fencer-display">
      <div class="display-box">
        <div
          :style="{
            backgroundColor: settings.config.leftColor,
            color: tinycolor
              .mostReadable(settings.config.leftColor, ['white', 'black'], {
                includeFallbackColors: true,
                level: 'AA',
                size: 'large',
              })
              .toHexString(),
          }"
          class="name fencer-1 clickable"
          @click.stop="$emit('index', 'PriorityLeft')"
        >
          <h1>
            {{
              leftFencer.fencer.name.toString(
                settings.config.lastNameFirst,
                settings.config.shortenFirst,
                settings.config.shortenSecond,
                settings.config.separator,
                settings.config.ending,
              )
            }}
          </h1>
          <h2>
            {{ leftFencer.fencer.club }}
            <span
              v-if="
                settings.config.showFlags &&
                leftFencer.fencer.country.countryCode
              "
              :class="`fi fi-${new Country(leftFencer.fencer.country.countryCode).alphaTwo()}`"
            />
          </h2>
        </div>
      </div>
      <div class="display-box">
        <div
          :style="{
            backgroundColor: settings.config.rightColor,
            color: tinycolor
              .mostReadable(settings.config.rightColor, ['white', 'black'], {
                includeFallbackColors: true,
                level: 'AA',
                size: 'large',
              })
              .toHexString(),
          }"
          class="name fencer-2 clickable"
          @click.stop="$emit('index', 'PriorityRight')"
        >
          <h1>
            {{
              rightFencer.fencer.name.toString(
                settings.config.lastNameFirst,
                settings.config.shortenFirst,
                settings.config.shortenSecond,
                settings.config.separator,
                settings.config.ending,
              )
            }}
          </h1>
          <h2>
            {{ rightFencer.fencer.club }}
            <span
              v-if="
                settings.config.showFlags &&
                rightFencer.fencer.country.countryCode
              "
              :class="`fi fi-${new Country(rightFencer.fencer.country.countryCode).alphaTwo()}`"
            />
          </h2>
        </div>
      </div>
    </div>
    <div id="scoring-display">
      <div class="side">
        <div></div>
        <div
          id="fencer1-score"
          :style="{
            color: leftChange ? 'transparent' : 'white',
            borderColor: status[0].priority === 'L' ? 'blue' : 'white',
          }"
          class="scoring fencer-1 clickable"
          @click.stop="$emit('index', 'LeftAdd1')"
        >
          {{ leftFencer.score }}
        </div>
        <div
          class="cards fencer-1 clickable"
          @click.stop="$emit('index', 'LeftCard')"
        >
          <div
            class="clickable"
            @click.stop="$emit('index', 'LeftRCard')"
          >
            <div
              v-if="leftFencer.rcard > 0"
              class="red"
            >
              {{ leftFencer.rcard }}
            </div>
          </div>
          <div>
            <div
              v-if="leftFencer.ycard"
              class="yellow"
            ></div>
          </div>
        </div>
      </div>
      <div id="center">
        <div id="nav">
          <div
            v-if="
              settings.settings.passivity != 0 &&
              passivity <= 20 &&
              passivity < stopwatch - 0.005
            "
            :style="{
              color: passivity <= 10 ? 'red' : 'yellow',
              borderColor: passivity <= 10 ? 'red' : 'yellow',
            }"
            style="font-size: 4rem; border-style: solid; border-width: 2px"
          >
            {{ passivity.toFixed(2) }}
          </div>
          <NextFencer
            v-else-if="
              (leftFencer.score >= (3 / 5) * settings.settings.maxScore ||
                rightFencer.score >= (3 / 5) * settings.settings.maxScore ||
                (status[0].doubles >= settings.settings.maxDoubles / 2 &&
                  settings.settings.maxDoubles !== 0) ||
                (Number(status[0].stopwatch) <= settings.settings.maxTime / 3 &&
                  status[0].round == settings.settings.rounds)) &&
              cyrano &&
              Object.keys(omit(matches, '')).length > 1
            "
            :match="status[0].match === '' ? 0 : status[0].match"
            :matches="omit(matches, '')"
          />
        </div>
        <div
          id="timer"
          :class="status[0].state"
          class="clickable"
          @click.stop="$emit('index', 'Timer')"
        >
          <div
            v-if="settings.config.showSubSec"
            id="sub"
          >
            <span>
              {{ Math.floor(stopwatch / 60) }}:{{
                (stopwatch - 60 * Math.floor(stopwatch / 60))
                  .toFixed(2)
                  .padStart(5, "0")
              }}
            </span>
          </div>
          <div
            v-else-if="short"
            id="short"
          >
            <span>{{ stopwatch.toFixed(2) }}</span>
          </div>
          <div
            v-else
            id="long"
          >
            <span>
              {{ Math.floor(stopwatch / 60) }}:{{
                (Math.floor(stopwatch) % 60).toString().padStart(2, "0")
              }}
            </span>
          </div>
        </div>
        <div>
          <div
            v-if="settings.config.showDoubles"
            id="doubles"
            class="clickable"
            @click.stop="$emit('index', 'Double')"
          >
            {{ status[0].doubles
            }}{{
              settings.settings.maxDoubles > 0
                ? "/" + settings.settings.maxDoubles.toString()
                : ""
            }}
            Doubles
          </div>
        </div>
        <div
          id="rounds"
          class="clickable"
          @click.stop="$emit('index', 'Period')"
        >
          <span>{{ status[0].poultab[0] === "P" ? "Match " : "Period " }}</span>
          <span>
            {{ status[0].round }}/{{
              status[0].poultab[0] === "P"
                ? Object.keys(omit(matches, "")).length
                : settings.settings.rounds
            }}
          </span>
        </div>
      </div>
      <div class="side">
        <div></div>
        <div
          id="fencer2-score"
          :style="{
            color: rightChange ? 'transparent' : 'white',
            borderColor: status[0].priority === 'R' ? 'blue' : 'white',
          }"
          class="scoring fencer-2 clickable"
          @click.stop="$emit('index', 'RightAdd1')"
        >
          {{ rightFencer.score }}
        </div>
        <div
          class="cards fencer-2 clickable"
          @click.stop="$emit('index', 'RightCard')"
        >
          <div
            class="clickable"
            @click.stop="$emit('index', 'RightRCard')"
          >
            <div
              v-if="rightFencer.rcard > 0"
              class="red"
            >
              {{ rightFencer.rcard }}
            </div>
          </div>
          <div>
            <div
              v-if="rightFencer.ycard"
              class="yellow"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Blur
    v-if="
      status[0].state === 'E' ||
      ((cyrano?.cyranoState === 'Waiting' ||
        cyrano?.cyranoState === 'No Bouts') &&
        cyrano)
    "
  >
    {{ cyrano?.cyranoState }}
  </Blur>
  <Blur
    v-else-if="winner"
    class="clickable"
    @click.stop="$emit('index', 'Timer')"
  >
    <template #default>
      Match
      {{
        leftFencer.status[0] === "V"
          ? "Left"
          : rightFencer.status[0] === "V"
            ? "Right"
            : "Tie"
      }}
    </template>
    <template #sub>{{ leftFencer.score }}-{{ rightFencer.score }}</template>
  </Blur>
  <Blur
    v-else-if="matchOver"
    class="clickable"
    @click.stop="$emit('index', 'Timer')"
  >
    {{ stopwatch <= 0 ? "Time" : "Match" }}
  </Blur>
  <Blur
    v-else-if="
      settings.settings.passivity != 0 &&
      settings.settings.passivityStops &&
      passivity <= 0
    "
    class="clickable"
    @click.stop="$emit('index', 'Timer')"
  >
    Passivity
  </Blur>
  <Blur v-if="status[0].state === 'P'">
    <template #default>1-min break</template>
    <template #sub
      ><span style="color: blue">
        {{ Math.floor((stopwatch ?? 0) / 60) }}:{{
          (Math.floor(stopwatch ?? 0) % 60).toString().padStart(2, "0")
        }}
      </span>
    </template>
  </Blur>
</template>

<style scoped>
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
  text-align: center;
  align-content: center;
}
.clickable:hover {
  cursor: pointer;
}
#fencer-display {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: 100%;
}
.display-box {
  width: 100%;
  padding: 1%;
}
.display-box div {
  width: 100%;
  height: 100%;
  border: solid 5px gray;
  border-radius: 2rem;
}
#fencer-display h1 {
  font-size: 5rem;
}
#fencer-display h2 {
  font-size: 3rem;
}
#scoring-display {
  display: grid;
  grid-template-columns: 30% 40% 30%;
  grid-template-rows: 100%;
  height: 100%;
}
.side {
  display: grid;
  grid-template-rows: 20% 60% 20%;
  width: 100%;
}
.cards {
  height: 2rem;
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 2% 5%;
}
.cards.fencer-1 {
  flex-direction: row;
}
.cards.fencer-2 {
  flex-direction: row-reverse;
}
.cards div {
  padding: 0 1%;
  height: 100%;
  aspect-ratio: 10 / 16;
  box-sizing: content-box;
  border-radius: 0.5rem;
}
.red {
  background-color: red;
  color: black;
  font-size: 4rem;
}
.yellow {
  background-color: yellow;
}
div.scoring {
  background-clip: border-box;
  background-color: #505050;
  align-self: center;
  width: 100%;
  height: min(100%, 25rem);
  border: solid 4vh;
  border-radius: 4vh;
  font-size: 20vh;
  vertical-align: middle;
}
#center {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 20% 40% 20% 20%;
  height: 100%;
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
  font-size: 5rem;
}
</style>
