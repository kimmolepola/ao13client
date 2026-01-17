import * as types from "../../types";
import * as parameters from "../../parameters";

const buffer5 = new ArrayBuffer(5);
const buffer4 = new ArrayBuffer(4);
const buffer3 = new ArrayBuffer(3);
const buffer2 = new ArrayBuffer(2);
const dataViews = {
  5: new DataView(buffer5),
  4: new DataView(buffer4),
  3: new DataView(buffer3),
  2: new DataView(buffer2),
};

let prevRoundingUp = 0;
let prevRoundingDown = 0;
let prevRoundingLeft = 0;
let prevRoundingRight = 0;
let prevRoundingSpace = 0;
let prevRoundingKeyD = 0;
let prevRoundingKeyF = 0;

export const gatherControlsDataBinary = (
  o: types.SharedGameObject,
  deltaCumulative: number
) => {
  const factor = parameters.controlToNetworkFactor;
  const decimalUp = o.controlsOverChannelsUp * factor - prevRoundingUp;
  const decimalDown = o.controlsOverChannelsDown * factor - prevRoundingDown;
  const decimalLeft = o.controlsOverChannelsLeft * factor - prevRoundingLeft;
  const decimalRight = o.controlsOverChannelsRight * factor - prevRoundingRight;
  const decimalSpace = o.controlsOverChannelsSpace * factor - prevRoundingSpace;
  const decimalKeyD = o.controlsOverChannelsD * factor - prevRoundingKeyD;
  const decimalKeyF = o.controlsOverChannelsF * factor - prevRoundingKeyF;

  const up = Math.round(decimalUp);
  const down = Math.round(decimalDown);
  const left = Math.round(decimalLeft);
  const right = Math.round(decimalRight);
  const space = Math.round(decimalSpace);
  const keyD = Math.round(decimalKeyD);
  const keyF = Math.round(decimalKeyF);

  prevRoundingUp = up - decimalUp;
  prevRoundingDown = down - decimalDown;
  prevRoundingLeft = left - decimalLeft;
  prevRoundingRight = right - decimalRight;
  prevRoundingSpace = space - decimalSpace;
  prevRoundingKeyD = keyD - decimalKeyD;
  prevRoundingKeyF = keyF - decimalKeyF;

  let length = 0;
  up && length++;
  down && length++;
  left && length++;
  right && length++;
  space && length++;
  keyD && length++;
  keyF && length++;
  length = 1 + Math.ceil(length / 2);

  if (length < 2) return;

  const byteLength = length as 2 | 3 | 4 | 5;

  let providedControls1to7 = 0b00000000;
  up && (providedControls1to7 |= 0b00000001);
  down && (providedControls1to7 |= 0b00000010);
  left && (providedControls1to7 |= 0b00000100);
  right && (providedControls1to7 |= 0b00001000);
  space && (providedControls1to7 |= 0b00010000);
  keyD && (providedControls1to7 |= 0b00100000);
  keyF && (providedControls1to7 |= 0b01000000);

  const dataView = dataViews[byteLength];
  dataView.setUint8(0, providedControls1to7);

  let offset = 1;
  let position: 0 | 4 = 0;
  let byte = 0;

  const insertValue = (value: number) => {
    if (position) {
      byte |= value << position;
      dataView.setUint8(offset, byte);
      position = 0;
      offset++;
    } else {
      byte = value;
      dataView.setUint8(offset, byte);
      position = 4;
    }
  };

  up && insertValue(up);
  down && insertValue(down);
  left && insertValue(left);
  right && insertValue(right);
  space && insertValue(space);
  keyD && insertValue(keyD);
  keyF && insertValue(keyF);

  o.controlsOverChannelsUp -= deltaCumulative;
  o.controlsOverChannelsDown -= deltaCumulative;
  o.controlsOverChannelsLeft -= deltaCumulative;
  o.controlsOverChannelsRight -= deltaCumulative;
  o.controlsOverChannelsSpace -= deltaCumulative;
  o.controlsOverChannelsD -= deltaCumulative;
  o.controlsOverChannelsF -= deltaCumulative;

  o.controlsOverChannelsUp < 0 && (o.controlsOverChannelsUp = 0);
  o.controlsOverChannelsDown < 0 && (o.controlsOverChannelsDown = 0);
  o.controlsOverChannelsLeft < 0 && (o.controlsOverChannelsLeft = 0);
  o.controlsOverChannelsRight < 0 && (o.controlsOverChannelsRight = 0);
  o.controlsOverChannelsSpace < 0 && (o.controlsOverChannelsSpace = 0);
  o.controlsOverChannelsD < 0 && (o.controlsOverChannelsD = 0);
  o.controlsOverChannelsF < 0 && (o.controlsOverChannelsF = 0);

  return dataView.buffer;
};
