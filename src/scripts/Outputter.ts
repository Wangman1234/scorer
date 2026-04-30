/**
 * Copyright 2026 Scorer
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
import { useSettingsStore } from "@/stores/settings.ts";
import { type MaybeRefOrGetter, toValue } from "vue";
import {
  type CorrectFencerStatus,
  type CorrectStatus,
  emptyFencer,
  emptyFencerStatus,
  FencerList,
  type FencerStatus,
} from "@/scripts/Types.ts";
import { useNavStore } from "@/stores/nav.ts";
import { defaultFencerStatus } from "@/scripts/Functions.ts";
import { CyranoMessage } from "@/scripts/CyranoMessage.ts";
import type { Round } from "@/scripts/Round.ts";
import { isEmpty } from "underscore";

export class Outputter {
  settings = useSettingsStore();
  nav = useNavStore();

  matches: MaybeRefOrGetter<
    Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
  >;
  status: MaybeRefOrGetter<[CorrectStatus]>;
  devices: MaybeRefOrGetter<number[]>;
  rounds: MaybeRefOrGetter<Round[]>;
  fencers: MaybeRefOrGetter<FencerList>;
  $reset: () => void;

  selfState = "No Bouts";

  socket?: UDPSocket;
  readab?: ReadableStream;
  writeab?: WritableStream;
  reader?: ReadableStreamDefaultReader;
  writer?: WritableStreamDefaultWriter;
  decoder = new TextDecoder();
  encoder = new TextEncoder();
  cyranoOut = "";
  cyranoState = "Waiting";
  deviceState: { [device: number]: number } = {};
  cyranoMatches: {
    [device: number]: Record<
      number,
      [CorrectFencerStatus, CorrectFencerStatus]
    >;
  } = {};
  cyranoMatch: {
    [device: number]: number;
  } = {};
  cyranoTempMatch: {
    [device: number]: [FencerStatus, FencerStatus];
  } = {};

  constructor(
    matches: MaybeRefOrGetter<
      Record<number | "", [CorrectFencerStatus, CorrectFencerStatus]>
    >,
    status: MaybeRefOrGetter<[CorrectStatus]>,
    rounds: MaybeRefOrGetter<Round[]>,
    fencers: MaybeRefOrGetter<FencerList>,
    $reset: () => void,
    devices: MaybeRefOrGetter<number[]>,
  ) {
    this.matches = matches;
    this.status = status;
    this.rounds = rounds;
    this.fencers = fencers;
    this.$reset = $reset;
    this.devices = devices;

    if (Object.keys(this.settings.mockOptions.devices).length > 0) {
      this.socket = new UDPSocket({
        localAddress: "0.0.0.0",
        localPort: this.settings.mockOptions.port,
      });
      if (!this.socket) {
        this.cyranoLog("startCyrano", "Socket not connected");
        return;
      }
    }
    if (this.settings.mockOptions.useSelf) {
      this.$reset();
      this.settings.settings.allowTies = false;
      this.selfState = "No Bouts";
      console.log(this.selfState);
      this.deviceState[this.settings.mockOptions.useSelf] = 0;
    }
  }
  async startCyrano() {
    if (!this.socket) {
      return;
    }
    console.log(this.socket);
    const { readable, writable } = await this.socket.opened;
    this.readab = readable;
    this.writeab = writable;
    this.reader = this.readab?.getReader();
    this.writer = this.writeab?.getWriter();
    console.log("startCyrano");
    for (const piste of toValue(this.devices).filter(
      (v) => v !== this.settings.mockOptions.useSelf,
    )) {
      console.log(piste);
      new Promise((res) => this.hello(res, piste)).catch((reason) => {
        console.log(reason);
      });
    }
    new Promise((res, rej) => this.runner(res, rej)).catch((reason) => {
      console.log(reason);
    });
  }
  async stopCyrano(resolve: (value?: any) => void) {
    this.writer?.releaseLock();
    this.reader?.releaseLock();
    await this.socket?.close();
    this.cyranoState = "Closed";
    this.cyranoLog("stopCyrano", "finished");
    resolve();
  }
  async hello(resolve: (value?: any) => void, device: number) {
    await this.write(
      "HELLO",
      "hello " + device.toString(),
      new CyranoMessage("EFP1.1", "HELLO", "0", "0"),
      device,
    );
    this.deviceState[device] = (this.deviceState[device] ?? 100) + 1;
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await this.hello(resolve, device);
  }
  async runner(resolve: (value?: any) => void, reject: (reason?: any) => void) {
    try {
      this.cyranoLog("runner", "waiting for message");
      const read = await this.read("runner");
      if (read === true) {
        return resolve();
      }
      const [remoteAddress, cyranoMsg] = read;
      const device =
        Object.fromEntries(
          Object.entries(this.settings.mockOptions.devices).map((v) => [
            v[1].remoteAddress,
            +v[0],
          ]),
        )[remoteAddress] ?? 0;
      if (device !== 0) {
        this.deviceState[device] = 0;
        switch (cyranoMsg.com) {
          case "NEXT":
            if (
              typeof this.cyranoMatch[device] !== "undefined" &&
              typeof this.cyranoMatches[device] !== "undefined" &&
              this.cyranoMatch[device] <=
                Math.max(
                  ...Object.keys(this.cyranoMatches[device]).map((v) => +v),
                )
            ) {
              this.cyranoMatch[device]++;
            }
            await this.write("DISP", "runner", cyranoMsg, device);
            break;
          case "PREV":
            if (
              typeof this.cyranoMatch[device] !== "undefined" &&
              typeof this.cyranoMatches[device] !== "undefined" &&
              this.cyranoMatch[device] >
                Math.min(
                  ...Object.keys(this.cyranoMatches[device]).map((v) => +v),
                )
            ) {
              this.cyranoMatch[device]--;
            }
            await this.write("DISP", "runner", cyranoMsg, device);
            break;
          case "INFO":
            this.cyranoTempMatch[device] = [
              cyranoMsg.leftfencer,
              cyranoMsg.rightfencer,
            ];
            if (cyranoMsg.status.state === "E") {
              let reason = "No victor";
              if (
                (this.cyranoTempMatch[device][0].status === "V" ||
                  this.cyranoTempMatch[device][1].status === "V") &&
                (cyranoMsg.status.priority !== "N" ||
                  this.cyranoTempMatch[device][0].score !==
                    this.cyranoTempMatch[device][1].score)
              ) {
                if (
                  typeof this.cyranoMatches[device] === "undefined" ||
                  typeof this.cyranoMatch[device] === "undefined" ||
                  typeof this.cyranoMatches[device][
                    this.cyranoMatch[device]
                  ] === "undefined"
                ) {
                  throw new Error("Match not found");
                }
                const fencer0 = (this.cyranoMatches[device][
                  this.cyranoMatch[device]
                ] ?? [emptyFencerStatus, emptyFencerStatus])[0];
                const fencer1 = (this.cyranoMatches[device][
                  this.cyranoMatch[device]
                ] ?? [emptyFencerStatus, emptyFencerStatus])[1];
                const leftFencer = this.cyranoTempMatch[device][0];
                const rightFencer = this.cyranoTempMatch[device][1];

                let correct = false;
                let f0 = fencer0;
                let f1 = fencer1;
                console.log(
                  leftFencer.fencer.id == fencer0.fencer.id &&
                    rightFencer.fencer.id == fencer1.fencer.id,
                );
                console.log(typeof leftFencer.fencer.id);
                console.log(typeof fencer0.fencer.id);
                console.log(typeof rightFencer.fencer.id);
                console.log(typeof fencer1.fencer.id);
                if (
                  leftFencer.fencer.id === fencer0.fencer.id &&
                  rightFencer.fencer.id === fencer1.fencer.id
                ) {
                  correct = true;
                } else if (
                  leftFencer.fencer.id === fencer1.fencer.id &&
                  rightFencer.fencer.id === fencer0.fencer.id
                ) {
                  f0 = fencer1;
                  f1 = fencer0;
                  correct = true;
                }
                if (correct) {
                  f0.score = leftFencer.score;
                  f0.status = leftFencer.status;
                  f1.score = rightFencer.score;
                  f1.status = rightFencer.status;
                  await this.write("ACK", "end", cyranoMsg, device);
                  toValue(this.rounds)[
                    toValue(this.rounds).length - 1
                  ]?.update();
                  toValue(this.fencers).update(toValue(this.rounds).length);
                  break;
                }
                reason =
                  "fencers not correct, received [" +
                  leftFencer.fencer.id +
                  ", " +
                  rightFencer.fencer.id +
                  "], system has [" +
                  f0.fencer.id +
                  ", " +
                  f1.fencer.id +
                  "]";
              }
              this.cyranoLog("NAK", reason);
              await this.write("NAK", "end", cyranoMsg, device);
            }
            break;
        }
      }
    } catch (error) {
      if (this.cyranoState === "Closed") {
        return reject("Cyrano ended");
      }
      await new Promise((resolve) => setTimeout(resolve, 100, ""));
    }
    await this.runner(resolve, reject).catch((reason) => console.log(reason));
  }
  async read(
    process: string = "read",
  ): Promise<true | [number, CyranoMessage]> {
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
    return [remoteAddress, new CyranoMessage(decoded)];
  }
  async write(
    com: "HELLO" | "DISP" | "ACK" | "NAK" = "HELLO",
    process: string = "write",
    prev: CyranoMessage,
    device: number,
  ) {
    let message: CyranoMessage;
    switch (com) {
      case "HELLO":
        message = new CyranoMessage(
          this.settings.mockOptions.devices[device]?.protocol || "EFP1.1",
          com,
          device.toString(),
          "1",
        );
        break;
      case "DISP":
        if (
          typeof this.cyranoMatches[device] === "undefined" ||
          typeof this.cyranoMatch[device] === "undefined"
        ) {
          prev.com = com;
          message = prev;
          break;
        }
        const max = Math.max(
          ...Object.keys(this.cyranoMatches[device]).map((v) => +v),
        );
        const status: CorrectStatus = {
          doubles: 0,
          match: this.cyranoMatch[device],
          poultab: "P" + toValue(this.rounds).length.toString(),
          priority: "N",
          round: this.cyranoMatch[device],
          state: "H",
          time: "",
          stopwatch: 180,
          type: "I",
          weapon: "F",
        };
        let leftFencer: FencerStatus;
        let rightFencer: FencerStatus;
        if (this.cyranoMatch[device] > max) {
          status.match = max;
          status.poultab = "X";
          leftFencer = (this.cyranoMatches[device][max] ?? [
            emptyFencerStatus,
            emptyFencerStatus,
          ])[0];
          rightFencer = (this.cyranoMatches[device][max] ?? [
            emptyFencerStatus,
            emptyFencerStatus,
          ])[1];
        } else {
          leftFencer = (this.cyranoMatches[device][
            this.cyranoMatch[device]
          ] ?? [emptyFencerStatus, emptyFencerStatus])[0];
          rightFencer = (this.cyranoMatches[device][
            this.cyranoMatch[device]
          ] ?? [emptyFencerStatus, emptyFencerStatus])[1];
        }
        message = new CyranoMessage(
          this.settings.mockOptions.devices[device]?.protocol || "EFP1.1",
          com,
          device.toString(),
          "1",
          toValue(this.rounds).length,
          status,
          emptyFencer,
          rightFencer,
          leftFencer,
        );
        break;
      case "ACK":
      case "NAK":
        prev.com = com;
        message = prev;
        break;
      default:
        throw new Error("Unknown command " + com);
    }
    await this.writer?.ready;
    await this.writer?.write({
      data: this.encoder.encode(message.toString()),
      remoteAddress: this.settings.mockOptions.devices[device]?.remoteAddress,
      remotePort: this.settings.mockOptions.port,
    });
    this.cyranoLog(
      process,
      "sent",
      message,
      "on port",
      this.settings.mockOptions.port,
      "to",
      this.settings.mockOptions.devices[device]?.remoteAddress,
    );
  }

  assignMatches(
    matches: MaybeRefOrGetter<
      Record<number, [CorrectFencerStatus, CorrectFencerStatus]>
    >,
    round: number,
  ) {
    this.cyranoState = "Bout";
    for (const device of toValue(this.devices)) {
      this.cyranoMatches[device] = {};
    }
    let num = 0;
    for (const match of Object.values(toValue(matches))) {
      const array = this.cyranoMatches[toValue(this.devices)[num] ?? 0];
      if (typeof array !== "undefined") {
        array[Object.keys(array).length + 1] = match;
      }
      num++;
      num %= toValue(this.devices).length;
    }
    for (const device of toValue(this.devices)) {
      if (device === this.settings.mockOptions.useSelf) {
        this.$reset();
        for (const i in this.cyranoMatches[device]) {
          toValue(this.matches)[+i] = this.cyranoMatches[device][+i] ?? [
            defaultFencerStatus(),
            defaultFencerStatus(),
          ];
        }
        this.selfState = "Bout";
        const status = toValue(this.status)[0];
        status.match = 1;
        status.round = status.match || 0;
        status.state = "H";
        status.poultab = "P" + round;
        status.type = "I";
        status.weapon = "F";
        this.cyranoMatch[device] = 1;
      } else {
        if (!isEmpty(this.cyranoMatches[device])) this.cyranoMatch[device] = 0;
      }
    }
  }
  reset() {
    this.noBout();
    this.$reset();
    this.cyranoMatches = {};
    this.cyranoState = "Waiting";
    this.cyranoMatch = {};
  }

  noBout() {
    this.selfState = "No Bouts";
  }
  waiting() {
    this.selfState = "Waiting";
  }
  bout() {
    this.selfState = "Bout";
  }

  async stopOutputter() {
    if (this.settings.mockOptions.useSelf) {
      this.settings.settings.rounds = 1;
      this.settings.settings.maxScore = 5;
      toValue(this.matches)[""] = [
        defaultFencerStatus(),
        defaultFencerStatus(),
      ];
      toValue(this.status)[0].match = "";
    }
    if (this.socket) {
      await new Promise((res) => this.stopCyrano(res));
    }
  }
  cyranoLog(process: string, ...args: any) {
    console.log("process", process, ":", ...args);
    this.cyranoOut = args.join(" ");
  }
}
