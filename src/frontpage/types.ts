import { FormEvent } from "react";

export type FormSubmitEvent = FormEvent<HTMLFormElement> & {
  target: { [key: number]: HTMLInputElement | undefined };
};

export enum ValidationState {
  OPEN,
  LOADING,
  SUCCESS,
}

export type Validation = {
  dirty: boolean;
  state: ValidationState;
  login?: undefined | string;
  create?: undefined | string;
  request?: undefined | string;
  update?: undefined | string;
  email?: undefined | string;
  username?: undefined | string;
  password?: undefined | string;
  repeatPassword?: undefined | string;
};
