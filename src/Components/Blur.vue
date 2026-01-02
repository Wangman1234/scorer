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
import { useSettingsStore } from "@/stores/settings.ts";

const settings = useSettingsStore();

defineProps<{
  header?: any;
}>();
</script>

<template>
  <div
    :class="{ blurred: settings.config.blurred }"
    class="background"
  >
    <h1><slot /></h1>
    <h2><slot name="sub" /></h2>
  </div>
</template>

<style scoped>
.background {
  z-index: 998;
  float: none;
  position: fixed;
  display: block;
  width: 100vw;
  height: 100vh;
  align-self: center;
  align-items: center;
  align-content: center;
  color: white;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.5);
}
.blurred {
  backdrop-filter: blur(5px);
}
* {
  color: white;
}
h1 {
  font-size: 15em;
}
h2 {
  font-size: 10em;
}
</style>
