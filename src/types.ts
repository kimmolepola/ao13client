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
  ctrlsUp: boolean;
  ctrlsDown: boolean;
  ctrlsLeft: boolean;
  ctrlsRight: boolean;
  ctrlsSpace: boolean;
  ctrlsD: boolean;
  ctrlsF: boolean;
  health: number;
  xDifferenceSignificance: number;
  yDifferenceSignificance: number;
  zDifferenceSignificance: number;
  rotationZDifferenceSignificance: number;
  xEncoded: number;
  yEncoded: number;
  x: number;
  y: number;
  z: number;
  rotationZEncoded: number;
  rotationZ: number;
  fuel: number;
  ordnanceChannel1: { id: number | undefined; value: number };
  ordnanceChannel2: { id: number | undefined; value: number };
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

export enum Keys {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
  Space = "space",
  D = "d",
  F = "f",
  E = "e",
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
  controlsUp: number;
  controlsDown: number;
  controlsLeft: number;
  controlsRight: number;
  controlsSpace: number;
  controlsF: number;
  controlsD: number;
  controlsE: number;
  controlsOverChannelsUp: number;
  controlsOverChannelsDown: number;
  controlsOverChannelsLeft: number;
  controlsOverChannelsRight: number;
  controlsOverChannelsSpace: number;
  controlsOverChannelsD: number;
  controlsOverChannelsF: number;
  controlsOverChannelsE: number;
  rotationSpeed: number;
  verticalSpeed: number;
  backendPosition: THREE.Vector3;
  backendRotationZ: number;
  keyDowns: Keys[];
  infoElement: {
    containerRef: RefObject<HTMLDivElement> | undefined;
    row1Ref: RefObject<HTMLDivElement> | undefined;
    row2Ref: RefObject<HTMLDivElement> | undefined;
  };
  shotDelay: number;
  positionZ: number;
  backendPositionZ: number;
  previousPosition: [string, string, number];
  previousRotation: number;
  halfHeight: number;
  radius: number;
  fuel: number;
  bullets: number;
}

export type TickStateObject = GameObject & {
  idOverNetwork: number;
  health: number;
  type: GameObjectType.Fighter;
  x: number;
  y: number;
  score: number;
  speed: number;
  controlsUp: number;
  controlsDown: number;
  controlsLeft: number;
  controlsRight: number;
  controlsSpace: number;
  controlsF: number;
  controlsD: number;
  controlsOverChannelsUp: number;
  controlsOverChannelsDown: number;
  controlsOverChannelsLeft: number;
  controlsOverChannelsRight: number;
  controlsOverChannelsSpace: number;
  controlsOverChannelsD: number;
  controlsOverChannelsF: number;
  rotationSpeed: number;
  verticalSpeed: number;
  backendX: number;
  backendY: number;
  backendRotationZ: number;
  keyDowns: Keys[];
  shotDelay: number;
  positionZ: number;
  backendPositionZ: number;
  previousPosition: [string, string, number];
  previousRotation: number;
  fuel: number;
  bullets: number;
};

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
  RemoveLocalObjectIndexes,
}

export type GameEvent =
  | {
      type: EventType.HealthZero;
      data: SharedGameObject;
    }
  | {
      type: EventType.Shot;
      data: SharedGameObject;
    }
  | { type: EventType.RemoveLocalObjectIndexes; data: number[] };

export type GameEventHandler = (scene: THREE.Scene, e: GameEvent) => void;

// State shape (1 + n * 1-23 bytes)
// [
//   Uint8 sequence number (1 byte)
//   ...game object data (1-23 bytes each): [                                           bytes cumulative max
//     Uint8 providedValues1to8                                                         1
//       1: values9to16IsProvided                                                       |
//       2: controls                                                                    |
//       3: fuel                                                                        |
//       4: providedBytesForPositionAndRotation                                         |
//       5: positionX                                                                   |
//       6: positionY                                                                   |
//       7: positionZ                                                                   |
//       8: rotationZ                                                                   |
//     Uint8 providedValues9to16                                                        2
//       1: idOverNetwork                                                               |
//       2: health                                                                      |
//       3: ordnanceChannel1                                                            |
//       4: ordnanceChannel2                                                            |
//       5:                                                                             |
//       6:                                                                             |
//       7:                                                                             |
//     Uint8 idOverNetwork?                                                             3
//     Uint8 controls? (1:up 2:down 3:left 4:right 5:space 6:keyD 7:keyF)               4
//     Uint8 health?                                                                    5
//     Uint8 fuel?                                                                      6
//     Uint8 providedBytesForPositionAndRotation? (6 bits in use)                       7
//       1&2 positionX:                                                                 |
//         [00]: 1 byte                                                                 |
//         [01]: 2 bytes                                                                |
//         [10]: 3 bytes                                                                |
//         [11]: 4 bytes                                                                |
//       3&4 positionY:                                                                 |
//         [00]: 1 byte                                                                 |
//         [01]: 2 bytes                                                                |
//         [10]: 3 bytes                                                                |
//         [11]: 4 bytes                                                                |
//       5 positionZ:                                                                   |
//         [0]: 1 byte                                                                  |
//         [1]: 2 bytes                                                                 |
//       6 rotationZ:                                                                   |
//         [0]: 1 byte                                                                  |
//         [1]: 2 bytes                                                                 |
//     Uint8*1-4 positionX? (unit is cm * positonToNetworkFactor (0.01) = meter)        11
//     Uint8*1-4 positionY? (unit is cm * positonToNetworkFactor (0.01) = meter)        15
//     Uint8*1-2 positionZ? (unit is feet)                                              17
//     Uint8*1-2 rotationZ?                                                             19
//     Uint8 ordnanceChannel1(1/2)?                                                     20
//       1: id part 1                                                                   |
//       2: id part 2                                                                   |
//       3: id part 3                                                                   |
//       4: byte count (value 0 = 1, value 1 = 2)                                       |
//       5: value part 1                                                                |
//       6: value part 2                                                                |
//       7: value part 3                                                                |
//       8: value part 4 (4 bit max value 15)                                           |
//     Uint8 ordnanceChannel1(2/2)?                                                     21
//       1: value part 5                                                                |
//       2: value part 6                                                                |
//       3: value part 7                                                                |
//       4: value part 8                                                                |
//       5: value part 9                                                                |
//       6: value part 10                                                               |
//       7: value part 11                                                               |
//       8: value part 12 (12 bit max value 4095)                                       |
//     Uint8 ordnanceChannel2(1/2)?                                                     22
//       1: id part 1                                                                   |
//       2: id part 2                                                                   |
//       3: id part 3                                                                   |
//       4: byte count (value 0 = 1, value 1 = 2)                                       |
//       5: value part 1                                                                |
//       6: value part 2                                                                |
//       7: value part 3                                                                |
//       8: value part 4 (4 bit max value 15)                                           |
//     Uint8 ordnanceChannel2(2/2)?                                                     23
//       1: value part 5                                                                |
//       2: value part 6                                                                |
//       3: value part 7                                                                |
//       4: value part 8                                                                |
//       5: value part 9                                                                |
//       6: value part 10                                                               |
//       7: value part 11                                                               |
//       8: value part 12 (12 bit max value 4095)                                       |
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
