import { memo, useCallback } from "react";
import Content from "./Content";

import * as networkingHooks from "src/networking/hooks";
import * as types from "src/types";

const Container = ({ quit }: { quit: () => void }) => {
  const { sendReliable } = networkingHooks.useSend();

  const chatOnSubmit = useCallback(
    (value: string) => {
      sendReliable({
        type: types.ClientDataType.ChatMessage_Client,
        text: value,
      });
    },
    [sendReliable]
  );

  return <Content quit={quit} chatOnSubmit={chatOnSubmit} />;
};

export default memo(Container);
