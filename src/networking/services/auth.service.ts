import axios from "axios";
import { backendUrl } from "src/config";

export const setToken = (token: string) => {
  axios.defaults.headers.common = { Authorization: `Bearer ${token}` };
};

export const getTurnCredentials = async () => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/getTurnCredentials`
    );
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};

export const logout = async () => {
  try {
    const response = await axios.post(`${backendUrl}/api/v1/auth/logout`);
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};

export const resetPassword = async ({
  token,
  userId,
  password,
}: {
  token: string;
  userId: string;
  password: string;
}) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/resetpassword`,
      {
        token,
        userId,
        password,
      }
    );
    return { data: response.data, error: null };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { data: null, error };
  }
};

export const requestPasswordReset = async ({
  username,
}: {
  username: string;
}) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/requestResetPassword`,
      {
        username,
      }
    );
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};

export const login = async ({
  username,
  password,
}: {
  username: string;
  password: string;
}) => {
  try {
    const response = await axios.post(`${backendUrl}/api/v1/auth/login`, {
      username,
      password,
    });
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};

export const signup = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    const response = await axios.post(`${backendUrl}/api/v1/auth/signup`, {
      email,
      password,
    });
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};
