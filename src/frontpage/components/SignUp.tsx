import {
  useMemo,
  ChangeEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import { requestSignup } from "src/networking/services/auth.service";

import * as theme from "src/theme";
import * as types from "../types";
import * as hooks from "../hooks";
import * as sharedTypes from "../../types";

const SignUp = ({ user }: { user: sharedTypes.User | undefined }) => {
  const navigate = useNavigate();
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [email, setEmail] = useState("");

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
      request: undefined,
      email: email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)
        ? ""
        : "Invalid email address",
    };
    e.target[0]?.setCustomValidity(newValidation.email);
    if (!newValidation.email) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { error } = await requestSignup({ email });
      newValidation.request = error;
      newValidation.state = error
        ? types.ValidationState.OPEN
        : types.ValidationState.SUCCESS;
    }
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

  const stateText = useMemo(() => {
    switch (validation.state) {
      case types.ValidationState.LOADING:
        return "Requesting...";
      case types.ValidationState.SUCCESS:
        return "Request sent, check your email";
      default:
        return "Create account";
    }
  }, [validation.state]);

  return (
    <div className={theme.cContainer}>
      {stateText}
      {validation.state === types.ValidationState.SUCCESS ? null : (
        <form onSubmit={onSubmit} className={theme.cForm}>
          {validation.request && (
            <div className={theme.cValidationError}>{validation.request}</div>
          )}
          <input
            className={theme.cInput}
            onChange={onChangeEmail}
            value={email}
            placeholder="email"
            type="email"
          />
          <button
            disabled={validation.state === types.ValidationState.LOADING}
            type="submit"
            className={clsx(theme.cButton, "bg-orange-400")}
          >
            Create
          </button>
        </form>
      )}
    </div>
  );
};

export default memo(SignUp);
