import * as types from "./types";

export const objects: types.GameObject[] = [];
export const peerConnections: types.PeerConnection[] = [];
export const state: { main: boolean; ownId: string | undefined } = {
  main: false,
  ownId: undefined,
};
export const canvasSize: { halfWidth: number; halfHeight: number } = {
  halfWidth: window.innerWidth / 2,
  halfHeight: window.innerHeight / 2,
};
