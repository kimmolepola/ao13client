export const objectPositionInterpolationAlpha = 0.001;
export const objectRotationInterpolationAlpha = 0.01;
export const cameraPositionInterpolationAlpha = 0.05;
export const cameraRotationInterpolationAlpha = 0.001;
export const chatMessageTimeToLive = 60000;
export const infoTextOffsetValue = 10;
export const sidepanelDefaultSize = 150;
export const sidepanelMinimumSize = 90;
export const shotDelay = 100;
export const rotationDecay = 0.99;
export const verticalDecay = 0.99;
export const unitFactor = 0.1;

// netcode
export const clientSendInterval = 1000 / 20;
export const unreliableStateInterval = 1000 / 20;
export const angleMaxValue = 65535;
export const maxRemoteObjects = 256;
export const stateMaxSequenceNumber = 255;
export const recentStateSlotLength = 32;
export const controlToNetworkFactor = 0.15;
// const networkToControlFactor = 1 / controlToNetworkFactor;

// fastest projectile speed 25500 km/h ~ 13769 knots
// 16 bit max value is 65535
// 65535 / 13769 = 4.76
// 65535 / 25500 = 2.57
// export const maxSpeed = 13769; // in knots
export const maxSpeed = 25500;
// const speedToNetworkFactor = 4.76;
const speedToNetworkFactor = 2.57;
export const networkToSpeedFactor = 1 / speedToNetworkFactor;

// 1 distance unit is 20 meters. World size is 400x400 km. 400 km / 20 m = 20 000 distance units.
export const oneDistanceUnitInMeters = 20;
export const maxWorldCoordinateValue = 10000; // 1 unit is 20 meters
export const minWorldCoordinateValue = -10000;
const maxNetworkCoordinateValue = 4294967295; // 32 bit unsigned integer
// const minNetworkCoordinateValue = 0;
const positionToNetworkAddition = -minWorldCoordinateValue;
const positionToNetworkFactor =
  maxNetworkCoordinateValue /
  (-minWorldCoordinateValue + maxWorldCoordinateValue);
export const networkToPositionAddition = -positionToNetworkAddition;
export const networkToPositionFactor = 1 / positionToNetworkFactor;

// const oldPositionToNetworkFactor = 0.01;
// const oldNetworkToPositionFactor = 1 / positonToNetworkFactor;
// const oldPositionToNetworkAddition = 0xffffffff / 2;
// const oldNetworkToPositionAddition = -positionToNetworkAddition;

export const initialSpeed = 0;
export const minSpeed = 0;
const millisecondsInHour = 1000 * 60 * 60;
const metersInKm = 1000;
export const speedFactor =
  ((1 / millisecondsInHour) * metersInKm) / oneDistanceUnitInMeters;
export const forceUpToSpeedFactor = 0.14;
export const forceDownToSpeedFactor = 0.14;

export const maxRotationSpeedAbsolute = 127;
export const rotationFactor = 0.00001;
export const forceLeftOrRightToRotationFactor = 0.1;

export const maxVerticalSpeedAbsolute = 127;
export const verticalSpeedFactor = 0.001;
export const forceAscOrDescToVerticalSpeedFactor = 0.01;

export const bulletSpeed = 2000;
export const bulletSpeedReductionFactor = 0.991;

export const cameraDefaultZ = 80; // 160000 / oneDistanceUnitInMeters; // low orbit satellite altitude 160 - 2000 km. 160 km / 20 m = 8000
const worldWidth = maxWorldCoordinateValue - minWorldCoordinateValue;
const radarBoxWidth = 100; // 100 px
export const worldToRadarPositionRatio = radarBoxWidth / worldWidth;
