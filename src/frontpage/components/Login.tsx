import { ChangeEvent, memo, useCallback, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import clsx from "clsx";

import { setAccessToken, login } from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as types from "../types";
import * as hooks from "../hooks";
import * as utils from "../../utils";
import * as sharedTypes from "../../types";

const Login = ({
  onChangeUser,
}: {
  onChangeUser: (user: sharedTypes.User | undefined) => void;
}) => {
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
      const { data: fullData, error } = await login({ username, password });
      const exp = utils.decodeJWT(fullData?.accessToken)?.payload?.exp;
      const data = {
        username: fullData?.username,
        score: fullData?.score,
        accessToken: fullData?.accessToken,
        accessTokenExpiration: exp,
        refreshToken: fullData?.refreshToken,
      };
      newValidation.login = error;
      newValidation.state = types.ValidationState.OPEN;
      if (!error) {
        onChangeUser(data);
        setAccessToken(data?.accessToken);
        setUsername("");
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          localStorage.removeItem("user");
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
      <Link to="/forgotten-password">Forgotten password?</Link>
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
