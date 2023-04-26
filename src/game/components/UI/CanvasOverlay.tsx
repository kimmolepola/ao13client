import { MouseEvent, memo, useMemo, useCallback } from "react";
import { useRecoilValue } from "recoil";
import {
  TfiArrowCircleLeft,
  TfiArrowCircleRight,
  TfiArrowCircleUp,
  TfiArrowCircleDown,
} from "react-icons/tfi";

import { handlePressed, handleReleased } from "../../controls";
import * as globals from "src/globals";
import * as atoms from "src/atoms";
import * as types from "src/types";

const InfoTexts = () => (
  <>
    {globals.objects.reduce((acc: JSX.Element[], cur) => {
      if (cur.id !== globals.state.ownId) {
        acc.push(
          <div
            key={cur.id}
            ref={(element) => {
              cur.infoElement = element;
            }}
            className="absolute text-red-400 text-xs -translate-x-1/2 translate-y-1/2"
          />
        );
      }
      return acc;
    }, [])}
  </>
);

const InfoBox = ({ visible }: { visible: boolean }) =>
  visible ? (
    <div
      className="absolute left-5 top-5 w-20 bg-white opacity-80 whitespace-pre-line px-1 py-0.5 text-xs"
      ref={(element: HTMLDivElement) => {
        const ownObject = globals.objects.find(
          (x) => x.id === globals.state.ownId
        );
        if (ownObject) {
          ownObject.infoBoxElement = element;
        }
      }}
    />
  ) : null;

const ConnectingBox = ({ visible }: { visible: boolean }) =>
  visible ? (
    <div className="w-full h-full flex justify-center items-center">
      <div className="bg-red-100 w-1/2 h-1/4 flex justify-center items-center">
        Connecting...
      </div>
    </div>
  ) : null;

const ControlButton = ({ control }: { control: types.Keys }) => {
  const onPressed = useCallback(() => {
    handlePressed(control);
  }, [control]);

  const onReleased = useCallback(() => {
    handleReleased(control);
  }, [control]);

  const onContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const symbol = useMemo(() => {
    switch (control) {
      case types.Keys.LEFT:
        return <TfiArrowCircleLeft />;
      case types.Keys.RIGHT:
        return <TfiArrowCircleRight />;
      case types.Keys.UP:
        return <TfiArrowCircleUp />;
      case types.Keys.DOWN:
        return <TfiArrowCircleDown />;
      default:
        return null;
    }
  }, [control]);

  return (
    <div
      className="text-red-900 text-[40px] select-none"
      onTouchStart={onPressed}
      onTouchEnd={onReleased}
      onMouseDown={onPressed}
      onMouseUp={onReleased}
      onContextMenu={onContextMenu}
    >
      {symbol}
    </div>
  );
};

const ControlButtons = () => (
  <div className="landscape:hidden absolute left-0 right-0 bottom-8 flex flex-col items-center">
    <ControlButton control={types.Keys.UP} />
    <div className="w-full flex justify-evenly">
      <ControlButton control={types.Keys.LEFT} />
      <ControlButton control={types.Keys.RIGHT} />
    </div>
    <ControlButton control={types.Keys.DOWN} />
  </div>
);

const CanvasOverlay = () => {
  useRecoilValue(atoms.objectIds); // render when objectIds change
  const connectedAmount = useRecoilValue(atoms.connectedAmount);
  const main = useRecoilValue(atoms.main);
  const connectedToMain = Boolean(main || connectedAmount);

  return (
    <div className="absolute inset-0 z-10 overflow-clip">
      <InfoTexts />
      <ConnectingBox visible={!connectedToMain} />
      <InfoBox visible={connectedToMain} />
      <ControlButtons />
    </div>
  );
};

export default memo(CanvasOverlay);
