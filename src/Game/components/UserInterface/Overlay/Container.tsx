import { RefObject, memo } from "react";

import * as globals from "src/globals";
import DataBlock from "./DataBlock";
import ConnectingBoxDiv from "./ConnectingBox";
import InfoBox from "./InfoBox";
import ControlButtons from "./ControlButtons";
import RadarBox from "./RadarBox";
import * as types from "src/types";

const InfoTexts = () => (
  <>
    {globals.sharedObjects.reduce((acc: JSX.Element[], cur) => {
      acc.push(<DataBlock key={cur.id} gameObject={cur} />);
      return acc;
    }, [])}
  </>
);

const ConnectingBox = ({ visible }: { visible: boolean }) =>
  visible ? <ConnectingBoxDiv /> : null;

const Container = ({
  style,
  infoBoxRef,
  radarBoxRef,
  isConnectedToGameServer,
  objectIds,
  staticObjects,
  radarBoxSize,
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  isConnectedToGameServer: boolean;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
  radarBoxSize: { width: number; height: number };
}) => {
  return (
    <div className="absolute inset-0 z-1" style={style}>
      <InfoTexts />
      <ConnectingBox visible={!isConnectedToGameServer} />
      {isConnectedToGameServer && <InfoBox infoBoxRef={infoBoxRef} />}
      <ControlButtons />
      <RadarBox
        radarBoxRef={radarBoxRef}
        objectIds={objectIds}
        staticObjects={staticObjects}
        radarBoxSize={radarBoxSize}
      />
    </div>
  );
};

export default memo(Container);
