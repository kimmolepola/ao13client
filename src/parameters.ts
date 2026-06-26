export const tickInterval = 50;
export const collisionMaxDistance = 0.7;
export const collisionMaxDistanceLocalObject = 0.1;
export const controlsInterval = 1000 / 60;
export const objectPositionInterpolationAlpha = 0.001;
export const objectRotationInterpolationAlpha = 0.01;
export const cameraPositionInterpolationAlpha = 0.05;
export const cameraRotationInterpolationAlpha = 0.001;
export const chatMessageTimeToLive = 60000;
export const infoTextOffsetValue = 10;
export const sidepanelDefaultSize = 150;
export const sidepanelMinimumSize = 90;
export const shotDelay = 100;
export const rotationDecay = 0.97;
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
// game object max speed = 25500
export const maxSpeed = 2414; // F22 max speed
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
// thrust - drag² physics: v_max ≈ sqrt(3×thrustForce / dragCoefficient) ≈ 2414 km/h at full throttle (up=3)
export const thrustForce = 79; // km/h per second per input count
export const dragCoefficient = 4.06e-5; // (km/h/s) / (km/h)²
export const brakeForce = 20; // km/h per second per input count
// S-curve: thrust ramps from thrustMinFactor at v=0 to 1.0 at thrustRampSpeed
export const thrustMinFactor = 0.1; // fraction of thrust available at standstill
export const thrustRampSpeed = 800; // km/h at which thrust reaches full power

export const maxRotationSpeedAbsolute = 32;
export const rotationFactor = 0.00002;
export const forceLeftOrRightToRotationFactor = 0.25;

export const maxVerticalSpeedAbsolute = 127;
export const verticalSpeedFactor = 0.001;
export const forceAscOrDescToVerticalSpeedFactor = 0.01;
export const minAirborneSpeedKmh = 75 * 1.852; // 138.9 km/h — enforced minimum when positionZ > 0
export const maxAltitude = 9144 / oneDistanceUnitInMeters; // 457.2 units — 30,000 feet
export const glideSlopeMinSpeedKts = 140;     // below this: descent steeper than glide slope
export const glideSlopeMaxSpeedKts = 150;     // 140-150 kts: ~3° glide slope descent
export const neutralMaxSpeedKts = 180;        // 150-180 kts: altitude neutral
export const glideSlopeVerticalSpeed = -0.19; // fixed descent rate matching ~3° glide slope
export const lowSpeedDescentFactor = 0.04;    // extra descent per knot below 140 kts
export const ascentFactor = 0.03;             // climb rate per knot above 180 kts

export const bulletSpeed = 3500;
export const bulletSpeedReductionFactor = 0.999;
export const bulletTimeToLive = 2000;

export const remotePlayerLerpMs = 50;    // smoothing time constant for remote player position
export const remotePlayerSnapDistSq = 25; // snap (no lerp) when distance² exceeds this (~5 units)
export const remoteVelocityBlendFactor = 0.4; // blend visual heading toward velocity direction (0=server heading, 1=pure velocity)
export const cameraDefaultZ = 80; // 160000 / oneDistanceUnitInMeters; // low orbit satellite altitude 160 - 2000 km. 160 km / 20 m = 8000
export const worldWidth = maxWorldCoordinateValue - minWorldCoordinateValue;
export const windowToRadarBoxRatio = 10;

export const maxFuelKg = 8200;
const fuelToNetworkRatio = 255 / maxFuelKg;
export const networkToFuelRatio = 1 / fuelToNetworkRatio;
export const maxBullets = 480;
