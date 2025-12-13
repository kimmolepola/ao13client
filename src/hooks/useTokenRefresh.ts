import { useEffect } from "react";
import { useRecoilState } from "recoil";
import * as atoms from "../atoms";
import {
  setAccessToken,
  requestTokenRefresh,
} from "src/networking/services/auth.service";
import * as utils from "../utils";

export const useTokenRefresh = () => {
  const [user, setUser] = useRecoilState(atoms.user);

  console.log("--user:", user);

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
