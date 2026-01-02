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
import Blur from "@/Components/Blur.vue";

const emit = defineEmits<{
  priority: [side: "L" | "N" | "R"];
}>();
</script>

<template>
  <div>
    <div class="priority">
      <h2>Choose Priority</h2>
      <div class="lr">
        <Button
          class="half"
          @click="emit('priority', 'L')"
        >
          Left
        </Button>
        <Button
          class="half"
          @click="emit('priority', 'R')"
        >
          Right
        </Button>
      </div>
      <div>
        <Button @click="emit('priority', 'N')">Random</Button>
      </div>
    </div>
    <Blur />
  </div>
</template>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
.button button {
  width: 100%;
  height: 4rem;
  border-width: 2px 0 0 0;
}

li div {
  align-self: center;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0 0.5rem;
}

nav {
  background-color: dodgerblue;
  height: 2rem;
  overflow: auto;
  white-space: nowrap;
}

nav::-webkit-scrollbar {
  display: none;
}

nav a {
  background-clip: border-box;
  display: inline-block;
  font-size: 1.5rem;
  width: fit-content;
  padding: 0 1rem;
}

nav a:hover {
  background-color: darkcyan;
  cursor: pointer;
}

menu {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  padding: 0.1rem 1rem;
  border-bottom: 1px solid var(--p-surface-600);
}

.priority {
  z-index: 1000;
  float: none;
  position: fixed;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 20% 50% 30%;
  width: 30vw;
  height: 40vh;
  top: 40%;
  left: 50%;
  margin-left: -15vw;
  align-self: flex-end;
  background-color: darkslategrey;
}

.priority div {
  align-items: center;
  align-self: center;
  height: 100%;
}

.lr {
  display: flex;
}

.priority button {
  width: 100%;
  height: 100%;
}
</style>
