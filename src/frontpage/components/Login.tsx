import { ChangeEvent, memo, useCallback, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import clsx from "clsx";

import { setToken, login } from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as atoms from "src/atoms";
import * as types from "../types";
import * as hooks from "../hooks";

const Login = () => {
  console.log("--Login");
  const setUser = useSetRecoilState(atoms.user);
  const navigate = useNavigate();
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      login: undefined,
      username: username.length ? "" : "required",
      password: password.length ? "" : "required",
    };
    e.target[0]?.setCustomValidity(newValidation.username);
    e.target[1]?.setCustomValidity(newValidation.password);
    if (!newValidation.username && !newValidation.password) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { data, error } = await login({ username, password });
      newValidation.login = error;
      newValidation.state = types.ValidationState.OPEN;
      if (!error) {
        setUser(data);
        setToken(data.token);
        setUsername("");
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(data));
        }
      }
    }
    setPassword("");
    setValidation({ ...newValidation });
  };

  const onChangeUsername = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      resetValidation();
      setUsername(e.target.value);
    },
    [resetValidation]
  );

  const onChangePassword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      resetValidation();
      setPassword(e.target.value);
    },
    [resetValidation]
  );

  const onChangeRememberMe = useCallback((e: any) => {
    setRememberMe(e.target.checked);
  }, []);

  const onClickSignUp = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  return (
    <div className={theme.cContainer}>
      <form onSubmit={onSubmit} className={theme.cForm}>
        {validation.login && (
          <div className={theme.cValidationError}>{validation.login}</div>
        )}
        <input
          className={theme.cInput}
          autoCapitalize="none"
          onChange={onChangeUsername}
          value={username}
          placeholder="username or email"
        />
        <input
          className={theme.cInput}
          type="password"
          onChange={onChangePassword}
          value={password}
          placeholder="password"
        />
        <button
          className={theme.cButton}
          disabled={validation.state === types.ValidationState.LOADING}
          type="submit"
        >
          Sign in
        </button>
        <label className="flex gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={onChangeRememberMe}
          />
          Remember me
        </label>
      </form>
      <Link to="/forgottenpassword">Forgotten password?</Link>
      <button
        className={clsx(theme.cButton, "bg-orange-400")}
        type="button"
        onClick={onClickSignUp}
      >
        Sign up
      </button>
    </div>
  );
};

export default memo(Login);
