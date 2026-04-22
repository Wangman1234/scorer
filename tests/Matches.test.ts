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

import { Swiss } from "tournament-pairings";
import type { Player } from "tournament-pairings/interfaces";
import { Fencer, FencerList } from "../src/scripts/Types.ts";
import { Country } from "../src/scripts/Country.ts";

let players: Player[] = [
  {
    id: "1",
    score: 0,
  },
  {
    id: "2",
    score: 1,
  },
];

const matches = Swiss(players, 1);
console.log(JSON.stringify(matches));

const fencersList: FencerList = new FencerList([
  {
    fencer: new Fencer("1", "", new Country(""), "THC"),
    seed: { 0: 0 },
    leftHanded: false,
    fencedFencers: [],
    receivedBye: false,
    victory: {},
    pointsScored: {},
    pointsAgainst: {},
  },
  {
    fencer: new Fencer("2", "", new Country(""), "THC"),
    seed: { 0: 1 },
    leftHanded: false,
    fencedFencers: [],
    receivedBye: false,
    victory: {},
    pointsScored: {},
    pointsAgainst: {},
  },
  {
    fencer: new Fencer("2", "", new Country(""), "THC"),
    seed: { 0: 2 },
    leftHanded: false,
    fencedFencers: [],
    receivedBye: false,
    victory: {},
    pointsScored: {},
    pointsAgainst: {},
  },
]);

const matches2 = fencersList.pairings(1);
console.log(JSON.stringify(matches2));
