/**
 * Copyright 2026 Scorer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  type CorrectFencerStatus,
  type FencerPlus,
  type RefFencerList,
} from "@/scripts/Types.ts";
import { ref, type Ref, toValue } from "vue";
import { defaultFencerStatus } from "@/scripts/Functions.ts";

export class Round {
  id: number;
  fencers: RefFencerList;
  matches: Ref<Record<number, [CorrectFencerStatus, CorrectFencerStatus]>>;
  statuses: Ref<{
    [fencerID: string]: [CorrectFencerStatus, CorrectFencerStatus];
  }>;
  initialSeed: FencerPlus[];
  bye?: FencerPlus;

  constructor(id: number, fencers: RefFencerList, previous: number) {
    this.id = id;
    this.fencers = fencers;
    this.fencers.value.rounds.push(this.id);
    this.initialSeed = this.fencers.value.sort(previous);
    const matches = this.fencers.value.pairings(this.id);
    this.matches = ref({});
    this.statuses = ref({});
    for (const i in matches) {
      const m = matches[i] ?? [null, null];
      const leftFencer = this.fencers.value.fencers[0].find(
        (v) => v.fencer.id === m[0],
      );
      const rightFencer = this.fencers.value.fencers[0].find(
        (v) => v.fencer.id === m[1],
      );
      if (typeof leftFencer === "undefined") {
        if (typeof rightFencer !== "undefined") {
          rightFencer.receivedBye = true;
          rightFencer.victory[this.id] = true;
          this.bye = rightFencer;
        }
        continue;
      }
      if (typeof rightFencer === "undefined") {
        if (typeof leftFencer !== "undefined") {
          leftFencer.receivedBye = true;
          leftFencer.victory[this.id] = true;
          this.bye = leftFencer;
        }
        continue;
      }
      leftFencer.fencedFencers.push(m[1] ?? "");
      rightFencer.fencedFencers.push(m[0] ?? "");
      this.matches.value[i] = [defaultFencerStatus(), defaultFencerStatus()];
      this.matches.value[i][0].fencer = leftFencer.fencer;
      this.matches.value[i][1].fencer = rightFencer.fencer;
      this.statuses.value[leftFencer.fencer.id] = this.matches.value[i];
      this.statuses.value[rightFencer.fencer.id] = [
        this.matches.value[i][1],
        this.matches.value[i][0],
      ];
    }
  }
  update = () => {
    for (const f of this.fencers.value.fencers[0]) {
      const status = this.statuses.value[f.fencer.id];
      if (typeof status === "undefined") {
        continue;
      }
      f.victory[this.id] = status[0].status === "V";
      f.pointsScored[this.id] = status[0].score || 0;
      f.pointsAgainst[this.id] = status[1].score || 0;
    }
  };
  finished = () => {
    for (const m of Object.values(toValue(this.matches))) {
      if (m[0].status !== "V" && m[1].status !== "V") {
        return false;
      }
    }
    return true;
  };
}
