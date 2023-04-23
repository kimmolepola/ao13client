import { memo } from "react";
import CanvasOverlay from "./CanvasOverlay";
import Sidepanel from "./Sidepanel";

const UserInterface = ({ quit }: { quit: () => void }) => {
  return (
    <>
      <CanvasOverlay />
      <Sidepanel quit={quit} />
    </>
  );
};

export default memo(UserInterface);
