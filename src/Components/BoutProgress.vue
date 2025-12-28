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
import { useSettingsStore } from "@/stores/settings.ts";

const match = useMatchStore();
const settings = useSettingsStore();
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
            v-for="(item, index) in match.matchData"
            :class="
              (item.stopwatch[0] !== match.matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== match.matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((match.status.priority === 'N'
                  ? match.status.round.toString() + '-'
                  : 'P-') + toTime(match.status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            scope="col"
          >
            {{ item.stopwatch }}
          </th>
          <th
            v-if="
              (match.status.priority === 'N'
                ? match.status.round.toString() + '-'
                : 'P-') +
                toTime(match.status.stopwatch) !==
              last(match.matchData)?.stopwatch
            "
            class="ldiff"
            scope="col"
          >
            {{
              (match.status.priority === "N"
                ? match.status.round.toString() + "-"
                : "P-") + toTime(match.status.stopwatch)
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
              match.match[0].fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
          </th>
          <td
            v-for="(item, index) in match.matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== match.matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== match.matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((match.status.priority === 'N'
                  ? match.status.round.toString() + '-'
                  : 'P-') + toTime(match.status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            :style="{
              backgroundColor:
                Number(item.leftFencerStatus.rcard) -
                (match.matchData[index - 1]?.leftFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(item.leftFencerStatus.ycard) -
                      Number(
                        match.matchData[index - 1]?.leftFencerStatus.ycard ??
                          false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
          >
            {{
              item.leftFencerStatus.score -
                (match.matchData[index - 1]?.leftFencerStatus.score ?? 0) ===
              0
                ? ""
                : item.leftFencerStatus.score -
                  (match.matchData[index - 1]?.leftFencerStatus.score ?? 0)
            }}
          </td>
          <td
            v-if="
              (match.status.priority === 'N'
                ? match.status.round.toString() + '-'
                : 'P-') +
                toTime(match.status.stopwatch) !==
              last(match.matchData)?.stopwatch
            "
            :style="{
              backgroundColor:
                Number(match.match[0].rcard) -
                (last(match.matchData)?.leftFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(match.match[0].ycard) -
                      Number(
                        last(match.matchData)?.leftFencerStatus.ycard ?? false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
            class="ldiff"
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
          <th
            class="ldiff"
            scope="row"
          >
            {{
              match.match[1].fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
          </th>
          <td
            v-for="(item, index) in match.matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== match.matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== match.matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((match.status.priority === 'N'
                  ? match.status.round.toString() + '-'
                  : 'P-') + toTime(match.status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            :style="{
              backgroundColor:
                Number(item.rightFencerStatus.rcard) -
                (match.matchData[index - 1]?.rightFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(item.rightFencerStatus.ycard) -
                      Number(
                        match.matchData[index - 1]?.rightFencerStatus.ycard ??
                          false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
          >
            {{
              item.rightFencerStatus.score -
                (match.matchData[index - 1]?.rightFencerStatus.score ?? 0) ===
              0
                ? ""
                : item.rightFencerStatus.score -
                  (match.matchData[index - 1]?.rightFencerStatus.score ?? 0)
            }}
          </td>
          <td
            v-if="
              (match.status.priority === 'N'
                ? match.status.round.toString() + '-'
                : 'P-') +
                toTime(match.status.stopwatch) !==
              last(match.matchData)?.stopwatch
            "
            :style="{
              backgroundColor:
                Number(match.match[1].rcard) -
                (last(match.matchData)?.rightFencerStatus.rcard ?? 0)
                  ? 'red'
                  : Number(match.match[1].ycard) -
                      Number(
                        last(match.matchData)?.rightFencerStatus.ycard ?? false,
                      )
                    ? 'yellow'
                    : 'transparent',
            }"
            class="ldiff"
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
          <th
            class="ldiff"
            scope="row"
          >
            Double
          </th>
          <td
            v-for="(item, index) in match.matchData"
            :key="index"
            :class="
              (item.stopwatch[0] !== match.matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== match.matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((match.status.priority === 'N'
                  ? match.status.round.toString() + '-'
                  : 'P-') + toTime(match.status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
          >
            {{
              item.doubles - (match.matchData[index - 1]?.doubles ?? 0)
                ? "D"
                : ""
            }}
          </td>
          <td
            v-if="
              (match.status.priority === 'N'
                ? match.status.round.toString() + '-'
                : 'P-') +
                toTime(match.status.stopwatch) !==
              last(match.matchData)?.stopwatch
            "
            class="ldiff"
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
          <th
            class="ldiff"
            scope="col"
          >
            Exchange
          </th>
          <th
            v-for="(item, index) in match.matchData"
            :class="
              (item.stopwatch[0] !== match.matchData[index - 1]?.stopwatch[0]
                ? 'diff'
                : '') +
              ' ' +
              (item.stopwatch[0] !== match.matchData[index + 1]?.stopwatch[0] &&
              item.stopwatch[0] !==
                ((match.status.priority === 'N'
                  ? match.status.round.toString() + '-'
                  : 'P-') + toTime(match.status.stopwatch))[0]
                ? 'ldiff'
                : '')
            "
            scope="col"
          >
            {{ index }}
          </th>
          <th
            v-if="
              (match.status.priority === 'N'
                ? match.status.round.toString() + '-'
                : 'P-') +
                toTime(match.status.stopwatch) !==
              last(match.matchData)?.stopwatch
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
.block {
  height: 1.5rem;
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
