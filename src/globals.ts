import * as types from "./types";

export const remoteObjects: types.RemoteGameObject[] = [];
export const localObjects: types.LocalGameObject[] = [];
export const gameServer: {
  connection: types.PeerConnection | undefined;
} = { connection: undefined };
export const state: { ownId: string | undefined } = {
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
