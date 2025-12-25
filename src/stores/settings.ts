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
import { defineStore } from "pinia";
import { ref } from "vue";
import type { map } from "../scripts/Types.ts";
import { defaultKeymaps } from "../scripts/keyMaps.ts";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const config = ref<{
      keymap: map<string>;
      leftColor: string;
      rightColor: string;
      showSubSec: boolean;
      lastNameFirst: boolean;
      shortenFirst: boolean;
      shortenSecond: boolean;
      separator: string;
      ending: string;
      showDoubles: boolean;
    }>({
      keymap: Object.assign({}, defaultKeymaps.remoteKeymap1),
      leftColor: "ff0000",
      rightColor: "0000ff",
      showSubSec: false,
      lastNameFirst: false,
      shortenFirst: false,
      shortenSecond: true,
      separator: " ",
      ending: "",
      showDoubles: false,
    });
    const settings = ref({
      piste: "1",
      compe: "0",
      phase: 0,
      maxTime: 180,
      maxScore: 5,
      rounds: 1,
      allowTies: false,
      allowOver: false,
      doublesAddPoints: 0,
      maxDoubles: 0,
    });
    const cyranoOptions = ref<{
      port: number;
      remoteAddress: string;
      pointsPerPeriod: number;
      roundsPerTableMatch: number;
      protocol: "EFP1" | "EFP1.1";
      ret: "INFO" | "NEXT" | "PREV";
      interval: number;
    }>({
      port: 50100,
      remoteAddress: "192.168.2.11",
      pointsPerPeriod: 5,
      roundsPerTableMatch: 3,
      protocol: "EFP1.1",
      ret: "INFO",
      interval: 10,
    });

    return { config, settings, cyranoOptions };
  },
  { persist: true },
);
