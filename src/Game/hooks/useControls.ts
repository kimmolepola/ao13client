import { useEffect, useCallback } from "react";
import {
  handlePressed,
  handleReleased,
  handleAllReleased,
} from "../logic/controls";
import * as types from "src/types";

const convertKeyToControl = (key: string) => {
  switch (key) {
    case "ArrowUp":
      return types.Keys.Up;
    case "ArrowDown":
      return types.Keys.Down;
    case "ArrowLeft":
      return types.Keys.Left;
    case "ArrowRight":
      return types.Keys.Right;
    case "Space":
      return types.Keys.Space;
    case "KeyD":
      return types.Keys.D;
    case "KeyF":
      return types.Keys.F;
    default:
      return null;
  }
};

export const useControls = () => {
  const handleKeyDown = useCallback((e: any) => {
    if (e.repeat) return;
    const control = convertKeyToControl(e.code);
    if (control) handlePressed(control);
  }, []);

  const handleKeyUp = useCallback((e: any) => {
    const control = convertKeyToControl(e.code);
    if (control) handleReleased(control);
  }, []);

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchend", handleAllReleased);
    window.addEventListener("touchcancel", handleAllReleased);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyUp, handleKeyDown]);
};
