import { ChangeEvent, memo, useMemo, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { resetPassword } from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as types from "../types";
import * as hooks from "../hooks";

const ResetPassword = () => {
  console.log("--ResetPassword");
  const query = new URLSearchParams(useLocation().search);
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const stateText = useMemo(() => {
    switch (validation.state) {
      case types.ValidationState.LOADING:
        return "Please wait...";
      case types.ValidationState.SUCCESS:
        return "Password changed. You can now log in using your new password.";
      default:
        return "Enter new password";
    }
  }, [validation.state]);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      request: undefined,
      password: password !== "" ? "" : "invalid password",
      repeatPassword: password === repeatPassword ? "" : "password mismatch",
    };
    e.target[0]?.setCustomValidity(newValidation.password);
    e.target[1]?.setCustomValidity(newValidation.repeatPassword);
    if (!newValidation.password && !newValidation.repeatPassword) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const token = query.get("token");
      const userId = query.get("id");
      let err;
      if (token && userId) {
        const { error } = await resetPassword({
          password,
          token,
          userId,
        });
        err = error;
      } else {
        err = "Missing token or userId";
      }
      newValidation.request = err;
      newValidation.state = err
        ? types.ValidationState.OPEN
        : types.ValidationState.SUCCESS;
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
      {stateText}
      {validation.state !== types.ValidationState.SUCCESS && (
        <form onSubmit={onSubmit} className={theme.cForm}>
          {validation.request && (
            <div className={theme.cValidationError}>{validation.request}</div>
          )}
          <input
            className={theme.cInput}
            type="password"
            onChange={onChangePassword}
            value={password}
            placeholder="password"
          />
          <input
            className={theme.cInput}
            type="password"
            onChange={onChangeRepeatPassword}
            value={repeatPassword}
            placeholder="repeat password"
          />
          <button
            disabled={validation.state === types.ValidationState.LOADING}
            type="submit"
            className={theme.cButton}
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default memo(ResetPassword);
