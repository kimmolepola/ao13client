import { useRef, RefObject, memo } from "react";

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

  return <div ref={ref} className="w-1 h-1 bg-white absolute" />;
};

export default memo(RadarItem);
