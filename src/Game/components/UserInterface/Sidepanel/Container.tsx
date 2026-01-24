import { useState, useMemo, memo, useCallback } from "react";
import clsx from "clsx";

import Header from "./Header";
import Chat from "./Chat/Container";
import * as types from "src/types";
import { useSidePanel } from "../../../hooks/useSidePanel";

import { sendStringData } from "src/networking/logic/send";

const Container = ({
  username,
  position,
  diameter,
  connectionMessage,
  chatMessages,
  windowSize,
  onChangePosition,
  onChangeDiameter,
  quit: onClickQuit,
}: {
  username: string | undefined;
  position: types.SidepanelPosition;
  diameter: number;
  connectionMessage: string | undefined;
  chatMessages: types.ChatMessage[];
  windowSize: { width: number; height: number };
  onChangePosition: (value: types.SidepanelPosition) => void;
  onChangeDiameter: (value: number) => void;
  quit: () => void;
}) => {
  const chatOnSubmit = useCallback((value: string) => {
    sendStringData({
      type: types.ClientDataType.ChatMessage_Client,
      text: value,
    });
  }, []);

  const [move, setMove] = useState(false);
  const { onMouseDown, onTouchStart } = useSidePanel(
    position,
    onChangePosition,
    onChangeDiameter
  );

  const sidePanelStyle = useMemo(() => {
    switch (position) {
      case types.SidepanelPosition.Bottom:
        return { top: windowSize.height - diameter };
      case types.SidepanelPosition.Left:
        return { right: windowSize.width - diameter };
      case types.SidepanelPosition.Right:
        return { left: windowSize.width - diameter };
      case types.SidepanelPosition.Top:
        return { bottom: windowSize.height - diameter };
      default:
        return undefined;
    }
  }, [diameter, position, windowSize]);

  const sidePanelClassName = useMemo(() => {
    switch (position) {
      case types.SidepanelPosition.Bottom:
        return "flex-col";
      case types.SidepanelPosition.Left:
        return "flex-row-reverse";
      case types.SidepanelPosition.Right:
        return "flex-row";
      case types.SidepanelPosition.Top:
        return "flex-col-reverse";
      default:
        return "";
    }
  }, [position]);

  const onClickMove = useCallback(() => {
    setMove((x) => !x);
  }, []);

  return (
    <div
      className={clsx(
        "absolute inset-0 bg-white flex",
        sidePanelClassName,
        move && "cursor-move"
      )}
      style={sidePanelStyle}
      onMouseDown={move ? onMouseDown : undefined}
      onTouchStart={move ? onTouchStart : undefined}
    >
      <div className="w-full h-full bg-white border flex flex-col">
        <div className="flex flex-col">
          <Header
            onClickQuit={onClickQuit}
            onClickMove={onClickMove}
            move={move}
          />
          <div className="flex gap-1 flex-wrap text-xs p-0.5 border">
            <div>{username} |</div>
            <div>{connectionMessage} |</div>
          </div>
        </div>
        <Chat chatMessages={chatMessages} chatOnSubmit={chatOnSubmit} />
      </div>
    </div>
  );
};

export default memo(Container);
