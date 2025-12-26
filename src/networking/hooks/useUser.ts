import { useCallback } from "react";

import { getUser } from "../services/user.service";
import * as types from "../../types";

export const useUser = (
  onChangeUser: (user: types.User | undefined) => void
) => {
  const refreshUser = useCallback(async () => {
    const { data } = await getUser();
    data && onChangeUser(data);
  }, [onChangeUser]);

  return { refreshUser };
};
