import * as types from "src/types";

export const gatherUpdateData = (
  updateData: { [id: string]: types.UpdateObject },
  o: types.GameObject
) => {
  const data = updateData;
  data[o.id] = {
    uScore: o.score,
    uControlsUp: o.controlsOverChannelsUp,
    uControlsDown: o.controlsOverChannelsDown,
    uControlsLeft: o.controlsOverChannelsLeft,
    uControlsRight: o.controlsOverChannelsRight,
    uControlsSpace: o.controlsOverChannelsSpace,
    uRotationSpeed: o.rotationSpeed,
    uSpeed: o.speed,
    uPositionX: o.object3D?.position.x || 0,
    uPositionY: o.object3D?.position.y || 0,
    uPositionZ: o.object3D?.position.z || 0,
    uQuaternionX: o.object3D?.quaternion.x || 0,
    uQuaternionY: o.object3D?.quaternion.y || 0,
    uQuaternionZ: o.object3D?.quaternion.z || 0,
    uQuaternionW: o.object3D?.quaternion.w || 0,
  };
};
