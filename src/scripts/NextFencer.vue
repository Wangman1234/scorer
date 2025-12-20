<script setup lang="ts">
import { type CorrectFencerStatus } from "./Types.ts";
import { Vue3Marquee } from "vue3-marquee";
import { computed } from "vue";

const props = defineProps<{
  matches: Record<number, [CorrectFencerStatus, CorrectFencerStatus]>;
  match: number;
}>();

const nextMatch = computed(() => {
  return props.matches[props.match + 1] ?? "";
});
const nextMatch2 = computed(() => {
  return props.matches[props.match + 2] ?? "";
});
function disp() {
  let text1: string;
  let text2: string;
  if (nextMatch.value == "") {
    text1 = "No rounds remaining";
    text2 = "No rounds remaining";
  } else {
    text1 =
      "Up next: " +
      nextMatch.value[0].fencer.name.toString() +
      " vs. " +
      nextMatch.value[1].fencer.name.toString();
    if (nextMatch2.value == "") {
      text2 = text1;
    } else {
      text2 =
        "On deck: " +
        nextMatch2.value[0].fencer.name.toString() +
        " vs. " +
        nextMatch2.value[1].fencer.name.toString();
    }
  }
  return [text1, text2];
}
</script>

<template>
  <div class="outer">
    <Vue3Marquee
      :gradient="true"
      :gradient-color="[0, 0, 0]"
    >
      <span>
        {{ disp()[0] }}
      </span>
      <span>
        {{ disp()[1] }}
      </span>
    </Vue3Marquee>
  </div>
</template>

<style scoped>
.outer {
  //border: 1px solid gold;
}
span {
  font-size: 4rem;
  padding: 0 5rem;
}
</style>
