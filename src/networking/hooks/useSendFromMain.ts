import { useCallback } from "react";

import { logError } from "src/utils";
import { peerConnections } from "src/globals";
import * as types from "src/types";

export const useSendFromMain = () => {
  console.log("--useSendFromMain");

  const sendOrdered = useCallback(
    (data: types.State | types.ChatMessageFromMain) => {
      try {
        const dataString = JSON.stringify(data);
        peerConnections.forEach((x) => {
          x.orderedChannel.send(dataString);
        });
      } catch (error) {
        logError(error, data);
      }
    },
    []
  );

  const sendUnordered = useCallback((data: types.Update) => {
    const stringData = JSON.stringify(data);
    peerConnections.forEach((x) => {
      try {
        x.unorderedChannel.send(stringData);
      } catch (error) {
        logError(error, data);
      }
    });
  }, []);

  return { sendOrdered, sendUnordered };
};
