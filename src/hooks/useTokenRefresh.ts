import { useEffect, Dispatch, SetStateAction } from "react";
import {
  setAccessToken,
  requestTokenRefresh,
} from "src/networking/services/auth";
import * as utils from "../utils";
import * as types from "../types";

export const useTokenRefresh = (
  user: types.User | undefined,
  setUser: Dispatch<SetStateAction<types.User | undefined>>
) => {
  useEffect(() => {
    let timeoutId: number | undefined;
    if (user?.accessTokenExpiration) {
      timeoutId = window.setTimeout(async () => {
        if (user.refreshToken) {
          const result = await requestTokenRefresh(user.refreshToken);
          const exp = utils.decodeJWT(result.data?.accessToken)?.payload?.exp;
          setUser((x) =>
            x
              ? {
                  ...x,
                  accessToken: result.data?.accessToken,
                  accessTokenExpiration: exp,
                  refreshToken: result.data?.refreshToken,
                }
              : x
          );
          setAccessToken(result.data?.accessToken);
        }
      }, user.accessTokenExpiration - new Date().getTime() - 1000 * 10);
    } else {
      window.clearTimeout(timeoutId);
    }
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    user?.accessToken,
    user?.accessTokenExpiration,
    user?.refreshToken,
    setUser,
  ]);
};
