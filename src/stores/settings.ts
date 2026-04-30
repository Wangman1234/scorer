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

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const keymaps = ref<Record<string, map<string>>>({
      "default remote": {
        Menu: "Escape",
        AddMin: "ArrowUp",
        AddSec: "w",
        MinusMin: "ArrowDown",
        MinusSec: "s",
        LeftAdd1: "AudioVolumeUp",
        RightAdd1: "PageUp",
        LeftMinus1: "AudioVolumeDown",
        RightMinus1: "PageDown",
        LeftCard: "ArrowLeft",
        RightCard: "ArrowRight",
        Timer: "Enter",
        ResetTime: "t",
        ResetBout: "g",
        Period: "p",
        Flip: "f",
      },
      "default keyboard": {
        Menu: "Escape",
        AddMin: "ArrowUp",
        AddSec: "2",
        MinusMin: "ArrowDown",
        MinusSec: "1",
        LeftAdd1: "ArrowLeft",
        RightAdd1: "ArrowRight",
        LeftMinus1: ",",
        RightMinus1: ".",
        LeftCard: "j",
        RightCard: "k",
        Timer: "Enter",
        ResetTime: "t",
        ResetBout: "g",
        Period: "p",
        Flip: "f",
      },
    });
    const config = ref({
      keymap: "default remote",
      timerEndsMatch: true,
      leftColor: "#ff0000",
      rightColor: "#0000ff",
      showSubSec: false,
      lastNameFirst: false,
      shortenFirst: false,
      shortenSecond: true,
      separator: " ",
      ending: "",
      showFlags: false,
      showDoubles: false,
      blurred: true,
      playSounds: true,
      click: true,
      flip: false,
    });
    const settings = ref({
      piste: "1",
      compe: "0",
      phase: 0,
      maxTime: 180,
      maxScore: 5,
      rounds: 1,
      rest: 60,
      break: 60,
      allowTies: false,
      doubleLoss: false,
      priority: 60,
      allowOver: false,
      allowFirst: false,
      doublesAddPoints: 0,
      doublesAddPoints1: 1,
      maxDoubles: 0,
      passivity: 60,
      passivityStops: true,
    });
    const cyranoOptions = ref<{
      port: number;
      remoteAddress: string;
      protocol: "EFP1" | "EFP1.1";
      ret: "INFO" | "NEXT" | "PREV";
      interval: number;
      replayMode: boolean;
      pointsPerPeriod: number;
      roundsPerTableMatch: number;
    }>({
      port: 50100,
      remoteAddress: "192.168.2.11",
      protocol: "EFP1.1",
      ret: "INFO",
      interval: 10,
      replayMode: false,
      pointsPerPeriod: 5,
      roundsPerTableMatch: 3,
    });
    const mockOptions = ref<{
      useSelf: number;
      port: number;
      devices: {
        [piste: number]: {
          remoteAddress: string;
          protocol: "EFP1" | "EFP1.1";
        };
      };
    }>({
      useSelf: 1,
      port: 50100,
      devices: {},
    });

    return { keymaps, config, settings, cyranoOptions, mockOptions };
  },
  { persist: true },
);
