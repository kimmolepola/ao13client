import { useCallback } from "react";

import { gameServer } from "src/globals";
import * as types from "src/types";

export const useSend = () => {
  const sendOrdered = useCallback((data: types.ChatMessageFromClient) => {
    const dataString = JSON.stringify(data);
    gameServer.connection?.orderedChannel?.send(dataString);
  }, []);

  const sendUnordered = useCallback((data: types.Controls) => {
    const stringData = JSON.stringify(data);
    gameServer.connection?.unorderedChannel?.send(stringData);
  }, []);

  return { sendOrdered, sendUnordered };
};
