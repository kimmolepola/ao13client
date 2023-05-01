import { useMemo, memo, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

import * as atoms from "src/atoms";
import * as types from "src/types";
import NumberBox from "src/components/NumberBox";

const Header = ({
  quit,
  onClickResizing,
}: {
  quit: () => void;
  onClickResizing: () => void;
}) => {
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

  const onChangeSize = useCallback(
    (x: number) => {
      setSidepanelGeometry((xx) => ({ ...xx, size: x }));
    },
    [setSidepanelGeometry]
  );

  const onClickPosition = useCallback(() => {
    const pos = sidepanelGeometry.position;
    const newPosition = pos === 3 ? 0 : pos + 1;
    const maxSize = getMaxSize(newPosition);
    const newSize =
      sidepanelGeometry.size > maxSize ? maxSize : sidepanelGeometry.size;
    setSidepanelGeometry({ position: newPosition, size: newSize });
  }, [sidepanelGeometry, getMaxSize, setSidepanelGeometry]);

  const positionButtonStyle = useMemo(() => {
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
        return {};
    }
  }, [sidepanelGeometry.position]);

  return (
    <div className="p-0.5 flex w-full justify-between flex-wrap gap-0.5">
      <div className="text-rose-900 font-bold select-none items-center">
        AO13
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          className="border relative w-6 h-6 z-20"
          type="button"
          onClick={onClickResizing}
        >
          <div className="absolute inset-0 bg-zinc-300" />
        </button>

        <NumberBox
          value={sidepanelGeometry.size}
          min={100}
          calculateMax={getMaxSize}
          onChange={onChangeSize}
        />
        <button
          className="border relative w-6 h-6 bg-zinc-200"
          type="button"
          onClick={onClickPosition}
        >
          <div
            className="absolute inset-0 bg-white"
            style={positionButtonStyle}
          />
        </button>
        <button
          className="w-10 h-6 text-rose-900 border-2 active:brightness-80 text-xs font-bold"
          type="button"
          onClick={quit}
        >
          Quit
        </button>
      </div>
    </div>
  );
};

export default memo(Header);
