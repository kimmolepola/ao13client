import * as types from "src/types";

export const gatherControlsData = (o: types.RemoteGameObject) => {
  const c = {
    up: o.controlsOverChannelsUp,
    down: o.controlsOverChannelsDown,
    left: o.controlsOverChannelsLeft,
    right: o.controlsOverChannelsRight,
    space: o.controlsOverChannelsSpace,
  };
  if (
    c.up === 0 &&
    c.down === 0 &&
    c.left === 0 &&
    c.right === 0 &&
    c.space === 0
  ) {
    return undefined;
  }
  return c;
};
