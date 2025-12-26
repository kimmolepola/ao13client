import { memo } from "react";
import {
  useLocation,
  BrowserRouter,
  Link,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./Login";
import ForgottenPassword from "./ForgottenPassword";
import SignUp from "./SignUp";
import ResetPassword from "./ResetPassword";
import LoggedIn from "./LoggedIn";
import AppBar from "./AppBar";

import ConfirmSignup from "./ConfirmSignup";
import * as types from "../../types";

const Container = ({
  user,
  onChangeUser,
  onChangePage,
  onChangeIceServers,
}: {
  user: types.User | undefined;
  onChangeUser: (user: types.User | undefined) => void;
  onChangePage: (page: "frontpage" | "game") => void;
  onChangeIceServers: (value: types.IceServerInfo[] | undefined) => void;
}) => (
  <BrowserRouter>
    <Routes>
      <Route
        path="*"
        element={
          <Content
            user={user}
            onChangeUser={onChangeUser}
            onChangePage={onChangePage}
            onChangeIceServers={onChangeIceServers}
          />
        }
      />
    </Routes>
  </BrowserRouter>
);

export default memo(Container);

const Content = ({
  user,
  onChangeUser,
  onChangePage,
  onChangeIceServers,
}: {
  user: types.User | undefined;
  onChangeUser: (user: types.User | undefined) => void;
  onChangePage: (page: "frontpage" | "game") => void;
  onChangeIceServers: (value: types.IceServerInfo[] | undefined) => void;
}) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-blue-200 dark:bg-blue-900">
      {Boolean(user) && <AppBar user={user} onChangeUser={onChangeUser} />}
      <div
        className={`grow flex flex-col items-center bg-rose-50 text-zinc-800 dark:bg-rose-900 dark:text-zinc-200 gap-4 ${
          user ? "pt-12 top-12" : "pt-24"
        }`}
      >
        {!user && location.pathname === "/" ? (
          <a className="active:text-black" href="/">
            AO13
          </a>
        ) : (
          <Link className="active:text-black" to="/">
            AO13
          </Link>
        )}

        <Routes>
          <Route
            path="/confirm-email"
            element={<ConfirmSignup user={user} onChangeUser={onChangeUser} />}
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgotten-password" element={<ForgottenPassword />} />
          <Route path="/signup" element={<SignUp user={user} />} />
          <Route
            path="*"
            element={
              !user ? (
                <Login onChangeUser={onChangeUser} />
              ) : (
                <LoggedIn
                  user={user}
                  onChangeUser={onChangeUser}
                  onChangePage={onChangePage}
                  onChangeIceServers={onChangeIceServers}
                />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
};
