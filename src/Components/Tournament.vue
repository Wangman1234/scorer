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
import Poule from "@/Components/Poule.vue";
import type { CorrectFencerStatus } from "@/scripts/Types.ts";
import MatchesTable from "@/Components/MatchesTable.vue";

defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
  match: number | "";
}>();
</script>

<template>
  <Poule
    :match="match"
    :matches="matches"
  />
  <MatchesTable
    :match="match"
    :matches="matches"
  />
</template>

<style scoped>
div {
  width: 100%;
  overflow-x: auto;
  justify-items: center;
  margin-bottom: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 0 0.5rem;
  text-align: center;
}
</style>
