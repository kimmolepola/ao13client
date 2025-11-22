import { useCallback } from "react";

import { gameServer } from "src/globals";
import * as types from "src/types";

export const useSend = () => {
  const sendStringData = useCallback((data: types.ChatMessageFromClient) => {
    const dataString = JSON.stringify(data);
    gameServer.connection?.stringChannel?.send(dataString);
  }, []);

  const sendAck = useCallback((data: ArrayBuffer) => {
    gameServer.connection?.ackChannel?.send(data);
  }, []);

  const sendControlsData = useCallback((data: ArrayBuffer) => {
    gameServer.connection?.controlsChannel?.send(data);
  }, []);

  return {
    sendStringData,
    sendAck,
    sendControlsData,
  };
};
