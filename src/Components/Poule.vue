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
import { type CorrectFencerStatus, Fencer } from "../scripts/Types.ts";
import { computed } from "vue";

const props = defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
}>();
const fencerMatchList = computed<{
  mats: Record<string, number[]>;
  fencers: Record<string, Fencer>;
  inds: Record<
    string,
    {
      V: number;
      HS: number;
      HR: number;
    }
  >;
}>(() => {
  let mats: Record<string, number[]> = {};
  let fencers: Record<string, Fencer> = {};
  let inds: Record<
    string,
    {
      V: number;
      HS: number;
      HR: number;
    }
  > = {};
  for (const matchId in props.matches) {
    let match = props.matches[matchId];
    if (typeof match === "undefined") {
      throw new TypeError();
    }
    if (match[0].fencer.id in mats) {
      mats[match[0].fencer.id]?.push(Number(matchId));
      const indsMat = inds[match[0].fencer.id] ?? { V: 0, HS: 0, HR: 0 };
      indsMat.V += match[0].status === "V" ? 1 : 0;
      indsMat.HS += match[0].score;
      indsMat.HR += match[1].score;
    } else {
      mats[match[0].fencer.id] = [Number(matchId)];
      fencers[match[0].fencer.id] = match[0].fencer;
      inds[match[0].fencer.id] = {
        V: match[0].status === "V" ? 1 : 0,
        HS: match[0].score,
        HR: match[1].score,
      };
    }
    if (match[1].fencer.id in mats) {
      mats[match[1].fencer.id]?.push(Number(matchId));
      const indsMat = inds[match[1].fencer.id] ?? { V: 0, HS: 0, HR: 0 };
      indsMat.V += match[1].status === "V" ? 1 : 0;
      indsMat.HS += match[1].score;
      indsMat.HR += match[0].score;
    } else {
      mats[match[1].fencer.id] = [Number(matchId)];
      fencers[match[1].fencer.id] = match[1].fencer;
      inds[match[1].fencer.id] = {
        V: match[1].status === "V" ? 1 : 0,
        HS: match[1].score,
        HR: match[0].score,
      };
    }
  }
  return { mats, fencers, inds };
});
const place = computed<Record<string, number>>(() => {
  let fencerScores = [];
  for (const fencerId in fencerMatchList.value.inds) {
    const inds = fencerMatchList.value.inds[fencerId] ?? { V: 0, HS: 0, HR: 0 };
    fencerScores.push({
      id: fencerId,
      score: inds.V * 1000 + inds.HS * 100 - inds.HR * 10 + (inds.HS - inds.HR),
    });
  }
  fencerScores.sort((a, b) => b.score - a.score);
  let rec: Record<string, number> = {};
  let i = 0;
  let score = 0;
  for (const fencerId of fencerScores) {
    if (score !== fencerId.score) {
      i++;
      score = fencerId.score;
    }
    rec[fencerId.id] = i;
  }
  return rec;
});

function getMatch<T>(a: T[], b: T[]) {
  const set1 = new Set(a);
  const set2 = new Set(b);
  return [...set1.intersection(set2)];
}

function getScore(members: number[], id: string) {
  if (members.length > 1) return "";
  return gs(members[0] ?? 0, id);
}

function gs(matchId: number, id: string) {
  const match = props.matches[matchId];
  if (typeof match === "undefined") {
    throw new TypeError();
  }
  const fencer1 = match[0];
  if (fencer1.fencer.id === id) {
    if (fencer1.status === "U") {
      if (fencer1.score === 0) return "";
      else return fencer1.score.toString();
    } else return fencer1.status + fencer1.score.toString();
  }
  const fencer2 = match[1];
  if (fencer2.fencer.id === id) {
    if (fencer2.status === "U") {
      if (fencer2.score === 0) return "";
      else return fencer2.score.toString();
    } else return fencer2.status + fencer2.score.toString();
  }
}
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th
            v-for="index1 in Object.keys(fencerMatchList.mats).sort((a, b) =>
              a > b ? 1 : -1,
            )"
            :key="index1"
            scope="col"
          >
            {{ index1 }}
          </th>
          <th scope="col">V</th>
          <th scope="col">HS</th>
          <th scope="col">HR</th>
          <th scope="col">Ind</th>
          <th scope="col">Pl</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="index in Object.keys(fencerMatchList.mats).sort((a, b) =>
            a > b ? 1 : -1,
          )"
        >
          <th scope="row">{{ index }}</th>
          <th scope="row">
            {{ fencerMatchList.fencers[index]?.name.toString() }}
          </th>
          <td
            v-for="index1 in Object.keys(fencerMatchList.mats).sort((a, b) =>
              a > b ? 1 : -1,
            )"
            :id="index + index1"
            :key="index1"
          >
            {{
              getScore(
                getMatch(
                  fencerMatchList.mats[index] ?? [0],
                  fencerMatchList.mats[index1] ?? [0],
                ),
                index,
              )
            }}
          </td>
          <td>{{ fencerMatchList.inds[index]?.V }}</td>
          <td>{{ fencerMatchList.inds[index]?.HS }}</td>
          <td>{{ fencerMatchList.inds[index]?.HR }}</td>
          <td>
            {{
              (fencerMatchList.inds[index]?.HS ?? 0) -
              (fencerMatchList.inds[index]?.HR ?? 0)
            }}
          </td>
          <td>{{ place[index] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
table {
  border-collapse: collapse;
  width: 100%;
  padding: 1rem;
}
th,
td {
  padding: 0;
}
tbody th {
  text-align: left;
}
</style>
