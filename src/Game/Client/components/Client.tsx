import { useRef, memo } from "react";
import UserInterface from "./UserInterface";
import Canvas from "./Canvas";
import * as commonHooks from "src/Game/Common/hooks";

const Client = ({ style, quit }: { style: Object; quit: () => void }) => {
  const infoBoxRef = useRef(null);
  const { scene, renderer, camera } = commonHooks.useSetup();
  const { gameEventHandler } = commonHooks.useGameLogic(scene);

  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas
        camera={camera}
        scene={scene}
        renderer={renderer}
        style={style}
        infoBoxRef={infoBoxRef}
        gameEventHandler={gameEventHandler}
      />
      <UserInterface style={style} infoBoxRef={infoBoxRef} quit={quit} />
    </div>
  );
};

export default memo(Client);
