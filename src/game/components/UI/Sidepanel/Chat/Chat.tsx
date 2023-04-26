import { memo } from "react";
import { useRecoilValue } from "recoil";
import clsx from "clsx";

import * as atoms from "src/atoms";
import * as globals from "src/globals";

const Chat = () => {
  const chatMessages = useRecoilValue(atoms.chatMessages);

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex flex-col-reverse gap-0.5 overflow-auto">
        {chatMessages.map((x) => (
          <div
            key={x.id}
            className={clsx(
              "flex gap-1 p-0.5",
              x.userId === globals.state.ownId ? "bg-amber-300" : "bg-stone-300"
            )}
          >
            <div className="grow text-xs">
              {x.username}:{x.text}
            </div>
            <img className="w-8 h-8 rounded-xs" src="avatar.jpg" alt="Avatar" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(Chat);
