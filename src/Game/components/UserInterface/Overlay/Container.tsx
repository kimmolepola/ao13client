import { RefObject, memo } from "react";

import * as globals from "src/globals";
import DataBlock from "./DataBlock";
import ConnectingBoxDiv from "./ConnectingBox";
import InfoBox from "./InfoBox";
import ControlButtons from "./ControlButtons";
import RadarBox from "./RadarBox";
import * as types from "src/types";
import DebugContainer from "src/Game/debug/DebugContainer";

const DataBlocks = () => (
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
  debugContentRef,
  debugIsOn,
  syncInfoRef,
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  isConnectedToGameServer: boolean;
  objectIds: string[];
  staticObjects: types.BaseStateStaticObject[];
  radarBoxSize: { width: number; height: number };
  debugContentRef: RefObject<HTMLDivElement>;
  debugIsOn: boolean;
  syncInfoRef: RefObject<HTMLDivElement>;
}) => {
  // console.log("--debugIsOn:", debugIsOn);
  return (
    <div className="absolute inset-0 z-1" style={style}>
      <DataBlocks />
      <ConnectingBox visible={!isConnectedToGameServer} />
      {isConnectedToGameServer && <InfoBox infoBoxRef={infoBoxRef} />}
      <ControlButtons />
      <RadarBox
        radarBoxRef={radarBoxRef}
        objectIds={objectIds}
        staticObjects={staticObjects}
        radarBoxSize={radarBoxSize}
      />
      <DebugContainer debugContentRef={debugContentRef} debugIsOn={debugIsOn} />
      {isConnectedToGameServer ? (
        <div
          className="w-80 h-40 flex justify-center items-center bg-white/75 absolute top-5 left-1/2 -translate-x-[50%]"
          ref={syncInfoRef}
        />
      ) : null}
    </div>
  );
};

export default memo(Container);
