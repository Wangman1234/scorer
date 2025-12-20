import type { FencerStatus } from "./Types.ts";

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
