import { FormEvent, ChangeEvent, memo, useCallback, useState } from "react";

import Messages from "./Messages";
import Input from "./Input";
import * as types from "src/types";

const Container = ({
  chatMessages,
  chatOnSubmit,
}: {
  chatMessages: types.ChatMessage[];
  chatOnSubmit: (value: string) => void;
}) => {
  const [value, setValue] = useState("");

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      chatOnSubmit(value);
      setValue("");
    },
    [value, chatOnSubmit]
  );

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  return (
    <div className="flex flex-col grow">
      <Messages chatMessages={chatMessages} />
      <Input value={value} onChange={onChange} onSubmit={onSubmit} />
    </div>
  );
};

export default memo(Container);
