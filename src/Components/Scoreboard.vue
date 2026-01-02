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
import Color from "color";
import { omit } from "underscore";
import NextFencer from "./NextFencer.vue";
import { useMatchStore } from "@/stores/match.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { computed } from "vue";
import { Country } from "@/scripts/Country.ts";

const match = useMatchStore();
const settings = useSettingsStore();

defineProps<{
  cyrano: boolean;
  leftChange: boolean;
  rightChange: boolean;
}>();

const short = computed(() => {
  return match.stopwatch < 10;
});
</script>

<template>
  <div class="container">
    <div id="fencer-display">
      <div class="display-box">
        <div
          :style="{
            backgroundColor: '#' + settings.config.leftColor,
            color: Color('#' + settings.config.leftColor).isLight()
              ? 'black'
              : 'white',
          }"
          class="name fencer-1"
        >
          <h1>
            {{
              match.match[0].fencer.name.toString(
                settings.config.lastNameFirst,
                settings.config.shortenFirst,
                settings.config.shortenSecond,
                settings.config.separator,
                settings.config.ending,
              )
            }}
          </h1>
          <h2>
            {{ match.match[0].fencer.club }}
            <span
              v-if="
                settings.config.showFlags &&
                match.match[0].fencer.country.countryCode
              "
              :class="`fi fi-${new Country(match.match[0].fencer.country.countryCode).alphaTwo()}`"
            />
          </h2>
        </div>
      </div>
      <div class="display-box">
        <div
          :style="{
            backgroundColor: '#' + settings.config.rightColor,
            color: Color('#' + settings.config.rightColor).isLight()
              ? 'black'
              : 'white',
          }"
          class="name fencer-2"
        >
          <h1>
            {{
              match.match[1].fencer.name.toString(
                settings.config.lastNameFirst,
                settings.config.shortenFirst,
                settings.config.shortenSecond,
                settings.config.separator,
                settings.config.ending,
              )
            }}
          </h1>
          <h2>
            {{ match.match[1].fencer.club }}
            <span
              v-if="
                settings.config.showFlags &&
                match.match[1].fencer.country.countryCode
              "
              :class="`fi fi-${new Country(match.match[1].fencer.country.countryCode).alphaTwo()}`"
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
            borderColor: match.status.priority === 'L' ? 'blue' : 'white',
          }"
          class="scoring fencer-1"
        >
          {{ match.match[0].score }}
        </div>
        <div class="cards fencer-1">
          <div>
            <div
              v-if="match.match[0].rcard > 0"
              class="red"
            >
              {{ match.match[0].rcard }}
            </div>
          </div>
          <div>
            <div
              v-if="match.match[0].ycard"
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
              match.passivity <= 20 &&
              match.passivity < match.stopwatch - 0.005
            "
            :style="{
              color: match.passivity <= 10 ? 'red' : 'yellow',
              borderColor: match.passivity <= 10 ? 'red' : 'yellow',
            }"
            style="font-size: 4rem; border-style: solid; border-width: 2px"
          >
            {{ match.passivity.toFixed(2) }}
          </div>
          <NextFencer
            v-else-if="
              (match.match[0].score >= (3 / 5) * settings.settings.maxScore ||
                match.match[1].score >= (3 / 5) * settings.settings.maxScore ||
                (match.status.doubles >= settings.settings.maxDoubles / 2 &&
                  settings.settings.maxDoubles !== 0) ||
                (Number(match.status.stopwatch) <=
                  settings.settings.maxTime / 3 &&
                  match.status.round == settings.settings.rounds)) &&
              cyrano &&
              Object.keys(omit(match.matches, '')).length > 1
            "
            :match="match.status.match === '' ? 0 : match.status.match"
            :matches="omit(match.matches, '')"
          />
        </div>
        <div
          id="timer"
          :class="match.status.state"
        >
          <div
            v-if="settings.config.showSubSec"
            id="sub"
          >
            <span>
              {{ Math.floor(match.stopwatch / 60) }}:{{
                (match.stopwatch - 60 * Math.floor(match.stopwatch / 60))
                  .toFixed(2)
                  .padStart(5, "0")
              }}
            </span>
          </div>
          <div
            v-else-if="short"
            id="short"
          >
            <span>{{ match.stopwatch.toFixed(2) }}</span>
          </div>
          <div
            v-else
            id="long"
          >
            <span>
              {{ Math.floor(match.stopwatch / 60) }}:{{
                (Math.floor(match.stopwatch) % 60).toString().padStart(2, "0")
              }}
            </span>
          </div>
        </div>
        <div>
          <div
            v-if="settings.config.showDoubles"
            id="doubles"
          >
            {{ match.status.doubles
            }}{{
              settings.settings.maxDoubles > 0
                ? "/" + settings.settings.maxDoubles.toString()
                : ""
            }}
            Doubles
          </div>
        </div>
        <div id="rounds">
          <span>{{
            match.status.poultab[0] === "P" ? "Match " : "Period "
          }}</span>
          <span>
            {{ match.status.round }}/{{
              match.status.poultab[0] === "P"
                ? Object.keys(omit(match.matches, "")).length
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
            borderColor: match.status.priority === 'R' ? 'blue' : 'white',
          }"
          class="scoring fencer-2"
        >
          {{ match.match[1].score }}
        </div>
        <div class="cards fencer-2">
          <div>
            <div
              v-if="match.match[1].rcard > 0"
              class="red"
            >
              {{ match.match[1].rcard }}
            </div>
          </div>
          <div>
            <div
              v-if="match.match[1].ycard"
              class="yellow"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
  background-color: gray;
  align-self: center;
  width: 100%;
  height: min(100%, 25rem);
  border: solid 40px;
  border-radius: 20px;
  font-size: 10rem;
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
