import { memo } from "react";
import { useRecoilValue } from "recoil";

import {
  InfoBox as InfoBoxDiv,
  InfoText,
  ControlButtons,
} from "src/Game/Common/components/UserInterface/Overlay";
import * as globals from "src/globals";
import * as atoms from "src/atoms";

const InfoTexts = () => (
  <>
    {globals.objects.reduce((acc: JSX.Element[], cur) => {
      if (cur.isMe) {
        acc.push(<InfoText key={cur.id} gameObject={cur} />);
      }
      return acc;
    }, [])}
  </>
);

const InfoBox = () => {
  const gameObject = globals.objects.find((x) => x.isMe);
  return gameObject ? <InfoBoxDiv gameObject={gameObject} /> : null;
};

const Overlay = ({ style }: { style: Object }) => {
  useRecoilValue(atoms.objectIds); // rerender when objectIds change

  return (
    <div className="absolute inset-0 z-1" style={style}>
      <InfoTexts />
      <InfoBox />
      <ControlButtons />
    </div>
  );
};

export default memo(Overlay);
