import { memo } from "react";
import Overlay from "./Overlay";
import Sidepanel from "./Sidepanel";

const UserInterface = ({
  style,
  quit,
}: {
  style: Object;
  quit: () => void;
}) => {
  return (
    <>
      <Overlay style={style} />
      <Sidepanel quit={quit} />
    </>
  );
};

export default memo(UserInterface);
