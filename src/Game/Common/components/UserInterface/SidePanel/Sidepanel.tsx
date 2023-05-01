import { useState, useMemo, memo, useCallback } from "react";
import { useRecoilValue } from "recoil";

import Header from "./Header";
import Chat from "./Chat";
import * as atoms from "src/atoms";
import * as types from "src/types";

const Sidepanel = ({
  quit,
  chatOnSubmit,
}: {
  quit: () => void;
  chatOnSubmit: (value: string) => void;
}) => {
  const windowSize = useRecoilValue(atoms.windowSize);
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const user = useRecoilValue(atoms.user);
  const connectedAmount = useRecoilValue(atoms.connectedAmount);
  const connectionMessage = useRecoilValue(atoms.connectionMessage);
  const score = useRecoilValue(atoms.score);
  const [resizing, setResizing] = useState(false);

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

  const onClickResizing = useCallback(() => {
    setResizing((x) => !x);
  }, []);

  return (
    <div className="absolute inset-0 bg-white" style={sidePanelStyle}>
      {resizing ? (
        <div className="absolute inset-0 z-10 bg-[rgba(11,111,211,0.5)] cursor-move">
          <div className="absolute left-0 w-2 h-full bg-yellow-500 cursor-ew-resize"></div>
          <div className="absolute right-0 w-2 h-full bg-yellow-500 cursor-ew-resize"></div>
          <div className="absolute top-0 w-full h-2 bg-yellow-500 cursor-ns-resize"></div>
          <div className="absolute bottom-0 w-full h-2 bg-yellow-500 cursor-ns-resize"></div>
        </div>
      ) : null}
      <div className="w-full h-full bg-white border flex flex-col">
        <div className="flex flex-col">
          <Header quit={quit} onClickResizing={onClickResizing} />
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

export default memo(Sidepanel);
