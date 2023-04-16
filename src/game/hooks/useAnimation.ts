import { useCallback, RefObject, useEffect, useMemo } from "react";
import * as THREE from "three";

let running = false;
let previousTimestamp = 0;

export const useAnimation = (ref: RefObject<HTMLDivElement>) => {
  const { camera, scene, renderer } = useMemo(() => {
    const c = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      10
    );
    const s = new THREE.Scene();
    const r = new THREE.WebGLRenderer({ antialias: true });
    return { camera: c, scene: s, renderer: r };
  }, []);

  const { cube } = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const c = new THREE.Mesh(geometry, material);
    return { cube: c };
  }, []);

  const animate = useCallback(
    (timestamp: number) => {
      running && requestAnimationFrame(animate);
      const delta = timestamp - previousTimestamp;
      cube.rotation.x += 0.0002 * delta;
      cube.rotation.y += 0.0002 * delta;
      previousTimestamp = timestamp;
      renderer.render(scene, camera);
    },
    [renderer, scene, camera, cube]
  );

  useEffect(() => {
    cube && scene.add(cube);
  }, [scene, cube]);

  useEffect(() => {
    camera.position.z = 5;
  }, [camera]);

  useEffect(() => {
    running = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    ref.current?.appendChild(renderer.domElement);
    animate(0);
    return () => {
      console.log("--RETURN");
      running = false;
    };
  }, [ref, renderer, animate]);
};
