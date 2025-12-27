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
  match = useMatchStore();
  settings = useSettingsStore();

  interval: number = 0;

  startTimer(set: "F" | "P") {
    this.match.status.state = set;
    if (set === "P") this.match.status.stopwatch = this.settings.settings.rest;
    this.interval = setInterval(() => {
      if (typeof this.match.status.stopwatch === "undefined") {
        throw TypeError("time not set");
      }
      this.match.status.stopwatch =
        Math.round(
          (this.match.status.stopwatch - 0.01 + Number.EPSILON) * 100,
        ) / 100;
      if (this.match.status.stopwatch <= 0) {
        clearInterval(this.interval);
        if (
          set === "F" &&
          this.match.status.round !== this.settings.settings.rounds &&
          this.match.status.priority === "N"
        ) {
          this.startTimer("P");
        } else {
          this.match.status.state = "H";
          if (set === "P") {
            this.match.status.stopwatch = this.settings.settings.maxTime;
            this.match.period();
          } else {
            this.match.status.stopwatch = 0;
          }
        }
      } else if (
        this.settings.settings.passivity != 0 &&
        this.settings.settings.passivityStops &&
        this.match.passivity <= 0
      ) {
        this.stopTimer("H");
      }
    }, 10);
  }
  stopTimer(set: "H") {
    this.match.status.state = set;
    clearInterval(this.interval);
  }
  addTime(time: number) {
    if (typeof this.match.status.stopwatch === "undefined") {
      throw TypeError("time not set");
    }
    this.match.status.stopwatch += time;
    const maxTime =
      this.match.status.state === "P"
        ? this.settings.settings.rest
        : this.match.status.priority !== "N"
          ? this.settings.settings.priority
          : this.settings.settings.maxTime;
    if (this.match.status.stopwatch < 0) {
      this.match.status.stopwatch += maxTime;
    }
    this.match.status.stopwatch %= maxTime;
  }
}
