import * as types from "./types";

export const objects: types.GameObject[] = [];
export const peerConnections: types.PeerConnection[] = [];
export const state: { main: boolean; ownId: string | undefined } = {
  main: false,
  ownId: undefined,
};
export const windowSize: { width: number; height: number } = {
  width: window.innerWidth,
  height: window.innerHeight,
};
