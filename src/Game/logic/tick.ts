import * as parameters from "src/parameters";
import * as types from "src/types";
import * as globals from "src/globals";
import { gatherControlsDataBinary } from "../netcode/controls";
import * as utils from "src/utils";

const object3d = utils.object3d;
const axis = utils.AXIS_Z;

// outer array index is tickNumber
// inner array index is idOverNetwork
// const ticks: types.TickStateObject[][] = [];

// array index is tickNumber
const ticksLocalObjects: types.TickLocalObjects[] = [];

export const tickState = {
  latestAuthTickNumber: 0,
};

export const authoritativeStates: {
  isStale: boolean;
  state: types.AuthoritativeState[];
}[] = []; // outer array index is tickNumber, inner array index is idOverNetwork

const isNewerSeqNum = (received: number, old: number) => {
  return ((received - old) & 0xff) < 128;
};

export const initializeAuthoritativeState = () => {
  // console.log("--init auth state");
  authoritativeStates.length = 0;
  ticksLocalObjects.length = 0;
  for (let i = 0; i < parameters.stateMaxSequenceNumber + 1; i++) {
    authoritativeStates[i] = { isStale: true, state: [] };
    ticksLocalObjects[i] = [];
    for (let ii = 0; ii < parameters.maxRemoteObjects; ii++) {
      authoritativeStates[i].state[ii] = {
        exists: false,
        idOverNetwork: ii,
        inputsUp: 0, // 0-3
        inputsDown: 0, // 0-3
        inputsLeft: 0, // 0-3
        inputsRight: 0, // 0-3
        inputsSpace: 0, // 0-3
        inputsD: 0, // 0-3
        inputsF: 0, // 0-3
        inputsE: 0, // 0-3
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
        ordnanceChannel1Value: 0,
        ordnanceChannel2Id: 0,
        ordnanceChannel2Value: 0,
        eventsEncoded: 0,
        verticalSpeed: 0,
      };
    }
  }
};

export const initializeTicks = (ticks: types.TickStateObject[][]) => {
  ticks.length = 0;
  ticksLocalObjects.length = 0;
  for (let i = 0; i < parameters.stateMaxSequenceNumber + 1; i++) {
    ticks[i] = [];
    ticksLocalObjects[i] = [];
    for (let ii = 0; ii < parameters.maxRemoteObjects; ii++) {
      ticks[i][ii] = {
        rollback: false,
        id: "",
        idOverNetwork: ii,
        health: 100,
        type: types.GameObjectType.Fighter,
        x: 0,
        y: 0,
        z: 1000,
        rotationZ: 0,
        speed: 0,
        inputsUp: 0,
        inputsDown: 0,
        inputsLeft: 0,
        inputsRight: 0,
        inputsSpace: 0,
        inputsF: 0,
        inputsD: 0,
        inputsE: 0,
        rotationSpeed: 0,
        verticalSpeed: 0,
        fuel: parameters.maxFuelKg,
        bulletCount: 0,
        eventsEncoded: 0,
        ordnanceChannel1Id: 0,
        ordnanceChannel1Value: parameters.maxBullets,
        ordnanceChannel2Id: 0,
        ordnanceChannel2Value: 0,
      };
    }
  }
};

export const handleTick = (
  ticks: types.TickStateObject[][],
  tickNumber: number,
  offset: number,
  handleGameEvent: (e: types.GameEvent) => void,
  sendControlsData: (data: ArrayBuffer) => void
) => {
  const ownIdOverNetwork = globals.state.ownRemoteObjectIndex;
  const hasValidIndex = ownIdOverNetwork !== undefined && ownIdOverNetwork >= 0;
  const ownTickObj = hasValidIndex
    ? ticks[tickNumber][ownIdOverNetwork!]
    : undefined;
  handleControlsData(sendControlsData, tickNumber, ownTickObj);
  handleSimulation(ticks, tickNumber, offset, handleGameEvent);
  hasValidIndex && applyCurState(ticks, tickNumber, ownIdOverNetwork!);
  // console.log("--tick:", tickNumber, offset);
};

export const handleReceiveAuthoritativeState = (
  receivedState: types.ReceivedState
) => {
  // console.log("--receivedState.state:", receivedState.state[0].health);
  if (isNewerSeqNum(receivedState.tick, tickState.latestAuthTickNumber)) {
    tickState.latestAuthTickNumber = receivedState.tick;
  }
  const tickAuthState = authoritativeStates[receivedState.tick];
  // console.log("--xxqqqqqqqwwwqer set isStale false:", receivedState.tick);
  tickAuthState.isStale = false;
  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    const o = tickAuthState.state[i];
    const r = receivedState.state[i];
    o.eventsEncoded = r.eventsEncoded;
    o.exists = r.exists;
    o.fuel = r.fuel;
    o.health = r.health;
    o.inputsD = r.inputsD;
    o.inputsDown = r.inputsDown;
    o.inputsE = r.inputsE;
    o.inputsF = r.inputsF;
    o.inputsLeft = r.inputsLeft;
    o.inputsRight = r.inputsRight;
    o.inputsSpace = r.inputsSpace;
    o.inputsUp = r.inputsUp;
    o.ordnanceChannel1Id = r.ordnanceChannel1Id;
    o.ordnanceChannel1Value = r.ordnanceChannel1Value;
    o.ordnanceChannel2Id = r.ordnanceChannel2Id;
    o.ordnanceChannel2Value = r.ordnanceChannel2Value;
    o.rotationSpeed = r.rotationSpeed;
    o.rotationZ = r.rotationZ;
    o.rotationZEncoded = r.rotationZEncoded;
    o.speed = r.speed;
    o.verticalSpeed = r.verticalSpeed;
    o.x = r.x;
    o.xEncoded = r.xEncoded;
    o.y = r.y;
    o.yEncoded = r.yEncoded;
    o.z = r.z;
  }
};

const isSeqHigher = (oldSeq: number, newSeq: number) => {
  // Normalize to 0–255
  const A = oldSeq & 0xff;
  const B = newSeq & 0xff;

  // Compute forward distance in modulo-256 space
  const diff = (B - A) & 0xff;

  // If diff is 1..127, B is newer; if 128..255, A is newer or equal
  return diff !== 0 && diff < 128;
};

const getBit = (value: number, bitPosition: number) =>
  !!((value >> bitPosition) & 1);

const handleEventsRollback = (
  localTickNumber: number,
  idOverNetwork: number,
  r: types.AuthoritativeState,
  ticks: types.TickStateObject[][],
  seq: number,
  pSeq: number,
  ppSeq: number,
  pppSeq: number,
  ppppSeq: number,
  handleGameEvent: (e: types.GameEvent) => void
) => {
  const tick = ticks[seq];
  const o = tick[idOverNetwork];
  if (r.eventsEncoded !== o.eventsEncoded) {
    const o1Ordnance1 = getBit(o.eventsEncoded, 0);
    const o2Ordnance1 = getBit(o.eventsEncoded, 1);
    const o3Ordnance1 = getBit(o.eventsEncoded, 2);
    const o4Ordnance1 = getBit(o.eventsEncoded, 3);
    const o1Ordnance2 = getBit(o.eventsEncoded, 4);
    const o2Ordnance2 = getBit(o.eventsEncoded, 5);
    const o3Ordnance2 = getBit(o.eventsEncoded, 6);
    const o4Ordnance2 = getBit(o.eventsEncoded, 7);
    const r1Ordnance1 = getBit(r.eventsEncoded, 0);
    const r2Ordnance1 = getBit(r.eventsEncoded, 1);
    const r3Ordnance1 = getBit(r.eventsEncoded, 2);
    const r4Ordnance1 = getBit(r.eventsEncoded, 3);
    const r1Ordnance2 = getBit(r.eventsEncoded, 4);
    const r2Ordnance2 = getBit(r.eventsEncoded, 5);
    const r3Ordnance2 = getBit(r.eventsEncoded, 6);
    const r4Ordnance2 = getBit(r.eventsEncoded, 7);

    if (o4Ordnance1 !== r4Ordnance1) {
      handleGameEvent({
        type: types.EventType.ShotRollback as const,
        localTickNumber,
        sequenceNumber: ppppSeq,
        originId: idOverNetwork,
        ticks,
        ticksLocalObjects,
      });
    }

    if (o3Ordnance1 !== r3Ordnance1) {
      handleGameEvent({
        type: types.EventType.ShotRollback as const,
        localTickNumber,
        sequenceNumber: pppSeq,
        originId: idOverNetwork,
        ticks,
        ticksLocalObjects,
      });
    }

    if (o2Ordnance1 !== r2Ordnance1) {
      handleGameEvent({
        type: types.EventType.ShotRollback as const,
        localTickNumber,
        sequenceNumber: ppSeq,
        originId: idOverNetwork,
        ticks,
        ticksLocalObjects,
      });
    }

    if (o1Ordnance1 !== r1Ordnance1) {
      handleGameEvent({
        type: types.EventType.ShotRollback as const,
        localTickNumber,
        sequenceNumber: pSeq,
        originId: idOverNetwork,
        ticks,
        ticksLocalObjects,
      });
    }

    o4Ordnance2 !== r4Ordnance2 &&
      handleGameEvent({ type: types.EventType.ShotRollback2 }); // TODO

    o3Ordnance2 !== r3Ordnance2 &&
      handleGameEvent({ type: types.EventType.ShotRollback2 }); // TODO

    o2Ordnance2 !== r2Ordnance2 &&
      handleGameEvent({ type: types.EventType.ShotRollback2 }); // TODO

    o1Ordnance2 !== r1Ordnance2 &&
      handleGameEvent({ type: types.EventType.ShotRollback2 }); // TODO

    o.eventsEncoded = r.eventsEncoded;
  }
};

// const multiplier = 0.5;
const replay = (prev: types.TickStateObject, cur: types.TickStateObject) => {
  // if (cur.idOverNetwork !== globals.state.ownRemoteObjectIndex) {
  //   const up = prev.inputsUp * multiplier;
  //   const down = prev.inputsDown * multiplier;
  //   const left = prev.inputsLeft * multiplier;
  //   const right = prev.inputsRight * multiplier;
  //   const keyD = prev.inputsD * multiplier;
  //   const keyF = prev.inputsF * multiplier;
  //   cur.inputsUp = up;
  //   cur.inputsDown = down;
  //   cur.inputsLeft = left;
  //   cur.inputsRight = right;
  //   cur.inputsD = keyD;
  //   cur.inputsF = keyF;
  // }
  handleMovement(cur, prev);
};

const nearlyEqual = (a: number, b: number, eps = 1e-12) => {
  return Math.abs(a - b) < eps;
};

const handleSimulationRollback = (
  localTickNumber: number,
  receivedTickNumber: number,
  idOverNetwork: number,
  r: types.AuthoritativeState,
  ticksAttr: types.TickStateObject[][]
) => {
  const tick = ticksAttr[receivedTickNumber];
  const o = tick[idOverNetwork];
  const isSame =
    nearlyEqual(r.x, o.x) &&
    nearlyEqual(r.y, o.y) &&
    nearlyEqual(r.rotationZ, o.rotationZ, 0.001) &&
    nearlyEqual(r.rotationSpeed, o.rotationSpeed, 1.0) &&
    nearlyEqual(r.speed, o.speed, 1.0) &&
    nearlyEqual(r.health, o.health) &&
    nearlyEqual(r.fuel, o.fuel, parameters.networkToFuelRatio) &&
    nearlyEqual(r.verticalSpeed, o.verticalSpeed, 1.0) &&
    nearlyEqual(r.z, o.z, 1.0) &&
    nearlyEqual(r.ordnanceChannel1Value, o.ordnanceChannel1Value) &&
    nearlyEqual(r.ordnanceChannel2Value, o.ordnanceChannel2Value) &&
    r.ordnanceChannel1Id === o.ordnanceChannel1Id &&
    r.ordnanceChannel2Id === o.ordnanceChannel2Id;

  // TODO: handle if differences due to rounding errors but practically same

  o.inputsUp = r.inputsUp;
  o.inputsDown = r.inputsDown;
  o.inputsLeft = r.inputsLeft;
  o.inputsRight = r.inputsRight;
  o.inputsSpace = r.inputsSpace;
  o.inputsD = r.inputsD;
  o.inputsF = r.inputsF;
  o.inputsE = r.inputsE;

  false &&
    console.log(
      "--isSame:",
      isSame,
      "\nx:",
      r.x === o.x,
      r.x,
      o.x,
      "\ny:",
      r.y === o.y,
      "\nrotationZ:",
      nearlyEqual(r.rotationZ, o.rotationZ),
      r.rotationZ === o.rotationZ,
      "\nrotationSpeed:",
      r.rotationSpeed === o.rotationSpeed,
      "\nspeed:",
      r.speed === o.speed,
      "\nhealth:",
      r.health === o.health,
      r.health,
      o.health,
      "\nfuel:",
      r.fuel === o.fuel,
      r.fuel,
      o.fuel,
      "\nverticalSpeed:",
      r.verticalSpeed === o.verticalSpeed,
      "\nz:",
      r.z === o.z,
      r.z,
      o.z,
      "\nordnanceChannel1Id:",
      r.ordnanceChannel1Id === o.ordnanceChannel1Id,
      r.ordnanceChannel1Id,
      o.ordnanceChannel1Id,
      "\nordnanceChannel1Value:",
      nearlyEqual(r.ordnanceChannel1Value, o.ordnanceChannel1Value),
      "\nordnanceChannel2Id:",
      r.ordnanceChannel2Id === o.ordnanceChannel2Id,
      r.ordnanceChannel2Id,
      o.ordnanceChannel2Id,
      "\nordnanceChannel2Value:",
      r.ordnanceChannel2Value === o.ordnanceChannel2Value
    );

  // console.log("--tick:", receivedTickNumber);
  if (!isSame) {
    o.x = r.x;
    o.y = r.y;
    o.rotationZ = r.rotationZ;
    o.rotationSpeed = r.rotationSpeed;
    o.speed = r.speed;
    o.health = r.health;
    o.fuel = r.fuel;
    o.verticalSpeed = r.verticalSpeed;
    o.z = r.z;
    o.ordnanceChannel1Id = r.ordnanceChannel1Id;
    o.ordnanceChannel1Value = r.ordnanceChannel1Value;
    o.ordnanceChannel2Id = r.ordnanceChannel2Id;
    o.ordnanceChannel2Value = r.ordnanceChannel2Value;
  }

  if (receivedTickNumber !== localTickNumber) {
    let s = receivedTickNumber;
    const nextLocalTickNumber = getNextSeq(localTickNumber);
    while (s !== nextLocalTickNumber) {
      const prevTick = ticksAttr[s];
      const prev = prevTick[idOverNetwork];
      s = getNextSeq(s);
      const curTick = ticksAttr[s];
      const cur = curTick[idOverNetwork];
      handleMovement(cur, prev);
      cur.health = prev.health;
      cur.fuel = prev.fuel - cur.speed * 0.0001;
      cur.ordnanceChannel1Id = prev.ordnanceChannel1Id;
      cur.ordnanceChannel1Value = prev.ordnanceChannel1Value - cur.inputsSpace;
      cur.ordnanceChannel2Id = prev.ordnanceChannel2Id;
      cur.ordnanceChannel2Value = prev.ordnanceChannel2Value;
    }
  }
};

const applyCurState = (
  ticks: types.TickStateObject[][],
  tickNumber: number,
  idOverNetwork: number
) => {
  const t = ticks[tickNumber][idOverNetwork];
  const s = globals.sharedObjects[idOverNetwork];
  const o3d = s?.object3d;
  if (o3d) {
    // console.log("--rot:", t.rotationZ.toFixed(2));
    o3d.position.x = t.x;
    o3d.position.y = t.y;
    o3d.rotation.z = t.rotationZ;
    s.positionZ = t.z;
    s.rotationSpeed = t.rotationSpeed;
    s.speed = t.speed;
    s.verticalSpeed = t.verticalSpeed;
    s.bulletCount = t.ordnanceChannel1Value;
    s.fuel = t.fuel;
    s.health = t.health;
  }
};

function subtractSeq8(a: number, b: number) {
  return (a - b) & 0xff;
}

const handleSimulation = (
  ticks: types.TickStateObject[][],
  tickNumber: number,
  offset: number,
  handleGameEvent: (e: types.GameEvent) => void
) => {
  // const authStateTickNum = getPrevSeq(getPrevSeq(getPrevSeq(tickNumber)));
  const authStateTickNum = subtractSeq8(tickNumber, offset);
  const authState = authoritativeStates[authStateTickNum];
  const prevPrevAuthState =
    authoritativeStates[getPrevSeq(getPrevSeq(authStateTickNum))];
  prevPrevAuthState.isStale = true;
  if (authState.isStale) {
    return;
  }

  const pSeq = getPrevSeq(authStateTickNum);
  const ppSeq = getPrevSeq(pSeq);
  const pppSeq = getPrevSeq(ppSeq);
  const ppppSeq = getPrevSeq(pppSeq);

  for (let i = 0; i < parameters.maxRemoteObjects; i++) {
    const r = authState.state[i];

    // TODO: would not need to store whole states locally?, only player inputs and received events?
    globals.state.ownRemoteObjectIndex === i &&
      handleSimulationRollback(tickNumber, authStateTickNum, i, r, ticks);

    handleEventsRollback(
      authStateTickNum,
      i,
      r,
      ticks,
      authStateTickNum,
      pSeq,
      ppSeq,
      pppSeq,
      ppppSeq,
      handleGameEvent
    );
    // applyCurState(ticks, tickNumber, i);
  }
};

const getPrevSeq = (seq: number) => {
  return (seq - 1) & 0xff;
};

const getNextSeq = (seq: number) => {
  return (seq + 1) & 0xff;
};

const handleControlsData = (
  sendControlsData: (data: ArrayBuffer) => void,
  tickNumber: number,
  ownTickObj: types.TickStateObject | undefined
) => {
  const controlsData = gatherControlsDataBinary(tickNumber, ownTickObj);
  if (controlsData) {
    sendControlsData(controlsData);
  }
};

const p = parameters;
const handleMovement = (
  currentTickObject: types.TickStateObject,
  previousTickObject: types.TickStateObject
) => {
  const prev = previousTickObject;
  const o = currentTickObject;

  //
  // 1. INPUT → VELOCITY
  //
  o.speed = prev.speed;
  o.speed += o.inputsUp * p.forceUpToSpeedFactor;
  o.speed -= o.inputsDown * p.forceDownToSpeedFactor;

  o.rotationSpeed = prev.rotationSpeed;
  o.rotationSpeed += o.inputsLeft * p.forceLeftOrRightToRotationFactor;
  o.rotationSpeed -= o.inputsRight * p.forceLeftOrRightToRotationFactor;

  o.verticalSpeed = prev.verticalSpeed;
  o.verticalSpeed += o.inputsF * p.forceAscOrDescToVerticalSpeedFactor;
  o.verticalSpeed -= o.inputsD * p.forceAscOrDescToVerticalSpeedFactor;

  //
  // 2. CLAMP VELOCITIES
  //
  o.speed = Math.min(Math.max(o.speed, p.minSpeed), p.maxSpeed);
  o.rotationSpeed = Math.min(
    Math.max(o.rotationSpeed, -p.maxRotationSpeedAbsolute),
    p.maxRotationSpeedAbsolute
  );
  o.verticalSpeed = Math.min(
    Math.max(o.verticalSpeed, -p.maxVerticalSpeedAbsolute),
    p.maxVerticalSpeedAbsolute
  );

  //
  // 3. APPLY DAMPING (time‑based exponential)
  //
  if (!o.inputsLeft && !o.inputsRight) {
    const decay = Math.exp(-p.rotationDecay * p.tickInterval);
    o.rotationSpeed *= decay;
    if (Math.abs(o.rotationSpeed) < 0.00001) o.rotationSpeed = 0;
  }

  if (!o.inputsD && !o.inputsF) {
    const decay = Math.exp(-p.verticalDecay * p.tickInterval);
    o.verticalSpeed *= decay;
    if (Math.abs(o.verticalSpeed) < 0.00001) o.verticalSpeed = 0;
  }

  object3d.position.set(prev.x, prev.y, 0);
  object3d.setRotationFromAxisAngle(axis, prev.rotationZ);
  object3d.rotateZ(o.rotationSpeed * p.rotationFactor * p.tickInterval);
  object3d.translateY(o.speed * p.speedFactor * p.tickInterval);
  o.x = object3d.position.x;
  o.y = object3d.position.y;
  o.rotationZ = object3d.rotation.z;

  o.z = prev.z;
  o.z += o.verticalSpeed * p.verticalSpeedFactor * p.tickInterval;
};

// const xhandleMovement = (o: types.SharedGameObject, object3d: THREE.Mesh) => {
//   const p = parameters;

//   //
//   // 1. INPUT → VELOCITY
//   //
//   const up = Math.min(o.inputsUp, tickDuration);
//   const down = Math.min(o.inputsDown, tickDuration);
//   const left = Math.min(o.inputsLeft, tickDuration);
//   const right = Math.min(o.inputsRight, tickDuration);
//   const d = Math.min(o.inputsD, tickDuration);
//   const f = Math.min(o.inputsF, tickDuration);

//   o.inputsUp -= up;
//   o.inputsDown -= down;
//   o.inputsLeft -= left;
//   o.inputsRight -= right;
//   o.inputsD -= d;
//   o.inputsF -= f;

//   o.speed += up * p.forceUpToSpeedFactor;
//   o.speed -= down * p.forceDownToSpeedFactor;

//   o.rotationSpeed += left * p.forceLeftOrRightToRotationFactor;
//   o.rotationSpeed -= right * p.forceLeftOrRightToRotationFactor;

//   o.verticalSpeed -= d * p.forceAscOrDescToVerticalSpeedFactor;
//   o.verticalSpeed += f * p.forceAscOrDescToVerticalSpeedFactor;

//   //
//   // 2. CLAMP VELOCITIES
//   //
//   o.speed = Math.min(Math.max(o.speed, p.minSpeed), p.maxSpeed);
//   o.rotationSpeed = Math.min(
//     Math.max(o.rotationSpeed, -p.maxRotationSpeedAbsolute),
//     p.maxRotationSpeedAbsolute
//   );
//   o.verticalSpeed = Math.min(
//     Math.max(o.verticalSpeed, -p.maxVerticalSpeedAbsolute),
//     p.maxVerticalSpeedAbsolute
//   );

//   //
//   // 3. APPLY DAMPING (time‑based exponential)
//   //
//   if (!left && !right) {
//     const decay = Math.exp(-p.rotationDecay * tickDuration);
//     o.rotationSpeed *= decay;
//     if (Math.abs(o.rotationSpeed) < 0.00001) o.rotationSpeed = 0;
//   }

//   if (!d && !f) {
//     const decay = Math.exp(-p.verticalDecay * tickDuration);
//     o.verticalSpeed *= decay;
//     if (Math.abs(o.verticalSpeed) < 0.00001) o.verticalSpeed = 0;
//   }

//   //
//   // 4. INTEGRATE VELOCITIES → TRANSFORM
//   //
//   o.previousPosition = [
//     object3d.position.x.toFixed(0),
//     object3d.position.y.toFixed(0),
//     o.positionZ,
//   ];
//   o.previousRotation = object3d.rotation.z;
//   object3d.rotateZ(o.rotationSpeed * p.rotationFactor * tickDuration);
//   object3d.translateY(o.speed * p.speedFactor * tickDuration);
//   o.positionZ += o.verticalSpeed * p.verticalSpeedFactor * tickDuration;
// };

// const handleShot = (
//   currentTickNumber: number,
//   currentTickObject: types.TickStateObject,
//   previousTickObject: types.TickStateObject,
//   inputs: types.InputsWithBytes,
//   gameEventHandler: types.GameEventHandler
// ) => {
//   const c = currentTickObject;
//   const p = previousTickObject;

//   c.ordnance1Event = false;
//   let delay = p.shotDelay;
//   delay -= parameters.tickInterval;
//   if (delay <= 0) {
//     if (inputs.inputs.space) {
//       // shoot
//       delay += parameters.shotDelay;
//       c.ordnance1Event = true;
//       gameEventHandler({
//         type: types.EventType.Shot,
//         data: {
//           gameObject: c,
//           tickLocalObjects: localObjects[currentTickNumber],
//         },
//       });
//     }
//   }
//   if (delay >= -parameters.shotDelay) {
//     delay -= parameters.tickInterval;
//   }
//   c.shotDelay = delay;
// };

// const ticksAreDifferent = (receivedState: types.ReceivedState) => {
//   const localTick = ticks[receivedState.tick];

//   for (let i = 0; i < parameters.maxRemoteObjects; i++) {
//     const r = receivedState.state[i];
//     const l = localTick[i];
//     if (r.exists) {
//       // if (r.ctrlsD !== l.controlsOverChannelsD)
//     }
//   }
// };

// const rollbackSimulate = (
//   receivedState: types.ReceivedState,
//   seq: number,
//   eventDepth: number, // 1 | 2 | 3 | 4
//   handleGameEvent: (e: types.GameEvent) => void
// ) => {
//   const tick = ticks[seq];
//   for (let i = 0; i < parameters.maxRemoteObjects; i++) {
//     if (eventDifferenceDepthFor[i] >= eventDepth) {
//       const o = tick[i];
//       const r = receivedState.state[i];
//       const ordnance1 = getBit(r.eventsEncoded, eventDepth - 1);
//       const ordnance2 = getBit(r.eventsEncoded, eventDepth - 1 + 4);
//       ordnance1 && handleGameEvent({ type: types.EventType.Shot, data: o });
//       ordnance2 && handleGameEvent({ type: types.EventType.Shot2, data: o });
//     }
//   }
// };

// function seq8Subtract(a: number, b: number) {
//   return (a - b + 256) & 0xff;
// }

// const handleAuthoritativeState = () => {
//   if (!latestReceivedState) return;

//   const seq = latestReceivedState.tick;
//   const receivedState = latestReceivedState.state;

//   const tick = ticks[seq];

//   for (let i = 0; i < parameters.maxRemoteObjects; i++) {
//     const o = tick[i];
//     const r = receivedState[i];
//     o.rollback = false;
//     if (
//       o.inputsUp !== r.inputsUp ||
//       o.inputsDown !== r.inputsDown ||
//       o.inputsLeft !== r.inputsLeft ||
//       o.inputsRight !== r.inputsRight ||
//       o.x !== r.x ||
//       o.y !== r.y
//     ) {
//       o.rollback = true;
//     }
//     o.inputsUp = r.inputsUp;
//     o.inputsDown = r.inputsDown;
//     o.inputsLeft = r.inputsLeft;
//     o.inputsRight = r.inputsRight;
//     o.inputsSpace = r.inputsSpace;
//     o.inputsD = r.inputsD;
//     o.inputsF = r.inputsF;
//     o.inputsE = r.inputsE;
//     o.x = r.x;
//     o.y = r.y;
//     o.z = r.z;
//     o.rotationZ = r.rotationZ;
//     o.health = r.health;
//     o.fuel = r.fuel;
//   }
// };

// const ls = globals.localObjects;
// const dst = parameters.collisionMaxDistanceLocalObject;
// const checkLocalCollision = (currentTickObject: types.TickStateObject) => {
//   for (let i = 0; i < ls.length; i++) {
//     const l = ls[i];
//     isColliding();
//   }
// };

// export const handleTick = (
//   tickNumber: number,
//   handleGameEvent: (e: types.GameEvent) => void,
//   sendControlsData: (data: ArrayBuffer) => void
// ) => {
//   handleRollback(tickNumber, handleGameEvent);
//   for (let i = globals.sharedObjects.length - 1; i > -1; i--) {
//     const o = globals.sharedObjects[i];
//     if (o && o.object3d) {
//       if (o.object3d.visible) {
//         if (o.isMe) {
//           handleControlsData(o, sendControlsData, tickNumber);
//           // TODO controls to tick object
//         }
//         // xhandleMovement(o, o.object3d);
//       }
//       const oo = ticks[tickNumber][o.idOverNetwork];
//       oo.id = o.id;
//       oo.idOverNetwork = o.idOverNetwork;
//       oo.health = o.health;
//       oo.type = o.type;
//       oo.x = o.object3d.position.x;
//       oo.y = o.object3d.position.y;
//       // oo.score = o.score;
//       oo.speed = o.speed;
//       oo.inputsUp = o.inputsUp;
//       oo.inputsDown = o.inputsDown;
//       oo.inputsLeft = o.inputsLeft;
//       oo.inputsRight = o.inputsRight;
//       oo.inputsSpace = o.inputsSpace;
//       oo.inputsF = o.inputsF;
//       oo.inputsD = o.inputsD;
//       oo.inputsE = o.inputsE;
//       oo.rotationSpeed = o.rotationSpeed;
//       oo.verticalSpeed = o.verticalSpeed;
//       // oo.backendX = o.backendPosition.x;
//       // oo.backendY = o.backendPosition.y;
//       // oo.backendRotationZ = o.backendRotationZ;
//       // oo.keyDowns = [...o.keyDowns];
//       // oo.shotDelay = o.shotDelay;
//       // oo.positionZ = o.positionZ;
//       // oo.backendPositionZ = o.backendPositionZ;
//       // oo.previousPosition[0] = o.previousPosition[0];
//       // oo.previousPosition[1] = o.previousPosition[1];
//       // oo.previousPosition[2] = o.previousPosition[2];
//       // oo.previousRotation = o.previousRotation;
//       oo.fuel = o.fuel;
//       oo.bulletCount = o.bulletCount;
//     }
//   }
// };
