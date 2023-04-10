import { memo } from "react";

import Chat from "./Chat";
import Input from "./Input";

const Container = () => {
  console.log("--ChatContainer");

  return (
    <div className="flex flex-col grow">
      <Chat />
      <Input />
    </div>
  );
};

export default memo(Container);
