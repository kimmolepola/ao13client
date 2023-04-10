import { memo } from "react";
import * as THREE from "three";

const Background = ({ map: threeMap }: { map: THREE.Texture }) => {
  console.log("--Background");

  const map = threeMap;
  map.wrapS = THREE.MirroredRepeatWrapping;
  map.wrapT = THREE.MirroredRepeatWrapping;
  map.repeat.set(120, 120);

  return (
    <mesh>
      <planeGeometry args={[map.image.width, map.image.height]} />
      <meshBasicMaterial color="#e5e4e2" map={map} />
    </mesh>
  );
};

export default memo(Background);
