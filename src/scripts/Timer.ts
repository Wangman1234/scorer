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
import { type MaybeRefOrGetter, toValue } from "vue";
import type { CorrectStatus } from "@/scripts/Types.ts";

export class Timer {
  settings = useSettingsStore();

  status: MaybeRefOrGetter<[CorrectStatus]>;
  passivity: MaybeRefOrGetter<number>;
  sound: MaybeRefOrGetter<Howl | undefined>;
  constructor(
    status: MaybeRefOrGetter<[CorrectStatus]>,
    passivity: MaybeRefOrGetter<number>,
    sound: MaybeRefOrGetter<Howl | undefined>,
  ) {
    this.status = status;
    this.passivity = passivity;
    this.sound = sound;
  }

  interval: NodeJS.Timeout | number = 0;
  breakTime: number = 0;

  startTimer(set: "F" | "P", brk = false) {
    toValue(this.status)[0].state = set;
    if (set === "P") {
      if (brk) {
        this.breakTime =
          toValue(this.status)[0].stopwatch ?? this.settings.settings.maxTime;
        toValue(this.status)[0].stopwatch = this.settings.settings.break;
      } else {
        this.breakTime = this.settings.settings.maxTime;
        toValue(this.status)[0].stopwatch = this.settings.settings.rest;
      }
    }
    this.interval = setInterval(() => {
      if (typeof toValue(this.status)[0].stopwatch === "undefined") {
        throw TypeError("time not set");
      }
      toValue(this.status)[0].stopwatch =
        Math.round(
          ((toValue(this.status)[0].stopwatch ?? 0) - 0.01 + Number.EPSILON) *
            100,
        ) / 100;
      if ((toValue(this.status)[0].stopwatch ?? 0) <= 0) {
        toValue(this.sound)?.play();
        clearInterval(this.interval);
        if (
          set === "F" &&
          toValue(this.status)[0].round !== this.settings.settings.rounds &&
          toValue(this.status)[0].priority === "N"
        ) {
          this.startTimer("P");
        } else {
          toValue(this.status)[0].state = "H";
          if (set === "P") {
            if (brk) toValue(this.status)[0].stopwatch = this.breakTime;
            else {
              toValue(this.status)[0].stopwatch =
                this.settings.settings.maxTime;
              if (toValue(this.status)[0].poultab[0] !== "P") {
                toValue(this.status)[0].round =
                  (toValue(this.status)[0].round %
                    this.settings.settings.rounds) +
                  1;
              }
            }
          } else {
            toValue(this.status)[0].stopwatch = 0;
          }
        }
      } else if (
        this.settings.settings.passivity != 0 &&
        this.settings.settings.passivityStops &&
        toValue(this.passivity) <= 0
      ) {
        this.stopTimer("H");
      }
    }, 10);
  }
  stopTimer(set: "H") {
    toValue(this.status)[0].state = set;
    clearInterval(this.interval);
  }
  addTime(time: number) {
    if (typeof toValue(this.status)[0].stopwatch === "undefined") {
      throw TypeError("time not set");
    }
    toValue(this.status)[0].stopwatch =
      (toValue(this.status)[0].stopwatch ?? 0) + time;
    const maxTime =
      toValue(this.status)[0].state === "P"
        ? this.settings.settings.rest
        : toValue(this.status)[0].priority !== "N"
          ? this.settings.settings.priority
          : this.settings.settings.maxTime;
    toValue(this.status)[0].stopwatch =
      (toValue(this.status)[0].stopwatch ?? 0) % maxTime;
    if ((toValue(this.status)[0].stopwatch ?? 0) <= 0) {
      toValue(this.status)[0].stopwatch =
        (toValue(this.status)[0].stopwatch ?? 0) + maxTime;
    }
  }
}
