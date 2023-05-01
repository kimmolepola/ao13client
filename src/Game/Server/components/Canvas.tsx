import { useRef, memo } from "react";
import * as hooks from "../hooks";

const Canvas = ({ style }: { style: Object }) => {
  const ref = useRef(null);
  hooks.useRendering(ref);

  return <div ref={ref} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
