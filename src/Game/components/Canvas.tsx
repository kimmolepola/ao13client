import { useEffect, useRef, memo, RefObject } from "react";
import { Mesh, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import * as parameters from "src/parameters";
import { startGameLoop, stopGameLoop, updateRenderSize } from "src/Game/logic/loop";
import { sendControlsData } from "src/networking/logic/send";
import { gameEventHandler } from "../logic/gameLogic";
import { localLoad } from "../logic/rendering/loaderLocalObjects";
import { updateRenderedSharedObjects } from "../logic/rendering/loaderSharedObjects";
import { updateRenderedStaticObjects } from "../logic/rendering/loaderStaticObjects";
import * as types from "src/types";

const camera = new PerspectiveCamera(
  30,
  undefined,
  parameters.cameraDefaultZ / 2,
  parameters.cameraDefaultZ + 1
);
const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });
camera.position.setZ(parameters.cameraDefaultZ);

const gameEventHandlerWrapper = (gameEvent: types.GameEvent) => {
  gameEventHandler(scene, gameEvent);
};

const handleUnmount = (node: HTMLDivElement | null) => {
  node?.removeChild(renderer.domElement);
  stopGameLoop();
  scene.traverse((obj) => {
    if (!(obj instanceof Mesh)) return;
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) {
      obj.material.forEach((m) => m.dispose());
    } else {
      obj.material?.dispose();
    }
  });
  scene.clear();
};

const Canvas = ({
  width,
  height,
  style,
  infoBoxRef,
  radarBoxRef,
  objectIds,
  staticObjects,
  debugContentRef,
  syncInfoRef,
}: {
  width: number;
  height: number;
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
  debugContentRef: RefObject<HTMLDivElement>;
  syncInfoRef: RefObject<HTMLDivElement>;
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updateRenderedSharedObjects(objectIds, scene, gameEventHandlerWrapper, infoBoxRef);
  }, [objectIds, infoBoxRef]);

  useEffect(() => {
    updateRenderedStaticObjects(staticObjects, scene);
  }, [staticObjects]);

  useEffect(() => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    updateRenderSize(width, height);
  }, [width, height]);

  useEffect(() => {
    const node = canvasRef.current;
    updateRenderSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    localLoad(scene, types.GameObjectType.Background);
    node?.appendChild(renderer.domElement);
    startGameLoop(
      camera,
      scene,
      renderer,
      infoBoxRef,
      radarBoxRef,
      debugContentRef,
      syncInfoRef,
      gameEventHandlerWrapper,
      sendControlsData
    );
    return () => handleUnmount(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={canvasRef} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
