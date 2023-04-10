import { useCallback } from "react";
import { useSetRecoilState } from "recoil";
import { setToken } from "src/networking/services/auth.service";

import * as atoms from "src/atoms";

export const useAuth = () => {
  console.log("--useAuth");

  const setUser = useSetRecoilState(atoms.user);
  const loadSavedUser = useCallback(() => {
    const item = JSON.parse(localStorage.getItem("user") || "null");
    setUser(item);
    setToken(item?.token);
  }, [setUser]);

  return { loadSavedUser };
};
