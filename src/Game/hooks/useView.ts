import { useState, useCallback, useEffect, useMemo } from "react";
import * as types from "src/types";
import * as globals from "src/globals";
import { debounce } from "lodash";
import * as parameters from "src/parameters";

const initialWindowSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const initialSidePanelGeometry = {
  position: types.SidepanelPosition.Bottom,
  size: parameters.sidepanelDefaultSize,
};

export const useView = () => {
  const [windowSize, setWindowSize] = useState(initialWindowSize);
  const [sidePanelGeometry, setSidePanelGeometry] = useState(
    initialSidePanelGeometry
  );

  const canvasStyle = useMemo(() => {
    const { size, position } = sidePanelGeometry;
    switch (position) {
      case types.SidepanelPosition.Bottom:
        return { bottom: size };
      case types.SidepanelPosition.Left:
        return { left: size };
      case types.SidepanelPosition.Right:
        return { right: size };
      case types.SidepanelPosition.Top:
        return { top: size };
      default:
        return {};
    }
  }, [sidePanelGeometry]);

  const canvasSize = useMemo(() => {
    switch (sidePanelGeometry.position) {
      case types.SidepanelPosition.Left:
      case types.SidepanelPosition.Right:
        return {
          width: windowSize.width - sidePanelGeometry.size,
          height: windowSize.height,
        };
      case types.SidepanelPosition.Bottom:
      case types.SidepanelPosition.Top:
        return {
          width: windowSize.width,
          height: windowSize.height - sidePanelGeometry.size,
        };
      default:
        return {
          width: windowSize.width,
          height: windowSize.height,
        };
    }
  }, [sidePanelGeometry, windowSize]);

  const onChangePosition = (value: types.SidepanelPosition) => {
    setSidePanelGeometry((x) => ({ ...x, position: value }));
  };

  const onChangeDiameter = (value: number) => {
    setSidePanelGeometry((x) => ({ ...x, size: value }));
  };

  const onResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const debouncedResize = useMemo(() => debounce(onResize, 200), [onResize]);

  useEffect(() => {
    window.addEventListener("resize", debouncedResize);
  }, [debouncedResize]);

  globals.dimensions.windowWidth = windowSize.width;
  globals.dimensions.windowHeight = windowSize.height;
  globals.dimensions.canvasHalfWidth = canvasSize.width / 2;
  globals.dimensions.canvasHalfHeight = canvasSize.height / 2;

  return {
    canvasStyle,
    canvasSize,
    sidePanelGeometry,
    windowSize,
    onChangePosition,
    onChangeDiameter,
  };
};
