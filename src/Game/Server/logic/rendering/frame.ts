import * as types from "src/types";

export const gatherUpdateData = (
  updateData: { [id: string]: types.UpdateObject },
  o: types.RemoteGameObject
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
    uPositionX: o.object3d?.position.x || 0,
    uPositionY: o.object3d?.position.y || 0,
    uPositionZ: o.object3d?.position.z || 0,
    uQuaternionX: o.object3d?.quaternion.x || 0,
    uQuaternionY: o.object3d?.quaternion.y || 0,
    uQuaternionZ: o.object3d?.quaternion.z || 0,
    uQuaternionW: o.object3d?.quaternion.w || 0,
  };
};
