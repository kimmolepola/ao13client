import * as types from "../../types";

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
