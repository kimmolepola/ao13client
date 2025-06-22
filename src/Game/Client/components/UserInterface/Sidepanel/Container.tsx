import { memo, useCallback } from "react";
import { SidePanel } from "src/Game/Common/components/UserInterface";

import * as networkingHooks from "src/networking/hooks";
import * as types from "src/types";

const Container = ({ quit }: { quit: () => void }) => {
  const { sendOrdered } = networkingHooks.useSendFromClient();

  const chatOnSubmit = useCallback(
    (value: string) => {
      sendOrdered({
        type: types.ClientDataType.ChatMessage_Client,
        text: value,
      });
    },
    [sendOrdered]
  );

  return <SidePanel quit={quit} chatOnSubmit={chatOnSubmit} />;
};

export default memo(Container);
