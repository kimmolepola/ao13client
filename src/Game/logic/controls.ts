import * as globals from "src/globals";
import * as types from "src/types";

export const handlePressed = (key: types.Keys) => {
  globals.keys[key] = true;
};

export const handleReleased = (key: types.Keys) => {
  globals.keys[key] = false;
};

export const handleAllReleased = () => {
  globals.keys[types.Keys.ArrowUp] = false;
  globals.keys[types.Keys.ArrowDown] = false;
  globals.keys[types.Keys.ArrowLeft] = false;
  globals.keys[types.Keys.ArrowRight] = false;
  globals.keys[types.Keys.Space] = false;
  globals.keys[types.Keys.KeyD] = false;
  globals.keys[types.Keys.KeyF] = false;
  globals.keys[types.Keys.KeyE] = false;
};

export const handleKeyDown = (e: any) => {
  if (e.repeat) return;
  handlePressed(e.code);
};

export const handleKeyUp = (e: any) => {
  handleReleased(e.code);
};
