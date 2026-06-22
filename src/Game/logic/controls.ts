import * as globals from "src/globals";
import * as types from "src/types";

export const handlePressed = (key: types.Key) => {
  globals.keys[key] = true;
};

export const handleReleased = (key: types.Key) => {
  globals.keys[key] = false;
};

export const handleAllReleased = () => {
  globals.keys[types.Key.ArrowUp] = false;
  globals.keys[types.Key.ArrowDown] = false;
  globals.keys[types.Key.ArrowLeft] = false;
  globals.keys[types.Key.ArrowRight] = false;
  globals.keys[types.Key.Space] = false;
  globals.keys[types.Key.KeyD] = false;
  globals.keys[types.Key.KeyF] = false;
};

export const handleKeyDown = (e: any) => {
  if (e.repeat) return;
  handlePressed(e.code);
};

export const handleKeyUp = (e: any) => {
  handleReleased(e.code);
};
