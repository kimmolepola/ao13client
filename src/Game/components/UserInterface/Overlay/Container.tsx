import { RefObject, memo } from "react";

import {
  ConnectingBox as ConnectingBoxDiv,
  InfoBox,
  InfoText,
  ControlButtons,
  RadarBox,
} from ".";
import * as globals from "src/globals";

const InfoTexts = () => (
  <>
    {globals.remoteObjects.reduce((acc: JSX.Element[], cur) => {
      acc.push(<InfoText key={cur.id} gameObject={cur} />);
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
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  isConnectedToGameServer: boolean;
  objectIds: string[];
}) => {
  return (
    <div className="absolute inset-0 z-1" style={style}>
      <InfoTexts />
      <ConnectingBox visible={!isConnectedToGameServer} />
      {isConnectedToGameServer && <InfoBox infoBoxRef={infoBoxRef} />}
      <ControlButtons />
      <RadarBox radarBoxRef={radarBoxRef} objectIds={objectIds} />
    </div>
  );
};

export default memo(Container);
