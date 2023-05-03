import { useMemo, memo } from "react";
import { useRecoilValue } from "recoil";
import clsx from "clsx";

import Header from "./Header";
import Chat from "./Chat";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as hooks from "../../../hooks";

const SidePanel = ({
  quit,
  chatOnSubmit,
}: {
  quit: () => void;
  chatOnSubmit: (value: string) => void;
}) => {
  const { onMouseDown, onTouchStart } = hooks.useResize();
  const windowSize = useRecoilValue(atoms.windowSize);
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const user = useRecoilValue(atoms.user);
  const connectedAmount = useRecoilValue(atoms.connectedAmount);
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

  return (
    <div
      className={clsx(
        "absolute inset-0 bg-white flex cursor-move",
        sidePanelClassName
      )}
      style={sidePanelStyle}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div className="w-full h-full bg-white border flex flex-col">
        <div className="flex flex-col">
          <Header quit={quit} />
          <div className="flex gap-1 flex-wrap text-xs p-0.5 border">
            <div>{user?.username} |</div>
            <div>{`Players: ${connectedAmount + 1} |`}</div>
            <div>{`${connectionMessage} |`}</div>
            <div>{`Score: ${score}`}</div>
          </div>
        </div>
        <Chat chatOnSubmit={chatOnSubmit} />
      </div>
    </div>
  );
};

export default memo(SidePanel);
