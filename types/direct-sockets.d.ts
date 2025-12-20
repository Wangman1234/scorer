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

/**
 * https://wicg.github.io/direct-sockets/#dom-udpsocket
 */
declare class UDPSocket {
  constructor(options?: UDPSocketOptions);

  opened: Promise<UDPSocketInfo>;
  closed: Promise<void>;

  close(): Promise<void>;
}

/* https://wicg.github.io/direct-sockets/#dom-udpsocketoptions */
interface UDPSocketOptions {
  remoteAddress?: string;
  remotePort?: number;

  localAddress?: string;
  localPort?: number;

  sendBufferSize?: number;
  recieveBufferSize?: number;

  dnsQueryType?: "ipv4" | "ipv6";
  ipv6Only?: boolean;

  multicastTimeToLive?: number;
  multicastLoopback?: boolean;
  multicastAllowAddressSharing?: boolean;
}

/* https://wicg.github.io/direct-sockets/#dom-udpsocketopeninfo */
interface UDPSocketInfo {
  readable: ReadableStream;
  writable: WritableStream;

  remoteAddress: string;
  remotePort: number;

  localAddress: string;
  localPort: number;

  multicastController?: MulticastController;
}

/* https://wicg.github.io/direct-sockets/#dom-multicastgroupoptions */
interface MulticastGroupOptions {
  sourceAddress: string;
}

/* https://wicg.github.io/direct-sockets/#dom-multicastmembership */
interface MulticastMembership {
  groupAddress: string;
  sourceAddress: string;
}

/* https://wicg.github.io/direct-sockets/#dom-multicastcontroller */
interface MulticastController {
  joinGroup(
    groupAddress: string,
    options: MulticastGroupOptions,
  ): Promise<void>;
  leaveGroup(
    groupAddress: string,
    options: MulticastGroupOptions,
  ): Promise<void>;
  joinedGroups: Readonly<Array<string | MulticastMembership>>;
}
