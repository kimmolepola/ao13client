import { memo } from "react";

const ConnectingBox = () => (
  <div className="w-full h-full flex justify-center items-center">
    <div className="bg-red-100 w-1/2 h-1/4 flex justify-center items-center">
      Connecting...
    </div>
  </div>
);

export default memo(ConnectingBox);
