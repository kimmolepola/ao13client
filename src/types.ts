import { RefObject } from "react";
import * as THREE from "three";

// 2 bytes for sequence number, 1 byte for associated reliable-state sequence number
export const unreliableStateInfoBytes = 3;

export const reliableStateSingleObjectBytes = 41;
export const unreliableStateSingleObjectMaxBytes = 32;

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
  reliableChannel?: RTCDataChannel;
  reliableChannelBinary?: RTCDataChannel;
  unreliableChannelBinary?: RTCDataChannel;
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

export type UpdateObject = {
  uScore: number;
  uHealth: number;
  uControlsUp: number;
  uControlsDown: number;
  uControlsLeft: number;
  uControlsRight: number;
  uControlsSpace: number;
  uControlsD: number;
  uControlsF: number;
  uRotationSpeed: number;
  uVerticalSpeed: number;
  uSpeed: number;
  uPositionX: number;
  uPositionY: number;
  uPositionZ: number;
  uAngleZ: number;
  // uQuaternionX: number;
  // uQuaternionY: number;
  // uQuaternionZ: number;
  // uQuaternionW: number;
};

export type BaseStateObject = {
  id: string;
  isPlayer: boolean;
  username: string;
};

// Reliable-State shape (1 + n * 41 bytes)
// [
//   Uint8 sequence number (1 byte)
//   ...stateDataInOrder (41 bytes each): [
//     Uint32 guid part 1
//     Uint32 guid part 2
//     Uint32 guid part 3
//     Uint32 guid part 4
//     Uint32 score
//     Uint8 health
//     Int8 rotationSpeed
//     Int8 verticalSpeed
//     Uint16 speed
//     Float32 positionX
//     Float32 positionY
//     Float32 positionZ
//     Float32 angleZ
//   ]
// ]

// Unreliable-State shape (3 + n * 2-32 bytes)
// [
//   Uint16 sequence number (2 bytes)
//   Uint8 sequence number of associated reliable-state (1 byte)
//   ...game object data (2-32 bytes each): [
//     Uint8 providedValues1to8
//     Uint8 providedValues9to16
//     Uint32 score? #1
//     Uint8 health? #2
//     Uint8 controlsUp? #3
//     Uint8 controlsDown? #4
//     Uint8 controlsLeft? #5
//     Uint8 controlsRight? #6
//     Uint8 controlsSpace? #7
//     Uint8 controlsD? #8
//     Uint8 controlsF? #9
//     Int8 rotationSpeed? #10
//     int8 verticalSpeed? #11
//     Uint16 speed? #12
//     Float32 positionX? #13
//     Float32 positionY? #14
//     Float32 positionZ? #15
//     Uint16 angleZ? #16
//   ]
// ]

// ControlsBinary shape (1-8 bytes)
// [
//   Uint8 providedValues
//   Uint8 up?
//   Uint8 down?
//   Uint8 left?
//   Uint8 right?
//   Uint8 space?
//   Uint8 d?
//   Uint8 f?
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

export type NetData = ChatMessageFromServer | BaseState;

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
