import { useCallback } from "react";
import * as types from "src/types";

export const useGameLogic = () => {
  const gameEventHandler = useCallback(
    async (gameEvent: types.ServerGameEvent) => {
      switch (gameEvent.type) {
        case types.EventType.COLLISION: {
          gameEvent.data.object.health -= 1;
          if (gameEvent.data.object.health < 0) {
            gameEvent.data.object.health = 0;
          }
          break;
        }

        default:
          break;
      }
    },
    []
  );

  return { gameEventHandler };
};
