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

const match = useMatchStore();
const settings = useSettingsStore();

defineProps<{
  cyrano: boolean;
}>();

const short = computed(() => {
  return match.stopwatch < 10;
});
// const button = computed(() => {
//   let name = "Timer"
//   if (matchOver.value) {
//     name = "Next"
//   }
//   return name
// })
</script>

<template>
  <div class="container">
    <div id="fencer-display">
      <div
        :style="{
          backgroundColor: settings.config.leftColor,
          color: Color(settings.config.leftColor).isLight() ? 'black' : 'white',
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
        <h2>{{ match.match[0].fencer.club }}</h2>
      </div>
      <div
        :style="{
          backgroundColor: settings.config.rightColor,
          color: Color(settings.config.rightColor).isLight()
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
        <h2>{{ match.match[1].fencer.club }}</h2>
      </div>
    </div>
    <div id="scoring-display">
      <div>
        <div
          id="fencer1-score"
          :style="{
            borderColor: match.Lcolor,
            backgroundColor:
              match.status.priority === 'L'
                ? settings.config.leftColor
                : 'gray',
          }"
          class="scoring fencer-1"
        >
          {{ match.match[0].score }}
        </div>
      </div>
      <div id="center">
        <div id="nav">
          <!--          <button :class="{ next:matchOver }" @click="click">{{button}}</button>-->
          <NextFencer
            v-if="
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
      <div :style="{}">
        <div
          id="fencer2-score"
          :style="{
            borderColor: match.Rcolor,
            backgroundColor:
              match.status.priority === 'R'
                ? settings.config.rightColor
                : 'gray',
          }"
          class="scoring fencer-2"
        >
          {{ match.match[1].score }}
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
#fencer-display h1 {
  font-size: 5rem;
}
#fencer-display h2 {
  font-size: 3rem;
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
</style>
