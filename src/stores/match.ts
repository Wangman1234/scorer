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
import { computed, ref, watch } from "vue";
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  emptyFencer,
} from "../scripts/Types.ts";
import { defaultFencerStatus } from "../scripts/Functions.ts";
import { useSettingsStore } from "./settings.ts";
import { CyranoMessage } from "@/scripts/CyranoMessage.ts";

export const useMatchStore = defineStore("match", () => {
  const settings = useSettingsStore();
  const matches = ref<
    Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
  >({
    "": [defaultFencerStatus(), defaultFencerStatus()],
  });
  const status = ref<CorrectStatus>({
    poultab: "",
    match: "",
    round: 1,
    time: "",
    stopwatch: settings.settings.maxTime,
    type: "",
    weapon: "F",
    priority: "N",
    state: "",
    doubles: 0,
  });
  const matchData = ref<
    Array<{
      stopwatch: string;
      leftFencerStatus: CorrectFencerStatus;
      rightFencerStatus: CorrectFencerStatus;
      doubles: number;
    }>
  >([]);
  const passivityStart = ref(settings.settings.maxTime * 1);
  const Lcard = ref(0);
  const Rcard = ref(0);
  const match = computed<[CorrectFencerStatus, CorrectFencerStatus]>(() => {
    return (
      matches.value[status.value.match] ?? [
        defaultFencerStatus(),
        defaultFencerStatus(),
      ]
    );
  });
  const stopwatch = computed(() => {
    if (typeof status.value.stopwatch === "undefined") {
      return 0;
    } else {
      return status.value.stopwatch;
    }
  });
  const cyranoMatch = computed(() => {
    console.log("cyrano changed");
    return new CyranoMessage(
      settings.cyranoOptions.protocol,
      settings.cyranoOptions.ret,
      settings.settings.piste,
      settings.settings.compe,
      settings.settings.phase,
      status.value,
      emptyFencer,
      match.value[1],
      match.value[0],
    );
  });
  const passivity = computed(() => {
    return settings.settings.passivity + stopwatch.value - passivityStart.value;
  });
  const Lcolor = computed(() => {
    return color(Lcard.value);
  });
  const Rcolor = computed(() => {
    return color(Rcard.value);
  });

  watch(Lcard, (value) => {
    switch (value) {
      case 0:
        match.value[0].ycard = false;
        match.value[0].rcard = 0;
        break;
      case 1:
        match.value[0].ycard = true;
        match.value[0].rcard = 0;
        break;
      case 2:
        match.value[0].ycard = true;
        match.value[0].rcard = 1;
        break;
    }
  });
  watch(Rcard, (value) => {
    switch (value) {
      case 0:
        match.value[1].ycard = false;
        match.value[1].rcard = 0;
        break;
      case 1:
        match.value[1].ycard = true;
        match.value[1].rcard = 0;
        break;
      case 2:
        match.value[1].ycard = true;
        match.value[1].rcard = 1;
        break;
    }
  });

  function color(card: number) {
    switch (card) {
      case 0:
        return "white"; //"transparent"
      case 1:
        return "yellow";
      case 2:
        return "red";
    }
  }
  function LcardAdd() {
    Lcard.value += 1;
    Lcard.value %= 3;
  }
  function RcardAdd() {
    Rcard.value += 1;
    Rcard.value %= 3;
  }
  function period() {
    if (status.value.poultab[0] !== "P") {
      status.value.round = (status.value.round % settings.settings.rounds) + 1;
    }
  }
  function $reset() {
    matches.value = {
      "": [defaultFencerStatus(), defaultFencerStatus()],
    };
    status.value = {
      poultab: "",
      match: "",
      round: 1,
      time: "",
      stopwatch: settings.settings.maxTime,
      type: "",
      weapon: "F",
      priority: "N",
      state: "",
      doubles: 0,
    };
    matchData.value = [];
    passivityStart.value = settings.settings.maxTime;
    Lcard.value = 0;
    Rcard.value = 0;
  }

  return {
    matches,
    status,
    matchData,
    passivityStart,
    Lcard,
    Rcard,
    match,
    stopwatch,
    cyranoMatch,
    passivity,
    Lcolor,
    Rcolor,
    color,
    LcardAdd,
    RcardAdd,
    period,
    $reset,
  };
});
