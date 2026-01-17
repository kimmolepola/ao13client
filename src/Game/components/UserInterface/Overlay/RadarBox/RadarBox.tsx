import { RefObject, memo } from "react";
import RadarItem from "./RadarItem";
import * as types from "src/types";

const RadarBox = ({
  radarBoxRef,
  objectIds,
  staticObjects,
}: {
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
}) => {
  return (
    <div className="absolute left-5 top-5 w-[100px] h-[100px] bg-black opacity-70 overflow-clip pointer-events-none">
      {objectIds.map((x) => (
        <RadarItem key={x} id={x} radarBoxRef={radarBoxRef} />
      ))}
    </div>
  );
};

export default memo(RadarBox);
