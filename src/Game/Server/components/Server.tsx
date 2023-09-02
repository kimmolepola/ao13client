import { memo, useCallback } from "react";

import UserInterface from "./UserInterface";
import Canvas from "./Canvas";
import * as types from "src/types";

const Server = ({ style, quit }: { style: Object; quit: () => void }) => {
  const gameEventHandler = useCallback((gameEvent: types.GameEvent) => {
    console.log("--event:", gameEvent);
  }, []);

  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas style={style} gameEventHandler={gameEventHandler} />
      <UserInterface style={style} quit={quit} />
    </div>
  );
};

export default memo(Server);
