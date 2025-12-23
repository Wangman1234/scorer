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
const emit = defineEmits<{
  started: [start: boolean];
}>();

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
  emit("started", true);
}
</script>

<template>
  <div>
    <Button @click="launch">launch</Button>
  </div>
</template>

<style scoped>
div {
  background-clip: border-box;
  height: 100%;
  width: 100%;
  align-content: center;
}
</style>
