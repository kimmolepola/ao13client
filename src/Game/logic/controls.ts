import * as globals from "src/globals";
import * as types from "src/types";

export const handlePressed = (key: types.Keys) => {
  const index = globals.state.ownRemoteObjectIndex;
  const o = index !== undefined && globals.remoteObjects[index];
  if (o && !o.keyDowns.includes(key)) {
    o.keyDowns.push(key);
  }
};

export const handleReleased = (key: types.Keys) => {
  const index = globals.state.ownRemoteObjectIndex;
  const o = index !== undefined && globals.remoteObjects[index];
  if (o) {
    const indexes = [];
    for (let i = 0; i < o.keyDowns.length; i++) {
      o.keyDowns[i] === key && indexes.push(i);
    }
    for (let i = 0; i < indexes.length; i++) {
      o.keyDowns.splice(indexes[i], 1);
    }
  }
};

export const handleAllReleased = () => {
  const index = globals.state.ownRemoteObjectIndex;
  const o = index !== undefined && globals.remoteObjects[index];
  if (o) {
    o.keyDowns.splice(0, o.keyDowns.length);
  }
};

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

export const handleKeyDown = (e: any) => {
  if (e.repeat) return;
  const control = convertKeyToControl(e.code);
  if (control) handlePressed(control);
};

export const handleKeyUp = (e: any) => {
  const control = convertKeyToControl(e.code);
  if (control) handleReleased(control);
};
