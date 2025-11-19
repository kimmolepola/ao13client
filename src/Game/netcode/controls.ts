import * as types from "../../types";
import * as parameters from "../../parameters";

const buffer = new ArrayBuffer(1);
const dataView = new DataView(buffer);
export const gatherControlsDataBinary = (o: types.RemoteGameObject) => {
  const up = o.controlsOverChannelsUp;
  const down = o.controlsOverChannelsDown;
  const left = o.controlsOverChannelsLeft;
  const right = o.controlsOverChannelsRight;
  const space = o.controlsOverChannelsSpace;
  const d = o.controlsOverChannelsD;
  const f = o.controlsOverChannelsF;

  if (!up && !down && !left && !right && !space && !d && !f) return;

  let controls = 0b00000000;
  up && (controls |= 0b00000001);
  down && (controls |= 0b00000010);
  left && (controls |= 0b00000100);
  right && (controls |= 0b00001000);
  space && (controls |= 0b00010000);
  d && (controls |= 0b00100000);
  f && (controls |= 0b01000000);
  dataView.setUint8(0, controls);

  o.controlsOverChannelsUp -= parameters.clientSendInterval;
  o.controlsOverChannelsDown -= parameters.clientSendInterval;
  o.controlsOverChannelsLeft -= parameters.clientSendInterval;
  o.controlsOverChannelsRight -= parameters.clientSendInterval;
  o.controlsOverChannelsSpace -= parameters.clientSendInterval;
  o.controlsOverChannelsD -= parameters.clientSendInterval;
  o.controlsOverChannelsF -= parameters.clientSendInterval;

  o.controlsOverChannelsUp < 0 && (o.controlsOverChannelsUp = 0);
  o.controlsOverChannelsDown < 0 && (o.controlsOverChannelsDown = 0);
  o.controlsOverChannelsLeft < 0 && (o.controlsOverChannelsLeft = 0);
  o.controlsOverChannelsRight < 0 && (o.controlsOverChannelsRight = 0);
  o.controlsOverChannelsSpace < 0 && (o.controlsOverChannelsSpace = 0);
  o.controlsOverChannelsD < 0 && (o.controlsOverChannelsD = 0);
  o.controlsOverChannelsF < 0 && (o.controlsOverChannelsF = 0);

  return buffer;
};
