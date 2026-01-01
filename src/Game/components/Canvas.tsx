import { useEffect, useRef, memo, RefObject } from "react";
import * as THREE from "three";
import * as parameters from "src/parameters";
import {
  startAnimation,
  stopAnimation,
} from "src/Game/logic/rendering/animation";
import { runFrame } from "../logic/rendering/frame";
import { sendControlsData } from "src/networking/logic/send";
import { gameEventHandler } from "../logic/gameLogic";
import { localLoad } from "../logic/rendering/localLoader";
import { updateRenderedObjects } from "../logic/rendering/loader";
import * as types from "src/types";

const camera = new THREE.PerspectiveCamera(70, 1, 1, 10);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
camera.position.setZ(parameters.cameraDefaultZ);
// renderer.setPixelRatio(window.devicePixelRatio);
localLoad(scene, types.GameObjectType.BACKGROUND);

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
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, [width, height]);

  useEffect(() => {
    updateRenderedObjects(objectIds, scene);
  }, [objectIds]);

  useEffect(() => {
    const node = canvasRef.current;
    node?.appendChild(renderer.domElement);
    startAnimation(
      camera,
      scene,
      renderer,
      width,
      height,
      infoBoxRef,
      radarBoxRef,
      gameEventHandler,
      sendControlsData,
      runFrame
    );
    return () => {
      node?.removeChild(renderer.domElement);
      stopAnimation();
    };
  }, [width, height, infoBoxRef, radarBoxRef]);

  return <div ref={canvasRef} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
