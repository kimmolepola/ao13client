import { useEffect, useCallback } from "react";
import { handlePressed, handleReleased } from "../controls";
import * as types from "../../types";

const convertKeyToControl = (key: string) => {
  switch (key) {
    case "ArrowUp":
      return types.Keys.UP;
    case "ArrowDown":
      return types.Keys.DOWN;
    case "ArrowLeft":
      return types.Keys.LEFT;
    case "ArrowRight":
      return types.Keys.RIGHT;
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
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyUp, handleKeyDown]);
};
