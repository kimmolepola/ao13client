import { memo } from "react";
import { BiMove } from "react-icons/bi";
import clsx from "clsx";

const Header = ({
  move,
  onClickQuit,
  onClickMove,
}: {
  move: boolean;
  onClickQuit: () => void;
  onClickMove: () => void;
}) => {
  return (
    <div className="p-0.5 flex w-full justify-between flex-wrap gap-0.5">
      <div className="text-rose-900 font-bold select-none items-center">
        AO13
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={onClickMove}>
          <BiMove className={clsx(move ? "text-rose-900" : "text-zinc-800")} />
        </button>
        <button
          className="w-10 h-6 text-rose-900 border-2 active:brightness-80 text-xs font-bold"
          type="button"
          onClick={onClickQuit}
        >
          Quit
        </button>
      </div>
    </div>
  );
};

export default memo(Header);
