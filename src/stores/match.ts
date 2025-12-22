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
  const settingsStore = useSettingsStore();
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
    stopwatch: settingsStore.settings.maxTime,
    type: "",
    weapon: "F",
    priority: "N",
    state: "",
    doubles: 0,
  });
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
    if (status.value.stopwatch === "") {
      return 0;
    } else {
      return status.value.stopwatch;
    }
  });
  const cyranoMatch = computed(() => {
    console.log("cyrano changed");
    return new CyranoMessage(
      settingsStore.cyranoOptions.protocol,
      settingsStore.cyranoOptions.ret,
      settingsStore.settings.piste,
      settingsStore.settings.compe,
      settingsStore.settings.phase,
      status.value,
      emptyFencer,
      match.value[1],
      match.value[0],
    );
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

  function $reset() {
    matches.value = {
      "": [defaultFencerStatus(), defaultFencerStatus()],
    };
    status.value = {
      poultab: "",
      match: "",
      round: 1,
      time: "",
      stopwatch: settingsStore.settings.maxTime,
      type: "",
      weapon: "F",
      priority: "N",
      state: "",
      doubles: 0,
    };
  }

  return {
    matches,
    status,
    match,
    stopwatch,
    cyranoMatch,
    Lcard,
    Rcard,
    $reset,
  };
});
