import {
  FormEvent,
  ChangeEvent,
  FocusEvent,
  memo,
  useCallback,
  useState,
} from "react";
import { AiOutlineEnter } from "react-icons/ai";
import { useRecoilValue, useSetRecoilState } from "recoil";
import clsx from "clsx";

import { objects } from "src/globals";
import * as parameters from "src/parameters";
import * as theme from "src/theme";
import * as atoms from "src/atoms";
import * as networkingHooks from "src/networking/hooks";
import * as types from "src/types";

const Input = () => {
  console.log("--InputForm");

  const setChatMessages = useSetRecoilState(atoms.chatMessages);
  const { sendOrdered: sendOrderedFromMain } =
    networkingHooks.useSendFromMain();
  const { sendOrdered: sendOrderedFromClient } =
    networkingHooks.useSendFromClient();
  const main = useRecoilValue(atoms.main);
  const ownId = useRecoilValue(atoms.ownId);
  const [value, setValue] = useState("");

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (main) {
        if (ownId) {
          const message = {
            id: ownId + Date.now().toString(),
            text: value,
            userId: ownId,
            username: objects.find((xx) => xx.id === ownId)?.username || "",
          };
          sendOrderedFromMain({
            type: types.NetDataType.CHATMESSAGE_MAIN,
            id: message.id,
            text: message.text,
            userId: message.userId,
          });
          setChatMessages((x) => [message, ...x]);
          setTimeout(
            () => setChatMessages((x) => x.filter((xx) => xx !== message)),
            parameters.chatMessageTimeToLive
          );
        }
      } else {
        sendOrderedFromClient({
          type: types.NetDataType.CHATMESSAGE_CLIENT,
          text: value,
        });
      }
      setValue("");
    },
    [
      main,
      ownId,
      sendOrderedFromClient,
      sendOrderedFromMain,
      setChatMessages,
      value,
    ]
  );

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

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
