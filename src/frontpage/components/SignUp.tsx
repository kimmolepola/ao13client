import { ChangeEvent, memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import clsx from "clsx";

import { signup, setToken } from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as atoms from "src/atoms";
import * as types from "../types";
import * as hooks from "../hooks";

const SignUp = () => {
  const navigate = useNavigate();
  const [user, setUser] = useRecoilState(atoms.user);
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [navigate, user]);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      create: undefined,
      email: email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)
        ? ""
        : "Invalid email address",
      password: password !== "" ? "" : "Invalid password",
      repeatPassword: password === repeatPassword ? "" : "Password mismatch",
    };
    e.target[0]?.setCustomValidity(newValidation.email);
    e.target[1]?.setCustomValidity(newValidation.password);
    e.target[2]?.setCustomValidity(newValidation.repeatPassword);
    if (
      !newValidation.email &&
      !newValidation.password &&
      !newValidation.repeatPassword
    ) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { data, error } = await signup({ email, password });
      newValidation.create = error;
      newValidation.state = types.ValidationState.OPEN;
      if (!error) {
        setToken(data.token);
        setUser(data);
      }
    }
    setPassword("");
    setRepeatPassword("");
    setValidation({ ...newValidation });
  };

  const onChangeEmail = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      e.target.setCustomValidity("");
      resetValidation();
      setEmail(e.target.value);
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
        ? "Create account"
        : "Creating..."}
      <form onSubmit={onSubmit} className={theme.cForm}>
        {validation.create && (
          <div className={theme.cValidationError}>{validation.create}</div>
        )}
        <input
          className={theme.cInput}
          onChange={onChangeEmail}
          value={email}
          placeholder="email"
          type="email"
        />
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
    </div>
  );
};

export default memo(SignUp);
