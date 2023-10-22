import { memo, useCallback } from "react";
import { SidePanel } from "src/Game/Common/components/UserInterface";

import { useSetRecoilState } from "recoil";

import * as globals from "src/globals";
import * as parameters from "src/parameters";
import * as atoms from "src/atoms";
import * as networkingHooks from "src/networking/hooks";
import * as types from "src/types";

const Container = ({ quit }: { quit: () => void }) => {
  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { sendOrdered } = networkingHooks.useSendFromMain();

  const chatOnSubmit = useCallback(
    (value: string) => {
      if (globals.state.ownId) {
        const message = {
          id: globals.state.ownId + Date.now().toString(),
          text: value,
          userId: globals.state.ownId,
          username:
            globals.remoteObjects.find((xx) => xx.id === globals.state.ownId)
              ?.username || "",
        };
        sendOrdered({
          type: types.NetDataType.CHATMESSAGE_MAIN,
          id: message.id,
          text: message.text,
          userId: message.userId,
        });
        setChatMessages((x) => [message, ...x]);
        setTimeout(
          () => setChatMessages((x) => x.filter((xx) => xx !== message)),
          parameters.chatMessageTimeToLive
        );
      }
    },
    [sendOrdered, setChatMessages]
  );

  return <SidePanel quit={quit} chatOnSubmit={chatOnSubmit} />;
};

export default memo(Container);
