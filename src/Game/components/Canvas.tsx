import { useEffect, useRef, memo, RefObject } from "react";
import * as THREE from "three";
import * as parameters from "src/parameters";
import { startGameLoop, stopGameLoop } from "src/Game/logic/loop";
import { sendControlsData } from "src/networking/logic/send";
import { gameEventHandler } from "../logic/gameLogic";
import { localLoad } from "../logic/rendering/loaderLocalObjects";
import { updateRenderedSharedObjects } from "../logic/rendering/loaderSharedObjects";
import { updateRenderedStaticObjects } from "../logic/rendering/loaderStaticObjects";
import * as types from "src/types";

const camera = new THREE.PerspectiveCamera(
  30,
  undefined,
  parameters.cameraDefaultZ - 10,
  parameters.cameraDefaultZ + 1
);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
camera.position.setZ(parameters.cameraDefaultZ);

localLoad(scene, types.GameObjectType.Background);

const Canvas = ({
  width,
  height,
  style,
  infoBoxRef,
  radarBoxRef,
  objectIds,
  staticObjects,
}: {
  width: number;
  height: number;
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, [width, height]);

  useEffect(() => {
    updateRenderedSharedObjects(objectIds, scene);
  }, [objectIds]);

  useEffect(() => {
    updateRenderedStaticObjects(staticObjects, scene);
  }, [staticObjects]);

  useEffect(() => {
    const node = canvasRef.current;
    node?.appendChild(renderer.domElement);
    startGameLoop(
      camera,
      scene,
      renderer,
      width,
      height,
      infoBoxRef,
      radarBoxRef,
      gameEventHandler,
      sendControlsData
    );
    return () => {
      node?.removeChild(renderer.domElement);
      stopGameLoop();
    };
  }, [width, height, infoBoxRef, radarBoxRef]);

  return <div ref={canvasRef} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
