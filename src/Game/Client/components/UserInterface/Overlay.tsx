import { memo } from "react";
import { useRecoilValue } from "recoil";

import {
  ConnectingBox as ConnectingBoxDiv,
  InfoBox as InfoBoxDiv,
  InfoText,
  ControlButtons,
} from "src/Game/Common/components/UserInterface/Overlay";
import * as globals from "src/globals";
import * as atoms from "src/atoms";

const InfoTexts = () => (
  <>
    {globals.objects.reduce((acc: JSX.Element[], cur) => {
      acc.push(<InfoText key={cur.id} gameObject={cur} />);
      return acc;
    }, [])}
  </>
);

const InfoBox = ({ visible }: { visible: boolean }) => {
  const gameObject = globals.objects.find((x) => x.isMe);
  return visible && gameObject ? <InfoBoxDiv gameObject={gameObject} /> : null;
};

const ConnectingBox = ({ visible }: { visible: boolean }) =>
  visible ? <ConnectingBoxDiv /> : null;

const CanvasOverlay = ({ style }: { style: Object }) => {
  useRecoilValue(atoms.objectIds); // rerender when objectIds change
  const isConnected = Boolean(useRecoilValue(atoms.connectedAmount));

  return (
    <div className="absolute inset-0 z-1" style={style}>
      <InfoTexts />
      <ConnectingBox visible={!isConnected} />
      <InfoBox visible={isConnected} />
      <ControlButtons />
    </div>
  );
};

export default memo(CanvasOverlay);
