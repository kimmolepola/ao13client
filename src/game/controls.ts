import { objects } from "src/globals";
import * as types from "../types";

export const handlePressed = (key: types.Keys, id: string | undefined) => {
  const o = objects.find((x) => x.id === id);
  if (id && o && !o.keyDowns.includes(key)) {
    o.keyDowns.push(key);
  }
};

export const handleReleased = (key: types.Keys, id: string | undefined) => {
  const o = objects.find((x) => x.id === id);
  if (id && o) {
    const index = o.keyDowns.findIndex((x: types.Keys) => x === key);
    index !== -1 && o.keyDowns.splice(index, 1);
  }
};
