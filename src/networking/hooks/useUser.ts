import { useCallback } from "react";
import { useRecoilState } from "recoil";

import { getUser } from "../services/user.service";
import * as atoms from "../../atoms";

export const useUser = () => {
  console.log("--useUser");

  const [user, setUser] = useRecoilState(atoms.user);

  const refreshUser = useCallback(async () => {
    if (user) {
      const { data } = await getUser();
      setUser(data);
    }
  }, [user, setUser]);

  return { refreshUser };
};
