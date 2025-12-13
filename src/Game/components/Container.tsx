import { useMemo, useEffect, memo, useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { debounce } from "lodash";

import Client from "./Client";

import * as networkingHooks from "src/networking/hooks";
import * as atoms from "src/atoms";
import * as hooks from "../hooks";
import * as types from "src/types";

let initialized = false;

const Container = () => {
  const user = useRecoilValue(atoms.user);
  const sidepanelGeometry = useRecoilValue(atoms.sidepanelGeometry);
  const setWindowSize = useSetRecoilState(atoms.windowSize);
  const setPage = useSetRecoilState(atoms.page);
  const iceServers = useRecoilValue(atoms.iceServers);

  const { connect, disconnect } = networkingHooks.useConnection();
  hooks.useControls();

  const onResize = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, [setWindowSize]);

  const debouncedResize = useMemo(() => debounce(onResize, 200), [onResize]);

  window.addEventListener("resize", debouncedResize);

  const quit = useCallback(async () => {
    await disconnect();
    setPage("frontpage");
    initialized = false;
  }, [setPage, disconnect]);

  useEffect(() => {
    if (!initialized && iceServers && user?.accessToken) {
      initialized = true;
      connect();
    }
  }, [connect, iceServers, user?.accessToken]);

  const style = useMemo(() => {
    const { size, position } = sidepanelGeometry;
    switch (position) {
      case types.Position.BOTTOM:
        return { bottom: size };
      case types.Position.LEFT:
        return { left: size };
      case types.Position.RIGHT:
        return { right: size };
      case types.Position.TOP:
        return { top: size };
      default:
        return {};
    }
  }, [sidepanelGeometry]);

  return <Client style={style} quit={quit} />;
};

export default memo(Container);
