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
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";

const { tournamentWindow } = defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
  match: number | "";
  tournamentWindow: boolean;
}>();

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
    <Tournament
      v-if="tournamentWindow"
      :match="match"
      :matches="matches"
    />
  </div>
</template>

<style scoped>
div {
  padding: 2rem;
}
</style>
