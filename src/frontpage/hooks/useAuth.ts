import { useCallback } from "react";
import { setAccessToken } from "src/networking/services/auth.service";

import * as types from "../../types";

export const useAuth = (
  onChangeUser: (user: types.User | undefined) => void
) => {
  const loadSavedUser = useCallback(() => {
    const item = JSON.parse(localStorage.getItem("user") || "null");
    onChangeUser(item);
    setAccessToken(item?.token);
  }, [onChangeUser]);

  return { loadSavedUser };
};
