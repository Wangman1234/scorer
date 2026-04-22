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
import { type FencerList, fencerResults } from "@/scripts/Types.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import type { UnwrapRef } from "vue";

const settings = useSettingsStore();

defineProps<{
  fencers: UnwrapRef<FencerList> | FencerList;
  roundId: number;
}>();
</script>

<template>
  <div>
    <table>
      <thead>
        <tr>
          <th scope="col">Rank</th>
          <th scope="col">id</th>
          <th scope="col">Name</th>
          <th scope="col">Club</th>
          <th scope="col">V</th>
          <th scope="col">HS</th>
          <th scope="col">HR</th>
          <th scope="col">Ind</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="fencer in fencers.sort(roundId)"
          :id="fencers.place(fencer.fencer.id, roundId).toString()"
        >
          <td>{{ fencers.place(fencer.fencer.id, roundId) }}</td>
          <td>{{ fencer.fencer.id }}</td>
          <td>
            {{
              fencer.fencer.name.toString(
                settings.config.lastNameFirst,
                false,
                false,
                settings.config.separator,
                "",
              )
            }}
          </td>
          <td>{{ fencer.fencer.club }}</td>
          <td>{{ fencerResults(roundId, fencer).V }}</td>
          <td>
            {{ fencerResults(roundId, fencer).HS }}
          </td>
          <td>
            {{ fencerResults(roundId, fencer).HR }}
          </td>
          <td>
            {{
              fencerResults(roundId, fencer).HS -
              fencerResults(roundId, fencer).HR
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<!--suppress CssUnresolvedCustomProperty -->
<style scoped>
div {
  width: 100%;
  overflow-x: auto;
  justify-items: center;
  margin-bottom: 1rem;
}
table {
  overflow-x: auto;
  white-space: nowrap;
  border-collapse: collapse;
}

tr {
  height: 1.5rem;
  border-bottom: 1px solid var(--p-surface-600);
  border-top: 1px solid var(--p-surface-600);
}

th,
td {
  background-clip: border-box;
  padding: 0.25rem;
  border-left: 1px solid var(--p-surface-600);
  border-right: 1px solid var(--p-surface-600);
  text-align: center;
}

td,
th[scope="col"] {
  width: 2rem;
}

th[scope="row"] {
  width: 1.5rem;
}
</style>
