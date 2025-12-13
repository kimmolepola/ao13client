import * as types from "./types";

export const accessToken: { value: string | undefined } = { value: undefined };
export const remoteObjects: types.RemoteGameObject[] = [];
export const localObjects: types.LocalGameObject[] = [];
export const gameServer: {
  connection: types.ConnectionObject | undefined;
} = { connection: undefined };
export const state: {
  ownId: string | undefined;
  ownRemoteObjectIndex: number | undefined;
} = {
  ownId: undefined,
  ownRemoteObjectIndex: undefined,
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
