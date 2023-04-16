import { useRef, useEffect, memo, useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

import * as networkingHooks from "../networking/hooks";

import Canvas from "./components/Canvas";
import UserInterface from "./components/UI";

import * as atoms from "../atoms";
import * as hooks from "./hooks";

let initialized = false;

const Game = () => {
  console.log("--Game");
  const ref = useRef(null);

  const { connect, disconnect } = networkingHooks.useConnection();
  hooks.useControls();
  hooks.useRendering(ref);

  const setPage = useSetRecoilState(atoms.page);
  const turnCredentials = useRecoilValue(atoms.turnCredentials);

  const quit = useCallback(async () => {
    await disconnect();
    setPage("frontpage");
    initialized = false;
  }, [setPage, disconnect]);

  useEffect(() => {
    console.log("--game useEffect, initialized:", initialized);
    if (!initialized && turnCredentials) {
      console.log("--initialize");
      initialized = true;
      connect();
    }
    return () => {
      console.log("--game useEffect return");
    };
  }, [connect, turnCredentials]);

  return (
    <div className="w-full h-full bg-rose-50">
      <div ref={ref} />
      <UserInterface quit={quit} />
    </div>
  );
};

export default memo(Game);
