import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { setAccessToken } from "src/networking/services/auth.service";

import * as atoms from "src/atoms";

export const useAuth = () => {
  const setUser = useSetRecoilState(atoms.user);
  const loadSavedUser = useCallback(() => {
    const item = JSON.parse(localStorage.getItem("user") || "null");
    setUser(item);
    setAccessToken(item?.token);
  }, [setUser]);

  return { loadSavedUser };
};
