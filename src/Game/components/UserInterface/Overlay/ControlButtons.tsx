import { MouseEvent, memo, useMemo, useCallback } from "react";
import {
  TfiArrowCircleLeft,
  TfiArrowCircleRight,
  TfiArrowCircleUp,
  TfiArrowCircleDown,
  TfiTarget,
} from "react-icons/tfi";

import { handlePressed, handleReleased } from "../../../logic/controls";
import * as types from "src/types";

const ControlButton = ({ control }: { control: types.Key }) => {
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
      case types.Key.Space:
        return <TfiTarget />;
      case types.Key.ArrowLeft:
        return <TfiArrowCircleLeft />;
      case types.Key.ArrowRight:
        return <TfiArrowCircleRight />;
      case types.Key.ArrowUp:
        return <TfiArrowCircleUp />;
      case types.Key.ArrowDown:
        return <TfiArrowCircleDown />;
      default:
        return null;
    }
  }, [control]);

  return (
    <div
      className="text-red-900 text-[40px] select-none"
      onTouchStart={onPressed}
      onTouchEnd={onReleased}
      onTouchCancel={onReleased}
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
    <div className="landscape:hidden absolute left-0 right-0 bottom-8 flex flex-col gap-4 items-center">
      <ControlButton control={types.Key.ArrowUp} />
      <div className="w-full flex justify-evenly">
        <ControlButton control={types.Key.ArrowLeft} />
        <ControlButton control={types.Key.Space} />
        <ControlButton control={types.Key.ArrowRight} />
      </div>
      <ControlButton control={types.Key.ArrowDown} />
    </div>
  );
};

export default memo(ControlButtons);
