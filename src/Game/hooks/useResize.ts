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

export const useResize = (
  position: types.Position,
  onChangePosition: (value: types.Position) => void,
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
          case types.Position.LEFT:
          case types.Position.RIGHT:
            if (y < moveStartPoint.y - globals.dimensions.windowHeight / 4) {
              setMoveStartPoint({ x, y });
              return types.Position.TOP;
            }
            if (y > moveStartPoint.y + globals.dimensions.windowHeight / 4) {
              setMoveStartPoint({ x, y });
              return types.Position.BOTTOM;
            }
            break;
          case types.Position.TOP:
          case types.Position.BOTTOM:
            if (x < moveStartPoint.x - globals.dimensions.windowWidth / 4) {
              setMoveStartPoint({ x, y });
              return types.Position.LEFT;
            }
            if (x > moveStartPoint.x + globals.dimensions.windowWidth / 4) {
              setMoveStartPoint({ x, y });
              return types.Position.RIGHT;
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

  const getDiameter = useCallback(
    (x: number, y: number, position: types.Position) => {
      const min = parameters.sidepanelMinimumSize;
      switch (position) {
        case types.Position.LEFT: {
          const max = globals.dimensions.windowWidth;
          return Math.max(min, Math.min(max, x));
        }
        case types.Position.RIGHT: {
          const max = globals.dimensions.windowWidth;
          return Math.max(min, Math.min(max, max - x));
        }
        case types.Position.TOP: {
          const max = globals.dimensions.windowHeight;
          return Math.max(min, Math.min(max, y));
        }
        case types.Position.BOTTOM: {
          const max = globals.dimensions.windowHeight;
          return Math.max(min, Math.min(max, max - y));
        }
        default:
          return min;
      }
    },
    []
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
    [resizing, getDiameter, getPosition, onChangePosition, onChangeDiameter]
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
