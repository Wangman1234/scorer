<script setup lang="ts">
import { ref, defineEmits } from 'vue'

const emit = defineEmits<{
  started: [start: boolean]
}>()
const started = ref(false)

async function launch() {
  await document.documentElement.requestFullscreen();
  const {state} = await navigator.permissions.query({name: 'keyboard-lock'});
  if (state === 'granted') {
    if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
      console.log("supported")
      navigator.keyboard.lock();
    } else {
      console.log("not in navigator")
    }
  } else {
    console.log("not granted")
  }
  started.value = true
  emit("started", true)
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