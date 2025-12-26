import { useState, useEffect } from "react";

import Game from "./Game";
import Frontpage from "./Frontpage";

import * as frontpageHooks from "./Frontpage/hooks";
import * as types from "./types";
import { useTokenRefresh } from "./hooks/useTokenRefresh";

const App = () => {
  const [user, setUser] = useState<types.User>();
  const [page, setPage] = useState<"frontpage" | "game">("frontpage");
  const [iceServers, setIceServers] = useState<
    types.IceServerInfo[] | undefined
  >();

  useTokenRefresh(user, setUser);
  const { loadSavedUser } = frontpageHooks.useAuth(setUser);

  useEffect(() => {
    loadSavedUser();
  }, [loadSavedUser]);

  return page === "frontpage" ? (
    <Frontpage
      user={user}
      onChangeUser={setUser}
      onChangePage={setPage}
      onChangeIceServers={setIceServers}
    />
  ) : (
    <Game user={user} iceServers={iceServers} onChangePage={setPage} />
  );
};

export default App;
