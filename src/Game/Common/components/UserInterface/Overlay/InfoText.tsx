import { memo } from "react";
import * as types from "src/types";

const InfoText = ({ gameObject }: { gameObject: types.GameObject }) => (
  <div
    className="absolute text-white bg-[rgba(1,1,1,0.3)] rounded px-1 text-xs -translate-x-1/2"
    ref={(element) => {
      gameObject.infoElement = element;
    }}
  ></div>
);

export default memo(InfoText);
