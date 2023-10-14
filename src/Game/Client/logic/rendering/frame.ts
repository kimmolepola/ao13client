import * as THREE from "three";

import { interpolationAlpha } from "src/parameters";
import * as types from "src/types";

export const gatherControlsData = (o: types.GameObject) => ({
  up: o.controlsOverChannelsUp,
  down: o.controlsOverChannelsDown,
  left: o.controlsOverChannelsLeft,
  right: o.controlsOverChannelsRight,
  space: o.controlsOverChannelsSpace,
});

export const interpolatePosition = (
  o: types.GameObject,
  object3D: THREE.Object3D
) => {
  object3D.position.lerp(o.backendPosition, interpolationAlpha);
  object3D.quaternion.slerp(o.backendQuaternion, interpolationAlpha);
};
