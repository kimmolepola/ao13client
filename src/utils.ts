import * as parameters from "./parameters";

export const decodeAxisValue = (encodedAxisValue: number) =>
  (encodedAxisValue + parameters.networkToPositionAddition) *
  parameters.networkToPositionFactor;

export const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);
export const radiansToDegrees = (radians: number) => radians * (180 / Math.PI);

export const parseIceUfrag = (sdp: any) =>
  sdp
    .split("\r\n")
    .find((x: any) => x.includes("a=ice-ufrag:"))
    .replace("a=ice-ufrag:", "");

export const logError = (error: any, data: any) => {
  if (
    error.message ===
    "Failed to execute 'send' on 'RTCDataChannel': RTCDataChannel.readyState is not 'open'"
  ) {
    console.log(
      "Failed to send on data channel. This is expected if player disconnected."
    );
  } else {
    console.error("Error:", error.message, "Data:", data);
  }
};

// const zAngleToQuaternion = (theta: number) => {
//   const half = theta / 2;
//   return {
//     w: Math.cos(half),
//     x: 0,
//     y: 0,
//     z: Math.sin(half),
//   };
// };

const min = -Math.PI;
const max = Math.PI;
const rangeMax = parameters.angleMaxValue;

export const decodeAngle = (encodedAngle: number) => {
  return (encodedAngle / rangeMax) * (max - min) + min;
  // encode: Math.round(((angle - min) / (max - min)) * rangeMax);
};

export function decodeJWT(token: string) {
  // Split the token into parts
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT");
  }

  // Base64URL decode helper
  function base64UrlDecode(str: string) {
    // Replace URL-safe chars
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    // Pad with '=' if needed
    while (str.length % 4) {
      str += "=";
    }
    return atob(str);
  }

  // Decode header and payload
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const parsedPayload = JSON.parse(base64UrlDecode(parts[1]));
  if (
    !parsedPayload ||
    typeof parsedPayload !== "object" ||
    typeof parsedPayload?.exp !== "number"
  ) {
    return undefined;
  }
  const roleKey = Object.keys(parsedPayload).find((x) => x.includes("role"));
  const idKey = Object.keys(parsedPayload).find((x) =>
    x.includes("nameidentifier")
  );
  const payload = {
    aud: parsedPayload.aud,
    exp: parsedPayload.exp * 1000,
    role: roleKey ? parsedPayload[roleKey] : undefined,
    id: idKey ? parsedPayload[idKey] : undefined,
    iss: parsedPayload.iss,
  };
  const signature = parts[2]; // raw signature string

  return { header, payload, signature };
}
