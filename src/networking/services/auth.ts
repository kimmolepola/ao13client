import { backendUrl } from "src/config";
import * as globals from "../../globals";
import { apiGet, apiPost, ApiError } from "./api";

export const setAccessToken = (accessToken: string) => {
  globals.accessToken.value = accessToken;
};

export const getTurnCredentials = async () => {
  try {
    const data = await apiGet(`${backendUrl}/api/v1/auth/getTurnCredentials`);
    return { data };
  } catch (err: any) {
    return { error: err.message ?? err.toString() };
  }
};

export const logout = async () => {
  try {
    const data = await apiPost(`${backendUrl}/api/v1/auth/logout`);
    return { data };
  } catch (err: any) {
    return { error: err.message ?? err.toString() };
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
    const data = await apiPost(`${backendUrl}/api/v1/auth/resetpassword`, {
      token,
      email,
      password,
    });
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? err.toString() };
  }
};

export const requestPasswordReset = async ({
  username,
}: {
  username: string;
}) => {
  try {
    const data = await apiPost(
      `${backendUrl}/api/v1/auth/requestResetPassword`,
      { username }
    );
    return { data };
  } catch (err: any) {
    return { error: err.message ?? err.toString() };
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
    const response = await apiPost(`${backendUrl}/api/v1/auth/login`, {
      username,
      password,
    });
    const data = {
      username: response?.username,
      score: response?.score,
      accessToken: response?.accessToken,
      refreshToken: response?.refreshToken,
    };
    return { data, error: null };
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 401) {
      return { data: null, error: "Invalid username, email or password" };
    }
    return { data: null, error: err.message ?? err.toString() };
  }
};

export const requestSignup = async ({ email }: { email: string }) => {
  try {
    const data = await apiPost(`${backendUrl}/api/v1/auth/signup`, { email });
    return { data };
  } catch (err: any) {
    return { error: err.message ?? err.toString() };
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
    const response = await apiPost(`${backendUrl}/api/v1/auth/confirmSignup`, {
      email,
      password,
      token,
    });
    const data = {
      username: response?.username,
      score: response?.score,
      accessToken: response?.accessToken,
      refreshToken: response?.refreshToken,
    };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? err.toString() };
  }
};

export const requestTokenRefresh = async (refreshToken: string) => {
  try {
    const response = await apiPost(`${backendUrl}/api/v1/auth/refreshToken`, {
      refreshToken,
    });
    const data = {
      accessToken: response?.accessToken,
      refreshToken: response?.refreshToken,
    };
    return { data };
  } catch (err: any) {
    return { error: err.message ?? err.toString() };
  }
};
