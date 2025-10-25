import * as types from "src/types";
import * as parameters from "src/parameters";

export const checkHealth = (
  remoteGameObject: types.RemoteGameObject,
  gameEventHandler: types.GameEventHandler
) => {
  if (remoteGameObject.health <= 0) {
    gameEventHandler({
      type: types.EventType.HEALTH_ZERO,
      data: remoteGameObject,
    });
  }
};

export const handleKeys = (
  delta: number,
  gameObject: types.RemoteGameObject
) => {
  const o = gameObject;
  o.keyDowns.forEach((key) => {
    switch (key) {
      case types.Keys.Up:
        o.controlsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.Down:
        o.controlsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.Left:
        o.controlsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.Right:
        o.controlsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      case types.Keys.Space:
        o.controlsSpace += delta;
        o.controlsOverChannelsSpace += delta;
        break;
      case types.Keys.D:
        o.controlsD += delta;
        o.controlsOverChannelsD += delta;
        break;
      case types.Keys.F:
        o.controlsF += delta;
        o.controlsOverChannelsF += delta;
        break;
      default:
        break;
    }
  });
};

export const handleShot = (
  delta: number,
  gameObject: types.RemoteGameObject,
  gameEventHandler: types.GameEventHandler
) => {
  const o = gameObject;
  if (o.controlsSpace) {
    const timeQuantity = o.controlsSpace > delta ? delta : o.controlsSpace;
    o.controlsSpace -= timeQuantity;

    //shooting
    if (o.shotDelay - timeQuantity <= 0) {
      // shoot
      o.shotDelay += parameters.shotDelay;
      o.object3d &&
        gameEventHandler({
          type: types.EventType.SHOT,
          data: { object3d: o.object3d, speed: o.speed },
        });
    }
  }
  o.shotDelay -= Math.min(delta, o.shotDelay);
};

export const resetControlValues = (gameObject: types.RemoteGameObject) => {
  const o = gameObject;
  o.controlsOverChannelsUp = 0;
  o.controlsOverChannelsDown = 0;
  o.controlsOverChannelsLeft = 0;
  o.controlsOverChannelsRight = 0;
  o.controlsOverChannelsSpace = 0;
  o.controlsOverChannelsD = 0;
  o.controlsOverChannelsF = 0;
};

const buffer = new ArrayBuffer(6);
const dataView = new DataView(buffer);
export const gatherControlsDataBinary = (o: types.RemoteGameObject) => {
  const up = Math.round(o.controlsOverChannelsUp);
  const down = Math.round(o.controlsOverChannelsDown);
  const left = Math.round(o.controlsOverChannelsLeft);
  const right = Math.round(o.controlsOverChannelsRight);
  const space = Math.round(o.controlsOverChannelsSpace);
  const d = Math.round(o.controlsOverChannelsD);
  const f = Math.round(o.controlsOverChannelsF);
  if (
    up === 0 &&
    down === 0 &&
    left === 0 &&
    right === 0 &&
    space === 0 &&
    d === 0 &&
    f === 0
  ) {
    return undefined;
  }
  let providedValues = 0b00000000;
  let offset = 1;
  if (up !== 0) {
    providedValues |= 0b00000001;
    dataView.setUint8(offset, up);
    offset += 1;
  }
  if (down !== 0) {
    providedValues |= 0b00000010;
    dataView.setUint8(offset, down);
    offset += 1;
  }
  if (left !== 0) {
    providedValues |= 0b00000100;
    dataView.setUint8(offset, left);
    offset += 1;
  }
  if (right !== 0) {
    providedValues |= 0b00001000;
    dataView.setUint8(offset, right);
    offset += 1;
  }
  if (space !== 0) {
    providedValues |= 0b00010000;
    dataView.setUint8(offset, space);
    offset += 1;
  }
  if (d !== 0) {
    providedValues |= 0b00100000;
    dataView.setUint8(offset, d);
    offset += 1;
  }
  if (f !== 0) {
    providedValues |= 0b01000000;
    dataView.setUint8(offset, f);
    offset += 1;
  }
  dataView.setUint8(0, providedValues);
  return buffer;
};
