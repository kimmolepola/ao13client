import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { chatMessageTimeToLive } from "src/parameters";
import * as serverHooks from "src/Game/Server/hooks";
import { remoteObjects } from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as hooks from ".";

export const useReceiveOnMain = () => {
  const { sendOrdered } = hooks.useSendFromMain();
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { handleReceiveControlsData } = serverHooks.useObjects();

  const onReceive = useCallback(
    (remoteId: string, data: types.NetData) => {
      switch (data.type) {
        case types.ClientDataType.Controls: {
          handleReceiveControlsData(data, remoteId);
          break;
        }
        case types.ClientDataType.ChatMessage_Client: {
          const message = {
            id: remoteId + Date.now().toString(),
            text: data.text,
            userId: remoteId,
            username:
              remoteObjects.find((x) => x.id === remoteId)?.username || "",
          };
          sendOrdered({
            ...message,
            type: types.ServerDataType.ChatMessage_Server,
          });
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
