import { RefObject } from "react";
import * as THREE from "three";

// 2 bytes for sequence number, 1 byte for associated reliable-state sequence number
export const unreliableStateInfoBytes = 3;

export const reliableStateSingleObjectBytes = 14;
export const reliableStateOffsets = {
  idOverNetwork: 0,
  health: 1,
  positionX: 2,
  positionY: 6,
  positionZ: 10,
  angleZ: 12,
};

export const unreliableStateSingleObjectMaxBytes = 17;

export type UpdateObject = {
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
  angleZDifferenceSignificance: number;
  xEncoded: number;
  xDecoded: number;
  yEncoded: number;
  yDecoded: number;
  z: number;
  quaternionEncodedWithOnlyZRotation: number;
  quaternion: THREE.Quaternion;
};

export type RecentStates = {
  // The objects in the UpdateObject[] array are in the order they were in the received data.
  // If the received object data does not have idOverNetwork, the idOverNetwork will be looked from
  // the object in the UpdateObject[] array that has the same index as the received object.
  [sequenceNumber: number]: UpdateObject[];
};

export enum Position {
  RIGHT,
  BOTTOM,
  LEFT,
  TOP,
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
}

export enum GameObjectType {
  EXPLOSION,
  BULLET,
  FIGHTER,
  BACKGROUND,
}

export interface GameObject {
  id: string;
  type: GameObjectType;
  speed: number;
  object3d: THREE.Object3D | undefined;
  dimensions?: THREE.Vector3 | undefined;
  collisions: { [gameObjectId: string]: { time: number; collision: boolean } };
}

export interface LocalGameObject extends GameObject {
  type: GameObjectType.BULLET | GameObjectType.EXPLOSION;
  object3d:
    | THREE.Mesh<THREE.PlaneGeometry, THREE.Material | THREE.Material[]>
    | undefined;
  timeToLive: number;
}

export interface RemoteGameObject extends GameObject {
  idOverNetwork: number;
  health: number;
  type: GameObjectType.FIGHTER;
  object3d: THREE.Mesh<THREE.BoxGeometry, THREE.Material[]> | undefined;
  isMe: boolean;
  isPlayer: boolean;
  username: string;
  score: number;
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
  backendPosition: THREE.Vector3;
  backendQuaternion: THREE.Quaternion;
  keyDowns: Keys[];
  infoElement: {
    containerRef: RefObject<HTMLDivElement> | undefined;
    row1Ref: RefObject<HTMLDivElement> | undefined;
    row2Ref: RefObject<HTMLDivElement> | undefined;
  };
  shotDelay: number;
  positionZ: number;
  backendPositionZ: number;
}

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

export type BaseStateObject = {
  id: string;
  idOverNetwork: number;
  isPlayer: boolean;
  username: string;
};

// State shape (1 + n * 1-17 bytes)
// [
//   Uint8 sequence number (1 byte)
//   ...game object data (1-17 bytes each): [                                           bytes cumulative max
//     Uint8 providedValues1to8                                                         1
//       1: idOverNetwork                                                               |
//       2: controls                                                                    |
//       3: health                                                                      |
//       4: positionX                                                                   |
//       5: positionY                                                                   |
//       6: positionZ                                                                   |
//       7: angleZ                                                                      |
//       8: providedBytesForPositionAndAngle                                            |
//     Uint8 idOverNetwork? #1                                                          2
//     Uint8 controls? #2 (1:up 2:down 3:left 4:right 5:space 6:keyD 7:keyF)            3
//     Uint8 health? #3                                                                 4
//     Uint8 providedBytesForPositionAndAngle? #4 (6 bits in use)                       5
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
//       6 angleZ:                                                                      |
//         [0]: 1 byte                                                                  |
//         [1]: 2 bytes                                                                 |
//     Uint8*1-4 positionX? #3 (unit is cm * positonToNetworkFactor (0.01) = meter)     9
//     Uint8*1-4 positionY? #4 (unit is cm * positonToNetworkFactor (0.01) = meter)     13
//     Uint8*1-2 positionZ? #5 (unit is feet)                                           15
//     Uint8*1-2 angleZ? #6                                                             17
//   ]
// ]

// Controls shape (1-5 bytes)
// [
//     Uint8 providedControls1to7 (1:up 2:down 3:left 4:right 5:space 6:keyD 7:keyF)
//     Uint8
//       1-4 providedControl1?
//       5-8 providedControl2?
//     Uint8
//       1-4 providedControl3?
//       5-8 providedControl4?
//     Uint8
//       1-4 providedControl5?
//       5-8 providedControl6?
//     Uint8
//       1-4 providedControl7?
// ]

export type UpdateBinary = ArrayBuffer;
export type ReliableStateBinary = ArrayBuffer;

export type ReliableState = {
  id: string;
  score: number;
  health: number;
  rotationSpeed: number;
  verticalSpeed: number;
  speed: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  angleZ: number;
  // quaternionX: number;
  // quaternionY: number;
  // quaternionZ: number;
  // quaternionW: number;
};

export type BaseState = {
  type: ServerDataType.BaseState;
  data: BaseStateObject[];
};

export type StringData = ChatMessageFromServer | BaseState;

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
  HEALTH_ZERO,
  SHOT,
  REMOVE_LOCAL_OBJECT_INDEXES,
}

export type GameEvent =
  | {
      type: EventType.HEALTH_ZERO;
      data: RemoteGameObject;
    }
  | {
      type: EventType.SHOT;
      data: { object3d: THREE.Mesh; speed: number };
    }
  | { type: EventType.REMOVE_LOCAL_OBJECT_INDEXES; data: number[] };

export type GameEventHandler = (e: GameEvent) => void;
