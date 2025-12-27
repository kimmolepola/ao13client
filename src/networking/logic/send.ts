import { gameServer } from "src/globals";
import * as types from "src/types";

export const sendStringData = (data: types.ChatMessageFromClient) => {
  const dataString = JSON.stringify(data);
  gameServer.connection?.stringChannel?.send(dataString);
};

export const sendAck = (data: ArrayBuffer) => {
  gameServer.connection?.ackChannel?.send(data);
};

export const sendControlsData = (data: ArrayBuffer) => {
  gameServer.connection?.controlsChannel?.send(data);
};
