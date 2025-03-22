import * as types from "src/types";
import * as parameters from "src/parameters";

export const checkHealth = (
  remoteGameObject: types.RemoteGameObject,
  commonGameEventHandler: types.CommonGameEventHandler
) => {
  if (remoteGameObject.health <= 0) {
    commonGameEventHandler({
      type: types.EventType.HEALTH_ZERO,
      data: remoteGameObject,
    });
  }
};

export const handleKeys = (
  delta: number,
  gameObject: types.RemoteGameObject
) => {
  const o = gameObject;
  o.keyDowns.forEach((key) => {
    switch (key) {
      case types.Keys.UP:
        o.controlsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.DOWN:
        o.controlsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.LEFT:
        o.controlsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.RIGHT:
        o.controlsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      case types.Keys.SPACE:
        o.controlsSpace += delta;
        o.controlsOverChannelsSpace += delta;
        break;
      default:
        break;
    }
  });
};

export const handleShot = (
  delta: number,
  gameObject: types.RemoteGameObject,
  commonGameEventHandler: types.CommonGameEventHandler
) => {
  const o = gameObject;
  if (o.controlsSpace) {
    const timeQuantity = o.controlsSpace > delta ? delta : o.controlsSpace;
    o.controlsSpace -= timeQuantity;

    //shooting
    if (o.shotDelay - timeQuantity <= 0) {
      // shoot
      o.shotDelay += parameters.shotDelay;
      o.object3d &&
        commonGameEventHandler({
          type: types.EventType.SHOT,
          data: { object3d: o.object3d, speed: o.speed },
        });
    }
  }
  o.shotDelay -= Math.min(delta, o.shotDelay);
};

export const resetControlValues = (gameObject: types.RemoteGameObject) => {
  const o = gameObject;
  o.controlsOverChannelsUp = 0;
  o.controlsOverChannelsDown = 0;
  o.controlsOverChannelsLeft = 0;
  o.controlsOverChannelsRight = 0;
  o.controlsOverChannelsSpace = 0;
};
