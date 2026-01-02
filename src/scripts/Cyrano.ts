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
import { defaultFencerStatus, fencerEqual } from "@/scripts/Functions.ts";
import { CyranoMessage } from "@/scripts/CyranoMessage.ts";
import type { CorrectFencerStatus, CorrectStatus } from "@/scripts/Types.ts";
import { min, omit } from "underscore";
import { useSettingsStore } from "@/stores/settings.ts";
import { useNavStore } from "@/stores/nav.ts";
import { type ComputedRef, type Ref } from "vue";

export class Cyrano {
  settings = useSettingsStore();
  nav = useNavStore();

  matches: Ref<Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>>;
  status: Ref<CorrectStatus>;
  match: ComputedRef<[CorrectFencerStatus, CorrectFencerStatus]>;
  cyranoMatch: ComputedRef<CyranoMessage>;
  $reset: () => void;

  socket: UDPSocket;
  readab?: ReadableStream;
  writeab?: WritableStream;
  reader?: ReadableStreamDefaultReader;
  writer?: WritableStreamDefaultWriter;
  decoder = new TextDecoder();
  encoder = new TextEncoder();
  nak = false;
  sendingData = false;
  knowList = 1;
  prev = 0;
  prevDisp = new CyranoMessage("|EFP1|HELLO|0|0|%|");
  cyranoState = "Waiting";
  cyranoOut = "";

  constructor(
    matches: Ref<
      Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
    >,
    status: Ref<CorrectStatus>,
    match: ComputedRef<[CorrectFencerStatus, CorrectFencerStatus]>,
    cyranoMatch: ComputedRef<CyranoMessage>,
    $reset: () => void,
  ) {
    this.matches = matches;
    this.match = match;
    this.status = status;
    this.$reset = $reset;
    this.cyranoMatch = cyranoMatch;
    this.socket = new UDPSocket({
      localAddress: "0.0.0.0",
      localPort: this.settings.cyranoOptions.port,
    });
    if (!this.socket) {
      this.cyranoLog("startCyrano", "Socket not connected");
      return;
    }
    if (!this.settings.cyranoOptions.replayMode) this.$reset();
  }
  async startCyrano() {
    const { readable, writable } = await this.socket.opened;
    this.readab = readable;
    this.writeab = writable;
    this.reader = this.readab.getReader();
    this.writer = this.writeab.getWriter();
    console.log("startCyrano");
    if (this.settings.cyranoOptions.replayMode) {
      this.sendingData = true;
      this.cyranoState = "Bout";
      this.settings.cyranoOptions.protocol = "EFP1.1";
      new Promise((res, rej) => this.writeRepeat(res, rej)).catch((reason) => {
        console.log(reason);
      });
    } else
      new Promise((res, rej) => this.runner(res, rej, "NEXT")).catch(
        (reason) => {
          console.log(reason);
        },
      );
  }
  async stopCyrano(resolve: (value?: any) => void) {
    this.writer?.releaseLock();
    this.reader?.releaseLock();
    await this.socket.close();
    this.sendingData = false;
    this.cyranoState = "Closed";
    if (!this.settings.cyranoOptions.replayMode) {
      this.settings.settings.rounds = 1;
      this.settings.settings.maxScore = 5;
      this.matches.value[""] = [defaultFencerStatus(), defaultFencerStatus()];
      this.status.value.match = "";
    }
    this.cyranoLog("stopCyrano", "finished");
    resolve();
  }
  async runner(
    resolve: (value?: any) => void,
    reject: (reason?: any) => void,
    msg: "NEXT" | "PREV" | "INFO" | "" = "",
  ) {
    try {
      if (msg !== "") {
        await this.write(msg, "runner");
      }
      this.cyranoLog(String(this.knowList), "waiting for message");
      const cyranoMsg = await this.read(this.cyranoState);
      if (cyranoMsg === true) {
        return reject("message doesn't exist");
      }
      console.log(cyranoMsg);
      this.settings.cyranoOptions.protocol = cyranoMsg.protocol;
      msg = this.tester(reject, cyranoMsg);
      console.log(msg);
    } catch (error) {
      if (this.cyranoState === "Closed") {
        return reject("Cyrano ended");
      }
      await new Promise((resolve) => setTimeout(resolve, 100, ""));
      if (this.status.value.state === "E") {
        msg = "INFO";
      } else {
        msg = "";
      }
    }
    await this.runner(resolve, reject, msg).catch((reason) =>
      console.log(reason),
    );
  }
  tester(
    _reject: (reason?: any) => void,
    cyranoMsg: CyranoMessage,
  ): "NEXT" | "PREV" | "INFO" | "" {
    if (this.nak) return "";
    switch (this.cyranoState) {
      case "Waiting":
      case "No Bouts":
        if (cyranoMsg.com === "HELLO") {
          this.settings.settings.compe = cyranoMsg.compe;
          this.settings.settings.piste = cyranoMsg.piste;
          return "NEXT";
        }
        if (cyranoMsg.com !== "DISP" || cyranoMsg.status.poultab === "") break;
        // Listing bouts
        if (this.knowList !== 0) {
          if (cyranoMsg.status.poultab === "X") {
            this.knowList = -1;
            return "PREV";
          }
          if (
            typeof this.matches.value[cyranoMsg.status.match] === "undefined"
          ) {
            this.matches.value[cyranoMsg.status.match] = [
              defaultFencerStatus(),
              defaultFencerStatus(),
            ];
          }
          const mat = this.matches.value[cyranoMsg.status.match] ?? [
            defaultFencerStatus(),
            defaultFencerStatus(),
          ];
          if (
            !(
              fencerEqual(mat[0], cyranoMsg.leftfencer) &&
              fencerEqual(mat[1], cyranoMsg.rightfencer)
            )
          ) {
            console.log("not equal");
            console.log(mat[0], mat[1]);
            mat[0] = cyranoMsg.leftfencer as CorrectFencerStatus;
            mat[1] = cyranoMsg.rightfencer as CorrectFencerStatus;
          } else if (
            cyranoMsg.status.match ===
            Number(min(Object.keys(omit(this.matches.value, ""))))
          ) {
            if (cyranoMsg.status.match === this.prev) {
              this.knowList = 0;
              this.prev = 0;
            } else {
              this.prev = cyranoMsg.status.match;
            }
          }
          if (this.knowList > 0) return "NEXT";
          return "PREV";
        }
        // No longer listing bouts
        if (cyranoMsg.status.poultab === "X") {
          if (this.cyranoState === "No Bouts") break;
          this.cyranoState = "No Bouts";
          this.nav.page = "tournament";
          this.nav.menu = true;
          return "PREV";
        }
        // Read display ended bout
        if (
          cyranoMsg.status.state === "E" ||
          cyranoMsg.leftfencer.status !== "U" ||
          cyranoMsg.rightfencer.status !== "U"
        ) {
          if (
            typeof this.matches.value[cyranoMsg.status.match] === "undefined"
          ) {
            this.matches.value[cyranoMsg.status.match] = [
              defaultFencerStatus(),
              defaultFencerStatus(),
            ];
          }
          const mat = this.matches.value[cyranoMsg.status.match] ?? [
            defaultFencerStatus(),
            defaultFencerStatus(),
          ];
          if (
            !(
              fencerEqual(mat[0], cyranoMsg.leftfencer) &&
              fencerEqual(mat[1], cyranoMsg.rightfencer)
            )
          ) {
            mat[0] = cyranoMsg.leftfencer as CorrectFencerStatus;
            mat[1] = cyranoMsg.rightfencer as CorrectFencerStatus;
          }
          return "NEXT";
        }
        this.set(cyranoMsg);
        // MatchList not correct
        if (
          !(
            fencerEqual(this.match.value[0], cyranoMsg.leftfencer) &&
            fencerEqual(this.match.value[0], cyranoMsg.rightfencer)
          )
        ) {
          this.$reset();
          this.cyranoState = "Waiting";
          this.knowList = 1;
          return "PREV";
        }
        this.status.value.stopwatch = this.settings.settings.maxTime;
        this.nav.page = "bout";
        this.nav.menu = true;
        this.cyranoState = "Bout";
        this.prevDisp = cyranoMsg;
        this.bout().then();
        break;
      case "Bout":
        if (cyranoMsg.com === "HELLO") {
          return "INFO";
        }
        break;
      case "Ending":
        if (cyranoMsg.com === "ACK") {
          console.log("ACK");
          this.matches.value[""] = [
            defaultFencerStatus(),
            defaultFencerStatus(),
          ];
          this.status.value = {
            poultab: "",
            match: "",
            round: 1,
            time: "",
            stopwatch: undefined,
            type: "",
            weapon: "F",
            priority: "N",
            state: "",
            doubles: 0,
          };
          this.cyranoState = "Waiting";
          return "NEXT";
        } else if (cyranoMsg.com === "NAK") {
          this.nak = true;
          this.nav.page = "nak";
          this.nav.menu = true;
          return "";
        }
        return "INFO";
    }
    return "";
  }
  unNak() {
    this.nak = false;
    this.nav.page = "tournament";
    this.reader?.releaseLock();
    this.reader = this.readab?.getReader();
  }
  async bout() {
    this.sendingData = true;
    console.log("sendTrue");
    await new Promise((res, rej) => this.writeRepeat(res, rej));
  }
  async writeRepeat(
    resolve: (value?: unknown) => void,
    reject: (reason?: any) => void,
  ) {
    if (this.check()) return resolve();
    else if (this.cyranoState === "Closed") return reject("Cyrano ended");
    try {
      await this.forceWrite();
    } catch (e) {}
    for (let i = 0; i < this.settings.cyranoOptions.interval; i++) {
      if (this.check()) return resolve();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log(this.status.value.state);
    await this.writeRepeat(resolve, reject);
  }
  async forceWrite() {
    this.reader?.releaseLock();
    this.writer?.releaseLock();
    this.writer = this.writeab?.getWriter();
    await this.write("INFO", "writeRepeat");
    this.reader = this.readab?.getReader();
  }
  check(): boolean {
    if (
      this.status.value.state === "E" &&
      !this.settings.cyranoOptions.replayMode
    ) {
      this.reader?.releaseLock();
      this.writer?.releaseLock();
      this.writer = this.writeab?.getWriter();
      this.reader = this.readab?.getReader();
      console.log("sendFalse");
      this.sendingData = false;
      return true;
    }
    return false;
  }
  set(cyr: CyranoMessage) {
    this.settings.settings.piste = cyr.piste;
    this.settings.settings.compe = cyr.compe;
    this.settings.settings.phase = cyr.phase === "" ? 0 : cyr.phase;
    this.status.value = cyr.status as CorrectStatus;
    this.settings.settings.maxTime = 180;
    switch (this.status.value.poultab[0]) {
      case "P":
        this.settings.settings.rounds = this.status.value.round;
        break;
      default:
        this.settings.settings.rounds =
          this.settings.cyranoOptions.roundsPerTableMatch;
    }
    this.settings.settings.maxScore =
      (this.settings.settings.rounds - this.status.value.round + 1) *
      this.settings.cyranoOptions.pointsPerPeriod;
    this.settings.settings.allowTies = false;
  }
  async read(process: string = "read") {
    const { value, done } = (await this.reader?.read()) ?? {
      value: "",
      done: true,
    };
    this.cyranoLog(process, "done reading");
    if (done) {
      await new Promise((res) => this.stopCyrano(res));
      this.cyranoLog(process, "done");
      return true;
    }
    this.cyranoLog(process, "message got");

    const { data, remoteAddress, remotePort } = value;
    this.settings.cyranoOptions.remoteAddress = remoteAddress;
    const decoded = this.decoder.decode(data);
    this.cyranoLog(
      "process",
      process,
      ": received ",
      decoded,
      " from ",
      remoteAddress,
      ":",
      remotePort,
    );
    return new CyranoMessage(decoded);
  }
  async write(
    com: "NEXT" | "PREV" | "INFO" = "INFO",
    process: string = "write",
  ) {
    this.settings.cyranoOptions.ret = com;
    console.log(process, this.cyranoMatch.value);
    let message = this.cyranoMatch.value.toString(
      !this.settings.cyranoOptions.replayMode,
    );
    await this.writer?.ready;
    await this.writer?.write({
      data: this.encoder.encode(message),
      remoteAddress: this.settings.cyranoOptions.remoteAddress,
      remotePort: this.settings.cyranoOptions.port,
    });
    this.cyranoLog(
      process,
      "sent",
      message,
      "on port",
      this.settings.cyranoOptions.port,
      "to",
      this.settings.cyranoOptions.remoteAddress,
    );
  }
  cyranoLog(process: string, ...args: any) {
    console.log("process", process, ":", ...args);
    this.cyranoOut = args.join(" ");
  }
}
