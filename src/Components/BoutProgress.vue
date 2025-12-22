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
import { useMatchStore } from "@/stores/match.ts";
import { last } from "@volar/typescript/lib/typescript/core";
import { toTime } from "@/scripts/Functions.ts";

const match = useMatchStore();
</script>

<template>
  <table>
    <thead>
      <tr>
        <th scope="col"></th>
        <th
          v-for="item in match.matchData.slice(1)"
          scope="col"
        >
          {{ item.stopwatch }}
        </th>
        <th
          v-if="
            toTime(match.status.stopwatch) +
              (match.status.priority === 'N' ? '' : 'P') !==
            last(match.matchData)?.stopwatch
          "
          scope="col"
        >
          {{
            toTime(match.status.stopwatch) +
            (match.status.priority === "N" ? "" : "P")
          }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">
          {{ match.match[0].fencer.name.toString() }}
        </th>
        <td
          v-for="(item, index) in match.matchData.slice(1)"
          :key="index"
          :style="{
            backgroundColor:
              Number(item.leftFencerStatus.ycard) -
              Number(match.matchData[index]?.leftFencerStatus.ycard ?? false)
                ? 'yellow'
                : Number(item.leftFencerStatus.rcard) -
                    Number(
                      match.matchData[index]?.leftFencerStatus.rcard ?? false,
                    )
                  ? 'red'
                  : 'transparent',
          }"
        >
          {{
            item.leftFencerStatus.score -
              (match.matchData[index]?.leftFencerStatus.score ?? 0) ===
            0
              ? ""
              : item.leftFencerStatus.score -
                (match.matchData[index]?.leftFencerStatus.score ?? 0)
          }}
        </td>
        <td
          v-if="
            toTime(match.status.stopwatch) +
              (match.status.priority === 'N' ? '' : 'P') !==
            last(match.matchData)?.stopwatch
          "
          :style="{
            backgroundColor:
              Number(match.match[0].ycard) -
              Number(last(match.matchData)?.leftFencerStatus.ycard ?? false)
                ? 'yellow'
                : Number(match.match[0].rcard) -
                    Number(
                      last(match.matchData)?.leftFencerStatus.rcard ?? false,
                    )
                  ? 'red'
                  : 'transparent',
          }"
        >
          {{
            match.match[0].score -
              (last(match.matchData)?.leftFencerStatus.score ?? 0) ===
            0
              ? ""
              : match.match[0].score -
                (last(match.matchData)?.leftFencerStatus.score ?? 0)
          }}
        </td>
        <td :style="{ backgroundColor: match.Lcolor, color: 'black' }">
          {{ match.match[0].score
          }}{{ match.match[0].status === "U" ? "" : match.match[0].status }}
        </td>
      </tr>
      <tr>
        <th scope="row">
          {{ match.match[1].fencer.name }}
        </th>
        <td
          v-for="(item, index) in match.matchData.slice(1)"
          :key="index"
          :style="{
            backgroundColor:
              Number(item.rightFencerStatus.ycard) -
              Number(match.matchData[index]?.rightFencerStatus.ycard ?? false)
                ? 'yellow'
                : Number(item.rightFencerStatus.rcard) -
                    Number(
                      match.matchData[index]?.rightFencerStatus.rcard ?? false,
                    )
                  ? 'red'
                  : 'transparent',
          }"
        >
          {{
            item.rightFencerStatus.score -
              (match.matchData[index]?.rightFencerStatus.score ?? 0) ===
            0
              ? ""
              : item.rightFencerStatus.score -
                (match.matchData[index]?.rightFencerStatus.score ?? 0)
          }}
        </td>
        <td
          v-if="
            toTime(match.status.stopwatch) +
              (match.status.priority === 'N' ? '' : 'P') !==
            last(match.matchData)?.stopwatch
          "
          :style="{
            backgroundColor:
              Number(match.match[1].ycard) -
              Number(last(match.matchData)?.rightFencerStatus.ycard ?? false)
                ? 'yellow'
                : Number(match.match[1].rcard) -
                    Number(
                      last(match.matchData)?.rightFencerStatus.rcard ?? false,
                    )
                  ? 'red'
                  : 'transparent',
          }"
        >
          {{
            match.match[1].score -
              (last(match.matchData)?.rightFencerStatus.score ?? 0) ===
            0
              ? ""
              : match.match[1].score -
                (last(match.matchData)?.rightFencerStatus.score ?? 0)
          }}
        </td>
        <td :style="{ backgroundColor: match.Rcolor, color: 'black' }">
          {{ match.match[1].score
          }}{{ match.match[1].status === "U" ? "" : match.match[1].status }}
        </td>
      </tr>
      <tr>
        <th>Double</th>
        <td
          v-for="(item, index) in match.matchData.slice(1)"
          :key="index"
        >
          {{ item.doubles - (match.matchData[index]?.doubles ?? 0) ? "D" : "" }}
        </td>
        <td
          v-if="
            toTime(match.status.stopwatch) +
              (match.status.priority === 'N' ? '' : 'P') !==
            last(match.matchData)?.stopwatch
          "
        >
          {{
            match.status.doubles - (last(match.matchData)?.doubles ?? 0)
              ? "D"
              : ""
          }}
        </td>
        <td>
          {{ match.status.doubles }}
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <th scope="col">Exchange</th>
        <th
          v-for="(_item, index) in match.matchData.slice(1)"
          scope="col"
        >
          {{ index }}
        </th>
        <th scope="col">Current</th>
      </tr>
    </tfoot>
  </table>
</template>

<style scoped>
table {
  overflow-x: auto;
  white-space: nowrap;
  border-collapse: collapse;
}
</style>
