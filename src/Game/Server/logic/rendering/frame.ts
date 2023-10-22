import * as types from "src/types";
import * as globals from "src/globals";

export const detectCollision = (
  remoteGameObject: types.RemoteGameObject,
  time: number,
  gameEventHandler: types.GameEventHandler
) => {
  const collisions: types.RemoteGameObject[] = [];
  globals.remoteObjects.forEach((x) => {
    if (remoteGameObject.id !== x.id) {
      // get collision info from the other object
      // if it has already calculated collision between it and this object
      const collisionInfo = x.collisions[remoteGameObject.id];
      if (collisionInfo?.time === time) {
        collisionInfo.collision && collisions.push(x);
      } else {
        // if no collision info from the other object
        // let's calculate if there is a collision
        const thisBb = remoteGameObject.object3d?.geometry.boundingBox;
        const otherBb = x.object3d?.geometry.boundingBox;
        const collision = Boolean(otherBb && thisBb?.intersectsBox(otherBb));
        collision && collisions.push(x);
        // let's add the result to this object's collision info
        // so that the other object can use it and we will not calculate it twice
        remoteGameObject.collisions[x.id] = { time, collision };
      }
    }
  });
  // let's handle the possible collisions between this and other objects
  collisions.length &&
    gameEventHandler({
      type: types.Event.COLLISION,
      data: { object: remoteGameObject, otherObjects: collisions },
    });
};

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
