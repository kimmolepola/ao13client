import { useState, memo, useCallback } from "react";
import { useRecoilValue } from "recoil";
import styled from "styled-components";

import Chat from "./Chat";
import * as atoms from "src/atoms";
import * as globals from "src/globals";
import * as types from "src/types";

const Sidepanel = ({ quit }: { quit: () => void }) => {
  const [panelPosition, setPanelPosition] = useState(
    globals.state.panelPosition
  );
  const [panelSizePercent, setPanelSizePercent] = useState(
    globals.state.panelSizePercent
  );
  const user = useRecoilValue(atoms.user);
  const main = useRecoilValue(atoms.main);
  const connectedAmount = useRecoilValue(atoms.connectedAmount);
  const connectionMessage = useRecoilValue(atoms.connectionMessage);
  const score = useRecoilValue(atoms.score);

  const onClickQuit = useCallback(() => {
    quit();
  }, [quit]);

  const changePanelSizePercent = useCallback(
    (panelPos: types.Position, value: number) => {
      if (value > 100) {
        setPanelSizePercent(100);
      } else {
        const minPixels = 100;
        let minPercent = Math.round((minPixels / window.innerWidth) * 100);
        if (
          panelPos === types.Position.DOWN ||
          panelPos === types.Position.UP
        ) {
          minPercent = Math.round((minPixels / window.innerHeight) * 100);
        }
        if (value < minPercent) {
          setPanelSizePercent(minPercent);
        } else {
          setPanelSizePercent(value);
        }
      }
    },
    []
  );

  const onClickPosition = useCallback(() => {
    let newPosition = globals.state.panelPosition + 1;
    if (newPosition > 3) {
      newPosition = 0;
    }
    globals.state.panelPosition = newPosition;
    setPanelPosition(newPosition);
    changePanelSizePercent(newPosition, panelSizePercent);
  }, [panelSizePercent, changePanelSizePercent]);

  const onChange = useCallback(
    (e: any) => {
      const value = Number(e.target.value);
      if (!Number.isNaN(value)) {
        changePanelSizePercent(panelPosition, value);
      }
    },
    [panelPosition, changePanelSizePercent]
  );

  return (
    <StyledDiv
      panelPosition={panelPosition}
      panelSizePercent={panelSizePercent}
    >
      <div className="w-full h-full bg-white border flex flex-col">
        <div className="flex flex-col">
          <div className="p-0.5 flex w-full justify-between flex-wrap gap-0.5">
            <div className="text-rose-900 font-bold select-none items-center">
              AO13
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                className="w-10 border h-6 text-xs text-center"
                value={panelSizePercent}
                onChange={onChange}
              />
              <StyledDiv2>
                <button
                  className="border w-full h-full relative bg-zinc-200 z-50"
                  type="button"
                  onClick={onClickPosition}
                >
                  <StyledDiv
                    panelPosition={panelPosition}
                    panelSizePercent={panelSizePercent}
                  />
                </button>
              </StyledDiv2>
              <button
                className="w-10 h-6 text-rose-900 border-2 active:brightness-80 text-xs font-bold"
                type="button"
                onClick={onClickQuit}
              >
                Quit
              </button>
            </div>
          </div>
          <div className="flex gap-1 flex-wrap text-xs p-0.5 border">
            <div>{user?.username} |</div>
            {main && <div>{`Players: ${connectedAmount + 1} |`}</div>}
            <div>{`${connectionMessage} |`}</div>
            <div>{`Score: ${score}`}</div>
          </div>
        </div>
        <Chat />
      </div>
    </StyledDiv>
  );
};

export default memo(Sidepanel);

const StyledDiv2 = styled.div`
  display: flex;
  height: 1.5rem;
  ${() => {
    const ratio = window.innerWidth / window.innerHeight;
    return `width: ${1.5 * ratio}rem`;
  }}
`;

const StyledDiv = styled.div<{
  panelPosition: types.Position;
  panelSizePercent: number;
}>`
  position: absolute;
  background-color: white;
  ${(x) => {
    switch (x.panelPosition) {
      case types.Position.DOWN:
        return `
        left: 0%;
        right: 0%;
        top: ${100 - x.panelSizePercent}%;
        bottom: 0%;
        `;
      case types.Position.LEFT:
        return `
        left: 0%;
        right: ${100 - x.panelSizePercent}%;
        top: 0%;
        bottom: 0%;
        `;
      case types.Position.RIGHT:
        return `
        left: ${100 - x.panelSizePercent}%;
        right: 0%;
        top: 0%;
        bottom: 0%;
        `;
      case types.Position.UP:
        return `
        left: 0%;
        right: 0%;
        top: 0%;
        bottom: ${100 - x.panelSizePercent}%;
        `;
      default:
        return "";
    }
  }}
`;
