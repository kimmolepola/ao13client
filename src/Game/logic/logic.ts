import * as types from "src/types";
import * as parameters from "src/parameters";

export const checkHealth = (
  remoteGameObject: types.RemoteGameObject,
  gameEventHandler: types.GameEventHandler
) => {
  if (remoteGameObject.health <= 0) {
    gameEventHandler({
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
  for (let i = 0; i < o.keyDowns.length; i++) {
    const key = o.keyDowns[i];
    switch (key) {
      case types.Keys.Up:
        o.controlsUp += delta;
        o.controlsOverChannelsUp += delta;
        break;
      case types.Keys.Down:
        o.controlsDown += delta;
        o.controlsOverChannelsDown += delta;
        break;
      case types.Keys.Left:
        o.controlsLeft += delta;
        o.controlsOverChannelsLeft += delta;
        break;
      case types.Keys.Right:
        o.controlsRight += delta;
        o.controlsOverChannelsRight += delta;
        break;
      case types.Keys.Space:
        o.controlsSpace += delta;
        o.controlsOverChannelsSpace += delta;
        break;
      case types.Keys.D:
        o.controlsD += delta;
        o.controlsOverChannelsD += delta;
        break;
      case types.Keys.F:
        o.controlsF += delta;
        o.controlsOverChannelsF += delta;
        break;
      default:
        break;
    }
  }
};

export const handleShot = (
  delta: number,
  gameObject: types.RemoteGameObject,
  gameEventHandler: types.GameEventHandler
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
        gameEventHandler({
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
  o.controlsOverChannelsD = 0;
  o.controlsOverChannelsF = 0;
};
