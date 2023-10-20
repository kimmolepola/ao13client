import * as types from "./types";

export const objects: types.RemoteGameObject[] = [];
export const localObjects: types.LocalGameObject[] = [];
export const peerConnections: types.PeerConnection[] = [];
export const state: { main: boolean; ownId: string | undefined } = {
  main: false,
  ownId: undefined,
};
export const dimensions: {
  windowWidth: number;
  windowHeight: number;
  canvasHalfWidth: number;
  canvasHalfHeight: number;
} = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  canvasHalfWidth: window.innerWidth / 2,
  canvasHalfHeight: window.innerHeight / 2,
};
