import { RefObject, useRef, memo } from "react";
import UserInterface from "./UserInterface";
import Canvas from "./Canvas";
import * as commonHooks from "src/Game/Common/hooks";

const Client = ({ style, quit }: { style: Object; quit: () => void }) => {
  const infoBoxRef = useRef(null);
  const radarBoxRef = useRef<{ [id: string]: RefObject<HTMLDivElement> }>({});
  const { scene, renderer, camera } = commonHooks.useSetup();
  const { gameEventHandler: commonGameEventHandler } =
    commonHooks.useGameLogic(scene);

  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas
        camera={camera}
        scene={scene}
        renderer={renderer}
        style={style}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        commonGameEventHandler={commonGameEventHandler}
      />
      <UserInterface
        style={style}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
        quit={quit}
      />
    </div>
  );
};

export default memo(Client);
