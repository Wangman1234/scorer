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
