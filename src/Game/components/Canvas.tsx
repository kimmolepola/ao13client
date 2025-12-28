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

const camera = new THREE.PerspectiveCamera(70, 1, 49990, 50001);
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
camera.position.setZ(parameters.cameraDefaultZ);
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }, [width, height]);

  useEffect(() => {
    updateRenderedObjects(objectIds, scene);
  }, [objectIds]);

  useEffect(() => {
    const node = ref.current;
    node?.appendChild(renderer.domElement);
    startAnimation(
      camera,
      scene,
      renderer,
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
  }, [ref, infoBoxRef, radarBoxRef]);

  return <div ref={ref} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
