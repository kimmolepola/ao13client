// import * as THREE from "three";
import * as types from "../../types";
import * as parameters from "../../parameters";
import * as debug from "../debug/debug";
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

const receivedState: types.ReceivedState = {
  tick: 0,
  state: [],
};

const getinitialUpdateObject = () => ({
  exists: false,
  idOverNetwork: 0,
  inputsUp: 0,
  inputsDown: 0,
  inputsLeft: 0,
  inputsRight: 0,
  inputsSpace: 0,
  inputsD: 0,
  inputsF: 0,
  inputsE: 0,
  health: 0,
  xEncoded: 0,
  yEncoded: 0,
  x: 0,
  y: 0,
  z: 0,
  speed: 0,
  rotationZEncoded: 0,
  rotationZ: 0,
  rotationSpeed: 0,
  fuel: 0,
  ordnanceChannel1Id: 0,
  ordnanceChannel1Byte1: 0,
  ordnanceChannel1Byte2: 0,
  ordnanceChannel2Id: 0,
  ordnanceChannel2Byte1: 0,
  ordnanceChannel2Byte2: 0,
  eventsEncoded: 0,
  ordnance1EventId1: undefined as number | undefined,
  ordnance1EventId2: undefined as number | undefined,
  ordnance1EventId3: undefined as number | undefined,
  ordnance1EventId4: undefined as number | undefined,
  ordnance2EventId1: undefined as number | undefined,
  ordnance2EventId2: undefined as number | undefined,
  ordnance2EventId3: undefined as number | undefined,
  ordnance2EventId4: undefined as number | undefined,
  verticalSpeed: 0,
});

const initializeUpdateObjects = () => {
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    receivedState.state[i] = {
      ...getinitialUpdateObject(),
      idOverNetwork: i,
    };
  }
};

const resetReceivedState = () => {
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    receivedState.state[i].exists = false;
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

const popcount = (x: number) => {
  let n = x >>> 0;
  let count = 0;
  while (n) { count += n & 1; n >>>= 1; }
  return count;
};

const getTwoBitValue = (byte: number, position: number) => {
  return (byte >> position) & 0b11;
};

let prevProvided = 0;
export const handleReceiveStateData = (dataView: DataView, save: boolean) => {
  const sequenceNumber = dataView.getUint8(0);
  // console.log("--seq:", dataView.getUint8(1));

  resetReceivedState();
  receivedState.tick = sequenceNumber;

  save && resetRecentState(sequenceNumber);
  const recentState = getTargetRecentState(sequenceNumber);

  let offset = 1;
  let index = 0;

  let isErr = false;
  const getNextByte = () => {
    try {
      const value = dataView.getUint8(offset);
      offset++;
      return value;
    } catch (err: any) {
      isErr = true;
      console.log("--err:", offset, err);
      const bits = Array.from({ length: dataView.byteLength }, (_, i) =>
        dataView.getUint8(i).toString(2).padStart(8, "0")
      );

      console.log(bits);
      return 0;
    }
  };

  const getNextSignedByte = () => {
    const value = dataView.getInt8(offset);
    offset++;
    return value;
  };

  const getNext2Bytes = () => {
    const value = dataView.getUint16(offset);
    offset += 2;
    return value;
  };

  let iter = 0;
  while (offset < dataView.byteLength) {
    const providedValues1to8 = getNextByte();
    // console.log("--offset:", offset, providedValues1to8, dataView.byteLength);
    // if (prevProvided !== providedValues1to8) {
    //   console.log(
    //     "--provided:",
    //     iter,
    //     offset,
    //     providedValues1to8.toString(2).padStart(8, "0")
    //   );
    // }
    // prevProvided = providedValues1to8;
    // iter++;
    const providedValues9to16IsProvided = getBit(providedValues1to8, 0);
    const inputs1IsProvided = getBit(providedValues1to8, 1);
    const xA = getBit(providedValues1to8, 2);
    const xB = getBit(providedValues1to8, 3);
    const yA = getBit(providedValues1to8, 4);
    const yB = getBit(providedValues1to8, 5);
    const rotationZIsProvided = getBit(providedValues1to8, 6);
    const rotationSpeedIsProvided = getBit(providedValues1to8, 7);

    const providedBytesPositionX =
      !xA && !xB ? 0 : xA && !xB ? 1 : !xA && xB ? 2 : 4;
    const providedBytesPositionY =
      !yA && !yB ? 0 : yA && !yB ? 1 : !yA && yB ? 2 : 4;

    const providedValues9to16 = providedValues9to16IsProvided
      ? getNextByte()
      : 0;

    const providedValues17to24IsProvided = getBit(providedValues9to16, 0);
    const idOverNetworkIsProvided = getBit(providedValues9to16, 1);
    const speedIsProvided = getBit(providedValues9to16, 2);
    const eventsIsProvided = getBit(providedValues9to16, 3);
    const eventsIdsIsProvided = getBit(providedValues9to16, 4);
    const healthIsProvided = getBit(providedValues9to16, 5);
    const fuelIsProvided = getBit(providedValues9to16, 6);

    const providedValues17to24 = providedValues17to24IsProvided
      ? getNextByte()
      : 0;

    const inputs2IsProvided = getBit(providedValues17to24, 0);
    const verticalSpeedIsProvided = getBit(providedValues17to24, 1);
    const positionZIsProvided = getBit(providedValues17to24, 2);
    const ordnanceChannel1IsProvided = getBit(providedValues17to24, 3);
    const ordnanceChannel2IsProvided = getBit(providedValues17to24, 4);

    const idOverNetwork = idOverNetworkIsProvided
      ? getNextByte()
      : recentState[index]?.idOverNetwork || 0;

    const possibleRecentObjectState = idOverNetworkIsProvided
      ? recentState.find((x) => x.idOverNetwork === idOverNetwork)
      : recentState[index];

    const allValuesAreProvided =
      inputs1IsProvided &&
      xA &&
      xB &&
      yA &&
      yB &&
      rotationZIsProvided &&
      rotationSpeedIsProvided &&
      speedIsProvided &&
      eventsIsProvided &&
      healthIsProvided &&
      fuelIsProvided &&
      inputs2IsProvided &&
      verticalSpeedIsProvided &&
      positionZIsProvided &&
      ordnanceChannel1IsProvided &&
      ordnanceChannel2IsProvided;

    if (!possibleRecentObjectState && !allValuesAreProvided) {
      // console.log(
      //   "--provided:",
      //   inputs1IsProvided,
      //   xA,
      //   xB,
      //   yA,
      //   yB,
      //   rotationZIsProvided,
      //   rotationSpeedIsProvided,
      //   speedIsProvided,
      //   eventsIsProvided,
      //   healthIsProvided,
      //   fuelIsProvided,
      //   inputs2IsProvided,
      //   verticalSpeedIsProvided,
      //   positionZIsProvided,
      //   ordnanceChannel1IsProvided,
      //   ordnanceChannel2IsProvided
      // );
      debug.debugNoRecentObjectState(
        idOverNetworkIsProvided,
        idOverNetwork,
        index
      );

      return;
    }
    const recent = possibleRecentObjectState!;

    const upd = receivedState.state[idOverNetwork];
    upd.exists = true;

    if (inputs1IsProvided) {
      const inputs = getNextByte();
      upd.inputsUp = getTwoBitValue(inputs, 0);
      upd.inputsDown = getTwoBitValue(inputs, 2);
      upd.inputsLeft = getTwoBitValue(inputs, 4);
      upd.inputsRight = getTwoBitValue(inputs, 6);
    } else {
      upd.inputsUp = recent.inputsUp;
      upd.inputsDown = recent.inputsDown;
      upd.inputsLeft = recent.inputsLeft;
      upd.inputsRight = recent.inputsRight;
    }
    let xEncoded = recent?.xEncoded;
    if (providedBytesPositionX) {
      xEncoded = replaceWithChange(
        xEncoded,
        providedBytesPositionX,
        dataView,
        offset,
        "x"
      );
      offset += providedBytesPositionX;
    }
    if (upd.xEncoded !== xEncoded) {
      upd.xEncoded = xEncoded;
      upd.x = utils.decodeAxisValue(upd.xEncoded);
    }

    let yEncoded = recent?.yEncoded;
    if (providedBytesPositionY) {
      yEncoded = replaceWithChange(
        yEncoded,
        providedBytesPositionY,
        dataView,
        offset,
        "y"
      );
      offset += providedBytesPositionY;
    }
    if (upd.yEncoded !== yEncoded) {
      upd.yEncoded = yEncoded;
      upd.y = utils.decodeAxisValue(yEncoded);
    }

    const rotationZEncoded = rotationZIsProvided
      ? getNext2Bytes()
      : recent.rotationZEncoded;
    if (upd.rotationZEncoded !== rotationZEncoded) {
      upd.rotationZEncoded = rotationZEncoded;
      upd.rotationZ = utils.decodeAngle(rotationZEncoded);
    }
    // console.log(
    //   "--rotZ:",
    //   rotationZIsProvided,
    //   rotationZEncoded,
    //   upd.rotationZ
    // );

    upd.rotationSpeed = rotationSpeedIsProvided
      ? getNextSignedByte()
      : recent.rotationSpeed;

    upd.speed = speedIsProvided ? getNext2Bytes() : recent.speed;

    // Decode ordnance event IDs. Count is derived from recent eventsEncoded since
    // eventsEncoded is encoded after the IDs in the stream.
    if (eventsIdsIsProvided) {
      const recentEventsEncoded = recent?.eventsEncoded ?? 0;
      const ord1Count = popcount(recentEventsEncoded & 0x0f);
      const ord2Count = popcount(recentEventsEncoded >> 4);

      if (ord1Count > 0) {
        const byte = getNextByte();
        if ((byte >> 7) & 1) {
          const id = byte & 0x7f;
          upd.ordnance1EventId1 = id;
          upd.ordnance1EventId2 = ord1Count > 1 ? id : undefined;
          upd.ordnance1EventId3 = ord1Count > 2 ? id : undefined;
          upd.ordnance1EventId4 = ord1Count > 3 ? id : undefined;
        } else {
          upd.ordnance1EventId1 = byte;
          upd.ordnance1EventId2 = ord1Count > 1 ? getNextByte() : undefined;
          upd.ordnance1EventId3 = ord1Count > 2 ? getNextByte() : undefined;
          upd.ordnance1EventId4 = ord1Count > 3 ? getNextByte() : undefined;
        }
      } else {
        upd.ordnance1EventId1 = undefined;
        upd.ordnance1EventId2 = undefined;
        upd.ordnance1EventId3 = undefined;
        upd.ordnance1EventId4 = undefined;
      }

      if (ord2Count > 0) {
        const byte = getNextByte();
        if ((byte >> 7) & 1) {
          const id = byte & 0x7f;
          upd.ordnance2EventId1 = id;
          upd.ordnance2EventId2 = ord2Count > 1 ? id : undefined;
          upd.ordnance2EventId3 = ord2Count > 2 ? id : undefined;
          upd.ordnance2EventId4 = ord2Count > 3 ? id : undefined;
        } else {
          upd.ordnance2EventId1 = byte;
          upd.ordnance2EventId2 = ord2Count > 1 ? getNextByte() : undefined;
          upd.ordnance2EventId3 = ord2Count > 2 ? getNextByte() : undefined;
          upd.ordnance2EventId4 = ord2Count > 3 ? getNextByte() : undefined;
        }
      } else {
        upd.ordnance2EventId1 = undefined;
        upd.ordnance2EventId2 = undefined;
        upd.ordnance2EventId3 = undefined;
        upd.ordnance2EventId4 = undefined;
      }
    } else {
      upd.ordnance1EventId1 = recent.ordnance1EventId1;
      upd.ordnance1EventId2 = recent.ordnance1EventId2;
      upd.ordnance1EventId3 = recent.ordnance1EventId3;
      upd.ordnance1EventId4 = recent.ordnance1EventId4;
      upd.ordnance2EventId1 = recent.ordnance2EventId1;
      upd.ordnance2EventId2 = recent.ordnance2EventId2;
      upd.ordnance2EventId3 = recent.ordnance2EventId3;
      upd.ordnance2EventId4 = recent.ordnance2EventId4;
    }

    upd.eventsEncoded = eventsIsProvided ? getNextByte() : recent.eventsEncoded;

    upd.health = healthIsProvided ? getNextByte() : recent.health;

    // console.log("--upd.health:", upd.health);

    upd.fuel = fuelIsProvided
      ? getNextByte() * parameters.networkToFuelRatio
      : recent.fuel;

    if (inputs2IsProvided) {
      const inputs2 = getNextByte();
      upd.inputsSpace = getTwoBitValue(inputs2, 0);
      upd.inputsD = getTwoBitValue(inputs2, 2);
      upd.inputsF = getTwoBitValue(inputs2, 4);
      upd.inputsE = getTwoBitValue(inputs2, 6);
    } else {
      upd.inputsSpace = recent.inputsSpace;
      upd.inputsD = recent.inputsD;
      upd.inputsF = recent.inputsF;
      upd.inputsE = recent.inputsE;
    }

    upd.verticalSpeed = verticalSpeedIsProvided
      ? getNextSignedByte()
      : recent.verticalSpeed;

    upd.z = positionZIsProvided ? getNext2Bytes() : recent.z;

    if (ordnanceChannel1IsProvided) {
      const idWithFlag = getNextByte();
      upd.ordnanceChannel1Id = idWithFlag & 0x7f;
      const byte2Included = (idWithFlag >> 7) & 1;
      upd.ordnanceChannel1Byte1 = getNextByte();
      upd.ordnanceChannel1Byte2 = byte2Included ? getNextByte() : (recent?.ordnanceChannel1Byte2 ?? 0);
    } else {
      upd.ordnanceChannel1Id = recent.ordnanceChannel1Id;
      upd.ordnanceChannel1Byte1 = recent.ordnanceChannel1Byte1;
      upd.ordnanceChannel1Byte2 = recent.ordnanceChannel1Byte2;
    }

    if (ordnanceChannel2IsProvided) {
      const idWithFlag = getNextByte();
      upd.ordnanceChannel2Id = idWithFlag & 0x7f;
      const byte2Included = (idWithFlag >> 7) & 1;
      upd.ordnanceChannel2Byte1 = getNextByte();
      upd.ordnanceChannel2Byte2 = byte2Included ? getNextByte() : (recent?.ordnanceChannel2Byte2 ?? 0);
    } else {
      upd.ordnanceChannel2Id = recent.ordnanceChannel2Id;
      upd.ordnanceChannel2Byte1 = recent.ordnanceChannel2Byte1;
      upd.ordnanceChannel2Byte2 = recent.ordnanceChannel2Byte2;
    }

    if (save) {
      save && recentStates[sequenceNumber].push({ ...upd });
      save && debug.debugSaveState(upd);
    }
    index++;
  }

  debug.statistics.objects = index;

  return receivedState;
};
