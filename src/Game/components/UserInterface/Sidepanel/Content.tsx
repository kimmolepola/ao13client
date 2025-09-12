import { useState, useMemo, memo, useCallback } from "react";
import { useRecoilValue } from "recoil";
import clsx from "clsx";

import Header from "./Header";
import Chat from "./Chat/Container";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as hooks from "../../../hooks";

const Content = ({
  quit: onClickQuit,
  chatOnSubmit,
}: {
  quit: () => void;
  chatOnSubmit: (value: string) => void;
}) => {
  const [move, setMove] = useState(false);
  const { onMouseDown, onTouchStart } = hooks.useResize();
  const windowSize = useRecoilValue(atoms.windowSize);
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const user = useRecoilValue(atoms.user);
  const connectionMessage = useRecoilValue(atoms.connectionMessage);
  const score = useRecoilValue(atoms.score);

  const sidePanelStyle = useMemo(() => {
    switch (sidepanelGeometry.position) {
      case types.Position.BOTTOM:
        return { top: windowSize.height - sidepanelGeometry.size };
      case types.Position.LEFT:
        return { right: windowSize.width - sidepanelGeometry.size };
      case types.Position.RIGHT:
        return { left: windowSize.width - sidepanelGeometry.size };
      case types.Position.TOP:
        return { bottom: windowSize.height - sidepanelGeometry.size };
      default:
        return undefined;
    }
  }, [sidepanelGeometry, windowSize]);

  const sidePanelClassName = useMemo(() => {
    switch (sidepanelGeometry.position) {
      case types.Position.BOTTOM:
        return "flex-col";
      case types.Position.LEFT:
        return "flex-row-reverse";
      case types.Position.RIGHT:
        return "flex-row";
      case types.Position.TOP:
        return "flex-col-reverse";
      default:
        return "";
    }
  }, [sidepanelGeometry.position]);

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
            <div>{user?.username} |</div>
            <div>{connectionMessage} |</div>
            <div>{`Score: ${score}`}</div>
          </div>
        </div>
        <Chat chatOnSubmit={chatOnSubmit} />
      </div>
    </div>
  );
};

export default memo(Content);
