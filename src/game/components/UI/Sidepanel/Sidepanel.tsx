import { useMemo, memo, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import Chat from "./Chat";
import * as atoms from "src/atoms";
import * as types from "src/types";
import NumberBox from "src/components/NumberBox";

const Sidepanel = ({ quit }: { quit: () => void }) => {
  const windowSize = useRecoilValue(atoms.windowSize);
  const [sidepanelGeometry, setSidepanelGeometry] = useRecoilState(
    atoms.sidepanelGeometry
  );

  const getMaxSize = useCallback(
    (panelPos?: types.Position) =>
      (panelPos || sidepanelGeometry.position) === types.Position.LEFT ||
      (panelPos || sidepanelGeometry.position) === types.Position.RIGHT
        ? windowSize.width
        : windowSize.height,
    [sidepanelGeometry.position, windowSize]
  );

  const user = useRecoilValue(atoms.user);
  const main = useRecoilValue(atoms.main);
  const connectedAmount = useRecoilValue(atoms.connectedAmount);
  const connectionMessage = useRecoilValue(atoms.connectionMessage);
  const score = useRecoilValue(atoms.score);

  const onClickQuit = useCallback(() => {
    quit();
  }, [quit]);

  const onClickPosition = useCallback(() => {
    const pos = sidepanelGeometry.position;
    const newPosition = pos === 3 ? 0 : pos + 1;
    const maxSize = getMaxSize(newPosition);
    const newSize =
      sidepanelGeometry.size > maxSize ? maxSize : sidepanelGeometry.size;
    setSidepanelGeometry({ position: newPosition, size: newSize });
  }, [sidepanelGeometry, getMaxSize, setSidepanelGeometry]);

  const onChangeSize = useCallback(
    (x: number) => {
      setSidepanelGeometry((xx) => ({ ...xx, size: x }));
    },
    [setSidepanelGeometry]
  );

  const style1 = useMemo(() => {
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

  const style2 = useMemo(() => {
    const size = "66%";
    switch (sidepanelGeometry.position) {
      case types.Position.BOTTOM:
        return { top: size };
      case types.Position.LEFT:
        return { right: size };
      case types.Position.RIGHT:
        return { left: size };
      case types.Position.TOP:
        return { bottom: size };
      default:
        return undefined;
    }
  }, [sidepanelGeometry.position]);

  return (
    <div className="absolute inset-0 bg-white" style={style1}>
      <div className="w-full h-full bg-white border flex flex-col">
        <div className="flex flex-col">
          <div className="p-0.5 flex w-full justify-between flex-wrap gap-0.5">
            <div className="text-rose-900 font-bold select-none items-center">
              AO13
            </div>
            <div className="flex gap-2 flex-wrap z-40">
              <NumberBox
                value={sidepanelGeometry.size}
                min={100}
                calculateMax={getMaxSize}
                onChange={onChangeSize}
              />
              <button
                className="border relative w-6 h-6 bg-zinc-200 z-50"
                type="button"
                onClick={onClickPosition}
              >
                <div className="absolute inset-0 bg-white" style={style2} />
              </button>
              <button
                className="w-10 h-6 text-rose-900 border-2 active:brightness-80 text-xs font-bold"
                type="button"
                onClick={onClickQuit}
              >
                Quit
              </button>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap text-xs p-0.5 border">
            <div>{user?.username} |</div>
            {main && <div>{`Players: ${connectedAmount + 1} |`}</div>}
            <div>{`${connectionMessage} |`}</div>
            <div>{`Score: ${score}`}</div>
          </div>
        </div>
        <Chat />
      </div>
    </div>
  );
};

export default memo(Sidepanel);
