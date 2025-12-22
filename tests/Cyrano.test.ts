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

import { CyranoMessage } from "../src/scripts/CyranoMessage";
import {
  type CorrectFencerStatus,
  emptyFencer,
  Fencer,
  Name,
} from "../src/scripts/Types";
import { CountryList } from "../src/scripts/Country";
import { cyrConvert } from "../src/scripts/Functions";

let messages = [
  "|EFP1|HELLO|17|fm-eq|%|",
  "|EFP1.1|INFO||||||||3:00||||W|%||||0|U|0|1|1|0|0|N|%||||0|U|0|1|0|0|0|N|%|",
  "|EFP1.1|INFO|17|efj-eq||||||3:00||||W|%||||8|V|0|1|1|0|0|N|%||||6|D|0|1|0|0|0|N|%|",
  "|EFP1.1|INFO|17|efj-eq|1|A32|12|2|10:30|3:00|I|S||W|132|" +
    "J.Smith|GBR|%|28|P.Martin|FRA|8|V|0|1|1|0|0|N|%|32|B. Panini|ITA|6|D|0|1|0|0|0|N|%|",
  "|EFP1.1|INFO||||||||||||W||%|",
];
let cyranos = [
  new CyranoMessage("EFP1", "HELLO", "17", "fm-eq"),
  new CyranoMessage(
    "EFP1.1",
    "INFO",
    "",
    "",
    "",
    {
      poultab: "",
      match: "",
      round: "",
      time: "",
      stopwatch: 180,
      type: "",
      weapon: "",
      priority: "",
      state: "W",
    },
    emptyFencer,
    {
      fencer: new Fencer(),
      score: 0,
      status: "U",
      ycard: false,
      rcard: 1,
      light: true,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
    {
      fencer: new Fencer(),
      score: 0,
      status: "U",
      ycard: false,
      rcard: 1,
      light: false,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
  ),
  new CyranoMessage(
    "EFP1.1",
    "INFO",
    "17",
    "efj-eq",
    "",
    {
      poultab: "",
      match: "",
      round: "",
      time: "",
      stopwatch: 180,
      type: "",
      weapon: "",
      priority: "",
      state: "W",
    },
    emptyFencer,
    {
      fencer: new Fencer(),
      score: 8,
      status: "V",
      ycard: false,
      rcard: 1,
      light: true,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
    {
      fencer: new Fencer(),
      score: 6,
      status: "D",
      ycard: false,
      rcard: 1,
      light: false,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
  ),
  new CyranoMessage(
    "EFP1.1",
    "INFO",
    "17",
    "efj-eq",
    "1",
    {
      poultab: "A32",
      match: "12",
      round: "2",
      time: "10:30",
      stopwatch: 180,
      type: "I",
      weapon: "S",
      priority: "",
      state: "W",
    },
    new Fencer("132", new Name("Smith", "J"), CountryList["GBR"], ""),
    {
      fencer: new Fencer("28", new Name("Martin", "P"), CountryList["FRA"], ""),
      score: 8,
      status: "V",
      ycard: false,
      rcard: 1,
      light: true,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
    {
      fencer: new Fencer("32", new Name("Panini", "B"), CountryList["ITA"], ""),
      score: 6,
      status: "D",
      ycard: false,
      rcard: 1,
      light: false,
      wlight: false,
      medical: 0,
      reserve: "N",
    },
  ),
  new CyranoMessage("EFP1.1", "INFO", "", "", "", {
    poultab: "",
    match: "",
    round: "",
    time: "",
    stopwatch: "",
    type: "",
    weapon: "",
    priority: "",
    state: "W",
  }),
];

let rec: boolean[] = [];
let send: boolean[] = [];
for (let msg in messages) {
  console.log(messages[msg]);
  let cyrano0 = new CyranoMessage(messages[msg]);
  // console.log(cyrano0)
  // console.log(messages[msg])
  console.log(cyrano0.toString());
  rec[msg] = messages[msg] === cyrano0.toString();
  console.log(rec[msg]);
  // console.log(cyranos[msg])
  console.log(cyranos[msg]?.toString());
  send[msg] = cyranos[msg]?.toString() === cyrano0.toString();
  console.log(send[msg]);
  console.log("\n");
}

console.log(rec);
console.log(send);

const print = String(cyrConvert(Number, cyrConvert(Boolean, 0)));
console.log("printed ", print, " of type", typeof print);

const c1 = new CyranoMessage(
  "|EFP1|NEXT|1|0||||1||||F|N|||||%||||0|U|0|0|0|0|0||%||||0|U|0|0|0|0|0||%|",
);
console.log(c1);
console.log(c1.toString());
c1.leftfencer.fencer = new Fencer("1", "Cada Lon", CountryList["CAN"], "THC");
c1.rightfencer.fencer = new Fencer(
  "2",
  "Yarel Han",
  CountryList["CAN"],
  "DWARF",
);
console.log(c1.toString());
c1.leftfencer.fencer.name.lastName = "Ion";
console.log(c1.toString());

console.log(c1.status);

// const rounds = {
//     "": [
//         {
//             fencer: new Fencer(),
//             score: 0,
//             status: "U",
//             ycard: false,
//             rcard: 0,
//             light: false,
//             wlight: false,
//             medical: 0,
//             reserve: ""
//         },
//         {
//             fencer: new Fencer(),
//             score: 0,
//             status: "U",
//             ycard: false,
//             rcard: 0,
//             light: false,
//             wlight: false,
//             medical: 0,
//             reserve: ""
//         }
//     ]
// }
// const leftfencer = rounds[""][0]
// const rightfencer = rounds[""][0]
// console.log(rounds)
// leftfencer.fencer = new Fencer("1", "Cada Lon", CountryList["CAN"], "THC")
// rightfencer.fencer = new Fencer("2", "Yarel Han", CountryList["CAN"], "DWARF")
// console.log(rounds)
// leftfencer.fencer.name.lastName = "Ion"
// console.log(rounds)
// rightfencer.score = 5
// console.log(rounds)

// const msg = new Cyrano(
//     "EFP1.1",
//     "NEXT",
//     "1",
//     "0",
//     "",
//     {
//         poultab: '',
//         match: '',
//         round: 1,
//         time: '',
//         stopwatch: '',
//         type: '',
//         weapon: 'F',
//         priority: 'N',
//         state: ''
//     },
//     emptyFencer,
//     {
//         fencer: new Fencer(),
//         score: 0,
//         status: "U",
//         ycard: false,
//         rcard: 0,
//         light: false,
//         wlight: false,
//         medical: 0,
//         reserve: ""
//     },
//     {
//         fencer: new Fencer(),
//         score: 0,
//         status: "U",
//         ycard: false,
//         rcard: 0,
//         light: false,
//         wlight: false,
//         medical: 0,
//         reserve: ""
//     },
// ).toString()
// console.log(msg)
// const nc = new Cyrano("|EFP1.1|NEXT|1|0||||1||||F|N|||||%||||0|U|0|0|0|0|0||%||||0|U|0|0|0|0|0||%|")
// console.log(nc.toString())
// console.log(msg === nc.toString())

function defaultFencerStatus(): CorrectFencerStatus {
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
const matches: Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]> =
  {
    "": [defaultFencerStatus(), defaultFencerStatus()],
  };
// console.log(matches);
matches[1] = [defaultFencerStatus(), defaultFencerStatus()];
// console.log(matches);
console.log(matches[1][0]);
console.log(matches[1][1]);
let mat = matches[1];
mat[0] = c1.leftfencer as CorrectFencerStatus;
mat[1] = c1.rightfencer as CorrectFencerStatus;
// console.log(matches);
console.log(matches[1][0]);
console.log(matches[1][1]);
