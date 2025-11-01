import * as types from "../../types";

export const recentStates: {
  [sequenceNumber: number]:
    | { timestamp: number; data: types.ReliableState[] }
    | undefined;
} = {};
