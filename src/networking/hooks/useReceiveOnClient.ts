import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import { objects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as gameHooks from "src/game/hooks";

let mostRecentTimestamp = 0;

export const useReceiveOnClient = () => {
  console.log("--useReceiveOnClient");

  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleUpdateData, handleStateData } = gameHooks.useObjectsOnClient();

  const onReceive = useCallback(
    (data: types.NetData) => {
      switch (data.type) {
        case types.NetDataType.STATE: {
          console.log("--CLIENT on receive state:", data);
          handleStateData(data);
          break;
        }
        case types.NetDataType.UPDATE: {
          if (data.timestamp > mostRecentTimestamp) {
            mostRecentTimestamp = data.timestamp;
            handleUpdateData(data);
          }
          break;
        }
        case types.NetDataType.CHATMESSAGE_MAIN: {
          console.log("--CLIENT on receive chat:", data);
          const message = {
            ...data,
            username: objects.find((x) => x.id === data.userId)?.username || "",
          };
          setChatMessages((x) => [message, ...x]);
          setTimeout(
            () => setChatMessages((x) => x.filter((xx) => xx !== message)),
            chatMessageTimeToLive
          );
          break;
        }
        default:
          console.log("--CLIENT on receive default:", data);
          break;
      }
    },
    [handleStateData, handleUpdateData, setChatMessages]
  );
  return { onReceive };
};
