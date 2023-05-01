import { MouseEvent, memo, useMemo, useCallback } from "react";
import {
  TfiArrowCircleLeft,
  TfiArrowCircleRight,
  TfiArrowCircleUp,
  TfiArrowCircleDown,
} from "react-icons/tfi";

import { handlePressed, handleReleased } from "../../../controls";
import * as types from "src/types";

const ControlButton = ({ control }: { control: types.Keys }) => {
  const onPressed = useCallback(() => {
    handlePressed(control);
  }, [control]);

  const onReleased = useCallback(() => {
    handleReleased(control);
  }, [control]);

  const onContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const symbol = useMemo(() => {
    switch (control) {
      case types.Keys.LEFT:
        return <TfiArrowCircleLeft />;
      case types.Keys.RIGHT:
        return <TfiArrowCircleRight />;
      case types.Keys.UP:
        return <TfiArrowCircleUp />;
      case types.Keys.DOWN:
        return <TfiArrowCircleDown />;
      default:
        return null;
    }
  }, [control]);

  return (
    <div
      className="text-red-900 text-[40px] select-none"
      onTouchStart={onPressed}
      onMouseDown={onPressed}
      onMouseUp={onReleased}
      onContextMenu={onContextMenu}
    >
      {symbol}
    </div>
  );
};

const ControlButtons = () => {
  return (
    <div className="landscape:hidden absolute left-0 right-0 bottom-8 flex flex-col items-center">
      <ControlButton control={types.Keys.UP} />
      <div className="w-full flex justify-evenly">
        <ControlButton control={types.Keys.LEFT} />
        <ControlButton control={types.Keys.RIGHT} />
      </div>
      <ControlButton control={types.Keys.DOWN} />
    </div>
  );
};

export default memo(ControlButtons);
