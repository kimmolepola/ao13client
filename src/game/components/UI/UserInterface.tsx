import { memo } from "react";
import CanvasOverlay from "./CanvasOverlay";
import Sidepanel from "./Sidepanel";

const UserInterface = ({ quit }: { quit: () => void }) => {
  console.log("--UserInterface");

  return (
    <>
      <CanvasOverlay />
      <Sidepanel quit={quit} />
    </>
  );
};

export default memo(UserInterface);
