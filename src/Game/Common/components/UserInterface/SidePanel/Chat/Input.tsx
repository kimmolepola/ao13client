import { FormEvent, ChangeEvent, FocusEvent, memo, useCallback } from "react";
import { AiOutlineEnter } from "react-icons/ai";
import clsx from "clsx";

import * as theme from "src/theme";

const Input = ({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) => {
  const onFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    e.target.placeholder = "";
  }, []);

  const onBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    e.target.placeholder = "Input";
  }, []);

  return (
    <form
      className="flex mb-0.5"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
    >
      <input
        className={clsx(theme.cInput, "w-0 grow relative w-full")}
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Input"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      <button
        className={clsx(
          theme.cButton,
          "w-[10%] max-w-[2.5rem] min-w-[1rem] flex justify-center items-center"
        )}
        type="submit"
        aria-label="submit"
      >
        <AiOutlineEnter />
      </button>
    </form>
  );
};

export default memo(Input);
