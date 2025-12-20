<!--
  - Copyright 2025 Scorer
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

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  started: [start: boolean];
}>();
const started = ref(false);

async function launch() {
  await document.documentElement.requestFullscreen();
  const { state } = await navigator.permissions.query({
    name: "keyboard-lock",
  });
  if (state === "granted") {
    if ("keyboard" in navigator && "lock" in navigator.keyboard) {
      console.log("supported");
      navigator.keyboard.lock();
    } else {
      console.log("not in navigator");
    }
  } else {
    console.log("not granted");
  }
  started.value = true;
  emit("started", true);
}
</script>

<template>
  <div id="butn">
    <button @click="launch">launch</button>
  </div>
</template>

<style scoped>
#butn {
  height: 95vh;
  width: 98%;
  align-content: center;
}
</style>
