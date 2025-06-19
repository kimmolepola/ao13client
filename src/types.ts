import { RefObject } from "react";
import * as THREE from "three";

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

export type PeerConnection = {
  remoteId: string;
  peerConnection: RTCPeerConnection;
  orderedChannel?: RTCDataChannel;
  unorderedChannel?: RTCDataChannel;
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
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
  SPACE = "space",
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
  controlsOverChannelsUp: number;
  controlsOverChannelsDown: number;
  controlsOverChannelsLeft: number;
  controlsOverChannelsRight: number;
  controlsOverChannelsSpace: number;
  rotationSpeed: number;
  backendPosition: THREE.Vector3;
  backendQuaternion: THREE.Quaternion;
  keyDowns: Keys[];
  infoElement: {
    containerRef: RefObject<HTMLDivElement> | undefined;
    row1Ref: RefObject<HTMLDivElement> | undefined;
    row2Ref: RefObject<HTMLDivElement> | undefined;
  };

  shotDelay: number;
}

export enum NetDataType {
  CHATMESSAGE_CLIENT,
  CHATMESSAGE_MAIN,
  CONTROLS,
  UPDATE,
  STATE,
}

export type ChatMessageFromClient = {
  type: NetDataType.CHATMESSAGE_CLIENT;
  text: string;
};

export type ChatMessageFromMain = {
  type: NetDataType.CHATMESSAGE_MAIN;
  id: string;
  text: string;
  userId: string;
};

export type Controls = {
  type: NetDataType.CONTROLS;
  data: {
    up: number;
    down: number;
    left: number;
    right: number;
    space: number;
  };
};

export type UpdateObject = {
  uScore: number;
  uHealth: number;
  uControlsUp: number;
  uControlsDown: number;
  uControlsLeft: number;
  uControlsRight: number;
  uControlsSpace: number;
  uRotationSpeed: number;
  uSpeed: number;
  uPositionX: number;
  uPositionY: number;
  uPositionZ: number;
  uQuaternionX: number;
  uQuaternionY: number;
  uQuaternionZ: number;
  uQuaternionW: number;
};

export type StateObject = {
  sId: string;
  sIsPlayer: boolean;
  sUsername: string;
  sScore: number;
  sRotationSpeed: number;
  sSpeed: number;
  sPositionX: number;
  sPositionY: number;
  sPositionZ: number;
  sQuaternionX: number;
  sQuaternionY: number;
  sQuaternionZ: number;
  sQuaternionW: number;
};

export type Update = {
  timestamp: number;
  type: NetDataType.UPDATE;
  data: {
    [id: string]: UpdateObject;
  };
};

export type State = {
  type: NetDataType.STATE;
  data: { [id: string]: StateObject };
};

export type NetData =
  | ChatMessageFromClient
  | Controls
  | ChatMessageFromMain
  | Update
  | State;

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
  COLLISION,
  SHOT,
  REMOVE_LOCAL_OBJECT_INDEXES,
}

export type ServerGameEvent = {
  type: EventType.COLLISION;
  data: {
    object: RemoteGameObject;
    otherObjects: GameObject[];
  };
};

export type CommonGameEvent =
  | {
      type: EventType.HEALTH_ZERO;
      data: RemoteGameObject;
    }
  | {
      type: EventType.SHOT;
      data: { object3d: THREE.Mesh; speed: number };
    }
  | { type: EventType.REMOVE_LOCAL_OBJECT_INDEXES; data: number[] };

export type ServerGameEventHandler = (e: ServerGameEvent) => void;
export type CommonGameEventHandler = (e: CommonGameEvent) => void;
