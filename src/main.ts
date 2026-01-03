/**
 * Copyright 2025 Scorer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import Vue3Marquee from "vue3-marquee";
import PrimeVue from "primevue/config";
import Nora from "@primeuix/themes/nora";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { definePreset } from "@primeuix/themes";
import "primeicons/primeicons.css";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import Ripple from "primevue/ripple";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
const app = createApp(App);

const MyPreset = definePreset(Nora, {
  semantic: {
    primary: {
      50: "{teal.50}",
      100: "{teal.100}",
      200: "{teal.200}",
      300: "{teal.300}",
      400: "{teal.400}",
      500: "{teal.500}",
      600: "{teal.600}",
      700: "{teal.700}",
      800: "{teal.800}",
      900: "{teal.900}",
      950: "{teal.950}",
    },
  },
});

app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: ".darkmode",
    },
  },
  ripple: true,
});
app.directive("ripple", Ripple);
app.use(Vue3Marquee);
app.mount("#app");
