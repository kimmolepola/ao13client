import { useCallback, RefObject } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "../../parameters";
import * as gameHooks from "../../game/hooks";

import * as atoms from "../../atoms";
import * as types from "../../types";
import * as hooks from ".";

export const useReceiveOnMain = (objectsRef: RefObject<types.GameObject[]>) => {
  console.log("--useReceiveOnMain");

  const { sendOrdered } = hooks.useSendFromMain();
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleReceiveControlsData } = gameHooks.useObjectsOnMain(objectsRef);

  const onReceive = useCallback(
    (data: types.NetData, remoteId: string) => {
      switch (data.type) {
        case types.NetDataType.CONTROLS: {
          handleReceiveControlsData(data, remoteId);
          break;
        }
        case types.NetDataType.CHATMESSAGE_CLIENT: {
          const message = {
            id: remoteId + Date.now().toString(),
            text: data.text,
            userId: remoteId,
            username:
              objectsRef.current?.find((x) => x.id === remoteId)?.username ||
              "",
          };
          sendOrdered({ ...message, type: types.NetDataType.CHATMESSAGE_MAIN });
          setChatMessages((x) => [message, ...x]);
          setTimeout(
            () => setChatMessages((x) => x.filter((xx) => xx !== message)),
            chatMessageTimeToLive
          );
          break;
        }
        default:
          break;
      }
    },
    [handleReceiveControlsData, objectsRef, sendOrdered, setChatMessages]
  );

  return { onReceive };
};
