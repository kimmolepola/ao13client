import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import * as THREE from "three";

import * as globals from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";
import * as parameters from "src/parameters";
import { decodeAngle } from "../../utils";
import { debugOn } from "../components/UserInterface/Sidepanel/Header";

let currentReliableStateSequenceNumber = 0;
let currentUnreliableStateIdsInOrderMaxIndex = 0;

const axis = new THREE.Vector3(0, 0, 1);

const recentStates: {
  [sequenceNumber: number]:
    | { timestamp: number; data: types.ReliableState[] }
    | undefined;
} = {};

type RecentState = {
  sequenceNumber: number;
  stateDataInOrder: types.ReliableState[];
};

const debug = (stateSequenceNumber: number) => {
  console.log("Received state sequance number:", stateSequenceNumber);
  console.log("RecentStates:", recentStates);
  console.log("GameServer:", globals.gameServer);
  setTimeout(async () => {
    globals.gameServer.connection?.peerConnection
      .getStats(null)
      .then((stats) => {
        let selected_firefox;
        let selectedCandidatePairId: string;
        let transportReport: any;
        const candidatePairs: any[] = [];

        stats.forEach((report) => {
          if (report.type === "candidate-pair" && report.selected) {
            selected_firefox = report;
          }
          if (report.type === "transport") {
            selectedCandidatePairId = report.selectedCandidatePairId;
            transportReport = report;
          }
          if (report.type === "candidate-pair") {
            candidatePairs.push(report);
          }
          console.log("Report:", report.type, report);
        });

        const selectedCandidatePair =
          selected_firefox ||
          candidatePairs.find((x) => x.id === selectedCandidatePairId);

        const local = stats.get(selectedCandidatePair.localCandidateId);
        const remote = stats.get(selectedCandidatePair.remoteCandidateId);

        console.log("Local candidate:", local);
        console.log("Remote candidate:", remote);

        console.log("Local protocol:", local?.protocol);
        console.log("Remote protocol:", remote?.protocol);
        console.log("Remote candidate type:", remote?.candidateType); // 'host', 'srflx', 'relay'

        if (remote?.candidateType === "relay") {
          console.log("Using TURN relay");
        } else {
          console.log("Not using TURN relay");
        }

        console.log("Relay protocol:", transportReport?.relayProtocol);
        console.log("Transport protocol:", transportReport?.protocol); // 'udp' or 'tcp'
      });
  });
};

const updateRecentStates = (state: RecentState) => {
  recentStates[state.sequenceNumber] = {
    timestamp: Date.now(),
    data: state.stateDataInOrder,
  };

  if (Object.keys(recentStates).length > 10) {
    const oldest: {
      timestamp: number;
      sequenceNumber: number | undefined;
    } = {
      timestamp: Date.now(),
      sequenceNumber: undefined,
    };
    Object.entries(recentStates).forEach(([key, value]) => {
      if (value?.timestamp && value.timestamp < oldest.timestamp) {
        oldest.timestamp = value.timestamp;
        oldest.sequenceNumber = Number(key);
      }
    });
    oldest.sequenceNumber && delete recentStates[oldest.sequenceNumber];
  }
  debugOn.value && debug(state.sequenceNumber);
};

export const useObjects = () => {
  const setObjectIds = useSetRecoilState(atoms.objectIds);

  const handleReceiveBaseState = useCallback(
    (baseStateObjects: types.BaseStateObject[]) => {
      let objectIdsChanged = false;

      const removeNonExistent = () => {
        for (let i = 0; i < globals.remoteObjects.length; i++) {
          const r = globals.remoteObjects[i];
          const b = baseStateObjects.find((x) => x.id === r.id);
          if (!b) {
            objectIdsChanged = true;
            globals.remoteObjects.splice(i, 1);
          }
        }
      };

      const addNewOrUpdate = () => {
        for (let i = 0; i < baseStateObjects.length; i++) {
          const b = baseStateObjects[i];
          const r = globals.remoteObjects.find((x) => x.id === b.id);
          if (r) {
            r.username = b.username;
            r.isPlayer = b.isPlayer;
          } else {
            objectIdsChanged = true;
            globals.remoteObjects.push({
              id: b.id,
              isMe: b.id === globals.state.ownId,
              type: types.GameObjectType.FIGHTER,
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
              backendPosition: new THREE.Vector3(0, 0, 0),
              backendQuaternion: new THREE.Quaternion(0, 0, 0, 0),
              keyDowns: [],
              infoElement: {
                containerRef: undefined,
                row1Ref: undefined,
                row2Ref: undefined,
              },
              object3d: undefined,
              dimensions: undefined,
              shotDelay: 0,
              collisions: {},
              health: 100,
              positionZ: 1000,
              backendPositionZ: 1000,
            });
          }
        }
      };

      const updateObjectIds = () => {
        if (objectIdsChanged) {
          const ids = baseStateObjects.map((x) => x.id);
          setObjectIds(ids);
        }
      };

      removeNonExistent();
      addNewOrUpdate();
      updateObjectIds();
    },
    [setObjectIds]
  );

  const handleReceiveReliableStateDataBinary = useCallback(
    (dataView: DataView) => {
      const state: RecentState = {
        sequenceNumber: dataView.getUint8(0),
        stateDataInOrder: [],
      };
      const byteLength = dataView.byteLength;
      let offset = 1;
      while (offset + types.reliableStateSingleObjectBytes <= byteLength) {
        const stateData: types.ReliableState = {
          id:
            "" +
            dataView.getUint32(offset).toString(16).padStart(8, "0") +
            dataView
              .getUint32(offset + 4)
              .toString(16)
              .padStart(8, "0") +
            dataView
              .getUint32(offset + 8)
              .toString(16)
              .padStart(8, "0") +
            dataView
              .getUint32(offset + 12)
              .toString(16)
              .padStart(8, "0"),
          score: dataView.getUint32(offset + 16),
          health: dataView.getUint8(offset + 20),
          rotationSpeed: dataView.getInt8(offset + 21),
          verticalSpeed: dataView.getInt8(offset + 22),
          speed:
            dataView.getUint16(offset + 23) * parameters.networkToSpeedFactor,
          positionX: dataView.getFloat32(offset + 25),
          positionY: dataView.getFloat32(offset + 29),
          positionZ: dataView.getFloat32(offset + 33),
          angleZ: dataView.getFloat32(offset + 37),
          // quaternionX: dataView.getFloat32(offset + 36),
          // quaternionY: dataView.getFloat32(offset + 40),
          // quaternionZ: dataView.getFloat32(offset + 44),
          // quaternionW: dataView.getFloat32(offset + 48),
        };
        state.stateDataInOrder.push(stateData);
        offset += types.reliableStateSingleObjectBytes;
      }
      updateRecentStates(state);
    },
    []
  );

  const handleReceiveUnreliableStateDataBinary = useCallback(
    (dataView: DataView) => {
      const reliableStateSequenceNumber = dataView.getUint8(2);

      const associatedState = recentStates[reliableStateSequenceNumber]?.data;
      if (!associatedState) {
        console.warn(
          "Received update data for unknown state version:",
          reliableStateSequenceNumber
        );
        return;
      }
      let offset = 3;
      let idsInOrderIndex = 0;
      const updateObjects: { [id: string]: types.UpdateObject } = {};

      while (offset < dataView.byteLength) {
        const associatedObject = associatedState[idsInOrderIndex];
        const providedValues1to8 = dataView.getUint8(offset);
        const providedValues9to16 = dataView.getUint8(offset + 1);
        offset += 2;
        const p: types.UpdateObject = {
          uScore: 0,
          uHealth: 0,
          uControlsUp: 0,
          uControlsDown: 0,
          uControlsLeft: 0,
          uControlsRight: 0,
          uControlsSpace: 0,
          uControlsD: 0,
          uControlsF: 0,
          uRotationSpeed: 0,
          uVerticalSpeed: 0,
          uSpeed: 0,
          uPositionX: 0,
          uPositionY: 0,
          uPositionZ: 0,
          uAngleZ: 0,
          // uQuaternionX: 0,
          // uQuaternionY: 0,
          // uQuaternionZ: 0,
          // uQuaternionW: 0,
        };

        if (providedValues1to8 & 0b00000001) {
          p.uScore = dataView.getUint32(offset);
          offset += 4;
        } else {
          p.uScore = associatedObject.score;
        }

        if (providedValues1to8 & 0b00000010) {
          p.uHealth = dataView.getUint8(offset);
          offset += 1;
        } else {
          p.uHealth = associatedObject.health;
        }

        if (providedValues1to8 & 0b00000100) {
          p.uControlsUp = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues1to8 & 0b00001000) {
          p.uControlsDown = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues1to8 & 0b00010000) {
          p.uControlsLeft = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues1to8 & 0b00100000) {
          p.uControlsRight = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues1to8 & 0b01000000) {
          p.uControlsSpace = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues1to8 & 0b10000000) {
          p.uControlsD = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues9to16 & 0b00000001) {
          p.uControlsF = dataView.getUint8(offset);
          offset += 1;
        }

        if (providedValues9to16 & 0b00000010) {
          p.uRotationSpeed = dataView.getInt8(offset);
          offset += 1;
        } else {
          p.uRotationSpeed = associatedObject.rotationSpeed;
        }

        if (providedValues9to16 & 0b00000100) {
          p.uVerticalSpeed = dataView.getInt8(offset);
          offset += 1;
        } else {
          p.uVerticalSpeed = associatedObject.verticalSpeed;
        }

        if (providedValues9to16 & 0b00001000) {
          p.uSpeed =
            dataView.getUint16(offset) * parameters.networkToSpeedFactor;
          offset += 2;
        } else {
          p.uSpeed = associatedObject.speed;
        }

        if (providedValues9to16 & 0b00010000) {
          p.uPositionX = dataView.getFloat32(offset);
          offset += 4;
        } else {
          p.uPositionX = associatedObject.positionX;
        }

        if (providedValues9to16 & 0b00100000) {
          p.uPositionY = dataView.getFloat32(offset);
          offset += 4;
        } else {
          p.uPositionY = associatedObject.positionY;
        }

        if (providedValues9to16 & 0b01000000) {
          p.uPositionZ = dataView.getFloat32(offset);
          offset += 4;
        } else {
          p.uPositionZ = associatedObject.positionZ;
        }

        if (providedValues9to16 & 0b10000000) {
          p.uAngleZ = decodeAngle(dataView.getUint16(offset));
          offset += 2;
        } else {
          p.uAngleZ = associatedObject.angleZ;
        }

        // if (providedValues9to16 & 0b00010000) {
        //   p.uQuaternionX = dataView.getFloat32(offset);
        //   offset += 4;
        // } else {
        //   p.uQuaternionX = associatedObject.quaternionX;
        // }

        // if (providedValues9to16 & 0b00100000) {
        //   p.uQuaternionY = dataView.getFloat32(offset);
        //   offset += 4;
        // } else {
        //   p.uQuaternionY = associatedObject.quaternionY;
        // }

        // if (providedValues9to16 & 0b01000000) {
        //   p.uQuaternionZ = dataView.getFloat32(offset);
        //   offset += 4;
        // } else {
        //   p.uQuaternionZ = associatedObject.quaternionZ;
        // }

        // if (providedValues9to16 & 0b10000000) {
        //   p.uQuaternionW = dataView.getFloat32(offset);
        //   offset += 4;
        // } else {
        //   p.uQuaternionW = associatedObject.quaternionW;
        // }

        updateObjects[associatedObject.id] = p;
        idsInOrderIndex++;
      }

      for (let i = globals.remoteObjects.length - 1; i > -1; i--) {
        const o = globals.remoteObjects[i];
        const u = o && updateObjects[o.id];
        if (u) {
          o.score = u.uScore;
          o.health = u.uHealth;
          o.rotationSpeed = u.uRotationSpeed || 0;
          o.speed = u.uSpeed || 0;
          o.backendPosition.set(u.uPositionX, u.uPositionY, 0);
          o.backendQuaternion.setFromAxisAngle(axis, u.uAngleZ);
          o.backendPositionZ = u.uPositionZ;
          // o.backendQuaternion.set(
          //   u.uQuaternionX,
          //   u.uQuaternionY,
          //   u.uQuaternionZ,
          //   u.uQuaternionW
          // );
          if (!o.isMe) {
            o.controlsUp += u.uControlsUp || 0;
            o.controlsDown += u.uControlsDown || 0;
            o.controlsLeft += u.uControlsLeft || 0;
            o.controlsUp += u.uControlsUp || 0;
            o.controlsSpace += u.uControlsSpace || 0;
            o.controlsD += u.uControlsD || 0;
            o.controlsF += u.uControlsF || 0;
          }
        }
      }
      if (
        debugOn.value &&
        reliableStateSequenceNumber !== currentReliableStateSequenceNumber
      ) {
        currentReliableStateSequenceNumber = reliableStateSequenceNumber;
        console.log(
          "reliableStateSequenceNumber:",
          reliableStateSequenceNumber
        );
        console.log("updateObjects:", updateObjects);
      }
      if (
        debugOn.value &&
        idsInOrderIndex !== currentUnreliableStateIdsInOrderMaxIndex
      ) {
        currentUnreliableStateIdsInOrderMaxIndex = idsInOrderIndex;
        console.log(
          "unreliableStateIdsInOrderMaxIndex:",
          currentUnreliableStateIdsInOrderMaxIndex
        );
      }
    },
    []
  );

  const handleQuit = useCallback(() => {
    globals.remoteObjects.splice(0, globals.remoteObjects.length);
    setObjectIds([]);
  }, [setObjectIds]);

  return {
    handleQuit,
    handleReceiveBaseState,
    handleReceiveReliableStateDataBinary,
    handleReceiveUnreliableStateDataBinary,
  };
};
