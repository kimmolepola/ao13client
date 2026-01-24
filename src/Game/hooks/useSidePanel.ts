import {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useState,
  useCallback,
} from "react";

import * as types from "src/types";
import * as globals from "src/globals";
import * as parameters from "src/parameters";

export const useSidePanel = (
  position: types.SidepanelPosition,
  onChangePosition: (value: types.SidepanelPosition) => void,
  onChangeDiameter: (value: number) => void
) => {
  const [resizing, setResizing] = useState(false);
  const [moveStartPoint, setMoveStartPoint] = useState<
    { x: number; y: number } | undefined
  >();

  const getPosition = useCallback(
    (x: number, y: number) => {
      if (moveStartPoint) {
        switch (position) {
          case types.SidepanelPosition.Left:
          case types.SidepanelPosition.Right:
            if (y < moveStartPoint.y - globals.dimensions.windowHeight / 4) {
              setMoveStartPoint({ x, y });
              return types.SidepanelPosition.Top;
            }
            if (y > moveStartPoint.y + globals.dimensions.windowHeight / 4) {
              setMoveStartPoint({ x, y });
              return types.SidepanelPosition.Bottom;
            }
            break;
          case types.SidepanelPosition.Top:
          case types.SidepanelPosition.Bottom:
            if (x < moveStartPoint.x - globals.dimensions.windowWidth / 4) {
              setMoveStartPoint({ x, y });
              return types.SidepanelPosition.Left;
            }
            if (x > moveStartPoint.x + globals.dimensions.windowWidth / 4) {
              setMoveStartPoint({ x, y });
              return types.SidepanelPosition.Right;
            }
            break;
          default:
            break;
        }
      }
      return position;
    },
    [position, moveStartPoint]
  );

  const onMove = useCallback(
    (x: number, y: number) => {
      if (resizing) {
        const pos = getPosition(x, y);
        const diam = getDiameter(x, y, pos);
        onChangePosition(pos);
        onChangeDiameter(diam);
      }
    },
    [resizing, getPosition, onChangePosition, onChangeDiameter]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      onMove(e.pageX, e.pageY);
    },
    [onMove]
  );

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      onMove(e.touches[0]?.pageX, e.touches[0]?.pageY);
    },
    [onMove]
  );

  useEffect(() => {
    const onMouseUp = () => {
      setResizing(false);
      setMoveStartPoint(undefined);
    };
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchend", onMouseUp);
    window.addEventListener("touchcancel", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("touchcancel", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [resizing, onMouseMove, onTouchMove]);

  const onMouseDown = useCallback((e: ReactMouseEvent) => {
    setMoveStartPoint({ x: e.pageX, y: e.pageY });
    setResizing(true);
  }, []);

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    setMoveStartPoint({ x: e.touches[0]?.pageX, y: e.touches[0]?.pageY });
    setResizing(true);
  }, []);

  return { onMouseDown, onTouchStart };
};

const getDiameter = (
  x: number,
  y: number,
  position: types.SidepanelPosition
) => {
  const min = parameters.sidepanelMinimumSize;
  switch (position) {
    case types.SidepanelPosition.Left: {
      const max = globals.dimensions.windowWidth;
      return Math.max(min, Math.min(max, x));
    }
    case types.SidepanelPosition.Right: {
      const max = globals.dimensions.windowWidth;
      return Math.max(min, Math.min(max, max - x));
    }
    case types.SidepanelPosition.Top: {
      const max = globals.dimensions.windowHeight;
      return Math.max(min, Math.min(max, y));
    }
    case types.SidepanelPosition.Bottom: {
      const max = globals.dimensions.windowHeight;
      return Math.max(min, Math.min(max, max - y));
    }
    default:
      return min;
  }
};
