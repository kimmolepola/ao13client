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

const Container = ({
  user,
  iceServers,
  onChangePage,
}: {
  user: types.User | undefined;
  iceServers: types.IceServerInfo[] | undefined;
  onChangePage: (page: "frontpage" | "game") => void;
}) => {
  const [isConnectedToGameServer, setIsConnectedToGameServer] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string>();
  const [objectIds, setObjectIds] = useState<string[]>([]);
  const [staticObjects, setStaticObjects] = useState<
    types.BaseStateStaticObject[]
  >([]);
  const [chatMessages, setChatMessages] = useState<types.ChatMessage[]>([]);

  const infoBoxRef = useRef<HTMLDivElement>(null);
  const radarBoxRef = useRef<{ [id: string]: RefObject<HTMLDivElement> }>({});

  const onChangeStaticObjects = useCallback(
    (value: types.BaseStateStaticObject[]) => {
      setStaticObjects(value);
    },
    []
  );

  const { disconnect } = useConnection(
    iceServers,
    setConnectionMessage,
    setIsConnectedToGameServer,
    setChatMessages,
    setObjectIds,
    onChangeStaticObjects
  );

  const quit = useCallback(async () => {
    await disconnect();
    onChangePage("frontpage");
  }, [onChangePage, disconnect]);

  const {
    canvasStyle,
    canvasSize,
    sidePanelGeometry,
    windowSize,
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
      />
      <Overlay
        style={canvasStyle}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        isConnectedToGameServer={isConnectedToGameServer}
        objectIds={objectIds}
        staticObjects={staticObjects}
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
