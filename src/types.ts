import { RefObject } from "react";
import * as THREE from "three";
import * as parameters from "./parameters";

export type RTCSdpType = "answer" | "offer" | "pranswer" | "rollback";

export type Msg =
  | {
      id: string;
      type: RTCSdpType;
      description: string;
    }
  | {
      id: string;
      type: "candidate";
      candidate: string;
      mid: string;
    };

export type IceServerInfo = {
  urls: string;
  username: string;
  credential: string;
};

export type User = {
  username: string;
  score: number;
  accessToken: string | undefined;
  accessTokenExpiration: number | undefined;
  refreshToken: string | undefined;
};

export type WindowSize = { width: number; height: number };

export type SidePanelGeometry = {
  position: SidepanelPosition;
  diameter: number;
};

export type AuthoritativeState = {
  exists: boolean;
  idOverNetwork: number;
  inputsUp: number; // 0-3
  inputsDown: number; // 0-3
  inputsLeft: number; // 0-3
  inputsRight: number; // 0-3
  inputsSpace: number; // 0-3
  inputsD: number; // 0-3
  inputsF: number; // 0-3
  inputsE: number; // 0-3
  health: number;
  xEncoded: number;
  yEncoded: number;
  x: number;
  y: number;
  z: number;
  speed: number;
  rotationZEncoded: number;
  rotationZ: number;
  rotationSpeed: number;
  fuel: number;
  ordnanceChannel1Id: number | undefined;
  ordnanceChannel1Value: number;
  ordnanceChannel2Id: number | undefined;
  ordnanceChannel2Value: number;
  eventsEncoded: number;
  verticalSpeed: number;
};

export type ReceivedState = {
  tick: number;
  state: AuthoritativeState[]; // state index is idOverNetwork
};

export type RecentStates = {
  // The objects in the UpdateObject[] array are in the order they were in the received data.
  // If the received object data does not have idOverNetwork, the idOverNetwork will be looked from
  // the object in the UpdateObject[] array that has the same index as the received object.
  [sequenceNumber: number]: AuthoritativeState[];
};

export enum SidepanelPosition {
  Right,
  Bottom,
  Left,
  Top,
}

export type Three = {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.Renderer;
};

export type ConnectionObject = {
  remoteId: string;
  peerConnection: RTCPeerConnection;
  stringChannel?: RTCDataChannel;
  ackChannel?: RTCDataChannel;
  controlsChannel?: RTCDataChannel;
  stateChannel?: RTCDataChannel;
};

export type PeerConnectionsDictionary = {
  [id: string]: {
    peerConnection: RTCPeerConnection;
    handleSignaling: (
      description: RTCSessionDescription | null | undefined,
      candidate: RTCIceCandidate | null | undefined
    ) => void;
  };
};

export type PlayerState = {
  remoteId: string;
  score: number;
};

export type OverlayInfotextRef = RefObject<HTMLDivElement>;

export type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  username: string;
};

export enum Key {
  ArrowUp = "ArrowUp",
  ArrowDown = "ArrowDown",
  ArrowLeft = "ArrowLeft",
  ArrowRight = "ArrowRight",
  Space = "Space",
  KeyD = "KeyD",
  KeyF = "KeyF",
  KeyE = "KeyE",
}

export enum GameObjectType {
  Explosion,
  Bullet,
  Fighter,
  Background,
  Runway,
}

export interface GameObject {
  id: string;
  type: GameObjectType;
}

export interface StaticGameObject extends GameObject {
  type: GameObjectType.Runway;
  object3d:
    | THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[]>
    | undefined;
}

export interface LocalGameObject extends GameObject {
  type: GameObjectType.Bullet | GameObjectType.Explosion;
  object3d:
    | THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[]>
    | undefined;
  timeToLive: number;
  speed: number;
  positionZ: number;
  originId: number;
}

const f22HeightMeters = 5.1;
export const fighterHalfHeight =
  (1 / parameters.oneDistanceUnitInMeters) * (f22HeightMeters / 2);

export interface SharedGameObject extends GameObject {
  idOverNetwork: number;
  health: number;
  type: GameObjectType.Fighter;
  object3d: THREE.Mesh<THREE.BoxGeometry, THREE.Material[]> | undefined;
  isMe: boolean;
  isPlayer: boolean;
  username: string;
  score: number;
  speed: number;
  // inputsUp: number;
  // inputsDown: number;
  // inputsLeft: number;
  // inputsRight: number;
  // inputsSpace: number;
  // inputsF: number;
  // inputsD: number;
  // inputsE: number;
  rotationSpeed: number;
  verticalSpeed: number;
  backendPosition: THREE.Vector3;
  backendRotationZ: number;
  keyDowns: Key[];
  infoElement: {
    containerRef: RefObject<HTMLDivElement> | undefined;
    row1Ref: RefObject<HTMLDivElement> | undefined;
    row2Ref: RefObject<HTMLDivElement> | undefined;
  };
  shotDelay: number;
  positionZ: number;
  backendPositionZ: number;
  previousTruncatedPositionX: number;
  previousTruncatedPositionY: number;
  previousTruncatedPositionZ: number;
  previous2DecimalTruncatedRotationZ: number;
  halfHeight: number;
  radius: number;
  fuel: number;
  bulletCount: number;
}

export type TickStateObject = GameObject & {
  rollback: boolean;
  idOverNetwork: number;
  type: GameObjectType.Fighter;
  health: number;
  x: number;
  y: number;
  z: number;
  rotationZ: number;
  inputsUp: number;
  inputsDown: number;
  inputsLeft: number;
  inputsRight: number;
  inputsSpace: number;
  inputsF: number;
  inputsD: number;
  inputsE: number;
  fuel: number;
  bulletCount: number;
  speed: number;
  rotationSpeed: number;
  verticalSpeed: number;
  eventsEncoded: number;
  ordnanceChannel1Id: number | undefined;
  ordnanceChannel1Value: number;
  ordnanceChannel2Id: number | undefined;
  ordnanceChannel2Value: number;
};

export type TickLocalObjects = (GameObjectType.Bullet | number)[];
// [type, x, y, z, rotationZ, speed, timeToLive, originId, type, x, y, z, rotationZ, speed, timeToLive, originId, ...]
// type: GameObjectType.Bullet;
// x: number;
// y: number;
// z: number;
// rotationZ: number;
// speed: number;
// timeToLive: number;
// originId: number;

export enum ClientDataType {
  ChatMessage_Client = "ChatMessage_Client",
}

export enum ServerDataType {
  ChatMessage_Server = "ChatMessage_Server",
  BaseState = "BaseState",
}

export type ChatMessageFromServer = {
  type: ServerDataType.ChatMessage_Server;
  id: string;
  text: string;
  userId: string;
};

export type ChatMessageFromClient = {
  type: ClientDataType.ChatMessage_Client;
  text: string;
};

export type BaseStateSharedObject = {
  id: string;
  idOverNetwork: number;
  isPlayer: boolean;
  username: string;
  score: number;
};

export interface BaseStateStaticObject {
  id: string;
  type: 2;
  x: number;
  y: number;
  rotation: number;
}

export type BaseState = {
  type: ServerDataType.BaseState;
  data: {
    sharedObjects: BaseStateSharedObject[];
    staticObjects: BaseStateStaticObject[];
  };
};

export type StringData = ChatMessageFromServer | BaseState;

export const BaseStateObjectTypes = {
  2: GameObjectType.Runway,
};

export type Channel = {
  send: (stringData: string) => void;
};

export type Signaling = {
  remoteId: string;
  description?: RTCSessionDescription | null;
  candidate?: RTCIceCandidate | null;
};

export type InitialGameObject = {
  username: string;
  score: number;
  isPlayer: boolean;
};

export enum EventType {
  HealthZero,
  Shot,
  Shot2,
  ShotRollback,
  ShotRollback2,
  RemoveLocalObjectIndexes,
  CollisionLocalObject,
}

export type GameEvent =
  | {
      type: EventType.HealthZero;
      o: SharedGameObject;
      sequenceNumber: number;
    }
  | {
      type: EventType.Shot;
      o: SharedGameObject;
      sequenceNumber: number;
    }
  | {
      type: EventType.ShotRollback;
      sequenceNumber: number;
      localTickNumber: number;
      originId: number;
      ticks: TickStateObject[][];
      ticksLocalObjects: TickLocalObjects[];
    }
  | {
      type: EventType.ShotRollback2;
    }
  | { type: EventType.RemoveLocalObjectIndexes; data: number[] };
// | {
//     type: EventType.CollisionLocalObject;
//     data: [currentObject: TickStateObject, otherObject: TickLocalObject];
//   };

export type GameEventHandler = (scene: THREE.Scene, e: GameEvent) => void;

// State shape (1 + n * 1-29 bytes)
// [
//   Uint8 sequence number (1 byte)
//   ...game object data (1-29 bytes each): [                                                 bytes cumulative max
//     Uint8 providedValues1to8                                                               1
//       1: providedValues9to16 (true if the byte is non-zero, not compared to recent state)  |
//       2: inputs1                                                                           |
//       3: providedBytesPositionX                                                            |
//       4: providedBytesPositionX                                                            |
//          [00]: 0 bytes                                                                     |
//          [01]: 1 byte                                                                      |
//          [10]: 2 bytes                                                                     |
//          [11]: 4 bytes                                                                     |
//       5: providedBytesPositionY                                                            |
//       6: providedBytesPositionY                                                            |
//          [00]: 0 bytes                                                                     |
//          [01]: 1 byte                                                                      |
//          [10]: 2 bytes                                                                     |
//          [11]: 4 bytes                                                                     |
//       7: rotationZ                                                                         |
//       8: rotationSpeed                                                                     |
//     Uint8 providedValues9to16                                                              2
//       1: providedValues17to24 (true if the byte is non-zero, not compared to recent state) |
//       2: idOverNetwork                                                                     |
//       3: speed                                                                             |
//       4: events                                                                            |
//       5: health                                                                            |
//       6: fuel                                                                              |
//       7:                                                                                   |
//       8:                                                                                   |
//     Uint8 providedValues17to24                                                             3
//       1: inputs2                                                                           |
//       2: verticalSpeed                                                                     |
//       3: positionZ                                                                         |
//       4: ordnanceChannel1                                                                  |
//       5: ordnanceChannel2                                                                  |
//       6:                                                                                   |
//       7:                                                                                   |
//       8:                                                                                   |
//     Uint8 idOverNetwork?                                                                   4
//     Uint8 inputs1? (1&2:up 3&4:down 5&6:left 7&8:right)                                    5
//     Uint8*1-4 positionX? (unit is cm * positonToNetworkFactor (0.01) = meter)              9
//     Uint8*1-4 positionY? (unit is cm * positonToNetworkFactor (0.01) = meter)              13
//     Uint8*2 rotationZ?                                                                     15
//     Uint8 rotationSpeed                                                                    16
//     Uint8*2 speed                                                                          18
//     Uint8 events?                                                                          19
//       1: pOrdnance1Event                                                                   |
//       2: ppOrdnance1Event                                                                  |
//       3: pppOrdnance1Event                                                                 |
//       4: ppppOrdnance1Event                                                                |
//       5: pOrdnance2Event                                                                   |
//       6: ppOrdnance2Event                                                                  |
//       7: pppOrdnance2Event                                                                 |
//       8: ppppOrdnance2Event                                                                |
//     Uint8 health?                                                                          20
//     Uint8 fuel?                                                                            21
//     Uint8 inputs2? (1&2:space 3&4:keyD 5&6:keyF 7&8:keyE)                                  22
//     Uint8 verticalSpeed                                                                    23
//     Uint8*2 positionZ? (unit is feet)                                                      25
//     Uint8 ordnanceChannel1(1/2)?                                                           26
//       1: id part 1                                                                         |
//       2: id part 2                                                                         |
//       3: id part 3                                                                         |
//       4: byte count (value 0 = 1, value 1 = 2)                                             |
//       5: value part 1                                                                      |
//       6: value part 2                                                                      |
//       7: value part 3                                                                      |
//       8: value part 4 (4 bit max value 15)                                                 |
//     Uint8 ordnanceChannel1(2/2)?                                                           27
//       1: value part 5                                                                      |
//       2: value part 6                                                                      |
//       3: value part 7                                                                      |
//       4: value part 8                                                                      |
//       5: value part 9                                                                      |
//       6: value part 10                                                                     |
//       7: value part 11                                                                     |
//       8: value part 12 (12 bit max value 4095)                                             |
//     Uint8 ordnanceChannel2(1/2)?                                                           28
//       1: id part 1                                                                         |
//       2: id part 2                                                                         |
//       3: id part 3                                                                         |
//       4: byte count (value 0 = 1, value 1 = 2)                                             |
//       5: value part 1                                                                      |
//       6: value part 2                                                                      |
//       7: value part 3                                                                      |
//       8: value part 4 (4 bit max value 15)                                                 |
//     Uint8 ordnanceChannel2(2/2)?                                                           29
//       1: value part 5                                                                      |
//       2: value part 6                                                                      |
//       3: value part 7                                                                      |
//       4: value part 8                                                                      |
//       5: value part 9                                                                      |
//       6: value part 10                                                                     |
//       7: value part 11                                                                     |
//       8: value part 12 (12 bit max value 4095)                                             |
//   ]
// ]

// Controls shape (2-3 bytes) big endian
// [
//     Uint8 tickNumber
//     Uint8
//       1: up
//       2: up
//       3: down
//       4: down
//       5: left
//       6: left
//       7: right
//       8: right
//     Uint8
//       1: space
//       2: space
//       3: keyD
//       4: keyD
//       5: keyF
//       6: keyF
//       7: keyE
//       8: keyE
// ]
