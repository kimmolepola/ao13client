import { useCallback, RefObject } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "../../parameters";

import * as atoms from "../../atoms";
import * as types from "../../types";
import * as gameHooks from "../../game/hooks";

let mostRecentTimestamp = 0;

export const useReceiveOnClient = (
  objectsRef: RefObject<types.GameObject[]>
) => {
  console.log("--useReceiveOnClient");

  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleUpdateData, handleStateData } =
    gameHooks.useObjectsOnClient(objectsRef);

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
            username:
              (objectsRef.current || []).find((x) => x.id === data.userId)
                ?.username || "",
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
    [handleStateData, handleUpdateData, objectsRef, setChatMessages]
  );
  return { onReceive };
};
