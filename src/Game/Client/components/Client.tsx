import { memo } from "react";

import UserInterface from "./UserInterface";
import Canvas from "./Canvas";

const Client = ({ style, quit }: { style: Object; quit: () => void }) => {
  return (
    <div className="w-full h-full bg-rose-50">
      <Canvas style={style} />
      <UserInterface style={style} quit={quit} />
    </div>
  );
};

export default memo(Client);
