import { ChangeEvent, memo, useMemo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useSetRecoilState } from "recoil";

import { updateUsername } from "src/networking/services/user.service";

import * as theme from "src/theme";
import * as atoms from "src/atoms";
import * as types from "../types";
import * as hooks from "../hooks";

const Settings = () => {
  console.log("--Settings");

  const setUser = useSetRecoilState(atoms.user);
  const [validation, setValidation, resetValidation] = hooks.useValidation();
  const [username, setUsername] = useState("");

  const stateText = useMemo(() => {
    switch (validation.state) {
      case types.ValidationState.LOADING:
        return "Updating...";
      case types.ValidationState.SUCCESS:
        return "Username updated";
      default:
        return "Update username";
    }
  }, [validation.state]);

  const onSubmit = async (e: types.FormSubmitEvent) => {
    e.preventDefault();
    const newValidation = {
      dirty: true,
      state: types.ValidationState.OPEN,
      update: undefined,
      username: (() => {
        if (!username.length) return "can not be empty";
        if (username.length > 20) return "max 20 characters";
        return "";
      })(),
    };
    e.target[0]?.setCustomValidity(newValidation.username);
    if (!newValidation.username) {
      newValidation.state = types.ValidationState.LOADING;
      setValidation(newValidation);
      const { data, error } = await updateUsername(username);
      newValidation.update = error;
      newValidation.state = error
        ? types.ValidationState.OPEN
        : types.ValidationState.SUCCESS;
      if (!error) {
        setUser(data);
        setUsername("");
      }
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

  return (
    <div className={theme.cContainer}>
      {stateText}
      {validation.state === types.ValidationState.SUCCESS && (
        <Link to="/">{"\u2794"}</Link>
      )}
      {validation.state !== types.ValidationState.SUCCESS && (
        <form className={theme.cForm} onSubmit={onSubmit}>
          {validation.update && (
            <div className={theme.cValidationError}>{validation.update}</div>
          )}
          <input
            className={theme.cInput}
            autoCapitalize="none"
            onChange={onChangeUsername}
            value={username}
            placeholder="new username"
          />
          <button type="submit" className={theme.cButton}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default memo(Settings);
