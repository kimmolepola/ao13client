import { objects } from "src/globals";
import * as types from "../types";

export const handlePressed = (key: types.Keys) => {
  const o = objects.find((x) => x.isMe);
  if (o && !o.keyDowns.includes(key)) {
    o.keyDowns.push(key);
  }
};

export const handleReleased = (key: types.Keys) => {
  const o = objects.find((x) => x.isMe);
  if (o) {
    const index = o.keyDowns.findIndex((x: types.Keys) => x === key);
    index !== -1 && o.keyDowns.splice(index, 1);
  }
};

export const handleAllReleased = () => {
  const o = objects.find((x) => x.isMe);
  if (o) {
    o.keyDowns.splice(0, o.keyDowns.length);
  }
};
