import { RefObject, memo } from "react";
import Overlay from "./Overlay";
import Sidepanel from "./Sidepanel";

const UserInterface = ({
  style,
  infoBoxRef,
  quit,
}: {
  style: Object;
  infoBoxRef: RefObject<HTMLDivElement>;
  quit: () => void;
}) => {
  return (
    <>
      <Overlay style={style} infoBoxRef={infoBoxRef} />
      <Sidepanel quit={quit} />
    </>
  );
};

export default memo(UserInterface);
