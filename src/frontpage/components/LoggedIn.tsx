import { memo, useCallback, useEffect, useState } from "react";
import { useLocation, Routes, Route } from "react-router-dom";

import { checkOkToStart } from "src/networking/services/user.service";
import { getTurnCredentials } from "src/networking/services/auth.service";
import * as networkingHooks from "src/networking/hooks";

import Settings from "./Settings";

import * as theme from "src/theme";
import * as types from "../../types";

const LoggedIn = ({
  user,
  onChangeUser,
  onChangePage,
  onChangeIceServers,
}: {
  user: types.User | undefined;
  onChangeUser: (user: types.User | undefined) => void;
  onChangePage: (page: "frontpage" | "game") => void;
  onChangeIceServers: (value: types.IceServerInfo[]) => void;
}) => {
  const location = useLocation();
  const { refreshUser } = networkingHooks.useUser(onChangeUser);

  const [errorText, setErrorText] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErrorText(undefined);
  }, [user, location]);

  const onClickRefresh = useCallback(async () => {
    setLoading(true);
    await refreshUser();
    setTimeout(() => setLoading(false), 250);
  }, [refreshUser]);

  const onClickPlay = useCallback(async () => {
    if (!errorText) {
      const { data, error } = await checkOkToStart();
      if (data && data.success) {
        const { data: turnCredentials, error: credentialsError } =
          await getTurnCredentials();
        if (turnCredentials) {
          const iceServer: any = {
            urls: "turns:" + turnCredentials.hostname + ":" + 5349,
            username: turnCredentials.username,
            credential: turnCredentials.password,
          };
          onChangeIceServers([iceServer]);
          onChangePage("game");
        } else {
          setErrorText(credentialsError);
          setTimeout(() => setErrorText(undefined), 5000);
        }
      } else {
        setErrorText(error);
        setTimeout(() => setErrorText(undefined), 5000);
      }
    }
  }, [errorText, setErrorText, onChangeIceServers, onChangePage]);

  return (
    <Routes>
      <Route
        path="/settings"
        element={<Settings user={user} onChangeUser={onChangeUser} />}
      />
      <Route
        path="*"
        element={
          <>
            <div className="flex gap-4">
              {user && `Score: ${user.score}`}
              <button
                className="disabled:animate-[spin_600ms_linear_infinite]"
                disabled={loading}
                onClick={onClickRefresh}
                type="button"
              >
                {"\u21BB"}
              </button>
            </div>
            {errorText && (
              <div className={theme.cValidationError}>{errorText}</div>
            )}
            <button
              className={theme.cButton}
              onClick={onClickPlay}
              type="button"
            >
              Play
            </button>
          </>
        }
      />
    </Routes>
  );
};

export default memo(LoggedIn);
