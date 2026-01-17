import { useRef, memo } from "react";
import * as types from "src/types";

const InfoText = ({ gameObject }: { gameObject: types.SharedGameObject }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  gameObject.infoElement.containerRef = containerRef;
  gameObject.infoElement.row1Ref = row1Ref;
  gameObject.infoElement.row2Ref = row2Ref;

  return (
    <div
      className="absolute text-white text-xs pointer-events-none"
      ref={containerRef}
    >
      <div className="border-r border-neutral-500/40 w-1/2 h-40">&nbsp;</div>
      <div ref={row1Ref} className="bg-neutral-500/40 px-1 rounded-t-sm" />
      <div ref={row2Ref} className="bg-neutral-500/40 px-1 rounded-b-sm" />
    </div>
  );
};

export default memo(InfoText);
