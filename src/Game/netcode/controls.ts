import * as types from "../../types";
import * as globals from "../../globals";

const dataView = new DataView(new ArrayBuffer(3));

const oneFrame60FPS = 1000 / 60;
const twoFrames60FPS = oneFrame60FPS * 2;

const get60FPSFramesMax3 = (ms: number) => {
  if (ms > twoFrames60FPS) return 3;
  if (ms > oneFrame60FPS) return 2;
  if (ms > 0) return 1;
  return 0;
};

type Pos = 0 | 2 | 4 | 6 | 8 | 10 | 12 | 14;
function set2BitValue(pos: Pos, value: number) {
  // pos = bit index where the 2‑bit field starts (0 | 2 | 4 | 6 | 8 | 10 | 12 | 14)
  // value = number 0–3

  const current = dataView.getUint16(1); // big‑endian read
  const mask = 0b11 << pos;
  const updated = (current & ~mask) | ((value & 0b11) << pos);
  dataView.setUint16(1, updated, false); // big‑endian write
}

const Key = types.Key;
const curTickKeyValues = globals.curTickKeyValues;

export const twoBitTickVals: { [key in types.Key]: number } = {
  ArrowUp: 0,
  ArrowDown: 0,
  ArrowLeft: 0,
  ArrowRight: 0,
  Space: 0,
  KeyD: 0,
  KeyF: 0,
  KeyE: 0,
};

const handle2BitValue = (
  key: types.Key,
  pos: Pos,
  ownTickObj: types.TickStateObject | undefined
) => {
  const val = get60FPSFramesMax3(curTickKeyValues[key]);
  if (ownTickObj) {
    key === types.Key.ArrowUp && (ownTickObj.inputsUp = val);
    key === types.Key.ArrowDown && (ownTickObj.inputsDown = val);
    key === types.Key.ArrowLeft && (ownTickObj.inputsLeft = val);
    key === types.Key.ArrowRight && (ownTickObj.inputsRight = val);
    key === types.Key.Space && (ownTickObj.inputsSpace = val);
    key === types.Key.KeyD && (ownTickObj.inputsD = val);
    key === types.Key.KeyF && (ownTickObj.inputsF = val);
    key === types.Key.KeyE && (ownTickObj.inputsE = val);
  }
  twoBitTickVals[key] = val;
  set2BitValue(pos, val);
  curTickKeyValues[key] = 0;
};

export const gatherControlsDataBinary = (
  tickNumber: number,
  ownTickObj: types.TickStateObject | undefined
) => {
  // buf[1] (positions 8–14): directional keys
  handle2BitValue(Key.ArrowUp, 8, ownTickObj);
  handle2BitValue(Key.ArrowDown, 10, ownTickObj);
  handle2BitValue(Key.ArrowLeft, 12, ownTickObj);
  handle2BitValue(Key.ArrowRight, 14, ownTickObj);
  // buf[2] (positions 0–6): action keys
  handle2BitValue(Key.Space, 0, ownTickObj);
  handle2BitValue(Key.KeyD, 2, ownTickObj);
  handle2BitValue(Key.KeyF, 4, ownTickObj);
  handle2BitValue(Key.KeyE, 6, ownTickObj);

  const byte2 = dataView.getUint8(1); // directional keys
  const byte3 = dataView.getUint8(2); // action keys

  if (!byte2 && !byte3) {
    return undefined;
  }

  console.log("--controls:", tickNumber);
  dataView.setUint8(0, tickNumber);

  if (!byte3) {
    return dataView.buffer.slice(0, 2); // 2 bytes: no action keys
  }

  return dataView.buffer.slice(0, 3); // 3 bytes: directional + action keys
};

// export const gatherControlsDataBinary = (
//   o: types.SharedGameObject,
//   tickNumber: number
// ) => {
//   set2BitValue(0, get60FPSFramesMax3(o.controlsOverChannelsUp));
//   set2BitValue(2, get60FPSFramesMax3(o.controlsOverChannelsDown));
//   set2BitValue(4, get60FPSFramesMax3(o.controlsOverChannelsLeft));
//   set2BitValue(6, get60FPSFramesMax3(o.controlsOverChannelsRight));
//   set2BitValue(8, get60FPSFramesMax3(o.controlsOverChannelsSpace));
//   set2BitValue(10, get60FPSFramesMax3(o.controlsOverChannelsD));
//   set2BitValue(12, get60FPSFramesMax3(o.controlsOverChannelsF));
//   set2BitValue(14, get60FPSFramesMax3(o.controlsOverChannelsE));

//   const byte2 = dataView.getUint8(1);
//   const byte3 = dataView.getUint8(2);

//   if (!byte2 && !byte3) {
//     return undefined;
//   }

//   dataView.setUint8(0, tickNumber);

//   if (byte3) {
//     return dataView.buffer;
//   }

//   return new Uint8Array(dataView.buffer, 0, 2).buffer;
// };
