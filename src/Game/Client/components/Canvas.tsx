import { useRef, memo, RefObject } from "react";
import * as THREE from "three";
import * as hooks from "../hooks";
import * as types from "src/types";

const Canvas = ({
  camera,
  scene,
  renderer,
  style,
  infoBoxRef,
  radarBoxRef,
  commonGameEventHandler,
}: {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.Renderer;
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  commonGameEventHandler: types.CommonGameEventHandler;
}) => {
  const ref = useRef(null);
  hooks.useRendering(
    camera,
    scene,
    renderer,
    ref,
    infoBoxRef,
    radarBoxRef,
    commonGameEventHandler
  );

  return <div ref={ref} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
