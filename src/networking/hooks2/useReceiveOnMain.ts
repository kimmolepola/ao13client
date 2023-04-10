import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import * as gameHooks from "src/game/hooks";
import { objects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as hooks from ".";

export const useReceiveOnMain = () => {
  console.log("--useReceiveOnMain");

  const { sendOrdered } = hooks.useSendFromMain();
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleReceiveControlsData } = gameHooks.useObjectsOnMain2();

  const onReceive = useCallback(
    (remoteId: string, data: types.NetData) => {
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
            username: objects.find((x) => x.id === remoteId)?.username || "",
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
    [handleReceiveControlsData, sendOrdered, setChatMessages]
  );

  return { onReceive };
};
