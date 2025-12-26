import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";

import {
  confirmSignup,
  setAccessToken,
} from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as types from "../types";
import * as hooks from "../hooks";
import * as utils from "../../utils";
import * as sharedTypes from "../../types";

const ConfirmSignUp = ({
  user,
  onChangeUser,
}: {
  user: sharedTypes.User | undefined;
  onChangeUser: (user: sharedTypes.User | undefined) => void;
}) => {
  const query = new URLSearchParams(useLocation().search);
  const navigate = useNavigate();
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const token = query.get("token");
    const email = query.get("email");
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      create: "",
      password: password !== "" ? "" : "Invalid password",
      repeatPassword: password === repeatPassword ? "" : "Password mismatch",
    };
    e.target[0]?.setCustomValidity(newValidation.password);
    e.target[1]?.setCustomValidity(newValidation.repeatPassword);
    if (!email || !token) {
      newValidation.create = "Invalid link from email";
    } else if (!newValidation.password && !newValidation.repeatPassword) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { data: fullData, error } = await confirmSignup({
        email,
        password,
        token,
      });
      const exp = utils.decodeJWT(fullData?.accessToken)?.payload?.exp;
      const data = {
        exp,
        username: fullData?.username,
        score: fullData?.score,
        accessToken: fullData?.accessToken,
        accessTokenExpiration: exp,
        refreshToken: fullData?.refreshToken,
      };
      newValidation.create = error;
      newValidation.state = types.ValidationState.OPEN;
      if (!error) {
        setAccessToken(data.accessToken);
        onChangeUser(data);
      }
    }
    setPassword("");
    setRepeatPassword("");
    setValidation({ ...newValidation });
  };

  const onChangePassword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      resetValidation();
      setPassword(e.target.value);
    },
    [resetValidation]
  );

  const onChangeRepeatPassword = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      resetValidation();
      setRepeatPassword(e.target.value);
    },
    [resetValidation]
  );

  return (
    <div className={theme.cContainer}>
      {validation.state !== types.ValidationState.LOADING
        ? "Complete registration by creating a password for your account"
        : "Creating..."}
      <form onSubmit={onSubmit} className={theme.cForm}>
        {validation.create && (
          <div className={theme.cValidationError}>{validation.create}</div>
        )}
        <input
          className={theme.cInput}
          onChange={onChangePassword}
          type="password"
          value={password}
          placeholder="password"
        />
        <input
          className={theme.cInput}
          onChange={onChangeRepeatPassword}
          type="password"
          value={repeatPassword}
          placeholder="repeat password"
        />
        <button
          disabled={validation.state === types.ValidationState.LOADING}
          type="submit"
          className={clsx(theme.cButton, "bg-orange-400")}
        >
          Create
        </button>
      </form>
      <div className="text-neutral-400 font-bold">
        email: {query.get("email")}
      </div>
    </div>
  );
};

export default memo(ConfirmSignUp);
