import axios from "axios";
import { backendUrl } from "src/config";
import * as globals from "../../globals";

export const setAccessToken = (accessToken: string) => {
  globals.accessToken.value = accessToken;
  axios.defaults.headers.common = { Authorization: `Bearer ${accessToken}` };
};

export const getTurnCredentials = async () => {
  try {
    const response = await axios.get(
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
  email,
  password,
}: {
  token: string;
  email: string;
  password: string;
}) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/resetpassword`,
      {
        token,
        email,
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
    const data = {
      username: response.data?.username,
      score: response.data?.score,
      accessToken: response.data?.accessToken,
      refreshToken: response.data?.refreshToken,
    };
    return { data, error: null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      return { data: null, error: "Invalid username, email or password" };
    }
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { data: null, error };
  }
};

export const requestSignup = async ({ email }: { email: string }) => {
  try {
    const response = await axios.post(`${backendUrl}/api/v1/auth/signup`, {
      email,
    });
    return { data: response.data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};

export const confirmSignup = async ({
  email,
  password,
  token,
}: {
  email: string;
  password: string;
  token: string;
}) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/confirmSignup`,
      {
        email,
        password,
        token,
      }
    );
    const data = {
      username: response.data?.username,
      score: response.data?.score,
      accessToken: response.data?.accessToken,
      refreshToken: response.data?.refreshToken,
    };
    return { data, error: null };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { data: null, error };
  }
};

export const requestTokenRefresh = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/refreshToken`,
      { refreshToken }
    );
    const data = {
      accessToken: response.data?.accessToken,
      refreshToken: response.data?.refreshToken,
    };
    return { data };
  } catch (err: any) {
    const error = err.response?.data ? err.response.data.error : err.toString();
    return { error };
  }
};
