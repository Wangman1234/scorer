/**
 * Copyright 2025 Scorer
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
import { useMatchStore } from "@/stores/match.ts";
import { useSettingsStore } from "@/stores/settings.ts";

export class Timer {
  matchStore = useMatchStore();
  settingsStore = useSettingsStore();

  interval: number = 0;

  startTimer(set: "F" | "P") {
    this.matchStore.status.state = set;
    this.interval = setInterval(() => {
      if (this.matchStore.status.stopwatch === "") {
        throw TypeError("time not set");
      }
      this.matchStore.status.stopwatch =
        Math.round(
          (this.matchStore.status.stopwatch - 0.01 + Number.EPSILON) * 100,
        ) / 100;
      if (this.matchStore.status.stopwatch <= 0) {
        clearInterval(this.interval);
        if (
          set === "F" &&
          this.matchStore.status.round !== this.settingsStore.settings.rounds
        ) {
          this.matchStore.status.state = "P";
          this.matchStore.status.stopwatch = 60;
          this.startTimer("P");
        } else {
          this.matchStore.status.state = "H";
          if (set === "P") {
            this.matchStore.status.stopwatch =
              this.settingsStore.settings.maxTime;
            this.matchStore.status.round += 1;
          } else {
            this.matchStore.status.stopwatch = 0;
          }
        }
      }
    }, 10);
  }
  stopTimer(set: "H") {
    this.matchStore.status.state = set;
    clearInterval(this.interval);
  }
  addTime(time: number) {
    if (this.matchStore.status.stopwatch === "") {
      throw TypeError("time not set");
    }
    this.matchStore.status.stopwatch += time;
    if (this.matchStore.status.stopwatch < 0) {
      this.matchStore.status.stopwatch += this.settingsStore.settings.maxTime;
    }
    this.matchStore.status.stopwatch %= 600;
  }
}
