import { RefObject, memo } from "react";
import { useRecoilValue } from "recoil";
import * as atoms from "src/atoms";
import RadarItem from "./RadarItem";

const RadarBox = ({
  radarBoxRef,
}: {
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
}) => {
  const objectIds = useRecoilValue(atoms.objectIds);

  return (
    <div className="absolute left-5 top-5 w-[100px] h-[100px] bg-black opacity-70 overflow-clip">
      {objectIds.map((x) => (
        <RadarItem key={x} id={x} radarBoxRef={radarBoxRef} />
      ))}
    </div>
  );
};

export default memo(RadarBox);
