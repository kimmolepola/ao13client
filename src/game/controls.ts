import { objects } from "src/globals";
import * as types from "../types";
import * as globals from "src/globals";

export const handlePressed = (key: types.Keys) => {
  const o = objects.find((x) => x.id === globals.state.ownId);
  if (o && !o.keyDowns.includes(key)) {
    o.keyDowns.push(key);
  }
};

export const handleReleased = (key: types.Keys) => {
  const o = objects.find((x) => x.id === globals.state.ownId);
  if (o) {
    const index = o.keyDowns.findIndex((x: types.Keys) => x === key);
    index !== -1 && o.keyDowns.splice(index, 1);
  }
};
