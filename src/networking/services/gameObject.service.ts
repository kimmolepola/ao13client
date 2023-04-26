import axios from "axios";
import { backendUrl } from "src/config";
import * as types from "src/types";

export const getGameObject = async (id: any) => {
  try {
    const response = await axios.get(`${backendUrl}/api/v1/gameObject/${id}`);
    return { data: response.data as types.InitialGameObject | undefined };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    console.error("gameobject fetch error:", error);
    return { error };
  }
};

export const savePlayerData = async (
  data: { remoteId: string; score: number }[]
) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/gameObject/saveGameState`,
      data
    );
    return { data: response.data, error: null };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { data: null, error };
  }
};
