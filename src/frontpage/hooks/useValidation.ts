import { useMemo, useCallback, useState } from "react";
import * as types from "../types";

export const useValidation = () => {
  console.log("--useValidation");

  const initial = useMemo(
    () => ({
      dirty: false,
      state: types.ValidationState.OPEN,
      login: undefined,
      create: undefined,
      request: undefined,
      update: undefined,
      email: undefined,
      username: undefined,
      password: undefined,
      repeatPassword: undefined,
    }),
    []
  );

  const [validation, setValidation] = useState<types.Validation>(initial);

  const resetValidation = useCallback(() => {
    if (validation.dirty) {
      setValidation(initial);
    }
  }, [validation.dirty, setValidation, initial]);

  return [validation, setValidation, resetValidation] as const;
};
