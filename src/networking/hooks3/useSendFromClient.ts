import { useCallback } from "react";
import { useRecoilValue } from "recoil";

import { logError } from "../../utils";

import * as types from "../../types";
import * as atoms from "../../atoms";

export const useSendFromClient = () => {
  console.log("--useSendFromClient");

  const orderedChannels = useRecoilValue(atoms.channelsOrdered);
  const unorderedChannels = useRecoilValue(atoms.channelsUnordered);

  const sendOrdered = useCallback(
    (data: types.ChatMessageFromClient) => {
      const dataString = JSON.stringify(data);
      orderedChannels.forEach((x) => {
        try {
          x.channel.send(dataString);
        } catch (error) {
          logError(error, data);
        }
      });
    },
    [orderedChannels]
  );

  const sendUnordered = useCallback(
    (data: types.Controls) => {
      const stringData = JSON.stringify(data);
      unorderedChannels.forEach((x) => {
        try {
          x.channel.send(stringData);
        } catch (error) {
          logError(error, data);
        }
      });
    },
    [unorderedChannels]
  );

  return { sendOrdered, sendUnordered };
};
