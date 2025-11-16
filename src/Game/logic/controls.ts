import * as globals from "src/globals";
import * as types from "src/types";

export const handlePressed = (key: types.Keys) => {
  const index = globals.state.ownRemoteObjectIndex;
  const o = index && globals.remoteObjects[index];
  if (o && !o.keyDowns.includes(key)) {
    o.keyDowns.push(key);
  }
};

export const handleReleased = (key: types.Keys) => {
  const index = globals.state.ownRemoteObjectIndex;
  const o = index && globals.remoteObjects[index];
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
  const o = index && globals.remoteObjects[index];
  if (o) {
    o.keyDowns.splice(0, o.keyDowns.length);
  }
};
