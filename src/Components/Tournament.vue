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
import Poule from "@/Components/Poule.vue";
import type { CorrectFencerStatus } from "@/scripts/Types.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import tinycolor from "tinycolor2";
import { Country } from "@/scripts/Country.ts";

defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
  match: number | "";
}>();

const settings = useSettingsStore();
</script>

<template>
  <Poule :matches="matches" />
  <div>
    <table>
      <thead>
        <tr>
          <th scope="col">Bout</th>
          <th
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
            scope="col"
          >
            Left fencer
          </th>
          <th colspan="5"></th>
          <th
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
            scope="col"
          >
            Right fencer
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in matches"
          :key="index"
          :class="index == match ? 'running' : 'not'"
        >
          <th scope="row">{{ index }}.</th>
          <td>
            {{ item[0].fencer.id }}
            -
            {{
              item[0].fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
            <span
              v-if="
                settings.config.showFlags && item[0].fencer.country.countryCode
              "
              :class="`fi fi-${new Country(item[0].fencer.country.countryCode).alphaTwo()}`"
            />
          </td>
          <td
            :style="{
              backgroundColor:
                item[0].status === 'V'
                  ? 'var(--p-green-800)'
                  : item[0].status === 'D'
                    ? 'var(--p-red-800)'
                    : 'transparent',
            }"
            class="score"
          >
            {{ item[0].status }}
          </td>
          <td class="score">
            {{ item[0].score }}
          </td>
          <td>vs.</td>
          <td class="score">
            {{ item[1].score }}
          </td>
          <td
            :style="{
              backgroundColor:
                item[1].status === 'V'
                  ? 'var(--p-green-800)'
                  : item[1].status === 'D'
                    ? 'var(--p-red-800)'
                    : 'transparent',
            }"
            class="score"
          >
            {{ item[1].status }}
          </td>
          <td>
            {{ item[1].fencer.id }}
            -
            {{
              item[1].fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
            <span
              v-if="
                settings.config.showFlags && item[1].fencer.country.countryCode
              "
              :class="`fi fi-${new Country(item[1].fencer.country.countryCode).alphaTwo()}`"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
div {
  width: 100%;
  overflow-x: auto;
  justify-items: center;
  margin-bottom: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0 0.5rem;
  text-align: center;
}
tr.running {
  border: 1px solid gold;
}
</style>
