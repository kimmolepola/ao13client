import { RefObject, memo } from "react";
import { useRecoilValue } from "recoil";

import {
  InfoBox,
  InfoText,
  ControlButtons,
} from "src/Game/Common/components/UserInterface/Overlay";
import * as globals from "src/globals";
import * as atoms from "src/atoms";

const InfoTexts = () => (
  <>
    {globals.remoteObjects.reduce((acc: JSX.Element[], cur) => {
      acc.push(<InfoText key={cur.id} gameObject={cur} />);
      return acc;
    }, [])}
  </>
);

const Overlay = ({
  style,
  infoBoxRef,
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
}) => {
  useRecoilValue(atoms.objectIds); // rerender when objectIds change

  return (
    <div className="absolute inset-0 z-1" style={style}>
      <InfoTexts />
      <InfoBox infoBoxRef={infoBoxRef} />
      <ControlButtons />
    </div>
  );
};

export default memo(Overlay);
