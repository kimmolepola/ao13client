import { useCallback } from "react";
import { useSetRecoilState } from "recoil";

import { getUser } from "../services/user.service";
import * as atoms from "../../atoms";

export const useUser = () => {
  const setUser = useSetRecoilState(atoms.user);

  const refreshUser = useCallback(async () => {
    const { data } = await getUser();
    if (data) {
      setUser(data);
    }
  }, [setUser]);

  return { refreshUser };
};
