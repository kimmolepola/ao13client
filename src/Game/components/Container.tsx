import {
  useState,
  RefObject,
  useRef,
  useMemo,
  useEffect,
  memo,
  useCallback,
} from "react";
import { debounce } from "lodash";

import Canvas from "./Canvas";
import Overlay from "./UserInterface/Overlay/Container";
import Sidepanel from "./UserInterface/Sidepanel/Container";

import * as networkingHooks from "src/networking/hooks";
import * as hooks from "../hooks";
import * as types from "../../types";
import * as parameters from "../../parameters";
import * as globals from "../../globals";

let initialized = false;

const Container = ({
  user,
  iceServers,
  onChangePage,
}: {
  user: types.User | undefined;
  iceServers: types.IceServerInfo[] | undefined;
  onChangePage: (page: "frontpage" | "game") => void;
}) => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isConnectedToGameServer, setIsConnectedToGameServer] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<
    string | undefined
  >();
  const [objectIds, setObjectIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<types.ChatMessage[]>([]);

  const { connect, disconnect } = networkingHooks.useConnection(
    iceServers,
    setConnectionMessage,
    setIsConnectedToGameServer,
    setChatMessages,
    setObjectIds
  );
  hooks.useControls();

  const onResize = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, [setWindowSize]);

  const debouncedResize = useMemo(() => debounce(onResize, 200), [onResize]);

  window.addEventListener("resize", debouncedResize);

  const quit = useCallback(async () => {
    await disconnect();
    onChangePage("frontpage");
    initialized = false;
  }, [onChangePage, disconnect]);

  useEffect(() => {
    if (!initialized && iceServers && user?.accessToken) {
      initialized = true;
      connect();
    }
  }, [connect, iceServers, user?.accessToken]);

  const [sidePanelGeometry, setSidePanelGeometry] = useState({
    position: types.Position.BOTTOM,
    size: parameters.sidepanelDefaultSize,
  });

  const onChangePosition = (value: types.Position) => {
    setSidePanelGeometry((x) => ({ ...x, position: value }));
  };

  const onChangeDiameter = (value: number) => {
    setSidePanelGeometry((x) => ({ ...x, size: value }));
  };

  const infoBoxRef = useRef(null);
  const radarBoxRef = useRef<{ [id: string]: RefObject<HTMLDivElement> }>({});
  const style = useMemo(() => {
    const { size, position } = sidePanelGeometry;
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
  }, [sidePanelGeometry]);

  const canvasSize = useMemo(() => {
    switch (sidePanelGeometry.position) {
      case types.Position.LEFT:
      case types.Position.RIGHT:
        return {
          width: windowSize.width - sidePanelGeometry.size,
          height: windowSize.height,
        };
      case types.Position.BOTTOM:
      case types.Position.TOP:
        return {
          width: windowSize.width,
          height: windowSize.height - sidePanelGeometry.size,
        };
      default:
        return {
          width: windowSize.width,
          height: windowSize.height,
        };
    }
  }, [sidePanelGeometry, windowSize]);

  useEffect(() => {
    globals.dimensions.windowWidth = windowSize.width;
    globals.dimensions.windowHeight = windowSize.height;
    globals.dimensions.canvasHalfWidth = canvasSize.width / 2;
    globals.dimensions.canvasHalfHeight = canvasSize.height / 2;
  }, [canvasSize, windowSize]);

  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas
        width={canvasSize.width}
        height={canvasSize.height}
        style={style}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        objectIds={objectIds}
      />
      <Overlay
        style={style}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        isConnectedToGameServer={isConnectedToGameServer}
        objectIds={objectIds}
      />
      <Sidepanel
        username={user?.username}
        position={sidePanelGeometry.position}
        diameter={sidePanelGeometry.size}
        connectionMessage={connectionMessage}
        chatMessages={chatMessages}
        windowSize={windowSize}
        onChangePosition={onChangePosition}
        onChangeDiameter={onChangeDiameter}
        quit={quit}
      />
    </div>
  );
};

export default memo(Container);
