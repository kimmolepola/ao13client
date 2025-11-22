import { memo, useCallback } from "react";
import Content from "./Content";

import * as networkingHooks from "src/networking/hooks";
import * as types from "src/types";

const Container = ({ quit }: { quit: () => void }) => {
  const { sendStringData } = networkingHooks.useSend();

  const chatOnSubmit = useCallback(
    (value: string) => {
      sendStringData({
        type: types.ClientDataType.ChatMessage_Client,
        text: value,
      });
    },
    [sendStringData]
  );

  return <Content quit={quit} chatOnSubmit={chatOnSubmit} />;
};

export default memo(Container);
