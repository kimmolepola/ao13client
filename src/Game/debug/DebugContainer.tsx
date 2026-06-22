import { RefObject } from "react";
import clsx from "clsx";

const DebugContainer = ({
  debugContentRef,
  debugIsOn,
}: {
  debugContentRef: RefObject<HTMLDivElement>;
  debugIsOn: boolean;
}) => {
  return (
    <div
      ref={debugContentRef}
      className={clsx(
        "bottom-0 absolute bg-white w-full",
        debugIsOn ? "visible" : "hidden"
      )}
    />
  );
};

export default DebugContainer;
