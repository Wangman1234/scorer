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
import { useSettingsStore } from "@/stores/settings.ts";
import { type MaybeRefOrGetter, toValue } from "vue";
import type { CorrectFencerStatus, CorrectStatus } from "@/scripts/Types.ts";
import { useNavStore } from "@/stores/nav.ts";
import { defaultFencerStatus } from "@/scripts/Functions.ts";

export class Outputter {
  settings = useSettingsStore();
  nav = useNavStore();

  matches: MaybeRefOrGetter<
    Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
  >;
  status: MaybeRefOrGetter<[CorrectStatus]>;
  match: MaybeRefOrGetter<[CorrectFencerStatus, CorrectFencerStatus]>;
  $reset: () => void;

  selfState = "No Bouts";

  constructor(
    matches: MaybeRefOrGetter<
      Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
    >,
    status: MaybeRefOrGetter<[CorrectStatus]>,
    match: MaybeRefOrGetter<[CorrectFencerStatus, CorrectFencerStatus]>,
    $reset: () => void,
  ) {
    this.matches = matches;
    this.match = match;
    this.status = status;
    this.$reset = $reset;

    if (this.settings.mockOptions.useSelf) {
      this.$reset();
      this.settings.settings.allowTies = false;
      this.selfState = "No Bouts";
      console.log(this.selfState);
    }
  }

  assignMatches(
    matches: MaybeRefOrGetter<
      Record<number, [CorrectFencerStatus, CorrectFencerStatus]>
    >,
    round: number,
    device: number = 0,
  ) {
    if (device === 0) {
      this.$reset();
      for (const i in toValue(matches)) {
        const status = toValue(matches)[i] ?? [
          defaultFencerStatus(),
          defaultFencerStatus(),
        ];
        toValue(this.matches)[i] = status;
      }
      this.selfState = "Bout";
      const status = toValue(this.status)[0];
      const keys = Object.keys(toValue(matches) ?? {})
        .map((value) => +value)
        .sort();
      status.match = keys[0] ?? "";
      status.round = status.match || 0;
      status.state = "H";
      status.poultab = "P" + round;
      status.type = "I";
      status.weapon = "F";
    }
  }
  reset() {
    this.noBout();
    this.$reset();
  }

  noBout() {
    this.selfState = "No Bouts";
  }

  stopOutputter() {
    if (this.settings.mockOptions.useSelf) {
      this.settings.settings.rounds = 1;
      this.settings.settings.maxScore = 5;
      toValue(this.matches)[""] = [
        defaultFencerStatus(),
        defaultFencerStatus(),
      ];
      toValue(this.status)[0].match = "";
    }
  }
}
