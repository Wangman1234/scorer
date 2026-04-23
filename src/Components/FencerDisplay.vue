<!--
  - Copyright 2026 Scorer
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
import { useSettingsStore } from "@/stores/settings.ts";
import type { CorrectFencerStatus } from "@/scripts/Types.ts";
import tinycolor from "tinycolor2";
import { Country } from "@/scripts/Country.ts";
import { computed } from "vue";

const settings = useSettingsStore();

const props = defineProps<{
  flip: Boolean;
  lFencer: CorrectFencerStatus;
  rFencer: CorrectFencerStatus;
}>();

const leftFencer = computed(() => (props.flip ? props.rFencer : props.lFencer));
const rightFencer = computed(() =>
  props.flip ? props.lFencer : props.rFencer,
);
const leftColor = computed(() =>
  props.flip ? settings.config.rightColor : settings.config.leftColor,
);
const rightColor = computed(() =>
  props.flip ? settings.config.leftColor : settings.config.rightColor,
);
</script>

<template>
  <div id="fencer-display">
    <div class="display-box">
      <div
        :style="{
          backgroundColor: leftColor,
          color: tinycolor
            .mostReadable(leftColor, ['white', 'black'], {
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
              settings.config.showFlags && leftFencer.fencer.country.countryCode
            "
            :class="`fi fi-${new Country(leftFencer.fencer.country.countryCode).alphaTwo()}`"
            :style="{ fontSize: '5rem' }"
          />
        </h2>
      </div>
    </div>
    <div class="display-box">
      <div
        :style="{
          backgroundColor: rightColor,
          color: tinycolor
            .mostReadable(rightColor, ['white', 'black'], {
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
            :style="{ fontSize: '5rem' }"
          />
        </h2>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.cards div {
  padding: 0 1%;
  height: 100%;
  aspect-ratio: 10 / 16;
  box-sizing: content-box;
  border-radius: 0.5rem;
}

#timer div {
  font-size: 12rem;
}
</style>
