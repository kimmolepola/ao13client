import { RefObject, memo } from "react";

const InfoBox = ({ infoBoxRef }: { infoBoxRef: RefObject<HTMLDivElement> }) => (
  <div
    className="absolute right-5 top-5 w-20 bg-white opacity-80 whitespace-pre-line px-1 py-0.5 text-xs"
    ref={infoBoxRef}
  />
);

export default memo(InfoBox);
