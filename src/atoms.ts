import { RefObject } from "react";
import { atom } from "recoil";
import { Socket } from "socket.io-client";

import * as types from "./types";
import * as parameters from "./parameters";

export const windowSize = atom<{ width: number; height: number }>({
  key: "windowSize",
  default: { width: window.innerWidth, height: window.innerHeight },
});

export const sidepanelGeometry = atom<{
  position: types.Position;
  size: number;
}>({
  key: "sidepanelGeometry",
  default: {
    position: types.Position.BOTTOM,
    size: parameters.sidepanelDefaultSize,
  },
});

export const iceServers = atom<
  { urls: string; username: string; credential: string }[] | undefined
>({
  key: "iceServers",
  default: undefined,
});

export const score = atom<number>({
  key: "score",
  default: 0,
});

export const overlayInfotext = atom<RefObject<HTMLDivElement> | undefined>({
  key: "overlayInfotext",
  default: undefined,
  dangerouslyAllowMutability: true,
});

export const chatMessages = atom<types.ChatMessage[]>({
  key: "chatMessages",
  default: [],
});

export const objectIds = atom<string[]>({
  key: "objectIds",
  default: [],
});

export const connectedAmount = atom<number>({
  key: "connectedAmount",
  default: 0,
});

export const connectedIdsOnMain = atom<string[]>({
  key: "connectedIds",
  default: [],
});

export const main = atom<boolean>({
  key: "main",
  default: false,
});

export const channelsOrdered = atom<
  { remoteId: string; channel: RTCDataChannel }[]
>({
  key: "channelsOrdered",
  default: [],
});

export const channelsUnordered = atom<
  { remoteId: string; channel: RTCDataChannel }[]
>({
  key: "channelsUnordered",
  default: [],
});

export const connectionMessage = atom<string | undefined>({
  key: "connectionMessage",
  default: undefined,
});

export const user = atom<
  | {
      token: string | undefined;
      username: string;
      score: number;
    }
  | undefined
>({
  key: "user",
  default: undefined,
});

export const socket = atom<
  undefined | (Socket & { auth: { [key: string]: any } })
>({
  key: "socket",
  default: undefined,
  dangerouslyAllowMutability: true,
});

export const page = atom<"frontpage" | "game">({
  key: "page",
  default: "frontpage",
});
