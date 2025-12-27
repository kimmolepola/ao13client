import { ChangeEvent, memo, useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "src/networking/services/auth";
import clsx from "clsx";

import * as theme from "src/theme";
import * as types from "../types";
import * as hooks from "../hooks";

const ForgottenPassword = () => {
  const navigate = useNavigate();
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [username, setUsername] = useState("");

  const stateText = useMemo(() => {
    switch (validation.state) {
      case types.ValidationState.LOADING:
        return "Please wait...";
      case types.ValidationState.SUCCESS:
        return "Email sent (check spam)";
      default:
        return "Enter your username or email";
    }
  }, [validation.state]);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      request: undefined,
      username: username.length ? "" : "required",
    };
    e.target[0]?.setCustomValidity(newValidation.username);
    if (!newValidation.username) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { error } = await requestPasswordReset({ username });
      newValidation.request = error;
      newValidation.state = error
        ? types.ValidationState.OPEN
        : types.ValidationState.SUCCESS;
      setUsername("");
    }
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

  const onClickCancel = useCallback(() => {
    navigate("/login");
  }, [navigate]);

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
            autoCapitalize="none"
            onChange={onChangeUsername}
            value={username}
            placeholder="username or email"
          />
          <div className="flex justify-center gap-2 w-full">
            <button
              className={clsx(
                theme.cButton,
                "bg-transparent border-rose-900 text-rose-900"
              )}
              onClick={onClickCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              disabled={validation.state === types.ValidationState.LOADING}
              type="submit"
              className={theme.cButton}
            >
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default memo(ForgottenPassword);
