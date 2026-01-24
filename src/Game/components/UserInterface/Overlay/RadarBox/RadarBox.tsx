import { RefObject, memo } from "react";
import RadarItem from "./RadarItem";
import * as types from "src/types";
import * as globals from "src/globals";

const RadarBox = ({
  radarBoxRef,
  objectIds,
  staticObjects,
  radarBoxSize,
}: {
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
  radarBoxSize: { width: number; height: number };
}) => {
  const dims = globals.dimensions;

  return (
    <div
      className="absolute left-5 top-5 bg-black/60 overflow-clip pointer-events-none"
      style={radarBoxSize}
    >
      {objectIds.map((x) => (
        <RadarItem
          key={x}
          id={x}
          radarBoxRef={radarBoxRef}
          className={`w-[2%] h-[2%] rounded-full ${
            globals.sharedObjects.find((xx) => xx.id === x)?.isMe
              ? "z-10 bg-orange-400"
              : "z-20 bg-white"
          }`}
        />
      ))}
      {staticObjects.map((x) => {
        return (
          <RadarItem
            key={x.id}
            className="w-[3%] h-[3%] z-0 bg-green-400"
            x={
              x.x * dims.worldToRadarPositionRatio + dims.radarBoxHalfWidth - 1
            }
            y={
              -x.y * dims.worldToRadarPositionRatio + dims.radarBoxHalfWidth - 1
            }
          />
        );
      })}
    </div>
  );
};

export default memo(RadarBox);
