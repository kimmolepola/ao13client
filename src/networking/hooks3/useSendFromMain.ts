import { useCallback } from "react";
import { useRecoilValue } from "recoil";

import { logError } from "../../utils";

import * as types from "../../types";
import * as atoms from "../../atoms";

export const useSendFromMain = () => {
  console.log("--useSendFromMain");

  const orderedChannels = useRecoilValue(atoms.channelsOrdered);
  const unorderedChannels = useRecoilValue(atoms.channelsUnordered);

  const sendOrdered = useCallback(
    (data: types.State | types.ChatMessageFromMain) => {
      console.log("--MAIN send ordered:", data);
      try {
        const dataString = JSON.stringify(data);
        console.log("--MAIN dataString:", dataString);
        console.log("--MAIN ordered channgels:", orderedChannels);
        orderedChannels.forEach((x) => {
          console.log("--MAIN send:", x, dataString);
          x.channel.send(dataString);
        });
      } catch (error) {
        logError(error, data);
      }
    },
    [orderedChannels]
  );

  const sendUnordered = useCallback(
    (data: types.Update) => {
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
