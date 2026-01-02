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

import { useSettingsStore } from "@/stores/settings.ts";
import { type Ref } from "vue";
import type { CorrectStatus } from "@/scripts/Types.ts";

export class Timer {
  settings = useSettingsStore();

  status: Ref<CorrectStatus>;
  passivity: Ref<number>;
  constructor(status: Ref<CorrectStatus>, passivity: Ref<number>) {
    this.status = status;
    this.passivity = passivity;
  }

  interval: number = 0;
  breakTime: number = 0;

  startTimer(set: "F" | "P", brk = false) {
    this.status.value.state = set;
    if (set === "P") {
      if (brk) {
        this.breakTime =
          this.status.value.stopwatch ?? this.settings.settings.maxTime;
        this.status.value.stopwatch = this.settings.settings.break;
      } else {
        this.breakTime = this.settings.settings.maxTime;
        this.status.value.stopwatch = this.settings.settings.rest;
      }
    }
    this.interval = setInterval(() => {
      if (typeof this.status.value.stopwatch === "undefined") {
        throw TypeError("time not set");
      }
      this.status.value.stopwatch =
        Math.round(
          (this.status.value.stopwatch - 0.01 + Number.EPSILON) * 100,
        ) / 100;
      if (this.status.value.stopwatch <= 0) {
        clearInterval(this.interval);
        if (
          set === "F" &&
          this.status.value.round !== this.settings.settings.rounds &&
          this.status.value.priority === "N"
        ) {
          this.startTimer("P");
        } else {
          this.status.value.state = "H";
          if (set === "P") {
            if (brk) this.status.value.stopwatch = this.breakTime;
            else {
              this.status.value.stopwatch = this.settings.settings.maxTime;
              if (this.status.value.poultab[0] !== "P") {
                this.status.value.round =
                  (this.status.value.round % this.settings.settings.rounds) + 1;
              }
            }
          } else {
            this.status.value.stopwatch = 0;
          }
        }
      } else if (
        this.settings.settings.passivity != 0 &&
        this.settings.settings.passivityStops &&
        this.passivity.value <= 0
      ) {
        this.stopTimer("H");
      }
    }, 10);
  }
  stopTimer(set: "H") {
    this.status.value.state = set;
    clearInterval(this.interval);
  }
  addTime(time: number) {
    if (typeof this.status.value.stopwatch === "undefined") {
      throw TypeError("time not set");
    }
    this.status.value.stopwatch += time;
    const maxTime =
      this.status.value.state === "P"
        ? this.settings.settings.rest
        : this.status.value.priority !== "N"
          ? this.settings.settings.priority
          : this.settings.settings.maxTime;
    if (this.status.value.stopwatch < 0) {
      this.status.value.stopwatch += maxTime;
    }
    this.status.value.stopwatch %= maxTime;
  }
}
