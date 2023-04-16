import * as types from "./types";

export const objects: types.GameObject[] = [];
export const peerConnections: types.PeerConnection[] = [];
export const state = {
  main: false,
  panelPosition: types.Position.RIGHT,
  panelSizePercent: 20,
};
