import * as types from "./types";

export const accessToken: { value: string | undefined } = { value: undefined };
export const sharedObjects: types.SharedGameObject[] = [];
export const positionObjects: types.PositionObject[] = [];
export const localObjects: types.LocalGameObject[] = [];
export const pendingLocalObjects: types.LocalGameObject[] = [];
export const staticObjects: types.StaticGameObject[] = [];
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
  radarBoxHalfWidth: number;
  worldToRadarPositionRatio: number;
} = {
  windowWidth: window.innerWidth,
  windowHeight: window.innerHeight,
  canvasHalfWidth: window.innerWidth / 2,
  canvasHalfHeight: window.innerHeight / 2,
  radarBoxHalfWidth: 0,
  worldToRadarPositionRatio: 1,
};

export const keys: Record<types.Key, boolean> = {
  [types.Key.ArrowUp]: false,
  [types.Key.ArrowDown]: false,
  [types.Key.ArrowLeft]: false,
  [types.Key.ArrowRight]: false,
  [types.Key.Space]: false,
  [types.Key.KeyD]: false,
  [types.Key.KeyF]: false,
  [types.Key.KeyE]: false,
};

export const curTickKeyValues: Record<string, number> = {
  [types.Key.ArrowUp]: 0,
  [types.Key.ArrowDown]: 0,
  [types.Key.ArrowLeft]: 0,
  [types.Key.ArrowRight]: 0,
  [types.Key.Space]: 0,
  [types.Key.KeyD]: 0,
  [types.Key.KeyF]: 0,
  [types.Key.KeyE]: 0,
};
