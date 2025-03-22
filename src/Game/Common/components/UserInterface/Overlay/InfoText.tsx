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
      className="absolute text-white bg-[rgba(1,1,1,0.3)] rounded px-1 text-xs -translate-x-1/2 flex flex-col"
      ref={containerRef}
    >
      <div ref={row1Ref} />
      <div ref={row2Ref} />
    </div>
  );
};

export default memo(InfoText);
