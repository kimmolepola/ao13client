import * as types from "../../types";

const dataView = new DataView(new ArrayBuffer(2));

const oneFrame60FPS = 1000 / 60;
const twoFrames60FPS = oneFrame60FPS * 2;

const get60FPSFramesMax3 = (ms: number) => {
  if (ms > twoFrames60FPS) return 3;
  if (ms > oneFrame60FPS) return 2;
  if (ms > 0) return 1;
  return 0;
};

function set2BitValue(pos: 0 | 2 | 4 | 6 | 8 | 10 | 12 | 14, value: number) {
  // pos = bit index where the 2‑bit field starts (0 | 2 | 4 | 6 | 8 | 10 | 12 | 14)
  // value = number 0–3

  const current = dataView.getUint16(1); // big‑endian read
  const mask = 0b11 << pos;
  const updated = (current & ~mask) | ((value & 0b11) << pos);
  dataView.setUint16(1, updated, false); // big‑endian write
}

export const gatherControlsDataBinary = (
  o: types.SharedGameObject,
  tickNumber: number
) => {
  set2BitValue(0, get60FPSFramesMax3(o.controlsOverChannelsUp));
  set2BitValue(2, get60FPSFramesMax3(o.controlsOverChannelsDown));
  set2BitValue(4, get60FPSFramesMax3(o.controlsOverChannelsLeft));
  set2BitValue(6, get60FPSFramesMax3(o.controlsOverChannelsRight));
  set2BitValue(8, get60FPSFramesMax3(o.controlsOverChannelsSpace));
  set2BitValue(10, get60FPSFramesMax3(o.controlsOverChannelsD));
  set2BitValue(12, get60FPSFramesMax3(o.controlsOverChannelsF));
  set2BitValue(14, get60FPSFramesMax3(o.controlsOverChannelsE));

  const byte2 = dataView.getUint8(1);
  const byte3 = dataView.getUint8(2);

  if (!byte2 && !byte3) {
    return undefined;
  }

  dataView.setUint8(0, tickNumber);

  if (byte3) {
    return dataView.buffer;
  }

  return new Uint8Array(dataView.buffer, 0, 2).buffer;
};
