import { memo } from "react";
import {
  useLocation,
  BrowserRouter,
  Link,
  Routes,
  Route,
} from "react-router-dom";
import { useRecoilValue } from "recoil";

import Login from "./Login";
import ForgottenPassword from "./ForgottenPassword";
import SignUp from "./SignUp";
import ResetPassword from "./ResetPassword";
import LoggedIn from "./LoggedIn";
import AppBar from "./AppBar";

import * as atoms from "../../atoms";
import ConfirmSignup from "./ConfirmSignup";

const Content = () => {
  const user = useRecoilValue(atoms.user);
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-blue-200 dark:bg-blue-900">
      {Boolean(user) && <AppBar />}
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
          <Route path="/confirm-email" element={<ConfirmSignup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgotten-password" element={<ForgottenPassword />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={!user ? <Login /> : <LoggedIn />} />
        </Routes>
      </div>
    </div>
  );
};

const Container = () => (
  <BrowserRouter>
    <Routes>
      <Route path="*" element={<Content />} />
    </Routes>
  </BrowserRouter>
);

export default memo(Container);
