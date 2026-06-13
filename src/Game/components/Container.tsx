import {
  useState,
  RefObject,
  useRef,
  useEffect,
  memo,
  useCallback,
} from "react";

import Canvas from "./Canvas";
import Overlay from "./UserInterface/Overlay/Container";
import Sidepanel from "./UserInterface/Sidepanel/Container";

import * as types from "../../types";
import {
  handleAllReleased,
  handleKeyUp,
  handleKeyDown,
} from "../logic/controls";
import { useConnection } from "src/networking/hooks/useConnection";
import { useView } from "../hooks/useView";
import { debugOn } from "../debug/debug";

const Container = ({
  user,
  iceServers,
  onChangePage,
}: {
  user: types.User | undefined;
  iceServers: types.IceServerInfo[] | undefined;
  onChangePage: (page: "frontpage" | "game", reason?: string) => void;
}) => {
  const [isConnectedToGameServer, setIsConnectedToGameServer] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string>();
  const [objectIds, setObjectIds] = useState<string[]>([]);
  const [staticObjects, setStaticObjects] = useState<
    types.BaseStateStaticObject[]
  >([]);
  const [chatMessages, setChatMessages] = useState<types.ChatMessage[]>([]);
  const [inactivityWarning, setInactivityWarning] = useState<number | null>(
    null
  );

  const infoBoxRef = useRef<HTMLDivElement>(null);
  const radarBoxRef = useRef<{ [id: string]: RefObject<HTMLDivElement> }>({});
  const debugContentRef = useRef<HTMLDivElement>(null);
  const syncInfoRef = useRef<HTMLDivElement>(null);

  const onChangeStaticObjects = useCallback(
    (value: types.BaseStateStaticObject[]) => {
      setStaticObjects(value);
    },
    []
  );

  const handleSetInactivityWarning = useCallback((seconds: number) => {
    setInactivityWarning(seconds);
  }, []);

  const { disconnect, kickReason } = useConnection(
    iceServers,
    setConnectionMessage,
    setIsConnectedToGameServer,
    setChatMessages,
    setObjectIds,
    onChangeStaticObjects,
    handleSetInactivityWarning
  );

  const quit = useCallback(
    async (reason?: string) => {
      await disconnect();
      onChangePage("frontpage", reason);
    },
    [onChangePage, disconnect]
  );

  useEffect(() => {
    if (kickReason) quit(kickReason);
  }, [kickReason, quit]);

  useEffect(() => {
    if (inactivityWarning === null || inactivityWarning <= 0) return;
    const clear = () => setInactivityWarning(null);
    window.addEventListener("keydown", clear);
    window.addEventListener("touchstart", clear);
    return () => {
      window.removeEventListener("keydown", clear);
      window.removeEventListener("touchstart", clear);
    };
  }, [inactivityWarning]);

  useEffect(() => {
    if (inactivityWarning === null || inactivityWarning <= 0) return;
    const timer = setInterval(() => {
      setInactivityWarning((prev) =>
        prev !== null && prev > 0 ? prev - 1 : prev
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [inactivityWarning]);

  useEffect(() => {
    if (inactivityWarning !== 0) return;
    quit("You were disconnected due to inactivity.");
  }, [inactivityWarning, quit]);

  const {
    canvasStyle,
    canvasSize,
    sidePanelGeometry,
    windowSize,
    radarBoxSize,
    onChangeDiameter,
    onChangePosition,
  } = useView();

  useEffect(() => {
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchend", handleAllReleased);
    window.addEventListener("touchcancel", handleAllReleased);
    return () => {
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchend", handleAllReleased);
      window.removeEventListener("touchcancel", handleAllReleased);
    };
  }, []);

  const [debug, setDebug] = useState(false);
  const onDebug = useCallback(() => {
    setDebug(!debug);
    debugOn.value = !debug;
  }, [debug]);

  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas
        width={canvasSize.width}
        height={canvasSize.height}
        style={canvasStyle}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        objectIds={objectIds}
        staticObjects={staticObjects}
        debugContentRef={debugContentRef}
        syncInfoRef={syncInfoRef}
      />
      <Overlay
        style={canvasStyle}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        isConnectedToGameServer={isConnectedToGameServer}
        objectIds={objectIds}
        staticObjects={staticObjects}
        radarBoxSize={radarBoxSize}
        debugContentRef={debugContentRef}
        debugIsOn={debug}
        syncInfoRef={syncInfoRef}
        inactivityWarning={inactivityWarning}
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
        debugIsOn={debug}
        onDebug={onDebug}
      />
    </div>
  );
};

export default memo(Container);
