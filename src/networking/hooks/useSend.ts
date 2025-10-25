import { useCallback } from "react";

import { gameServer } from "src/globals";
import * as types from "src/types";

export const useSend = () => {
  const sendReliable = useCallback((data: types.ChatMessageFromClient) => {
    const dataString = JSON.stringify(data);
    gameServer.connection?.reliableChannel?.send(dataString);
  }, []);

  const sendReliableBinary = useCallback((data: ArrayBuffer) => {
    gameServer.connection?.reliableChannelBinary?.send(data);
  }, []);

  const sendUnreliableBinary = useCallback((data: ArrayBuffer) => {
    gameServer.connection?.unreliableChannelBinary?.send(data);
  }, []);

  return {
    sendReliable,
    sendReliableBinary,
    sendUnreliableBinary,
  };
};
