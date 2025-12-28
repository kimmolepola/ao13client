import { useRef, RefObject, memo } from "react";
import * as globals from "src/globals";
import clsx from "clsx";

const RadarItem = ({
  id,
  radarBoxRef,
}: {
  id: string;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  if (radarBoxRef.current) {
    radarBoxRef.current[id] = ref;
  }
  const isMe = globals.remoteObjects.find((x) => x.id === id)?.isMe;

  return (
    <div
      ref={ref}
      className={clsx(
        "w-1 h-1 absolute",
        isMe ? "z-0 bg-orange-400" : "z-10 bg-white"
      )}
    />
  );
};

export default memo(RadarItem);
