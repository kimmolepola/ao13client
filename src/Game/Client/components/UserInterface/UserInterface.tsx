import { RefObject, memo } from "react";
import Overlay from "./Overlay";
import Sidepanel from "./Sidepanel";

const UserInterface = ({
  style,
  infoBoxRef,
  radarBoxRef,
  quit,
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  radarBoxRef: RefObject<{ [id: string]: RefObject<HTMLDivElement> }>;
  quit: () => void;
}) => {
  return (
    <>
      <Overlay
        style={style}
        infoBoxRef={infoBoxRef}
        radarBoxRef={radarBoxRef}
      />
      <Sidepanel quit={quit} />
    </>
  );
};

export default memo(UserInterface);
