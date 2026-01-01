// import * as THREE from "three";
import * as types from "../../types";
import * as parameters from "../../parameters";
import * as debug from "./debug";
import * as utils from "../../utils";

// const axis = new THREE.Vector3(0, 0, 1);

const recentStates: types.RecentStates = {
  0: [],
  32: [],
  64: [],
  96: [],
  128: [],
  160: [],
  192: [],
  224: [],
};

export const getRecentStateForDebug = () => recentStates;

const getTargetRecentState = (curSeq: number) => {
  const maxSequenceNumber = parameters.stateMaxSequenceNumber;
  const sequenceNumbers = maxSequenceNumber + 1;
  const slotLength = parameters.recentStateSlotLength;
  const remainder = curSeq % slotLength;
  const slotStart = curSeq - remainder;
  const difference = slotStart - slotLength;
  const previousSlotStart =
    ((difference + sequenceNumbers) & maxSequenceNumber) >>> 0;
  const recentState = recentStates[previousSlotStart];
  return recentState;
};

const updateObjects: types.UpdateObject[] = []; // index is idOverNetwork

const getinitialUpdateObject = () => ({
  exists: false,
  idOverNetwork: 0,
  ctrlsUp: false,
  ctrlsDown: false,
  ctrlsLeft: false,
  ctrlsRight: false,
  ctrlsSpace: false,
  ctrlsD: false,
  ctrlsF: false,
  health: 0,
  xDifferenceSignificance: 0,
  yDifferenceSignificance: 0,
  zDifferenceSignificance: 0,
  angleZDifferenceSignificance: 0,
  xEncoded: 0,
  yEncoded: 0,
  x: 0,
  y: 0,
  z: 0,
  // quaternionEncodedWithOnlyZRotation: 0,
  // quaternion: new THREE.Quaternion(0, 0, 0, 0),
  // quaternionChanged: false,
  rotationZEncoded: 0,
  rotationZ: 0,
});

const initializeUpdateObjects = () => {
  updateObjects.length = 0;
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    updateObjects.push({ ...getinitialUpdateObject(), idOverNetwork: i });
  }
};

const initializeRecentStates = () => {
  recentStates[0] = [];
  recentStates[32] = [];
  recentStates[64] = [];
  recentStates[96] = [];
  recentStates[128] = [];
  recentStates[160] = [];
  recentStates[192] = [];
  recentStates[224] = [];
};

export const initializeState = () => {
  initializeUpdateObjects();
  initializeRecentStates();
};

const resetUpdateObjects = () => {
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    updateObjects[i].exists = false;
  }
};

const resetRecentState = (seqNum: number) => {
  recentStates[seqNum] = [];
};

const getBit = (value: number, bitPosition: number) =>
  !!((value >> bitPosition) & 1);

const getBits = (value: number, start: number, length: number) => {
  return (value >> start) & ((1 << length) - 1);
};

const getUint24 = (view: DataView, offset: number) => {
  const b0 = view.getUint8(offset);
  const b1 = view.getUint8(offset + 1);
  const b2 = view.getUint8(offset + 2);
  return ((b0 << 16) | (b1 << 8) | b2) >>> 0;
};

const replaceWithChange = (
  oldValue: number,
  differenceSignificance: number,
  dataView: DataView,
  offset: number,
  variableName: string
) => {
  if (differenceSignificance === 4) {
    const result = dataView.getUint32(offset);
    // variableName === "y" &&
    //   console.log(
    //     "--rr32:",
    //     result,
    //     dataView.getUint8(offset),
    //     dataView.getUint8(offset + 1),
    //     dataView.getUint8(offset + 2),
    //     dataView.getUint8(offset + 3)
    //   );

    return result;
  }
  if (differenceSignificance === 3) {
    const change = getUint24(dataView, offset);
    const result = ((oldValue & 0xff000000) | (change & 0x00ffffff)) >>> 0;
    // variableName === "y" &&
    //   console.log(
    //     "--rr24:",
    //     change,
    //     result,
    //     dataView.getUint8(offset),
    //     dataView.getUint8(offset + 1),
    //     dataView.getUint8(offset + 2)
    //   );
    return result;
  }
  if (differenceSignificance === 2) {
    const change = dataView.getUint16(offset);
    const result = ((oldValue & 0xffff0000) | (change & 0x0000ffff)) >>> 0;
    // variableName === "y" &&
    //   console.log(
    //     "--rr16:",
    //     change,
    //     result,
    //     dataView.getUint8(offset),
    //     dataView.getUint8(offset + 1)
    //   );

    return result;
  }
  if (differenceSignificance === 1) {
    const change = dataView.getUint8(offset);
    const result = ((oldValue & 0xffffff00) | (change & 0x000000ff)) >>> 0;
    // variableName === "y" &&
    //   console.log("--rr8:", change, result, dataView.getUint8(offset));

    return result;
  }
  debug.debugDifferenceSignificance(variableName, differenceSignificance);
  return oldValue;
};

export const handleReceiveStateData = (dataView: DataView, save: boolean) => {
  resetUpdateObjects();

  const sequenceNumber = dataView.getUint8(0);

  save && resetRecentState(sequenceNumber);
  const recentState = getTargetRecentState(sequenceNumber);

  let offset = 1;
  let index = 0;

  const getNextByte = () => {
    const value = dataView.getUint8(offset);
    offset++;
    return value;
  };

  while (offset < dataView.byteLength) {
    const providedValues1to8 = getNextByte();
    const idIsProvided = getBit(providedValues1to8, 0);
    const controlsIsProvided = getBit(providedValues1to8, 1);
    const healthIsProvided = getBit(providedValues1to8, 2);
    const xIsProvided = getBit(providedValues1to8, 3);
    const yIsProvided = getBit(providedValues1to8, 4);
    const zIsProvided = getBit(providedValues1to8, 5);
    const angleZIsProvided = getBit(providedValues1to8, 6);
    const bytesForPositionAndAngleIsProvided = getBit(providedValues1to8, 7);

    const idOverNetwork = idIsProvided
      ? dataView.getUint8(offset)
      : recentState[index].idOverNetwork;
    idIsProvided && offset++;

    const recentObjectState = idIsProvided
      ? recentState.find((x) => x.idOverNetwork === idOverNetwork)
      : recentState[index];

    const updateObject = updateObjects[idOverNetwork];
    updateObject.exists = true;

    if (controlsIsProvided) {
      const controls = getNextByte();
      updateObject.ctrlsUp = getBit(controls, 0);
      updateObject.ctrlsDown = getBit(controls, 1);
      updateObject.ctrlsLeft = getBit(controls, 2);
      updateObject.ctrlsRight = getBit(controls, 3);
      updateObject.ctrlsSpace = getBit(controls, 4);
      updateObject.ctrlsD = getBit(controls, 5);
      updateObject.ctrlsF = getBit(controls, 6);
    } else if (recentObjectState) {
      updateObject.ctrlsUp = recentObjectState.ctrlsUp;
      updateObject.ctrlsDown = recentObjectState.ctrlsDown;
      updateObject.ctrlsLeft = recentObjectState.ctrlsLeft;
      updateObject.ctrlsRight = recentObjectState.ctrlsRight;
      updateObject.ctrlsSpace = recentObjectState.ctrlsSpace;
      updateObject.ctrlsD = recentObjectState.ctrlsD;
      updateObject.ctrlsF = recentObjectState.ctrlsF;
    } else {
      debug.debugNoRecentObjectState(idIsProvided, idOverNetwork, index);
      return;
    }

    if (healthIsProvided) {
      updateObject.health = getNextByte();
    } else if (recentObjectState) {
      updateObject.health = recentObjectState.health;
    } else {
      debug.debugNoRecentObjectState(idIsProvided, idOverNetwork, index);
      return;
    }

    if (bytesForPositionAndAngleIsProvided) {
      const providedBytesForPositionAndAngle = getNextByte();
      updateObject.xDifferenceSignificance =
        getBits(providedBytesForPositionAndAngle, 0, 2) + 1;
      updateObject.yDifferenceSignificance =
        getBits(providedBytesForPositionAndAngle, 2, 2) + 1;
      updateObject.zDifferenceSignificance =
        getBits(providedBytesForPositionAndAngle, 4, 1) + 1;
      updateObject.angleZDifferenceSignificance =
        getBits(providedBytesForPositionAndAngle, 5, 1) + 1;
    } else if (recentObjectState) {
      updateObject.xDifferenceSignificance =
        recentObjectState.xDifferenceSignificance;
      updateObject.yDifferenceSignificance =
        recentObjectState.yDifferenceSignificance;
      updateObject.zDifferenceSignificance =
        recentObjectState.zDifferenceSignificance;
      updateObject.angleZDifferenceSignificance =
        recentObjectState.angleZDifferenceSignificance;
    } else {
      debug.debugNoRecentObjectState(idIsProvided, idOverNetwork, index);
      return;
    }

    let xEncoded = recentObjectState?.xEncoded || 0;
    let yEncoded = recentObjectState?.yEncoded || 0;
    let z = recentObjectState?.z || 0;
    // let encodedAngleZ =
    //   recentObjectState?.quaternionEncodedWithOnlyZRotation || 0;
    let encodedAngleZ = recentObjectState?.rotationZEncoded || 0;

    if (xIsProvided) {
      xEncoded = replaceWithChange(
        xEncoded,
        updateObject.xDifferenceSignificance,
        dataView,
        offset,
        "x"
      );
      offset += updateObject.xDifferenceSignificance;
    }

    if (yIsProvided) {
      yEncoded = replaceWithChange(
        yEncoded,
        updateObject.yDifferenceSignificance,
        dataView,
        offset,
        "y"
      );
      offset += updateObject.yDifferenceSignificance;
    }

    if (zIsProvided) {
      z = replaceWithChange(
        z,
        updateObject.zDifferenceSignificance,
        dataView,
        offset,
        "z"
      );
      offset += updateObject.zDifferenceSignificance;
    }

    if (angleZIsProvided) {
      encodedAngleZ = replaceWithChange(
        encodedAngleZ,
        updateObject.angleZDifferenceSignificance,
        dataView,
        offset,
        "angleZ"
      );
      offset += updateObject.angleZDifferenceSignificance;
    }

    if (updateObject.xEncoded !== xEncoded) {
      updateObject.xEncoded = xEncoded;
      updateObject.x = utils.decodeAxisValue(xEncoded);
    }

    if (updateObject.yEncoded !== yEncoded) {
      updateObject.yEncoded = yEncoded;
      updateObject.y = utils.decodeAxisValue(yEncoded);
      // console.log("--y:", updateObject.y.toFixed(2));
    }

    updateObject.z = z;
    if (updateObject.rotationZEncoded !== encodedAngleZ) {
      updateObject.rotationZEncoded = encodedAngleZ;
      updateObject.rotationZ = utils.decodeAngle(encodedAngleZ);
    }

    if (save) {
      save && recentStates[sequenceNumber].push({ ...updateObject });
      save && debug.debugSaveState(updateObject);
    }
    index++;
  }

  debug.statistics.objects = index;

  return updateObjects;
};
