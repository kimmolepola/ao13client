import * as THREE from "three";

import * as globals from "src/globals";
import * as types from "src/types";
import * as parameters from "src/parameters";
import { handleReceiveAuthoritativeState } from "./tick";

export const handleReceiveBaseState = (
  baseState: types.BaseState,
  onChangeObjectIds: (value: string[]) => void,
  onChangeStaticObjects: (value: types.BaseStateStaticObject[]) => void
) => {
  let objectIdsChanged = false;

  // const removeNonExistentSharedObjects = () => {
  //   for (let i = 0; i < globals.sharedObjects.length; i++) {
  //     const r = globals.sharedObjects[i];
  //     const b = baseState.data.sharedObjects.find((x) => x.id === r.id);
  //     if (!b) {
  //       objectIdsChanged = true;
  //       globals.sharedObjects.splice(i, 1);
  //     }
  //   }
  // };

  const handleNonExistentSharedObjects = () => {
    for (let i = 0; i < globals.sharedObjects.length; i++) {
      const r = globals.sharedObjects[i];
      const b = baseState.data.sharedObjects.find((x) => x.id === r.id);
      if (!b) {
        objectIdsChanged = true;
        // globals.sharedObjects.splice(i, 1);
      }
    }
  };

  const addNewOrUpdateSharedObjects = () => {
    for (let i = 0; i < baseState.data.sharedObjects.length; i++) {
      const b = baseState.data.sharedObjects[i];
      const r = globals.sharedObjects.find((x) => x.id === b.id);
      if (r) {
        r.idOverNetwork = b.idOverNetwork;
        r.username = b.username;
        r.isPlayer = b.isPlayer;
      } else {
        objectIdsChanged = true;
        globals.sharedObjects.push({
          id: b.id,
          idOverNetwork: b.idOverNetwork,
          isMe: b.id === globals.state.ownId,
          type: types.GameObjectType.Fighter,
          isPlayer: b.isPlayer,
          username: b.username,
          score: 0,
          controlsUp: 0,
          controlsDown: 0,
          controlsLeft: 0,
          controlsRight: 0,
          controlsSpace: 0,
          controlsD: 0,
          controlsF: 0,
          controlsOverChannelsUp: 0,
          controlsOverChannelsDown: 0,
          controlsOverChannelsLeft: 0,
          controlsOverChannelsRight: 0,
          controlsOverChannelsSpace: 0,
          controlsOverChannelsD: 0,
          controlsOverChannelsF: 0,
          rotationSpeed: 0,
          verticalSpeed: 0,
          speed: 0,
          backendPosition: new THREE.Vector3(0, 0, 0.1),
          // backendQuaternion: new THREE.Quaternion(0, 0, 0, 0),
          backendRotationZ: 0,
          keyDowns: [],
          infoElement: {
            containerRef: undefined,
            row1Ref: undefined,
            row2Ref: undefined,
          },
          object3d: undefined,
          shotDelay: 0,
          health: 100,
          positionZ: 1000,
          backendPositionZ: 1000,
          previousPosition: ["0", "0", 0],
          previousRotation: 0,
          halfHeight: types.fighterHalfHeight,
          radius: 1,
          bullets: 0,
          fuel: 0,
        });
      }
    }
  };

  const updateObjectIds = () => {
    if (objectIdsChanged) {
      const ids = baseState.data.sharedObjects.map((x) => x.id);
      onChangeObjectIds(ids);
      globals.state.ownRemoteObjectIndex = globals.sharedObjects.findIndex(
        (x) => x.isMe
      );
    }
  };

  const updateStaticObjects = () => {
    globals.staticObjects.length = 0;
    baseState.data.staticObjects.forEach((x) => {
      const type = types.BaseStateObjectTypes[x.type];
      const existingStaticObject = globals.staticObjects.find(
        (xx) => xx.id === x.id
      );
      if (!existingStaticObject && type === types.GameObjectType.Runway) {
        globals.staticObjects.push({
          id: x.id,
          type,
          object3d: undefined,
        });
      }
    });
  };

  // removeNonExistentSharedObjects();
  handleNonExistentSharedObjects();
  addNewOrUpdateSharedObjects();
  updateObjectIds();

  updateStaticObjects();
  onChangeStaticObjects(baseState.data.staticObjects);
};

export const handleQuit = (
  onChangeObjectIds: (value: string[]) => void,
  onChangeStaticObjects: (value: types.BaseStateStaticObject[]) => void
) => {
  globals.sharedObjects.splice(0, globals.sharedObjects.length);
  onChangeObjectIds([]);
  onChangeStaticObjects([]);
};

export const handleReceiveState = handleReceiveAuthoritativeState;

// let previousTime: number | null = null;
// export const handleReceiveState = (receivedState: types.ReceivedState) => {
//   const time = Date.now();
//   const prev = previousTime ?? time - parameters.unreliableStateInterval;
//   const delta = time - prev;
//   previousTime = time;
//   for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
//     const o = globals.sharedObjects[i];
//     const u = o && updateObjects[o.idOverNetwork];
//     if (u) {
//       o.health = u.health;
//       o.backendPosition.setX(u.x);
//       o.backendPosition.setY(u.y);
//       o.backendPositionZ = u.z;
//       o.backendRotationZ = u.rotationZ;
//       o.fuel = u.fuel;
//       o.bullets = u.ordnanceChannel1.value;
//       if (!o.isMe) {
//         o.controlsUp += u.ctrlsUp ? delta : 0;
//         o.controlsDown += u.ctrlsDown ? delta : 0;
//         o.controlsLeft += u.ctrlsLeft ? delta : 0;
//         o.controlsRight += u.ctrlsRight ? delta : 0;
//         o.controlsSpace += u.ctrlsSpace ? delta : 0;
//         o.controlsD += u.ctrlsD ? delta : 0;
//         o.controlsF += u.ctrlsF ? delta : 0;
//       }
//     }
//   }
// };
