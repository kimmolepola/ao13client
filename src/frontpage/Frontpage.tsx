import { memo } from "react";
import {
  useLocation,
  BrowserRouter,
  Link,
  Routes,
  Route,
} from "react-router-dom";
import { useRecoilValue } from "recoil";

import Login from "./components/Login";
import ForgottenPassword from "./components/ForgottenPassword";
import SignUp from "./components/SignUp";
import ResetPassword from "./components/ResetPassword";
import LoggedIn from "./components/LoggedIn";
import AppBar from "./components/AppBar";

import * as atoms from "../atoms";

const Frontpage = () => {
  console.log("--Frontpage");

  const user = useRecoilValue(atoms.user);
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-blue-200">
      {Boolean(user) && <AppBar />}
      <div
        className={`grow flex flex-col items-center bg-rose-50 text-zinc-800 gap-4 ${
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
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/forgottenpassword" element={<ForgottenPassword />} />
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
      <Route path="*" element={<Frontpage />} />
    </Routes>
  </BrowserRouter>
);

export default memo(Container);
