import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useRecoilState } from "recoil";

import { logout, setToken } from "src/networking/services/auth.service";

import * as atoms from "src/atoms";

const AppBar = () => {
  console.log("--AppBar");

  const [user, setUser] = useRecoilState(atoms.user);

  const onClickLogout = useCallback(async () => {
    logout();
    localStorage.removeItem("user");
    setUser(undefined);
    setToken("");
  }, [setUser]);

  return (
    <>
      <div className="absolute left-0 right-0 top-0 h-12 bg-rose-50 opacity-10" />
      <div className="absolute left-0 right-0 top-0 h-12 justify-between flex items-center border border-b-zinc-200 text-zinc-700">
        <div className="w-1/3 pl-3">
          <Link className="active:text-black" to="/">
            AO13
          </Link>
        </div>
        <div className="w-1/3 flex justify-center">
          {user?.username && `Hi, ${user.username}`}
        </div>
        <div className="w-1/3 flex justify-end pr-3 gap-4">
          {user && !user.username.includes("guest_") && (
            <Link className="text-2xl active:text-black" to="/settings">
              {"\u2699"}
            </Link>
          )}
          <div className="flex flex-col justify-center">
            <button
              className="border active:text-black border-zinc-700 active:border-black pl-2 pr-2 rounded"
              onClick={onClickLogout}
              type="button"
            >
              logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(AppBar);
