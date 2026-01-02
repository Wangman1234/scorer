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
import { last } from "@volar/typescript/lib/typescript/core";
import { toTime } from "@/scripts/Functions.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import type { CorrectFencerStatus, CorrectStatus } from "@/scripts/Types.ts";

const settings = useSettingsStore();

defineProps<{
  matchData: Array<{
    stopwatch: string;
    leftFencerStatus: CorrectFencerStatus;
    rightFencerStatus: CorrectFencerStatus;
    doubles: number;
  }>;
  leftFencer: CorrectFencerStatus;
  rightFencer: CorrectFencerStatus;
  status: CorrectStatus;
  Lcolor: string;
  Rcolor: string;
}>();
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th
            class="ldiff"
            scope="col"
          ></th>
          <th
            v-for="(item, index) in matchData"
            :class="
              (item.stopwatch[0] !== matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((status.priority === 'N'
                  ? status.round.toString() + '-'
                  : 'P-') + toTime(status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            scope="col"
          >
            {{ item.stopwatch }}
          </th>
          <th
            v-if="
              (status.priority === 'N' ? status.round.toString() + '-' : 'P-') +
                toTime(status.stopwatch) !==
              last(matchData)?.stopwatch
            "
            class="ldiff"
            scope="col"
          >
            {{
              (status.priority === "N" ? status.round.toString() + "-" : "P-") +
              toTime(status.stopwatch)
            }}
          </th>
          <td></td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th
            class="ldiff"
            scope="row"
          >
            {{
              leftFencer.fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
          </th>
          <td
            v-for="(item, index) in matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((status.priority === 'N'
                  ? status.round.toString() + '-'
                  : 'P-') + toTime(status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            :style="{
              backgroundColor:
                Number(item.leftFencerStatus.rcard) -
                (matchData[index - 1]?.leftFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(item.leftFencerStatus.ycard) -
                      Number(
                        matchData[index - 1]?.leftFencerStatus.ycard ?? false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
          >
            {{
              item.leftFencerStatus.score -
                (matchData[index - 1]?.leftFencerStatus.score ?? 0) ===
              0
                ? ""
                : item.leftFencerStatus.score -
                  (matchData[index - 1]?.leftFencerStatus.score ?? 0)
            }}
          </td>
          <td
            v-if="
              (status.priority === 'N' ? status.round.toString() + '-' : 'P-') +
                toTime(status.stopwatch) !==
              last(matchData)?.stopwatch
            "
            :style="{
              backgroundColor:
                Number(leftFencer.rcard) -
                (last(matchData)?.leftFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(leftFencer.ycard) -
                      Number(last(matchData)?.leftFencerStatus.ycard ?? false)
                    ? 'yellow'
                    : 'transparent',
            }"
            class="ldiff"
          >
            {{
              leftFencer.score -
                (last(matchData)?.leftFencerStatus.score ?? 0) ===
              0
                ? ""
                : leftFencer.score -
                  (last(matchData)?.leftFencerStatus.score ?? 0)
            }}
          </td>
          <td :style="{ backgroundColor: Lcolor, color: 'black' }">
            {{ leftFencer.score
            }}{{ leftFencer.status === "U" ? "" : leftFencer.status }}
          </td>
        </tr>
        <tr>
          <th
            class="ldiff"
            scope="row"
          >
            {{
              rightFencer.fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
          </th>
          <td
            v-for="(item, index) in matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((status.priority === 'N'
                  ? status.round.toString() + '-'
                  : 'P-') + toTime(status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            :style="{
              backgroundColor:
                Number(item.rightFencerStatus.rcard) -
                (matchData[index - 1]?.rightFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(item.rightFencerStatus.ycard) -
                      Number(
                        matchData[index - 1]?.rightFencerStatus.ycard ?? false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
          >
            {{
              item.rightFencerStatus.score -
                (matchData[index - 1]?.rightFencerStatus.score ?? 0) ===
              0
                ? ""
                : item.rightFencerStatus.score -
                  (matchData[index - 1]?.rightFencerStatus.score ?? 0)
            }}
          </td>
          <td
            v-if="
              (status.priority === 'N' ? status.round.toString() + '-' : 'P-') +
                toTime(status.stopwatch) !==
              last(matchData)?.stopwatch
            "
            :style="{
              backgroundColor:
                Number(rightFencer.rcard) -
                (last(matchData)?.rightFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(rightFencer.ycard) -
                      Number(last(matchData)?.rightFencerStatus.ycard ?? false)
                    ? 'yellow'
                    : 'transparent',
            }"
            class="ldiff"
          >
            {{
              rightFencer.score -
                (last(matchData)?.rightFencerStatus.score ?? 0) ===
              0
                ? ""
                : rightFencer.score -
                  (last(matchData)?.rightFencerStatus.score ?? 0)
            }}
          </td>
          <td :style="{ backgroundColor: Rcolor, color: 'black' }">
            {{ rightFencer.score
            }}{{ rightFencer.status === "U" ? "" : rightFencer.status }}
          </td>
        </tr>
        <tr>
          <th
            class="ldiff"
            scope="row"
          >
            Double
          </th>
          <td
            v-for="(item, index) in matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((status.priority === 'N'
                  ? status.round.toString() + '-'
                  : 'P-') + toTime(status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
          >
            {{ item.doubles - (matchData[index - 1]?.doubles ?? 0) ? "D" : "" }}
          </td>
          <td
            v-if="
              (status.priority === 'N' ? status.round.toString() + '-' : 'P-') +
                toTime(status.stopwatch) !==
              last(matchData)?.stopwatch
            "
            class="ldiff"
          >
            {{ status.doubles - (last(matchData)?.doubles ?? 0) ? "D" : "" }}
          </td>
          <td>
            {{ status.doubles }}
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th
            class="ldiff"
            scope="col"
          >
            Exchange
          </th>
          <th
            v-for="(item, index) in matchData"
            :class="
              (item.stopwatch[0] !== matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((status.priority === 'N'
                  ? status.round.toString() + '-'
                  : 'P-') + toTime(status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            scope="col"
          >
            {{ index }}
          </th>
          <th
            v-if="
              (status.priority === 'N' ? status.round.toString() + '-' : 'P-') +
                toTime(status.stopwatch) !==
              last(matchData)?.stopwatch
            "
            class="ldiff"
            scope="col"
          >
            Current
          </th>
          <th scope="col">Total</th>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
div {
  width: 100%;
  overflow-x: auto;
}
table {
  overflow-x: auto;
  white-space: nowrap;
  border-collapse: collapse;
}
td,
th {
  background-clip: border-box;
  padding: 0.25rem 1rem;
  border-left: 1px solid var(--p-surface-600);
  border-right: 1px solid var(--p-surface-600);
}
tr {
  height: 1.5rem;
  border-bottom: 1px solid var(--p-surface-600);
  border-top: 1px solid var(--p-surface-600);
}
.diff {
  display: none;
}
.ldiff {
  border-right: 2px solid var(--p-surface-400);
}
</style>
