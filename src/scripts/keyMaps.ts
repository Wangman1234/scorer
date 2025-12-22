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
import type { keyMap } from "./Types.ts";

export const defaultKeymaps: Record<string, keyMap> = {
  remoteKeymap1: {
    Menu: "Escape",
    AddMin: "ArrowUp",
    AddSec: "w",
    MinusMin: "ArrowDown",
    MinusSec: "s",
    LeftAdd1: "AudioVolumeUp",
    RightAdd1: "PageUp",
    LeftAdd2: "",
    RightAdd2: "",
    LeftAdd3: "",
    RightAdd3: "",
    Double: "",
    MinusDouble: "",
    LeftMinus1: "AudioVolumeDown",
    RightMinus1: "PageDown",
    LeftCard: "ArrowLeft",
    RightCard: "ArrowRight",
    Timer: "Enter",
    ResetTime: "t",
    Period: "p",
    Flip: "f",
  },
  keyboardKeymap1: {
    Menu: "Escape",
    AddMin: "ArrowUp",
    AddSec: "2",
    MinusMin: "ArrowDown",
    MinusSec: "1",
    LeftAdd1: "ArrowLeft",
    RightAdd1: "ArrowRight",
    LeftAdd2: "",
    RightAdd2: "",
    LeftAdd3: "",
    RightAdd3: "",
    Double: "",
    MinusDouble: "",
    LeftMinus1: ",",
    RightMinus1: ".",
    LeftCard: "j",
    RightCard: "k",
    Timer: "Enter",
    ResetTime: "t",
    Period: "p",
    Flip: "f",
  },
};
