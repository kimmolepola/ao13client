import { useMemo, useRef, RefObject, memo } from "react";
import clsx from "clsx";

const RadarItem = ({
  id,
  radarBoxRef,
  className,
  x,
  y,
}: {
  id?: string;
  radarBoxRef?: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  className?: string;
  x?: number;
  y?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  if (radarBoxRef?.current && id != null) {
    radarBoxRef.current[id] = ref;
  }
  const style = useMemo(
    () =>
      x != null && y != null
        ? { transform: `translate3d(${x}px, ${y}px, 0)` }
        : undefined,
    [x, y]
  );

  console.log("--style:", style, radarBoxRef?.current);

  return (
    <div ref={ref} className={clsx("absolute", className)} style={style} />
  );
};

export default memo(RadarItem);
