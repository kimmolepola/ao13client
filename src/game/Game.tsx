import { useMemo, useRef, useEffect, memo, useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import _ from "lodash";

import * as networkingHooks from "../networking/hooks";

import Canvas from "./components/Canvas";
import UserInterface from "./components/UI";

import * as atoms from "../atoms";
import * as hooks from "./hooks";
import * as types from "../types";

let initialized = false;

const Game = () => {
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const setWindowSize = useSetRecoilState(atoms.windowSize);
  const setPage = useSetRecoilState(atoms.page);
  const turnCredentials = useRecoilValue(atoms.turnCredentials);
  const ref = useRef(null);

  const { connect, disconnect } = networkingHooks.useConnection();
  hooks.useControls();
  hooks.useRendering(ref);

  const onResize = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, [setWindowSize]);

  window.addEventListener("resize", _.debounce(onResize, 200));

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

  const style = useMemo(() => {
    const { size } = sidepanelGeometry;
    switch (sidepanelGeometry.position) {
      case types.Position.BOTTOM:
        return { bottom: size };
      case types.Position.LEFT:
        return { left: size };
      case types.Position.RIGHT:
        return { right: size };
      case types.Position.TOP:
        return { top: size };
      default:
        return undefined;
    }
  }, [sidepanelGeometry]);

  return (
    <div className="w-full h-full bg-rose-50">
      <div ref={ref} className="absolute inset-0" style={style} />
      <UserInterface quit={quit} />
    </div>
  );
};

export default memo(Game);
