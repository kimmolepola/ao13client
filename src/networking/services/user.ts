import { backendUrl } from "src/config";
import { apiGet, apiPost } from "./api";

export const checkOkToStart = async () => {
  try {
    const data = await apiGet(`${backendUrl}/api/v1/user/checkOkToStart`);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? err.toString() };
  }
};

export const getUser = async () => {
  try {
    const data = await apiGet(`${backendUrl}/api/v1/user`);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? err.toString() };
  }
};

export const updateUsername = async (username: any) => {
  try {
    const data = await apiPost(`${backendUrl}/api/v1/user/updateUsername`, {
      username,
    });
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? err.toString() };
  }
};
