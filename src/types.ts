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
  ordnanceChannel1Id: number;
  ordnanceChannel1Byte1: number;
  ordnanceChannel1Byte2: number;
  ordnanceChannel2Id: number;
  ordnanceChannel2Byte1: number;
  ordnanceChannel2Byte2: number;
  eventsEncoded: number;
  gameEventIds: number[][];
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

// 2-bit input encoding: frames held at 60 fps, capped at 3
export const inputFull = 3;
export const inputPartial = 2;
export const inputTap = 1;

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
  previous2DecimalTruncatedPositionX: number;
  previous2DecimalTruncatedPositionY: number;
  previous2DecimalTruncatedPositionZ: number;
  previous3DecimalTruncatedRotationZ: number;
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
  ordnanceChannel1Id: number;
  ordnanceChannel1Byte1: number;
  ordnanceChannel1Byte2: number;
  ordnanceChannel2Id: number;
  ordnanceChannel2Byte1: number;
  ordnanceChannel2Byte2: number;
  shotDelay: number;
  gameEventIds: number[];
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
  InactivityWarning = "InactivityWarning",
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

export type InactivityWarning = {
  type: ServerDataType.InactivityWarning;
  secondsUntilDisconnect: number;
};

export type StringData = ChatMessageFromServer | BaseState | InactivityWarning;

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
      sequenceNumber: number;
      tickStateObject: TickStateObject;
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

// State shape (1 + n * 1-38 bytes)
// [
//   Uint8 sequence number (1 byte)
//   ...game object data (1-38 bytes each): [                                                 bytes cumulative max
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
//     Uint8 providedValues9to16?                                                             2
//       1: providedValues17to24 (true if the byte is non-zero, not compared to recent state) |
//       2: idOverNetwork                                                                     |
//       3: speed                                                                             |
//       4: events                                                                            |
//       5: eventsIds                                                                         |
//       6: health                                                                            |
//       7: fuel                                                                              |
//       8:                                                                                   |
//     Uint8 providedValues17to24?                                                            3
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
//     Uint8 rotationSpeed?                                                                   16
//     Uint8*2 speed?                                                                         18
//     Uint8 events?                                                                          19
//       1: cur had one or more game events                                                   |
//       2: p had one or more game events                                                     |
//       3: pp had one or more game events                                                    |
//       4: ppp had one or more game events                                                   |
//       5-8: unused                                                                          |
//     Uint8* gameEventIds? (linked list per tick, cur then p then pp then ppp)              20+
//       1-7: event id (0-127)                                                                |
//       8: another event follows for this tick (1) or end of tick's events (0)              |
//     Uint8 health?                                                                          20+n
//     Uint8 fuel?                                                                            29
//     Uint8 inputs2? (1&2:space 3&4:keyD 5&6:keyF 7&8:keyE)                                  30
//     Uint8 verticalSpeed?                                                                   31
//     Uint8*2 positionZ? (unit is feet)                                                      32
//     Uint8 ordnanceChannel1ID?                                                              33
//       1: id part 1                                                                         |
//       2: id part 2                                                                         |
//       3: id part 3                                                                         |
//       4: id part 4                                                                         |
//       5: id part 5                                                                         |
//       6: id part 6                                                                         |
//       7: id part 7 (7 bit max value 127)                                                   |
//       8: byte 2 provided                                                                   |
//     Uint8 ordnanceChannel1ValueByte1?                                                      34
//     Uint8 ordnanceChannel1ValueByte2?                                                      35
//     Uint8 ordnanceChannel2ID?                                                              36
//       1: id part 1                                                                         |
//       2: id part 2                                                                         |
//       3: id part 3                                                                         |
//       4: id part 4                                                                         |
//       5: id part 5                                                                         |
//       6: id part 6                                                                         |
//       7: id part 7 (7 bit max value 127)                                                   |
//       8: byte 2 provided                                                                   |
//     Uint8 ordnanceChannel2ValueByte1?                                                      37
//     Uint8 ordnanceChannel2ValueByte2?                                                      38
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
