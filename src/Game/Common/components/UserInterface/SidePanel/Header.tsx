import { memo } from "react";

const Header = ({ quit }: { quit: () => void }) => {
  return (
    <div className="p-0.5 flex w-full justify-between flex-wrap gap-0.5">
      <div className="text-rose-900 font-bold select-none items-center">
        AO13
      </div>
      <button
        className="w-10 h-6 text-rose-900 border-2 active:brightness-80 text-xs font-bold"
        type="button"
        onClick={quit}
      >
        Quit
      </button>
    </div>
  );
};

export default memo(Header);
