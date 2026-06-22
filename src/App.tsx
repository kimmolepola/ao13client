import { useState, useEffect, useCallback } from "react";

import Game from "./Game/components/Container";
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
  const [disconnectReason, setDisconnectReason] = useState<string>();

  useTokenRefresh(user, setUser);
  const { loadSavedUser } = frontpageHooks.useAuth(setUser);

  useEffect(() => {
    loadSavedUser();
  }, [loadSavedUser]);

  const handleChangePage = useCallback(
    (p: "frontpage" | "game", reason?: string) => {
      setPage(p);
      setDisconnectReason(reason);
    },
    []
  );

  return page === "frontpage" ? (
    <Frontpage
      user={user}
      onChangeUser={setUser}
      onChangePage={handleChangePage}
      onChangeIceServers={setIceServers}
      disconnectReason={disconnectReason}
    />
  ) : (
    <Game user={user} iceServers={iceServers} onChangePage={handleChangePage} />
  );
};

export default App;
