import { useRef, memo, RefObject } from "react";
import * as hooks from "../hooks";

const Canvas = ({
  width,
  height,
  style,
  infoBoxRef,
  radarBoxRef,
  objectIds,
}: {
  width: number;
  height: number;
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  objectIds: string[];
}) => {
  const { scene, renderer, camera } = hooks.useSetup(width, height);
  const { gameEventHandler } = hooks.useGameLogic(objectIds, scene);
  const ref = useRef(null);
  hooks.useRendering(
    camera,
    scene,
    renderer,
    ref,
    infoBoxRef,
    radarBoxRef,
    gameEventHandler
  );

  return <div ref={ref} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
