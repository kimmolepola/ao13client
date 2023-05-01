import { memo } from "react";
import * as types from "src/types";

const InfoBox = ({ gameObject }: { gameObject: types.GameObject }) => (
  <div
    className="absolute left-5 top-5 w-20 bg-white opacity-80 whitespace-pre-line px-1 py-0.5 text-xs"
    ref={(element) => {
      gameObject.infoBoxElement = element;
    }}
  />
);

export default memo(InfoBox);
