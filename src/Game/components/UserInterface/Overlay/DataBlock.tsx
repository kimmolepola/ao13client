import { useRef, memo } from "react";
import * as types from "src/types";

const InfoText = ({ gameObject }: { gameObject: types.RemoteGameObject }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  gameObject.infoElement.containerRef = containerRef;
  gameObject.infoElement.row1Ref = row1Ref;
  gameObject.infoElement.row2Ref = row2Ref;

  return (
    <div
      className="absolute text-white bg-black/30 rounded px-1 text-xs"
      ref={containerRef}
    >
      <div ref={row1Ref} />
      <div ref={row2Ref} />
    </div>
  );
};

export default memo(InfoText);
