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

import {
  type CorrectFencerStatus,
  Fencer,
  type FencerStatus,
} from "./Types.ts";

export function toSeconds(time?: string) {
  const time1 = time ?? "";
  if (time1 === "") {
    return "";
  }
  const split = time1.split(":");
  return Number(split[0]) * 60 + Number(split[1]);
}

export function toTime(seconds: number | "") {
  if (seconds === "") {
    return "";
  }
  const minutes = Math.floor(seconds / 60);
  const minsec = seconds - minutes * 60;
  let sec = minsec.toFixed(2);
  if (minsec < 10) {
    sec = "0" + minsec;
  }
  return minutes.toString() + ":" + sec;
}

export function cyrConvert<T, R>(convert: (pre: T) => R, pre?: T | ""): R | "" {
  const pre1 = pre ?? "";

  if (pre1 === "") {
    return "";
  }
  return convert(pre1);
}

export function fencerEqual(fencer1: FencerStatus, fencer2: FencerStatus) {
  return (
    fencer1.fencer.id === fencer2.fencer.id &&
    fencer1.score === fencer2.score &&
    fencer1.status === fencer2.status
  );
}

export function defaultFencerStatus(): CorrectFencerStatus {
  return {
    fencer: new Fencer(),
    score: 0,
    status: "U",
    ycard: false,
    rcard: 0,
    light: false,
    wlight: false,
    medical: 0,
    reserve: "",
  };
}
