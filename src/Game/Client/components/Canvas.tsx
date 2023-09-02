import { useRef, memo } from "react";
import * as hooks from "../hooks";
import * as types from "src/types";

const Canvas = ({
  style,
  gameEventHandler,
}: {
  style: Object;
  gameEventHandler: types.GameEventHandler;
}) => {
  const ref = useRef(null);
  hooks.useRendering(ref, gameEventHandler);

  return <div ref={ref} className="absolute inset-0" style={style} />;
};

export default memo(Canvas);
