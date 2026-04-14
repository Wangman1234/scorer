<!--
  - Copyright 2026 Scorer
  -
  - Licensed under the Apache License, Version 2.0 (the "License");
  - you may not use this file except in compliance with the License.
  - You may obtain a copy of the License at
  -
  -     http://www.apache.org/licenses/LICENSE-2.0
  -
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the License is distributed on an "AS IS" BASIS,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the License for the specific language governing permissions and
  - limitations under the License.
  -->

<script lang="ts" setup>
import Tournament from "@/Components/Tournament.vue";
import type { CorrectFencerStatus } from "@/scripts/Types.ts";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import FencerDisplay from "@/Components/FencerDisplay.vue";

const { match, matches, tournamentWindow } = defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
  match: number | "";
  tournamentWindow: boolean;
}>();
const current = computed(() => {
  if (match === "") {
    return undefined;
  } else {
    return matches[match];
  }
});
const nextMatch = computed(() => {
  if (match === "") {
    return undefined;
  } else {
    return matches[match + 1];
  }
});
const onDeck = computed(() => {
  if (match === "") {
    return undefined;
  } else {
    return matches[match + 2];
  }
});

const emit = defineEmits(["close"]);

const el = useTemplateRef("el");

const windowRef = ref<Window | null>(null);

function copyStyles(sourceDoc: Document, targetDoc: Document | undefined) {
  Array.from(sourceDoc.styleSheets).forEach((styleSheet) => {
    if (styleSheet.cssRules) {
      // for <style> elements
      const newStyleEl = sourceDoc.createElement("style");

      Array.from(styleSheet.cssRules).forEach((cssRule) => {
        // write the text of each rule into the body of the style element
        newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
      });

      targetDoc?.head.appendChild(newStyleEl);
    } else if (styleSheet.href) {
      // for <link> elements loading CSS from a URL
      const newLinkEl = sourceDoc.createElement("link");

      newLinkEl.rel = "stylesheet";
      newLinkEl.href = styleSheet.href;
      targetDoc?.head.appendChild(newLinkEl);
    }
  });
}

function closePortal() {
  if (windowRef.value) {
    windowRef.value.close();
    windowRef.value = null;
    emit("close");
    console.log("close portal");
  }
}

function openPortal() {
  windowRef.value = window.open("", "", "popup");
  windowRef.value?.addEventListener("beforeunload", closePortal);
  windowRef.value?.document.body.appendChild(
    el.value ? el.value : document.createElement("p"),
  );
  copyStyles(window.document, windowRef.value?.document);
}

watch(
  () => tournamentWindow,
  (newOpen, _) => {
    if (newOpen) {
      openPortal();
    } else {
      closePortal();
    }
  },
);

onMounted(() => {
  if (tournamentWindow) {
    openPortal();
  }
});
onBeforeUnmount(() => {
  if (windowRef.value) {
    closePortal();
  }
});
</script>

<template>
  <div ref="el">
    <div
      class="container"
      v-if="tournamentWindow"
    >
      <Tournament
        :match="match"
        :matches="matches"
      />
      <div v-if="!!current">
        <h1>Current:</h1>
        <div class="disp">
          <FencerDisplay
            :left-fencer="current[0]"
            :right-fencer="current[1]"
          />
        </div>
      </div>
      <div v-if="!!nextMatch">
        <h1>Up Next:</h1>
        <div class="disp">
          <FencerDisplay
            :left-fencer="nextMatch[0]"
            :right-fencer="nextMatch[1]"
          />
        </div>
      </div>
      <div v-if="!!onDeck">
        <h1>On Deck:</h1>
        <div class="disp">
          <FencerDisplay
            :left-fencer="onDeck[0]"
            :right-fencer="onDeck[1]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
div.container {
  padding: 2rem;
}
div.disp {
  height: 25rem;
}
</style>
