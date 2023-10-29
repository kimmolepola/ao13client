import * as types from "src/types";

export const gatherControlsData = (o: types.RemoteGameObject) => ({
  up: o.controlsOverChannelsUp,
  down: o.controlsOverChannelsDown,
  left: o.controlsOverChannelsLeft,
  right: o.controlsOverChannelsRight,
  space: o.controlsOverChannelsSpace,
});
