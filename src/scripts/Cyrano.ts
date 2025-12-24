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
import { useMatchStore } from "@/stores/match.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { useNavStore } from "@/stores/nav.ts";

export class Cyrano {
  matchStore = useMatchStore();
  settingsStore = useSettingsStore();
  navStore = useNavStore();

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

  constructor() {
    this.socket = new UDPSocket({
      localAddress: "0.0.0.0",
      localPort: this.settingsStore.cyranoOptions.port,
    });
    if (!this.socket) {
      this.cyranoLog("startCyrano", "Socket not connected");
      return;
    }
    this.matchStore.$reset();
  }
  async startCyrano() {
    const { readable, writable } = await this.socket.opened;
    this.readab = readable;
    this.writeab = writable;
    this.reader = this.readab.getReader();
    this.writer = this.writeab.getWriter();
    console.log("startCyrano");
    new Promise((res, rej) => this.runner(res, rej, "NEXT")).catch((reason) => {
      console.log(reason);
    });
  }
  async stopCyrano(resolve: (value?: any) => void) {
    this.writer?.releaseLock();
    this.reader?.releaseLock();
    await this.socket.close();
    this.sendingData = false;
    this.cyranoState = "Closed";
    this.settingsStore.settings.rounds = 1;
    this.settingsStore.settings.maxScore = 5;
    this.matchStore.matches[""] = [
      defaultFencerStatus(),
      defaultFencerStatus(),
    ];
    this.matchStore.status.match = "";
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
      this.settingsStore.cyranoOptions.protocol = cyranoMsg.protocol;
      msg = this.tester(reject, cyranoMsg);
      console.log(msg);
    } catch (error) {
      if (this.cyranoState === "Closed") {
        return reject("Cyrano ended");
      }
      await new Promise((resolve) => setTimeout(resolve, 100, ""));
      if (this.matchStore.status.state === "E") {
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
        if (cyranoMsg.com === "DISP" && cyranoMsg.status.poultab !== "") {
          if (this.knowList === 0) {
            if (cyranoMsg.status.poultab === "X") {
              if (this.cyranoState !== "No Bouts") {
                this.cyranoState = "No Bouts";
                this.navStore.page = "tournament";
                this.navStore.menu = true;
                return "PREV";
              } else {
                // reset()
              }
            } else if (
              cyranoMsg.status.state === "E" ||
              cyranoMsg.leftfencer.status !== "U" ||
              cyranoMsg.rightfencer.status !== "U"
            ) {
              if (
                typeof this.matchStore.matches[cyranoMsg.status.match] ===
                "undefined"
              ) {
                this.matchStore.matches[cyranoMsg.status.match] = [
                  defaultFencerStatus(),
                  defaultFencerStatus(),
                ];
              }
              const mat = this.matchStore.matches[cyranoMsg.status.match] ?? [
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
            } else {
              this.set(cyranoMsg);
              if (
                !(
                  fencerEqual(this.matchStore.match[0], cyranoMsg.leftfencer) &&
                  fencerEqual(this.matchStore.match[1], cyranoMsg.rightfencer)
                )
              ) {
                this.matchStore.$reset();
                this.cyranoState = "Waiting";
                this.knowList = 1;
                return "PREV";
              }
              this.matchStore.status.stopwatch =
                this.settingsStore.settings.maxTime;
              this.navStore.page = "bout";
              this.navStore.menu = true;
              this.cyranoState = "Bout";
              this.prevDisp = cyranoMsg;
              this.bout().then();
            }
          } else {
            if (cyranoMsg.status.poultab === "X") {
              this.knowList = -1;
            } else {
              if (
                typeof this.matchStore.matches[cyranoMsg.status.match] ===
                "undefined"
              ) {
                this.matchStore.matches[cyranoMsg.status.match] = [
                  defaultFencerStatus(),
                  defaultFencerStatus(),
                ];
              }
              const mat = this.matchStore.matches[cyranoMsg.status.match] ?? [
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
                Number(min(Object.keys(omit(this.matchStore.matches, ""))))
              ) {
                if (cyranoMsg.status.match === this.prev) {
                  this.knowList = 0;
                  this.prev = 0;
                } else {
                  this.prev = cyranoMsg.status.match;
                }
              }
            }
            if (this.knowList > 0) {
              return "NEXT";
            } else {
              return "PREV";
            }
          }
        } else if (cyranoMsg.com === "HELLO") {
          this.settingsStore.settings.compe = cyranoMsg.compe;
          this.settingsStore.settings.piste = cyranoMsg.piste;
          return "NEXT";
        }
        break;
      case "Bout":
        if (cyranoMsg.com === "HELLO") {
          return "INFO";
        }
        break;
      case "Ending":
        if (cyranoMsg.com === "ACK") {
          console.log("ACK");
          this.matchStore.$reset();
          this.cyranoState = "Waiting";
          return "NEXT";
        } else if (cyranoMsg.com === "NAK") {
          this.nak = true;
          this.navStore.page = "nak";
          this.navStore.menu = true;
          return "";
        }
        return "INFO";
    }
    return "";
  }
  unNak() {
    this.nak = false;
    this.navStore.page = "tournament";
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
    this.reader?.releaseLock();
    this.writer?.releaseLock();
    this.writer = this.writeab?.getWriter();
    await this.write("INFO", "writeRepeat");
    this.reader = this.readab?.getReader();
    for (let i = 0; i < 10; i++) {
      if (this.check()) return resolve();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    console.log(this.matchStore.status.state);
    await this.writeRepeat(resolve, reject);
  }
  check(): boolean {
    if (this.matchStore.status.state === "E") {
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
    this.settingsStore.settings.piste = cyr.piste;
    this.settingsStore.settings.compe = cyr.compe;
    this.settingsStore.settings.phase = cyr.phase === "" ? 0 : cyr.phase;
    this.matchStore.status = cyr.status as CorrectStatus;
    this.settingsStore.settings.maxTime = 180;
    switch (this.matchStore.status.poultab[0]) {
      case "P":
        this.settingsStore.settings.rounds = this.matchStore.status.round;
        break;
      default:
        this.settingsStore.settings.rounds =
          this.settingsStore.cyranoOptions.roundsPerTableMatch;
    }
    this.settingsStore.settings.maxScore =
      (this.settingsStore.settings.rounds - this.matchStore.status.round + 1) *
      this.settingsStore.cyranoOptions.pointsPerPeriod;
    this.settingsStore.settings.allowTies = false;
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
    this.settingsStore.cyranoOptions.remoteAddress = remoteAddress;
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
    this.settingsStore.cyranoOptions.ret = com;
    console.log(process, this.matchStore.cyranoMatch);
    let message = this.matchStore.cyranoMatch.toString();
    await this.writer?.ready;
    await this.writer?.write({
      data: this.encoder.encode(message),
      remoteAddress: this.settingsStore.cyranoOptions.remoteAddress,
      remotePort: this.settingsStore.cyranoOptions.port,
    });
    this.cyranoLog(
      process,
      "sent",
      message,
      "on port",
      this.settingsStore.cyranoOptions.port,
      "to",
      this.settingsStore.cyranoOptions.remoteAddress,
    );
  }
  cyranoLog(process: string, ...args: any) {
    console.log("process", process, ":", ...args);
    this.cyranoOut = args.join(" ");
  }
}
