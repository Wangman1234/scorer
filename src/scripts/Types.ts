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

import { Country } from "./Country.ts";
import { ref, type Ref, toValue } from "vue";
import type { Player } from "tournament-pairings/interfaces";
import { Swiss } from "tournament-pairings";
import { points } from "@/scripts/Functions.ts";
import { isEmpty } from "underscore";

export class Name {
  lastName: string;
  firstName: string;
  constructor(lastName: string, firstName: string);
  constructor(name: string);
  constructor(nameLastName: string, firstName: string = "") {
    if (firstName === "") {
      if (nameLastName.includes(",")) {
        let names = nameLastName.split(",");
        this.lastName = names[0]?.trim() ?? "";
        this.firstName = names[1]?.trim() ?? "";
      } else if (nameLastName.includes(".")) {
        let names = nameLastName.split(".");
        this.firstName = names[0]?.trim() ?? "";
        this.lastName = names[1]?.trim() ?? "";
      } else {
        let names = nameLastName.split(" ");
        if (names[0] === names[0]?.toUpperCase()) {
          this.lastName = "";
          this.firstName = "";
          for (const namesKey in names) {
            if (names[namesKey] === names[namesKey]?.toUpperCase()) {
              this.lastName += " " + names[namesKey];
            } else {
              this.firstName += " " + names[namesKey];
            }
          }
          this.lastName = this.lastName.trim();
          this.firstName = this.firstName.trim();
        } else {
          this.firstName = names[0]?.trim() ?? "";
          this.lastName = names[1]?.trim() ?? "";
        }
      }
    } else {
      this.lastName = nameLastName;
      this.firstName = firstName;
    }
  }
  toString(
    lastNameFirst = false,
    shortenFirst = false,
    shortenSecond = true,
    separator = " ",
    ending = "",
  ) {
    let first = this.firstName;
    let second = this.lastName;
    if (lastNameFirst) {
      first = this.lastName;
      second = this.firstName;
    }
    if (shortenFirst) {
      first = first[0] ?? "";
    }
    if (shortenSecond) {
      second = second[0] ?? "";
    }
    let name = first + separator + second + ending;
    if (name === separator + ending) {
      name = "";
    }
    return name;
  }
}

export class Fencer {
  id: string;
  name: Name;
  country: Country;
  club: string;
  constructor(id: string, name: Name, country: Country, club: string);
  constructor(id: string, name: string, country: Country, club: string);
  constructor(
    id: string,
    name: [string, string],
    country: Country,
    club: string,
  );
  constructor(id: string, name: string, country: Country, club: string);
  constructor();
  constructor(
    id: string = "",
    name: Name | string | [string, string] = "",
    country: Country = new Country(""),
    club: string = "",
  ) {
    if (name instanceof Name) {
      this.name = name;
    } else if (typeof name === "string") {
      this.name = new Name(name);
    } else {
      this.name = new Name(name[0], name[1]);
    }
    this.country = country;
    this.club = club;
    this.id = id;
  }
}

export const emptyFencer = new Fencer();

export type FencerPlus = {
  fencer: Fencer;
  seed: { [round: number]: number };
  leftHanded: boolean;
  fencedFencers: string[];
  receivedBye: boolean;
  victory: { [round: number]: boolean };
  pointsScored: { [round: number]: number };
  pointsAgainst: { [round: number]: number };
};

export class FencerList {
  rounds: Ref<number[]>;
  fencers: Ref<[FencerPlus[]]>;
  constructor(fencers: FencerPlus[]) {
    this.rounds = ref([0]);
    this.fencers = ref([fencers]);
  }
  update(round: number) {
    if (round > 0) {
      toValue(this.fencers)[0].forEach((value) => {
        value.seed[round] = fencerResults(round, value).points;
      });
    }
  }
  sort(round: number = 0) {
    this.update(round);
    return toValue(this.fencers)[0].toSorted(
      (b, a) =>
        (a.seed[round] || 0) - (b.seed[round] || 0) ||
        (a.seed[0] || 0) - (b.seed[0] || 0) ||
        +b.fencer.id - +a.fencer.id,
    );
  }
  place(fencerID: string, round: number = 0) {
    return (
      this.sort(round).findIndex((fencer) => fencer.fencer.id === fencerID) + 1
    );
  }
  ids() {
    return toValue(this.fencers)[0].map(({ fencer }) => fencer.id);
  }
  push(fencer: FencerPlus) {
    toValue(this.fencers)[0].push(fencer);
  }
  length() {
    return toValue(this.fencers)[0].length;
  }
  remove(fencerID: string) {
    toValue(this.fencers)[0] = toValue(this.fencers)[0].filter(
      (f) => f.fencer.id !== fencerID,
    );
  }
  pairings(round: number) {
    const players: Player[] = [];
    const bye: string[] = [];
    for (const fencer of toValue(this.fencers)[0]) {
      const fenced = fencer.fencedFencers;
      if (fencer.receivedBye) {
        fenced.push("");
        bye.push(fencer.fencer.id);
      }
      players.push(
        JSON.parse(
          JSON.stringify({
            id: fencer.fencer.id,
            avoid: fenced,
            receivedBye: fencer.receivedBye,
            score: fencer.seed[round - 1] ?? 0,
          }),
        ),
      );
    }
    if (!isEmpty(bye)) {
      players.push({
        id: "",
        avoid: bye,
        receivedBye: false,
        score: 0,
      });
    }
    console.log(players);
    const matches = Swiss(players, round);
    const ms = matches.map((value) => {
      let match;
      if (
        toValue(this.fencers)[0].find((v) => v.fencer.id === value.player2)
          ?.leftHanded
      ) {
        match = [value.player2, value.player1] as [
          string | null,
          string | null,
        ];
      } else {
        match = [value.player1, value.player2] as [
          string | null,
          string | null,
        ];
      }
      return [value.match, match] as [number, [string | null, string | null]];
    });
    const out: Record<number, [string | null, string | null]> = {};
    for (const m of ms) {
      out[m[0]] = m[1];
    }
    return out;
  }
}
const refFencerList = ref(new FencerList([]));
export type RefFencerList = typeof refFencerList;
export function fencerResults(round: number, fencer: FencerPlus) {
  const out = {
    points: 0,
    V: 0,
    HS: 0,
    HR: 0,
  };
  for (let i = 1; i <= round; i++) {
    out.V += fencer.victory[i] ? 1 : 0;
    out.HS += fencer.pointsScored[i] ?? 0;
    out.HR += fencer.pointsAgainst[i] ?? 0;
  }
  out.points = points(out.V, out.HS, out.HR);
  return out;
}
export type Status = {
  poultab: string;
  match: number | "";
  round: number | "";
  time: string;
  stopwatch: number | "";
  type: "I" | "T" | "";
  weapon: "F" | "E" | "S" | "";
  priority: "N" | "L" | "R" | "";
  state: "F" | "H" | "P" | "W" | "E" | "";
  doubles: number;
};

export type CorrectStatus = {
  poultab: string;
  match: number | "";
  round: number;
  time: string;
  stopwatch?: number;
  type: "I" | "T" | "";
  weapon: "F" | "E" | "S";
  priority: "N" | "L" | "R";
  state: "F" | "H" | "P" | "W" | "E" | "";
  doubles: number;
};

export const emptyStatus: Status = {
  poultab: "",
  match: "",
  round: "",
  time: "",
  stopwatch: "",
  type: "",
  weapon: "",
  priority: "",
  state: "",
  doubles: 0,
};

export type FencerStatus = {
  fencer: Fencer;
  score: number | "";
  status: "U" | "V" | "D" | "A" | "E" | "";
  ycard: boolean | "";
  rcard: number | "";
  light: boolean | "";
  wlight: boolean | "";
  medical: number | "";
  reserve: "N" | "R" | "";
};

export type CorrectFencerStatus = {
  fencer: Fencer;
  score: number;
  status: "U" | "V" | "D" | "A" | "E";
  ycard: boolean;
  rcard: number;
  light: boolean;
  wlight: boolean;
  medical: number;
  reserve: "N" | "R" | "";
};

export const emptyFencerStatus: FencerStatus = {
  fencer: emptyFencer,
  score: "",
  status: "",
  ycard: "",
  rcard: "",
  light: "",
  wlight: "",
  medical: "",
  reserve: "",
};

export type map<T> = {
  Menu: T;
  AddMin: T;
  AddSec: T;
  MinusMin: T;
  MinusSec: T;
  LeftAdd1: T;
  RightAdd1: T;
  LeftMinus1: T;
  RightMinus1: T;
  LeftCard: T;
  RightCard: T;
  Timer: T;
  ResetTime: T;
  ResetBout: T;
  Period: T;
  Flip: T;
  [action: string]: T;
};
